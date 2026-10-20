// Shared fixture for the frozen billing tests (docs/billing/DESIGN.md §3). Public API only.
// Sandbox only: every partner is fictional and every email uses an RFC 2606 .example domain.
import type { Result } from './result'
import type { ContractId, EmailDomain, Instant, PartnerId, ReferralCode } from './brand'
import type { Contract, Partner, AttributionPolicy, PartnerCatalog } from './attribution'
import type { Money, CurrencyCode } from './money'
import { moneyFromMinor, parseMoney } from './money'
import { parseEmail, parseInstant, parseReferralCode } from './validate'
import { buildPartnerCatalog } from './attribution'
import { fixedClock } from './clock'
import { sequentialIds } from './ids'
import { createHmacPseudonymiser } from './pii'
import { createFeeScheduleRegistry, flatFeePerSignup } from './fees'
import type { FeeSchedule } from './fees'
import { createMemoryRepository } from './repository'
import type { BillingRepository } from './repository'
import { createBillingService } from './signup'

export const T = '2026-10-20T10:00:00.000Z'
export const DAY = 86_400_000

export function must<V, E extends { code: string }>(r: Result<V, E>): V {
  if (!r.ok) throw new Error(`fixture: unexpected ${r.error.code}`)
  return r.value
}

export function expectErr<V, E extends { code: string }>(r: Result<V, E>): E['code'] {
  if (r.ok) throw new Error('expected an error result')
  return r.error.code
}

export const inst = (s: string): Instant => must(parseInstant(s))
/** Instant `ms` milliseconds from T (negative = before). */
export const at = (ms: number): Instant => inst(new Date(Date.parse(T) + ms).toISOString())
export const gbp = (major: string): Money => must(parseMoney(major, 'GBP'))
export const money = (major: string, c: CurrencyCode): Money => must(parseMoney(major, c))
export const code = (c: string): ReferralCode => must(parseReferralCode(c))
export const domain = (d: string): EmailDomain => must(parseEmail(`x@${d}`)).domain

export const PTN_ALPHA = 'ptn_alpha' as PartnerId
export const PTN_BETA = 'ptn_beta' as PartnerId
export const PTN_GAMMA = 'ptn_gamma' as PartnerId
export const PTN_DELTA = 'ptn_delta' as PartnerId

export function partners(): Partner[] {
  return [
    { id: PTN_ALPHA, name: 'Palatine Lettings (fictional)', status: 'active', referralCodes: [code('ALPHA2026')], emailDomains: [domain('alpha-lettings.example')] },
    { id: PTN_BETA, name: 'Wearside Homes (fictional)', status: 'active', referralCodes: [code('BETA')], emailDomains: [domain('beta-homes.example')] },
    { id: PTN_GAMMA, name: 'Gamma Rooms (fictional)', status: 'active', referralCodes: [code('GAMMA')], emailDomains: [] },
    { id: PTN_DELTA, name: 'Delta Studios (fictional)', status: 'inactive', referralCodes: [code('DELTA')], emailDomains: [] },
  ]
}

export function contracts(over: { alpha?: Partial<Contract> } = {}): Contract[] {
  return [
    {
      id: 'ctr_alpha' as ContractId, partnerId: PTN_ALPHA, status: 'active',
      effectiveFrom: inst('2026-09-01T00:00:00.000Z'), effectiveTo: inst('2027-09-01T00:00:00.000Z'),
      feeScheduleId: 'flat-per-signup', flatFee: gbp('2.50'), ...over.alpha,
    },
    {
      id: 'ctr_beta' as ContractId, partnerId: PTN_BETA, status: 'active',
      effectiveFrom: inst('2026-01-01T00:00:00.000Z'), effectiveTo: null,
      feeScheduleId: 'flat-per-signup', flatFee: gbp('4.00'),
    },
    {
      id: 'ctr_gamma' as ContractId, partnerId: PTN_GAMMA, status: 'active',
      effectiveFrom: inst('2025-01-01T00:00:00.000Z'), effectiveTo: inst('2026-01-01T00:00:00.000Z'),
      feeScheduleId: 'flat-per-signup', flatFee: gbp('3.00'),
    },
    {
      id: 'ctr_delta' as ContractId, partnerId: PTN_DELTA, status: 'active',
      effectiveFrom: inst('2026-01-01T00:00:00.000Z'), effectiveTo: null,
      feeScheduleId: 'flat-per-signup', flatFee: gbp('1.00'),
    },
  ]
}

export const catalog = (over: { alpha?: Partial<Contract> } = {}): PartnerCatalog => must(buildPartnerCatalog(partners(), contracts(over)))

export const POLICY_FIRST: AttributionPolicy = { touchModel: 'first', lookbackDays: 30 }
export const POLICY_LAST: AttributionPolicy = { touchModel: 'last', lookbackDays: 30 }

export const KEY = new Uint8Array(32).fill(1)
export const KEY_ID = 'k1'
export const pseudonymiser = () => createHmacPseudonymiser({ keyId: KEY_ID, key: KEY })

export function setup(o: { repo?: BillingRepository; schedules?: FeeSchedule[]; catalog?: PartnerCatalog; maxCommitAttempts?: number } = {}) {
  const repo = o.repo ?? createMemoryRepository()
  const clock = fixedClock(T)
  const ids = sequentialIds()
  const service = createBillingService({
    repo, clock, ids,
    pseudonymiser: pseudonymiser(),
    catalog: o.catalog ?? catalog(),
    fees: must(createFeeScheduleRegistry(o.schedules ?? [flatFeePerSignup])),
    policy: POLICY_FIRST,
    ...(o.maxCommitAttempts === undefined ? {} : { maxCommitAttempts: o.maxCommitAttempts }),
  })
  return { repo, clock, ids, service }
}

/** Pluggable schedule used to prove FeeSchedule is swappable (fees and signup tests). */
export const stubSchedule: FeeSchedule = {
  id: 'stub',
  version: 7,
  computeFee: (c) => ({ ok: true, value: { amount: must(moneyFromMinor(999n, 'GBP')), scheduleId: 'stub', scheduleVersion: 7, contractId: c.contract.id, basis: 'stub' } }),
}

