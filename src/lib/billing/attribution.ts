// Partner attribution: referral code first (first- or last-touch), then an exact email-domain match, else unattributed.
import type { ContractId, EmailDomain, Instant, PartnerId, ReferralCode } from './brand'
import type { Money } from './money'
import type { Result } from './result'
import { fail, ok } from './result'
import { deepFreeze, instantMs, parseEmail, parseReferralCode } from './validate'

export interface Partner {
  readonly id: PartnerId
  readonly name: string
  readonly status: 'active' | 'inactive'
  readonly referralCodes: readonly ReferralCode[]
  readonly emailDomains: readonly EmailDomain[]
}

/** Billing window is [effectiveFrom, effectiveTo) in UTC; effectiveTo null means open-ended. */
export interface Contract {
  readonly id: ContractId
  readonly partnerId: PartnerId
  readonly status: 'active' | 'suspended' | 'terminated'
  readonly effectiveFrom: Instant
  readonly effectiveTo: Instant | null
  readonly feeScheduleId: string
  readonly flatFee: Money
}

export interface PartnerCatalog {
  readonly partners: ReadonlyMap<PartnerId, Partner>
  readonly contracts: ReadonlyMap<ContractId, Contract>
  readonly byCode: ReadonlyMap<ReferralCode, PartnerId>
  readonly byDomain: ReadonlyMap<EmailDomain, PartnerId>
  readonly contractsByPartner: ReadonlyMap<PartnerId, readonly Contract[]>
}

export interface AttributionPolicy { readonly touchModel: 'first' | 'last'; readonly lookbackDays: number }
export interface ReferralTouch { readonly code: ReferralCode; readonly at: Instant }

export type RejectionReason = 'UNKNOWN_CODE' | 'PARTNER_INACTIVE' | 'NO_ACTIVE_CONTRACT' | 'TOUCH_OUTSIDE_WINDOW' | 'TOUCH_AFTER_SIGNUP'
export interface Rejection { readonly source: 'referral_code' | 'email_domain'; readonly value: string; readonly reason: RejectionReason }

export type Attribution =
  | {
      readonly kind: 'partner'; readonly partnerId: PartnerId; readonly contractId: ContractId
      readonly rule: 'referral_code' | 'email_domain'; readonly code: ReferralCode | null; readonly rejected: readonly Rejection[]
    }
  | { readonly kind: 'unattributed'; readonly rejected: readonly Rejection[] }

/** Free-mail providers can never identify a partner: anyone can register an address there. */
const FORBIDDEN_DOMAINS = new Set([
  'gmail.com', 'googlemail.com', 'outlook.com', 'hotmail.com', 'hotmail.co.uk', 'live.com', 'live.co.uk', 'msn.com',
  'yahoo.com', 'yahoo.co.uk', 'icloud.com', 'me.com', 'mac.com', 'aol.com', 'proton.me', 'protonmail.com', 'gmx.com',
])

const DAY_MS = 86_400_000
const endMs = (c: Contract) => (c.effectiveTo === null ? Infinity : instantMs(c.effectiveTo))

/**
 * A read-only view over a private Map. Object.freeze does not stop Map.prototype.set, so the catalog never hands out
 * the Map itself: once built and checked, nobody can add a code or swap a contract.
 */
function readonlyMap<K, V>(m: Map<K, V>): ReadonlyMap<K, V> {
  const view: ReadonlyMap<K, V> = {
    get: (k) => m.get(k),
    has: (k) => m.has(k),
    get size() { return m.size },
    forEach: (fn, thisArg) => m.forEach((v, k) => fn.call(thisArg, v, k, view)),
    entries: () => m.entries(),
    keys: () => m.keys(),
    values: () => m.values(),
    [Symbol.iterator]: () => m[Symbol.iterator](),
  }
  return Object.freeze(view)
}

export function buildPartnerCatalog(partners: readonly Partner[], contracts: readonly Contract[]): Result<PartnerCatalog> {
  const ps = new Map<PartnerId, Partner>()
  const byCode = new Map<ReferralCode, PartnerId>()
  const byDomain = new Map<EmailDomain, PartnerId>()
  for (const raw of partners) {
    if (ps.has(raw.id)) return fail('INVALID_REQUEST', `partner ${raw.id} listed twice`)
    // Codes and domains go through the same parsers as incoming signups, so "alpha2026" and "ALPHA2026" are one code.
    const codes: ReferralCode[] = []
    for (const c of raw.referralCodes) {
      const parsed = parseReferralCode(c)
      if (!parsed.ok) return parsed
      codes.push(parsed.value)
    }
    const domains: EmailDomain[] = []
    for (const d of raw.emailDomains) {
      const parsed = parseEmail(`x@${d}`)
      if (!parsed.ok) return fail('INVALID_EMAIL', `partner ${raw.id} has an invalid email domain`)
      domains.push(parsed.value.domain)
    }
    const p: Partner = deepFreeze({ ...raw, referralCodes: codes, emailDomains: domains })
    ps.set(p.id, p)
    for (const c of p.referralCodes) {
      if (byCode.has(c)) return fail('DUPLICATE_REFERRAL_CODE', `referral code ${c} belongs to two partners`)
      byCode.set(c, p.id)
    }
    for (const d of p.emailDomains) {
      if (FORBIDDEN_DOMAINS.has(d)) return fail('FORBIDDEN_DOMAIN', `${d} is a free-mail domain`)
      if (byDomain.has(d)) return fail('DUPLICATE_EMAIL_DOMAIN', `email domain ${d} belongs to two partners`)
      byDomain.set(d, p.id)
    }
  }
  const cs = new Map<ContractId, Contract>()
  const byPartner = new Map<PartnerId, Contract[]>()
  for (const raw of contracts) {
    const c: Contract = deepFreeze({ ...raw })
    if (cs.has(c.id)) return fail('INVALID_REQUEST', `contract ${c.id} listed twice`)
    if (!ps.has(c.partnerId)) return fail('UNKNOWN_PARTNER', `contract ${c.id} names an unknown partner`)
    if (endMs(c) <= instantMs(c.effectiveFrom)) return fail('INVALID_CONTRACT_WINDOW', `contract ${c.id} ends before it starts`)
    if (c.flatFee.amountMinor <= 0n) return fail('NON_POSITIVE_AMOUNT', `contract ${c.id} has a non-positive fee`)
    cs.set(c.id, c)
    byPartner.set(c.partnerId, [...(byPartner.get(c.partnerId) ?? []), c])
  }
  for (const list of byPartner.values()) {
    const active = list.filter((c) => c.status === 'active')
    for (let i = 0; i < active.length; i++) {
      for (let j = i + 1; j < active.length; j++) {
        const a = active[i]
        const b = active[j]
        if (instantMs(a.effectiveFrom) < endMs(b) && instantMs(b.effectiveFrom) < endMs(a)) {
          return fail('OVERLAPPING_CONTRACTS', `contracts ${a.id} and ${b.id} overlap`)
        }
      }
    }
  }
  const frozenByPartner = new Map<PartnerId, readonly Contract[]>()
  for (const [p, list] of byPartner) frozenByPartner.set(p, Object.freeze([...list]))
  return ok(Object.freeze({
    partners: readonlyMap(ps), contracts: readonlyMap(cs), byCode: readonlyMap(byCode), byDomain: readonlyMap(byDomain),
    contractsByPartner: readonlyMap(frozenByPartner),
  }))
}

function activeContract(cat: PartnerCatalog, p: PartnerId, atMs: number): Contract | null {
  for (const c of cat.contractsByPartner.get(p) ?? []) {
    if (c.status === 'active' && instantMs(c.effectiveFrom) <= atMs && atMs < endMs(c)) return c
  }
  return null
}

export function attribute(
  i: { emailDomain: EmailDomain; touches: readonly ReferralTouch[]; at: Instant }, cat: PartnerCatalog, policy: AttributionPolicy,
): Attribution {
  const atMs = instantMs(i.at)
  const earliest = atMs - policy.lookbackDays * DAY_MS
  const rejected: Rejection[] = []
  const valid: { touch: ReferralTouch; ms: number; partnerId: PartnerId; contract: Contract }[] = []
  const sorted = [...i.touches]
    .map((touch) => ({ touch, ms: instantMs(touch.at) }))
    .sort((a, b) => a.ms - b.ms || (a.touch.code < b.touch.code ? -1 : a.touch.code > b.touch.code ? 1 : 0))

  for (const { touch, ms } of sorted) {
    const reject = (reason: RejectionReason) => rejected.push({ source: 'referral_code', value: touch.code, reason })
    const partnerId = cat.byCode.get(touch.code)
    if (!partnerId) { reject('UNKNOWN_CODE'); continue }
    if (cat.partners.get(partnerId)?.status !== 'active') { reject('PARTNER_INACTIVE'); continue }
    if (ms > atMs) { reject('TOUCH_AFTER_SIGNUP'); continue }
    if (ms < earliest) { reject('TOUCH_OUTSIDE_WINDOW'); continue }
    const contract = activeContract(cat, partnerId, atMs)
    if (!contract) { reject('NO_ACTIVE_CONTRACT'); continue }
    valid.push({ touch, ms, partnerId, contract })
  }

  if (valid.length > 0) {
    // valid is ordered by (time, code). Last-touch takes the latest instant; equal instants still go A to Z.
    const lastMs = valid[valid.length - 1].ms
    const pick = policy.touchModel === 'first' ? valid[0] : valid.find((v) => v.ms === lastMs) ?? valid[0]
    return deepFreeze({
      kind: 'partner' as const, partnerId: pick.partnerId, contractId: pick.contract.id,
      rule: 'referral_code' as const, code: pick.touch.code, rejected,
    })
  }

  const partnerId = cat.byDomain.get(i.emailDomain)
  if (partnerId) {
    const reject = (reason: RejectionReason) => rejected.push({ source: 'email_domain', value: i.emailDomain, reason })
    const contract = activeContract(cat, partnerId, atMs)
    if (cat.partners.get(partnerId)?.status !== 'active') reject('PARTNER_INACTIVE')
    else if (!contract) reject('NO_ACTIVE_CONTRACT')
    else {
      return deepFreeze({
        kind: 'partner' as const, partnerId, contractId: contract.id, rule: 'email_domain' as const, code: null, rejected,
      })
    }
  }
  return deepFreeze({ kind: 'unattributed' as const, rejected })
}
