// Simulated partner billing demo. Runs fictional signups through the billing module in this tab.
// No real money, no real partners, no network: the HMAC key is random per page load and thrown away.
import type { Result } from './billing/result'
import type { BillingError } from './billing/errors'
import type { ContractId, PartnerId } from './billing/brand'
import type { Attribution, Contract, Partner, PartnerCatalog, RejectionReason } from './billing/attribution'
import type { BillingRepository } from './billing/repository'
import type { LedgerTransaction } from './billing/ledger'
import type { Money } from './billing/money'
import { buildPartnerCatalog } from './billing/attribution'
import { fixedClock } from './billing/clock'
import { sequentialIds } from './billing/ids'
import { createHmacPseudonymiser } from './billing/pii'
import { createFeeScheduleRegistry, flatFeePerSignup } from './billing/fees'
import { createMemoryRepository } from './billing/repository'
import { createBillingService } from './billing/signup'
import { verifyAuditChain } from './billing/audit'
import { reconcile } from './billing/reconcile'
import { formatSimulated, fromDTO, parseMoney } from './billing/money'
import { parseEmail, parseInstant, parseReferralCode } from './billing/validate'

/** Demo time starts here and moves 4 minutes per signup, so the page reads the same on every load. */
export const DEMO_START = '2026-10-20T09:00:00.000Z'
const STEP_MS = 4 * 60_000
const TOUCH_BEFORE_MS = 60 * 60_000

function must<V>(r: Result<V, BillingError>): V {
  if (!r.ok) throw new Error(`billing demo setup: ${r.error.code}`)
  return r.value
}

const code = (c: string) => must(parseReferralCode(c))
const domain = (d: string) => must(parseEmail(`x@${d}`)).domain
const inst = (s: string) => must(parseInstant(s))
const gbp = (s: string) => must(parseMoney(s, 'GBP'))

const PARTNERS: Partner[] = [
  { id: 'ptn_alpha' as PartnerId, name: 'Palatine Lettings (fictional)', status: 'active', referralCodes: [code('ALPHA2026')], emailDomains: [domain('alpha-lettings.example')] },
  { id: 'ptn_beta' as PartnerId, name: 'Wearside Homes (fictional)', status: 'active', referralCodes: [code('BETA')], emailDomains: [domain('beta-homes.example')] },
  { id: 'ptn_gamma' as PartnerId, name: 'Gamma Rooms (fictional)', status: 'active', referralCodes: [code('GAMMA')], emailDomains: [] },
]

const CONTRACTS: Contract[] = [
  { id: 'ctr_alpha' as ContractId, partnerId: 'ptn_alpha' as PartnerId, status: 'active', effectiveFrom: inst('2026-09-01T00:00:00Z'), effectiveTo: inst('2027-09-01T00:00:00Z'), feeScheduleId: 'flat-per-signup', flatFee: gbp('2.50') },
  { id: 'ctr_beta' as ContractId, partnerId: 'ptn_beta' as PartnerId, status: 'active', effectiveFrom: inst('2026-01-01T00:00:00Z'), effectiveTo: null, feeScheduleId: 'flat-per-signup', flatFee: gbp('4.00') },
  { id: 'ctr_gamma' as ContractId, partnerId: 'ptn_gamma' as PartnerId, status: 'active', effectiveFrom: inst('2025-01-01T00:00:00Z'), effectiveTo: inst('2026-01-01T00:00:00Z'), feeScheduleId: 'flat-per-signup', flatFee: gbp('3.00') },
]

export interface DemoPartner {
  readonly id: string
  readonly name: string
  readonly code: string
  readonly fee: string
  readonly contract: string
}

/** Partner list for the page, with the referral code and fee in plain words. */
export const DEMO_PARTNERS: readonly DemoPartner[] = [
  { id: 'ptn_alpha', name: 'Palatine Lettings (fictional)', code: 'ALPHA2026', fee: 'SIM £2.50 per signup', contract: 'Sept 2026 to Aug 2027' },
  { id: 'ptn_beta', name: 'Wearside Homes (fictional)', code: 'BETA', fee: 'SIM £4.00 per signup', contract: 'From Jan 2026, no end date' },
  { id: 'ptn_gamma', name: 'Gamma Rooms (fictional)', code: 'GAMMA', fee: 'SIM £3.00 per signup', contract: 'Ended 1 Jan 2026' },
]

export interface SignupRequest {
  readonly email: string
  readonly referralCode: string
}

export interface SignupResult {
  readonly ok: boolean
  readonly email: string
  readonly key: string
  /** One plain-English line for the result panel. */
  readonly headline: string
  /** Extra plain-English lines: rejected codes, replays. */
  readonly notes: readonly string[]
}

export interface LedgerRow {
  readonly id: string
  readonly at: string
  readonly partner: string
  readonly memo: string
  readonly debit: string
  readonly credit: string
}

export interface Snapshot {
  readonly rows: readonly LedgerRow[]
  readonly receivables: readonly { partner: string; amount: string }[]
  readonly signups: number
  readonly balanced: boolean
  readonly discrepancies: number
  readonly auditEvents: number
  readonly auditVerified: boolean
}

const REASON: Record<RejectionReason, string> = {
  UNKNOWN_CODE: 'no partner uses that code',
  PARTNER_INACTIVE: 'that partner is not active',
  NO_ACTIVE_CONTRACT: 'that partner has no contract running on the signup date',
  TOUCH_OUTSIDE_WINDOW: 'the link was used more than 30 days before signing up',
  TOUCH_AFTER_SIGNUP: 'the link was used after signing up',
}

const ERROR: Partial<Record<string, string>> = {
  INVALID_EMAIL: 'That email address is not valid.',
  INVALID_REFERRAL_CODE: 'Referral codes are 4 to 16 letters or digits.',
  DUPLICATE_STUDENT: 'This student already signed up, so nobody is billed twice.',
  IDEMPOTENCY_KEY_REUSED: 'That request key was used for a different signup.',
  IDEMPOTENCY_IN_PROGRESS: 'The same request is still running. Try again in a moment.',
}

const partnerName = (id: string) => PARTNERS.find((p) => p.id === id)?.name ?? id

/** Ledger memos carry partner ids; the page shows names instead. */
const readableMemo = (memo: string) => memo.replace(/ptn_[a-z0-9_]+/g, (id) => partnerName(id).replace(' (fictional)', ''))

function describeAttribution(a: Attribution, fee: Money | null): string {
  if (a.kind === 'unattributed') return 'No partner matched. Free signup, nobody is billed.'
  const how = a.rule === 'referral_code' ? `referral code ${a.code ?? ''}` : 'email domain'
  return `${partnerName(a.partnerId)} via ${how}. Fee ${fee ? formatSimulated(fee) : 'none'}.`
}

function rejectionNotes(a: Attribution): string[] {
  return a.rejected.map((r) => `${r.source === 'referral_code' ? 'Code' : 'Domain'} ${r.value} ignored: ${REASON[r.reason]}.`)
}

export interface BillingDemo {
  signup(req: SignupRequest): Promise<SignupResult>
  /** Sends the last request again with the same idempotency key. */
  replayLast(): Promise<SignupResult | null>
  snapshot(): Promise<Snapshot>
}

/** Builds a fresh simulated billing world. Nothing persists after the page closes. */
export function createBillingDemo(): BillingDemo {
  const key = new Uint8Array(32)
  globalThis.crypto.getRandomValues(key)
  const clock = fixedClock(DEMO_START)
  const repo: BillingRepository = createMemoryRepository()
  const catalog: PartnerCatalog = must(buildPartnerCatalog(PARTNERS, CONTRACTS))
  const service = createBillingService({
    repo,
    clock,
    ids: sequentialIds(),
    pseudonymiser: createHmacPseudonymiser({ keyId: 'demo', key }),
    catalog,
    fees: must(createFeeScheduleRegistry([flatFeePerSignup])),
    policy: { touchModel: 'first', lookbackDays: 30 },
  })
  let n = 0
  let last: { body: unknown; key: string; email: string } | null = null

  async function send(body: unknown, idemKey: string, email: string): Promise<SignupResult> {
    const r = await service.recordSignup(body, idemKey)
    if (!r.ok) {
      return { ok: false, email, key: idemKey, headline: ERROR[r.error.code] ?? `Rejected (${r.error.code}).`, notes: [] }
    }
    const o = r.value
    const notes = rejectionNotes(o.attribution)
    if (o.replayed) notes.unshift(`Same request key ${idemKey}: the first result came back and the ledger did not change.`)
    return { ok: true, email, key: idemKey, headline: describeAttribution(o.attribution, o.fee), notes }
  }

  async function signup(req: SignupRequest): Promise<SignupResult> {
    n += 1
    clock.advance(n === 1 ? 0 : STEP_MS)
    const email = req.email.trim()
    const c = req.referralCode.trim()
    const touchAt = new Date(Date.parse(clock.now()) - TOUCH_BEFORE_MS).toISOString()
    const body = c ? { email, referralTouches: [{ code: c, at: touchAt }] } : { email }
    const idemKey = `demo-${String(n).padStart(3, '0')}`
    last = { body, key: idemKey, email }
    return send(body, idemKey, email)
  }

  async function replayLast(): Promise<SignupResult | null> {
    if (!last) return null
    return send(last.body, last.key, last.email)
  }

  async function snapshot(): Promise<Snapshot> {
    const ledger: readonly LedgerTransaction[] = await repo.listLedger()
    const signups = await repo.listSignups()
    const audit = await repo.listAudit()
    const report = reconcile({ transactions: ledger, signups })
    const verified = await verifyAuditChain(audit)
    const rows: LedgerRow[] = []
    for (const t of ledger) {
      for (const e of t.entries) {
        const isReceivable = e.accountId.startsWith('receivable:')
        rows.push({
          id: `${t.id}-${e.accountId}`,
          at: t.at.slice(11, 16) + ' UTC',
          partner: isReceivable ? partnerName(e.accountId.slice('receivable:'.length)) : 'RentReady signup fees',
          memo: readableMemo(t.memo),
          debit: e.direction === 'debit' ? formatSimulated(e.amount) : '',
          credit: e.direction === 'credit' ? formatSimulated(e.amount) : '',
        })
      }
    }
    const receivables = Object.entries(report.receivableByPartner).map(([id, dto]) => {
      const m = fromDTO(dto)
      return { partner: partnerName(id), amount: m.ok ? formatSimulated(m.value) : dto.amountMinor }
    })
    return {
      rows,
      receivables,
      signups: signups.length,
      balanced: report.balanced,
      discrepancies: report.discrepancies.length,
      auditEvents: audit.length,
      auditVerified: verified.ok,
    }
  }

  return { signup, replayLast, snapshot }
}

/** The opening scenario: domain match, referral code, expired partner and a free signup. */
export const SEED_SIGNUPS: readonly SignupRequest[] = [
  { email: 'amy@alpha-lettings.example', referralCode: '' },
  { email: 'ben@student.example', referralCode: 'BETA' },
  { email: 'cara@student.example', referralCode: 'ALPHA2026' },
  { email: 'dev@student.example', referralCode: 'GAMMA' },
  { email: 'eli@student.example', referralCode: '' },
]
