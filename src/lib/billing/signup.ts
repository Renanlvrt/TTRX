// recordSignup: validate → pseudonymise → claim the idempotency key → attribute → price → one atomic commit.
// Sandbox only: every posting is labelled [SIMULATED] and no money moves.
import type { AuditEvent, AuditType } from './audit'
import { appendAuditEvent } from './audit'
import type { Attribution, AttributionPolicy, PartnerCatalog, ReferralTouch } from './attribution'
import { attribute } from './attribution'
import type { IdempotencyKey, Instant, PseudonymousId, SignupId, TransactionId } from './brand'
import { canonicalJson } from './canonical'
import type { Clock } from './clock'
import { InvariantError } from './errors'
import type { FeeQuote, FeeScheduleRegistry } from './fees'
import type { IdGenerator } from './ids'
import type { LedgerTransaction } from './ledger'
import { SIGNUP_REVENUE, buildTransaction, receivableAccount } from './ledger'
import type { BillingMode } from './mode'
import { BILLING_MODE } from './mode'
import type { Money } from './money'
import { toDTO } from './money'
import type { Pseudonymiser } from './pii'
import { sha256Hex } from './pii'
import type { BillingRepository, SignupRecord } from './repository'
import type { Result } from './result'
import { fail, ok } from './result'
import type { NormalisedEmail } from './validate'
import { deepFreeze, parseEmail, parseIdempotencyKey, parseInstant, parseReferralCode } from './validate'

export interface BillingDeps {
  readonly repo: BillingRepository
  readonly clock: Clock
  readonly ids: IdGenerator
  readonly pseudonymiser: Pseudonymiser
  readonly catalog: PartnerCatalog
  readonly fees: FeeScheduleRegistry
  readonly policy: AttributionPolicy
  readonly maxCommitAttempts?: number
  readonly mode?: BillingMode
}

export interface SignupOutcome {
  readonly signupId: SignupId
  readonly studentRef: PseudonymousId
  readonly signedUpAt: Instant
  readonly attribution: Attribution
  readonly fee: Money | null
  readonly transactionId: TransactionId | null
  readonly replayed: boolean
  readonly sandbox: true
}

export interface BillingService {
  recordSignup(body: unknown, idempotencyKey: unknown): Promise<Result<SignupOutcome>>
}

interface SignupRequest { readonly email: NormalisedEmail; readonly touches: readonly ReferralTouch[] }

const MAX_TOUCHES = 50

/**
 * Reads a JSON-shaped object: a plain object (no prototype tricks, no class instances) whose fields are all in
 * `allowed` and are plain data properties. Inherited fields and getters are refused, so what we validate is what we use.
 * Error results never repeat the caller's field names: a key can itself be an email address.
 */
function readPlain(x: unknown, allowed: readonly string[], what: string): Result<Readonly<Record<string, unknown>>> {
  if (x === null || typeof x !== 'object' || Array.isArray(x)) return fail('INVALID_REQUEST', `${what} must be an object`)
  const proto = Object.getPrototypeOf(x)
  if (proto !== Object.prototype && proto !== null) return fail('INVALID_REQUEST', `${what} must be a plain object`)
  const out: Record<string, unknown> = {}
  for (const k of Reflect.ownKeys(x)) {
    if (typeof k !== 'string' || !allowed.includes(k)) return fail('UNEXPECTED_FIELD', `${what} has a field that is not accepted`)
    const desc = Object.getOwnPropertyDescriptor(x, k)
    if (!desc || !('value' in desc)) return fail('INVALID_REQUEST', `${what} fields must be plain values`)
    out[k] = desc.value
  }
  return ok(out)
}

/** The client may send only what it knows. Fees, partners and timestamps are decided here, never trusted from input. */
function parseRequest(body: unknown): Result<SignupRequest> {
  const b = readPlain(body, ['email', 'referralTouches'], 'body')
  if (!b.ok) return b
  const { email, referralTouches } = b.value
  const e = parseEmail(email)
  if (!e.ok) return e
  const touches: ReferralTouch[] = []
  if (referralTouches !== undefined) {
    if (!Array.isArray(referralTouches) || referralTouches.length > MAX_TOUCHES) {
      return fail('INVALID_REQUEST', `referralTouches must be an array of at most ${MAX_TOUCHES}`)
    }
    for (const t of referralTouches) {
      const touch = readPlain(t, ['code', 'at'], 'touch')
      if (!touch.ok) return touch
      const { code, at } = touch.value
      const c = parseReferralCode(code)
      if (!c.ok) return c
      const a = parseInstant(at)
      if (!a.ok) return a
      touches.push({ code: c.value, at: a.value })
    }
  }
  return ok({ email: e.value, touches })
}

export function createBillingService(d: BillingDeps): BillingService {
  if (d.mode !== undefined && d.mode !== BILLING_MODE) throw new InvariantError('live billing disabled')
  const maxAttempts = d.maxCommitAttempts ?? 3
  if (!Number.isInteger(maxAttempts) || maxAttempts < 1) throw new InvariantError('maxCommitAttempts must be a positive integer')

  async function process(
    req: SignupRequest, studentRef: PseudonymousId, now: Instant, k: IdempotencyKey, lease: string, onCommitted: () => void,
  ): Promise<Result<SignupOutcome>> {
    const attribution = attribute({ emailDomain: req.email.domain, touches: req.touches, at: now }, d.catalog, d.policy)
    let quote: FeeQuote | null = null
    if (attribution.kind === 'partner') {
      const contract = d.catalog.contracts.get(attribution.contractId)
      if (!contract) throw new InvariantError(`catalog lost contract ${attribution.contractId}`)
      const schedule = d.fees.resolve(contract.feeScheduleId)
      if (!schedule.ok) return schedule
      const q = schedule.value.computeFee({ contract, partnerId: attribution.partnerId, signupAt: now })
      if (!q.ok) return q
      if (q.value.amount.amountMinor <= 0n) return fail('NON_POSITIVE_AMOUNT', 'fee schedule quoted a non-positive fee')
      // A pluggable schedule is code we did not write: its quote must be for this contract, in its currency.
      if (q.value.contractId !== contract.id || q.value.scheduleId !== schedule.value.id) {
        return fail('FEE_QUOTE_MISMATCH', 'fee quote does not belong to the attributed contract')
      }
      if (q.value.amount.currency !== contract.flatFee.currency) return fail('CURRENCY_MISMATCH', 'fee quote currency differs from the contract')
      quote = deepFreeze({ ...q.value })
    }

    const signupId = d.ids.next('sig') as SignupId
    const transactionId = quote ? (d.ids.next('txn') as TransactionId) : null
    let transaction: LedgerTransaction | null = null
    if (quote && transactionId && attribution.kind === 'partner') {
      const t = buildTransaction({
        id: transactionId, at: now, causationId: signupId,
        memo: `[SIMULATED] signup fee for ${attribution.partnerId}`,
        entries: [
          { accountId: receivableAccount(attribution.partnerId), direction: 'debit', amount: quote.amount },
          { accountId: SIGNUP_REVENUE, direction: 'credit', amount: quote.amount },
        ],
      })
      if (!t.ok) return t
      transaction = t.value
    }

    const signup: SignupRecord = {
      id: signupId, studentRef, emailDomain: req.email.domain, at: now, attribution,
      fee: quote ? toDTO(quote.amount) : null, transactionId,
    }

    const events: { type: AuditType; data: Record<string, string> }[] = [
      { type: 'SIGNUP_RECEIVED', data: { studentRef, emailDomain: req.email.domain, touches: String(req.touches.length) } },
      attribution.kind === 'partner'
        ? { type: 'SIGNUP_ATTRIBUTED', data: { partnerId: attribution.partnerId, contractId: attribution.contractId, rule: attribution.rule, code: attribution.code ?? '' } }
        : { type: 'SIGNUP_UNATTRIBUTED', data: { rejected: String(attribution.rejected.length) } },
    ]
    if (quote) {
      events.push({
        type: 'FEE_CALCULATED',
        data: {
          amountMinor: quote.amount.amountMinor.toString(), currency: quote.amount.currency, scheduleId: quote.scheduleId,
          scheduleVersion: String(quote.scheduleVersion), contractId: quote.contractId,
        },
      })
    }
    if (transaction) {
      events.push({ type: 'LEDGER_POSTED', data: { transactionId: transaction.id, amountMinor: quote ? quote.amount.amountMinor.toString() : '0' } })
    }

    const outcome: SignupOutcome = deepFreeze({
      signupId, studentRef, signedUpAt: now, attribution, fee: quote ? quote.amount : null, transactionId,
      replayed: false, sandbox: true as const,
    })
    let last: Result<{ version: number }> = fail('VERSION_CONFLICT', 'no commit attempted')
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      const version = await d.repo.getVersion()
      let prev = await d.repo.getAuditHead()
      const audit: AuditEvent[] = []
      for (const e of events) {
        const r = await appendAuditEvent(prev, { at: now, type: e.type, subjectId: signupId, data: e.data })
        if (!r.ok) return r
        audit.push(r.value)
        prev = r.value
      }
      last = await d.repo.commit({ signup, transaction, audit, idempotency: { key: k, lease, response: outcome } }, version)
      if (last.ok) {
        onCommitted()
        return ok(outcome)
      }
      if (last.error.code !== 'VERSION_CONFLICT') return last
    }
    return last.ok ? fail('VERSION_CONFLICT', 'unreachable') : last
  }

  return Object.freeze({
    async recordSignup(body: unknown, idempotencyKey: unknown): Promise<Result<SignupOutcome>> {
      const key = parseIdempotencyKey(idempotencyKey)
      if (!key.ok) return key
      const req = parseRequest(body)
      if (!req.ok) return req

      const studentRef = await d.pseudonymiser.pseudonymise(req.value.email)
      const fingerprint = await sha256Hex(canonicalJson({
        studentRef, emailDomain: req.value.email.domain, touches: req.value.touches.map((t) => ({ code: t.code, at: t.at })),
      }))
      const now = d.clock.now()
      const k: IdempotencyKey = key.value
      const lease = globalThis.crypto.randomUUID()
      const claim = await d.repo.claimIdempotencyKey(k, fingerprint, now, lease)
      if (claim.status === 'in_progress') return fail('IDEMPOTENCY_IN_PROGRESS', 'a request with this key is still running')
      if (claim.status === 'fingerprint_mismatch') return fail('IDEMPOTENCY_KEY_REUSED', 'this key was used for a different request')
      if (claim.status === 'completed') return ok(deepFreeze({ ...claim.response, replayed: true }))

      // Once the commit lands, money is posted: the key must never be released again, or a retry would post twice.
      let committed = false
      let out: Result<SignupOutcome>
      try {
        out = await process(req.value, studentRef, now, k, lease, () => { committed = true })
      } catch (e) {
        if (!committed) await d.repo.releaseIdempotencyKey(k, lease)
        throw e
      }
      if (!out.ok) {
        await d.repo.releaseIdempotencyKey(k, lease)
        return out
      }
      try {
        // Repositories that complete the key inside commit make this a no-op; it stays for adapters that do not.
        await d.repo.completeIdempotencyKey(k, out.value, lease)
      } catch {
        // The posting is durable and the result is correct. A retry finds the key still claimed and gets
        // IDEMPOTENCY_IN_PROGRESS until the lock expires, never a second posting.
      }
      return out
    },
  })
}
