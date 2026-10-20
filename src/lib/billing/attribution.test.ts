import { describe, expect, it } from 'vitest'
import type { Contract, Partner, ReferralTouch } from './attribution'
import { attribute, buildPartnerCatalog } from './attribution'
import type { ContractId, PartnerId } from './brand'
import {
  DAY, POLICY_FIRST, POLICY_LAST, PTN_ALPHA, PTN_BETA, at, catalog, code, contracts, domain, expectErr, gbp, inst, partners,
} from './test-fixtures'

const touch = (c: string, ms: number): ReferralTouch => ({ code: code(c), at: at(ms) })
const H = 3_600_000

describe('buildPartnerCatalog', () => {
  it('rejects a referral code shared by two partners', () => {
    const ps: Partner[] = partners()
    ps[1] = { ...ps[1], referralCodes: [code('ALPHA2026')] }
    expect(expectErr(buildPartnerCatalog(ps, contracts()))).toBe('DUPLICATE_REFERRAL_CODE')
  })

  it('rejects an email domain shared by two partners', () => {
    const ps: Partner[] = partners()
    ps[1] = { ...ps[1], emailDomains: [domain('alpha-lettings.example')] }
    expect(expectErr(buildPartnerCatalog(ps, contracts()))).toBe('DUPLICATE_EMAIL_DOMAIN')
  })

  it('rejects a contract for an unknown partner', () => {
    const cs: Contract[] = [...contracts(), { ...contracts()[0], id: 'ctr_x' as ContractId, partnerId: 'ptn_ghost' as PartnerId }]
    expect(expectErr(buildPartnerCatalog(partners(), cs))).toBe('UNKNOWN_PARTNER')
  })

  it('rejects a contract whose window ends before it starts', () => {
    const cs = contracts({ alpha: { effectiveTo: inst('2026-09-01T00:00:00.000Z') } })
    expect(expectErr(buildPartnerCatalog(partners(), cs))).toBe('INVALID_CONTRACT_WINDOW')
  })

  it('rejects two active overlapping contracts for one partner', () => {
    const cs: Contract[] = [...contracts(), { ...contracts()[0], id: 'ctr_alpha2' as ContractId, effectiveFrom: inst('2027-01-01T00:00:00.000Z'), effectiveTo: null }]
    expect(expectErr(buildPartnerCatalog(partners(), cs))).toBe('OVERLAPPING_CONTRACTS')
  })

  it('rejects free-mail partner domains', () => {
    const ps: Partner[] = partners()
    ps[0] = { ...ps[0], emailDomains: [domain('gmail.com')] }
    expect(expectErr(buildPartnerCatalog(ps, contracts()))).toBe('FORBIDDEN_DOMAIN')
  })

  it('rejects a zero flat fee', () => {
    expect(expectErr(buildPartnerCatalog(partners(), contracts({ alpha: { flatFee: gbp('0') } })))).toBe('NON_POSITIVE_AMOUNT')
  })
})

describe('attribute', () => {
  const cat = catalog()
  const T0 = at(0)
  const student = domain('student.example')

  it('attributes by referral code', () => {
    const a = attribute({ emailDomain: student, touches: [touch('ALPHA2026', -H)], at: T0 }, cat, POLICY_FIRST)
    expect(a).toMatchObject({ kind: 'partner', partnerId: PTN_ALPHA, contractId: 'ctr_alpha', rule: 'referral_code' })
  })

  it('falls back to the student email domain', () => {
    const a = attribute({ emailDomain: domain('alpha-lettings.example'), touches: [], at: T0 }, cat, POLICY_FIRST)
    expect(a).toMatchObject({ kind: 'partner', partnerId: PTN_ALPHA, rule: 'email_domain', code: null })
  })

  it('a referral code beats the email domain', () => {
    const a = attribute({ emailDomain: domain('alpha-lettings.example'), touches: [touch('BETA', -H)], at: T0 }, cat, POLICY_FIRST)
    expect(a).toMatchObject({ kind: 'partner', partnerId: PTN_BETA, rule: 'referral_code' })
  })

  it('first-touch and last-touch pick different partners', () => {
    const touches = [touch('ALPHA2026', -10 * DAY), touch('BETA', -DAY)]
    expect(attribute({ emailDomain: student, touches, at: T0 }, cat, POLICY_FIRST)).toMatchObject({ partnerId: PTN_ALPHA })
    expect(attribute({ emailDomain: student, touches, at: T0 }, cat, POLICY_LAST)).toMatchObject({ partnerId: PTN_BETA })
  })

  it('touch order in the input does not matter', () => {
    const touches = [touch('BETA', -DAY), touch('ALPHA2026', -10 * DAY)]
    expect(attribute({ emailDomain: student, touches, at: T0 }, cat, POLICY_FIRST)).toMatchObject({ partnerId: PTN_ALPHA })
    expect(attribute({ emailDomain: student, touches, at: T0 }, cat, POLICY_LAST)).toMatchObject({ partnerId: PTN_BETA })
  })

  it('same-instant touches tie-break by code A to Z under both models', () => {
    const touches = [touch('BETA', -H), touch('ALPHA2026', -H)]
    expect(attribute({ emailDomain: student, touches, at: T0 }, cat, POLICY_FIRST)).toMatchObject({ partnerId: PTN_ALPHA })
    expect(attribute({ emailDomain: student, touches, at: T0 }, cat, POLICY_LAST)).toMatchObject({ partnerId: PTN_ALPHA })
  })

  it('a touch exactly 30 days old still counts', () => {
    expect(at(-30 * DAY)).toBe('2026-09-20T10:00:00.000Z')
    const a = attribute({ emailDomain: domain('alpha-lettings.example'), touches: [touch('BETA', -30 * DAY)], at: T0 }, cat, POLICY_FIRST)
    expect(a).toMatchObject({ kind: 'partner', partnerId: PTN_BETA, rule: 'referral_code' })
  })

  it('a touch 1ms older than the lookback is rejected and the domain applies', () => {
    const a = attribute({ emailDomain: domain('alpha-lettings.example'), touches: [touch('BETA', -30 * DAY - 1)], at: T0 }, cat, POLICY_FIRST)
    expect(a).toMatchObject({ kind: 'partner', partnerId: PTN_ALPHA, rule: 'email_domain' })
    expect(a.rejected).toEqual([{ source: 'referral_code', value: 'BETA', reason: 'TOUCH_OUTSIDE_WINDOW' }])
  })

  it('a touch after the signup instant is rejected', () => {
    const a = attribute({ emailDomain: student, touches: [touch('ALPHA2026', 1)], at: T0 }, cat, POLICY_FIRST)
    expect(a.kind).toBe('unattributed')
    expect(a.rejected).toEqual([{ source: 'referral_code', value: 'ALPHA2026', reason: 'TOUCH_AFTER_SIGNUP' }])
  })

  it('unknown codes are recorded and skipped', () => {
    const a = attribute({ emailDomain: student, touches: [touch('NOPE1234', -5 * DAY), touch('BETA', -2 * DAY)], at: T0 }, cat, POLICY_FIRST)
    expect(a).toMatchObject({ kind: 'partner', partnerId: PTN_BETA })
    expect(a.rejected).toEqual([{ source: 'referral_code', value: 'NOPE1234', reason: 'UNKNOWN_CODE' }])
  })

  it('a code whose contract has ended gives NO_ACTIVE_CONTRACT', () => {
    const a = attribute({ emailDomain: student, touches: [touch('GAMMA', -H)], at: T0 }, cat, POLICY_FIRST)
    expect(a.kind).toBe('unattributed')
    expect(a.rejected).toEqual([{ source: 'referral_code', value: 'GAMMA', reason: 'NO_ACTIVE_CONTRACT' }])
  })

  it('an inactive partner gives PARTNER_INACTIVE', () => {
    const a = attribute({ emailDomain: student, touches: [touch('DELTA', -H)], at: T0 }, cat, POLICY_FIRST)
    expect(a.kind).toBe('unattributed')
    expect(a.rejected).toEqual([{ source: 'referral_code', value: 'DELTA', reason: 'PARTNER_INACTIVE' }])
  })

  it('contract windows are [from, to) in UTC', () => {
    const d = domain('alpha-lettings.example')
    expect(attribute({ emailDomain: d, touches: [], at: inst('2026-09-01T00:00:00.000Z') }, cat, POLICY_FIRST)).toMatchObject({ kind: 'partner', partnerId: PTN_ALPHA })
    const before = attribute({ emailDomain: d, touches: [], at: inst('2026-08-31T23:59:59.999Z') }, cat, POLICY_FIRST)
    expect(before.kind).toBe('unattributed')
    expect(before.rejected[0]).toMatchObject({ source: 'email_domain', reason: 'NO_ACTIVE_CONTRACT' })
    const end = attribute({ emailDomain: d, touches: [], at: inst('2027-09-01T00:00:00.000Z') }, cat, POLICY_FIRST)
    expect(end.kind).toBe('unattributed')
    expect(end.rejected[0]).toMatchObject({ source: 'email_domain', reason: 'NO_ACTIVE_CONTRACT' })
  })

  it('a suspended contract inside its window does not bill', () => {
    const suspended = catalog({ alpha: { status: 'suspended' } })
    const a = attribute({ emailDomain: domain('alpha-lettings.example'), touches: [], at: T0 }, suspended, POLICY_FIRST)
    expect(a.kind).toBe('unattributed')
    expect(a.rejected[0]).toMatchObject({ reason: 'NO_ACTIVE_CONTRACT' })
  })

  it('domains match exactly: no suffix tricks, no subdomains', () => {
    expect(attribute({ emailDomain: domain('alpha-lettings.example.evil.example'), touches: [], at: T0 }, cat, POLICY_FIRST).kind).toBe('unattributed')
    expect(attribute({ emailDomain: domain('cs.alpha-lettings.example'), touches: [], at: T0 }, cat, POLICY_FIRST).kind).toBe('unattributed')
  })

  it('is deterministic and returns frozen results', () => {
    const input = { emailDomain: student, touches: [touch('ALPHA2026', -H)], at: T0 }
    const a = attribute(input, cat, POLICY_FIRST)
    expect(attribute(input, cat, POLICY_FIRST)).toEqual(a)
    expect(Object.isFrozen(a)).toBe(true)
    expect(Object.isFrozen(a.rejected)).toBe(true)
  })
})
