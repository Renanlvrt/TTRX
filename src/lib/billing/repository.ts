// Storage port plus an in-memory adapter. Each check-and-set runs with no `await` inside it, which stands in for a
// database unique constraint or row lock. Production swaps this for Postgres (see docs/billing/adr/0004-idempotency.md).
import type { AuditEvent } from './audit'
import { GENESIS_HASH } from './audit'
import type { Attribution } from './attribution'
import type { EmailDomain, IdempotencyKey, Instant, PseudonymousId, SignupId, TransactionId } from './brand'
import type { LedgerTransaction } from './ledger'
import { appendTransaction, checkEntries } from './ledger'
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
  /**
   * When set, the commit also completes this idempotency key with `response`, in the same atomic step. A crash after
   * the money is posted can then never leave the key open for a second posting (Brandur's "atomic phases").
   */
  readonly idempotency?: { readonly key: IdempotencyKey; readonly lease: string; readonly response: SignupOutcome }
}

export interface BillingRepository {
  /**
   * `lease` identifies this claimant. Complete and release only act when they present the same lease, so a request
   * whose lock expired and was taken over cannot release or overwrite the new holder's claim.
   */
  claimIdempotencyKey(k: IdempotencyKey, fingerprint: string, now: Instant, lease?: string): Promise<ClaimResult>
  completeIdempotencyKey(k: IdempotencyKey, response: SignupOutcome, lease?: string): Promise<void>
  releaseIdempotencyKey(k: IdempotencyKey, lease?: string): Promise<void>
  getVersion(): Promise<number>
  getAuditHead(): Promise<AuditEvent | null>
  /**
   * Atomic: all of the unit is stored, or none. Checks run in order: version, idempotency lease, student, transaction
   * id, then the unit's own integrity (double entry, sandbox labels, signup links, audit chain continuity).
   */
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
  lease: string | null
}

/** The sandbox and double-entry rules a stored unit must meet, whoever built it. */
function checkUnit(u: UnitOfWork, head: AuditEvent | null): Result<true> {
  const t = u.transaction
  if (t) {
    const entries = checkEntries(t.entries)
    if (!entries.ok) return entries
    if (t.sandbox !== true || !t.memo.startsWith('[SIMULATED]')) return fail('INVALID_REQUEST', 'only simulated postings can be stored')
    if (t.causationId !== u.signup.id || u.signup.transactionId !== t.id) {
      return fail('INVALID_REQUEST', 'the posting and the signup must point at each other')
    }
    const debits = t.entries.filter((e) => e.direction === 'debit')
    const debitTotal = debits.reduce((sum, e) => sum + e.amount.amountMinor, 0n)
    if (!u.signup.fee || u.signup.fee.amountMinor !== debitTotal.toString() || u.signup.fee.currency !== debits[0].amount.currency) {
      return fail('INVALID_REQUEST', 'the signup fee must equal the posted amount')
    }
  } else if (u.signup.fee !== null || u.signup.transactionId !== null) {
    return fail('INVALID_REQUEST', 'a billed signup needs its posting in the same commit')
  }
  let prevHash = head ? head.hash : GENESIS_HASH
  let seq = head ? head.seq : 0
  for (const e of u.audit) {
    seq += 1
    if (e.seq !== seq || e.prevHash !== prevHash) {
      return fail('AUDIT_CHAIN_BROKEN', 'audit events must continue the stored chain', { atSeq: String(e.seq) })
    }
    prevHash = e.hash
  }
  return ok(true as const)
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
    async claimIdempotencyKey(k, fingerprint, now, lease) {
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
      keys.set(k, { status: 'in_progress', fingerprint, claimedAtMs: nowMs, response: null, lease: lease ?? null })
      return { status: 'claimed' }
    },

    async completeIdempotencyKey(k, response, lease) {
      await io()
      const rec = keys.get(k)
      if (!rec || (lease !== undefined && rec.lease !== lease)) return
      if (rec.status === 'completed') return
      keys.set(k, { ...rec, status: 'completed', response: deepFreeze({ ...response }) })
    },

    async releaseIdempotencyKey(k, lease) {
      await io()
      const rec = keys.get(k)
      if (!rec || (lease !== undefined && rec.lease !== lease)) return
      // A completed key holds a stored response; releasing it would let the same request post twice.
      if (lease !== undefined && rec.status === 'completed') return
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
      const idem = u.idempotency
      const keyRec = idem ? keys.get(idem.key) : undefined
      if (idem && (!keyRec || keyRec.status !== 'in_progress' || keyRec.lease !== idem.lease)) {
        return fail('IDEMPOTENCY_IN_PROGRESS', 'another request now holds this idempotency key')
      }
      if (students.has(u.signup.studentRef)) return fail('DUPLICATE_STUDENT', 'this student has already signed up')
      let nextLedger = ledger
      if (u.transaction) {
        const r = appendTransaction(ledger, u.transaction)
        if (!r.ok) return r
        nextLedger = r.value
      }
      const checked = checkUnit(u, audit.length ? audit[audit.length - 1] : null)
      if (!checked.ok) return checked
      if (idem && keyRec) keys.set(idem.key, { ...keyRec, status: 'completed', response: deepFreeze({ ...idem.response }) })
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
