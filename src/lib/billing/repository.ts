// Storage port plus an in-memory adapter. Each check-and-set runs with no `await` inside it, which stands in for a
// database unique constraint or row lock. Production swaps this for Postgres (see docs/billing/adr/0004-idempotency.md).
import type { AuditEvent } from './audit'
import type { Attribution } from './attribution'
import type { EmailDomain, IdempotencyKey, Instant, PseudonymousId, SignupId, TransactionId } from './brand'
import type { LedgerTransaction } from './ledger'
import { appendTransaction } from './ledger'
import type { MoneyDTO } from './money'
import type { Result } from './result'
import { fail, ok } from './result'
import type { SignupOutcome } from './signup'
import { deepFreeze, instantMs } from './validate'

export type ClaimResult =
  | { readonly status: 'claimed' }
  | { readonly status: 'in_progress' }
  | { readonly status: 'completed'; readonly response: SignupOutcome }
  | { readonly status: 'fingerprint_mismatch' }

export interface SignupRecord {
  readonly id: SignupId
  readonly studentRef: PseudonymousId
  readonly emailDomain: EmailDomain
  readonly at: Instant
  readonly attribution: Attribution
  readonly fee: MoneyDTO | null
  readonly transactionId: TransactionId | null
}

export interface UnitOfWork {
  readonly signup: SignupRecord
  readonly transaction: LedgerTransaction | null
  readonly audit: readonly AuditEvent[]
}

export interface BillingRepository {
  claimIdempotencyKey(k: IdempotencyKey, fingerprint: string, now: Instant): Promise<ClaimResult>
  completeIdempotencyKey(k: IdempotencyKey, response: SignupOutcome): Promise<void>
  releaseIdempotencyKey(k: IdempotencyKey): Promise<void>
  getVersion(): Promise<number>
  getAuditHead(): Promise<AuditEvent | null>
  /** Atomic: all of the unit is stored, or none. Checks run in order: version, student, transaction id. */
  commit(u: UnitOfWork, expectedVersion: number): Promise<Result<{ version: number }>>
  listSignups(): Promise<readonly SignupRecord[]>
  listLedger(): Promise<readonly LedgerTransaction[]>
  listAudit(): Promise<readonly AuditEvent[]>
}

interface KeyRecord {
  status: 'in_progress' | 'completed'
  fingerprint: string
  claimedAtMs: number
  response: SignupOutcome | null
}

/** Simulated I/O: yields once so concurrent callers interleave the way they would against a real database. */
const io = () => Promise.resolve()

export function createMemoryRepository(o: { retentionMs?: number; lockTimeoutMs?: number } = {}): BillingRepository {
  const retentionMs = o.retentionMs ?? 86_400_000
  const lockTimeoutMs = o.lockTimeoutMs ?? 60_000
  const keys = new Map<IdempotencyKey, KeyRecord>()
  const students = new Set<PseudonymousId>()
  let version = 0
  let signups: readonly SignupRecord[] = Object.freeze([])
  let ledger: readonly LedgerTransaction[] = Object.freeze([])
  let audit: readonly AuditEvent[] = Object.freeze([])

  return {
    async claimIdempotencyKey(k, fingerprint, now) {
      await io()
      const nowMs = instantMs(now)
      const rec = keys.get(k)
      if (rec) {
        const age = nowMs - rec.claimedAtMs
        const expired = rec.status === 'completed' ? age >= retentionMs : age >= lockTimeoutMs
        if (!expired) {
          if (rec.fingerprint !== fingerprint) return { status: 'fingerprint_mismatch' }
          if (rec.status === 'completed' && rec.response) return { status: 'completed', response: rec.response }
          return { status: 'in_progress' }
        }
      }
      keys.set(k, { status: 'in_progress', fingerprint, claimedAtMs: nowMs, response: null })
      return { status: 'claimed' }
    },

    async completeIdempotencyKey(k, response) {
      await io()
      const rec = keys.get(k)
      if (rec) keys.set(k, { ...rec, status: 'completed', response: deepFreeze({ ...response }) })
    },

    async releaseIdempotencyKey(k) {
      await io()
      keys.delete(k)
    },

    async getVersion() {
      await io()
      return version
    },

    async getAuditHead() {
      await io()
      return audit.length ? audit[audit.length - 1] : null
    },

    async commit(u, expectedVersion) {
      await io()
      if (expectedVersion !== version) return fail('VERSION_CONFLICT', `expected version ${expectedVersion}, store is at ${version}`)
      if (students.has(u.signup.studentRef)) return fail('DUPLICATE_STUDENT', 'this student has already signed up')
      let nextLedger = ledger
      if (u.transaction) {
        const r = appendTransaction(ledger, u.transaction)
        if (!r.ok) return r
        nextLedger = r.value
      }
      students.add(u.signup.studentRef)
      signups = Object.freeze([...signups, deepFreeze({ ...u.signup })])
      ledger = nextLedger
      audit = Object.freeze([...audit, ...u.audit])
      version += 1
      return ok({ version })
    },

    async listSignups() {
      await io()
      return signups
    },

    async listLedger() {
      await io()
      return ledger
    },

    async listAudit() {
      await io()
      return audit
    },
  }
}
