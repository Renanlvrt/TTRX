// Regression tests for the QA review of f2481c1 (findings 1 to 11). Each test failed before its fix.
import { describe, expect, it } from 'vitest'
import type { ContractId, PseudonymousId, SignupId, TransactionId } from './brand'
import type { Contract, Partner } from './attribution'
import { buildPartnerCatalog } from './attribution'
import { canonicalJson } from './canonical'
import { InvariantError } from './errors'
import type { FeeSchedule } from './fees'
import { flatFeePerSignup } from './fees'
import type { LedgerTransaction } from './ledger'
import { SIGNUP_REVENUE, buildTransaction, receivableAccount } from './ledger'
import { moneyFromMinor, parseMoney } from './money'
import { containsPii } from './pii'
import { reconcile } from './reconcile'
import type { BillingRepository, SignupRecord, UnitOfWork } from './repository'
import { createMemoryRepository } from './repository'
import type { SignupOutcome } from './signup'
import { parseIdempotencyKey } from './validate'
import { PTN_ALPHA, T, at, catalog, contracts, domain, expectErr, must, partners, setup } from './test-fixtures'

const key = (k: string) => must(parseIdempotencyKey(k))
const alphaTouch = { code: 'ALPHA2026', at: '2026-10-20T09:00:00Z' }

function outcome(id: string): SignupOutcome {
  return {
    signupId: id as SignupId, studentRef: 'psn_v1_k1_x' as PseudonymousId, signedUpAt: at(0),
    attribution: { kind: 'unattributed', rejected: [] }, fee: null, transactionId: null, replayed: false, sandbox: true,
  }
}

function signupRecord(n: number, fee: string | null): SignupRecord {
  return {
    id: `sig_${n}` as SignupId, studentRef: `psn_v1_k1_${n}` as PseudonymousId, emailDomain: domain('alpha-lettings.example'),
    at: at(0), attribution: { kind: 'unattributed', rejected: [] },
    fee: fee === null ? null : { amountMinor: fee, currency: 'GBP' }, transactionId: fee === null ? null : (`txn_${n}` as TransactionId),
  }
}

function posting(n: number, minor = 250n): LedgerTransaction {
  const amount = must(moneyFromMinor(minor, 'GBP'))
  return must(buildTransaction({
    id: `txn_${n}`, at: T, causationId: `sig_${n}`, memo: '[SIMULATED] signup fee',
    entries: [{ accountId: receivableAccount(PTN_ALPHA), direction: 'debit', amount }, { accountId: SIGNUP_REVENUE, direction: 'credit', amount }],
  }))
}

describe('1. idempotency leases', () => {
  it('a request whose lock was taken over cannot release the new holder', async () => {
    const repo = createMemoryRepository()
    expect((await repo.claimIdempotencyKey(key('k'), 'fp', at(0), 'lease-a')).status).toBe('claimed')
    expect((await repo.claimIdempotencyKey(key('k'), 'fp', at(61_000), 'lease-b')).status).toBe('claimed')
    await repo.releaseIdempotencyKey(key('k'), 'lease-a')
    expect((await repo.claimIdempotencyKey(key('k'), 'fp', at(62_000), 'lease-c')).status).toBe('in_progress')
  })

  it('a request whose lock was taken over cannot complete the new holder', async () => {
    const repo = createMemoryRepository()
    await repo.claimIdempotencyKey(key('k'), 'fp', at(0), 'lease-a')
    await repo.claimIdempotencyKey(key('k'), 'fp', at(61_000), 'lease-b')
    await repo.completeIdempotencyKey(key('k'), outcome('sig_from_a'), 'lease-a')
    expect((await repo.claimIdempotencyKey(key('k'), 'fp', at(62_000), 'lease-c')).status).toBe('in_progress')
    await repo.completeIdempotencyKey(key('k'), outcome('sig_from_b'), 'lease-b')
    const replay = await repo.claimIdempotencyKey(key('k'), 'fp', at(63_000), 'lease-d')
    expect(replay.status === 'completed' && replay.response.signupId).toBe('sig_from_b')
  })

  it('a commit carrying a stale lease is refused', async () => {
    const repo = createMemoryRepository()
    await repo.claimIdempotencyKey(key('k'), 'fp', at(0), 'lease-a')
    await repo.claimIdempotencyKey(key('k'), 'fp', at(61_000), 'lease-b')
    const u: UnitOfWork = { signup: signupRecord(1, '250'), transaction: posting(1), audit: [], idempotency: { key: key('k'), lease: 'lease-a', response: outcome('sig_1') } }
    expect(expectErr(await repo.commit(u, 0))).toBe('IDEMPOTENCY_IN_PROGRESS')
    expect(await repo.listLedger()).toHaveLength(0)
  })
})

describe('2. completion after a successful commit', () => {
  it('a failure while completing the key never reopens it for a second posting', async () => {
    const base = createMemoryRepository()
    let failOnce = true
    const repo: BillingRepository = {
      ...base,
      completeIdempotencyKey: async (k, r, lease) => {
        if (failOnce) { failOnce = false; throw new Error('network blip') }
        return base.completeIdempotencyKey(k, r, lease)
      },
    }
    const { service } = setup({ repo })
    const first = must(await service.recordSignup({ email: 'bob@student.example', referralTouches: [alphaTouch] }, 'k-1'))
    const again = must(await service.recordSignup({ email: 'bob@student.example', referralTouches: [alphaTouch] }, 'k-1'))
    expect(again.replayed).toBe(true)
    expect(again.transactionId).toBe(first.transactionId)
    expect(await base.listLedger()).toHaveLength(1)
  })
})

describe('3. receivables per currency', () => {
  it('never adds GBP and EUR owed by one partner', () => {
    const eur = must(moneyFromMinor(300n, 'EUR'))
    const eurPosting = must(buildTransaction({
      id: 'txn_2', at: T, causationId: 'sig_2', memo: '[SIMULATED] signup fee',
      entries: [{ accountId: receivableAccount(PTN_ALPHA), direction: 'debit', amount: eur }, { accountId: SIGNUP_REVENUE, direction: 'credit', amount: eur }],
    }))
    const r = reconcile({
      transactions: [posting(1), eurPosting],
      signups: [signupRecord(1, '250'), { ...signupRecord(2, '300'), fee: { amountMinor: '300', currency: 'EUR' } }],
    })
    expect(r.receivableByPartnerCurrency.ptn_alpha).toEqual({ GBP: '250', EUR: '300' })
    expect(r.receivableByPartner.ptn_alpha).toBeUndefined()
    expect(r.discrepancies).toContainEqual({ kind: 'MIXED_CURRENCY_RECEIVABLE', ref: 'ptn_alpha' })
  })
})

describe('4. the repository checks what it stores', () => {
  const amount = () => must(moneyFromMinor(250n, 'GBP'))
  const handBuilt = (over: Partial<LedgerTransaction>): LedgerTransaction => ({
    id: 'txn_1' as TransactionId, at: T, causationId: 'sig_1', memo: '[SIMULATED] signup fee', reverses: null, sandbox: true,
    entries: [{ accountId: receivableAccount(PTN_ALPHA), direction: 'debit', amount: amount() }, { accountId: SIGNUP_REVENUE, direction: 'credit', amount: amount() }],
    ...over,
  })

  it('refuses a one-sided hand-built transaction', async () => {
    const repo = createMemoryRepository()
    const tx = handBuilt({ entries: [{ accountId: receivableAccount(PTN_ALPHA), direction: 'debit', amount: amount() }] })
    expect(expectErr(await repo.commit({ signup: signupRecord(1, '250'), transaction: tx, audit: [] }, 0))).toBe('TOO_FEW_ENTRIES')
  })

  it('refuses a posting without the [SIMULATED] label', async () => {
    const repo = createMemoryRepository()
    expect(expectErr(await repo.commit({ signup: signupRecord(1, '250'), transaction: handBuilt({ memo: 'signup fee' }), audit: [] }, 0))).toBe('INVALID_REQUEST')
  })

  it('refuses a posting that points at another signup', async () => {
    const repo = createMemoryRepository()
    expect(expectErr(await repo.commit({ signup: signupRecord(1, '250'), transaction: handBuilt({ causationId: 'sig_9' }), audit: [] }, 0))).toBe('INVALID_REQUEST')
  })

  it('refuses audit events that do not continue the stored chain', async () => {
    const repo = createMemoryRepository()
    const forged = { seq: 1, at: at(0), type: 'SIGNUP_RECEIVED' as const, subjectId: 'sig_1', data: {}, prevHash: 'f'.repeat(64), hash: 'a'.repeat(64) }
    expect(expectErr(await repo.commit({ signup: signupRecord(1, null), transaction: null, audit: [forged] }, 0))).toBe('AUDIT_CHAIN_BROKEN')
  })
})

describe('5. the catalog is read-only', () => {
  it('exposes no Map.set and freezes partners and contracts', () => {
    const cat = catalog()
    expect(() => Reflect.apply(Map.prototype.set, cat.byCode, ['EVIL', 'ptn_evil'])).toThrow(TypeError)
    expect((cat.byCode as unknown as { set?: unknown }).set).toBeUndefined()
    const c = cat.contracts.get('ctr_alpha' as ContractId)
    expect(c && Object.isFrozen(c)).toBe(true)
    expect(Object.isFrozen(cat.partners.get(PTN_ALPHA))).toBe(true)
    expect(Object.isFrozen(cat.contractsByPartner.get(PTN_ALPHA))).toBe(true)
  })

  it('later edits to the input objects do not reach the catalog', () => {
    const cs: Contract[] = contracts()
    const cat = must(buildPartnerCatalog(partners(), cs))
    const mutable = cs[0] as { status: Contract['status'] }
    mutable.status = 'terminated'
    expect(cat.contracts.get('ctr_alpha' as ContractId)?.status).toBe('active')
  })
})

describe('6 and 7. request bodies', () => {
  it('an unexpected field name is never echoed back', async () => {
    const { service } = setup()
    const r = await service.recordSignup({ email: 'bob@student.example', 'victim@uni.example': 1 }, 'k-1')
    expect(expectErr(r)).toBe('UNEXPECTED_FIELD')
    expect(JSON.stringify(r)).not.toContain('victim')
  })

  it('an inherited email is refused', async () => {
    const { service } = setup()
    const r = await service.recordSignup(Object.create({ email: 's2@alpha-lettings.example' }), 'k-2')
    expect(r.ok).toBe(false)
  })

  it('a getter is refused', async () => {
    const { service } = setup()
    const sneaky = Object.defineProperty({}, 'email', { enumerable: true, get: () => 's3@alpha-lettings.example' })
    expect(expectErr(await service.recordSignup(sneaky, 'k-3'))).toBe('INVALID_REQUEST')
  })

  it('a class instance is refused', async () => {
    class Body { email = 's4@alpha-lettings.example' }
    const { service } = setup()
    expect(expectErr(await service.recordSignup(new Body(), 'k-4'))).toBe('INVALID_REQUEST')
  })
})

describe('8. fee quotes must match their contract', () => {
  const rogue = (over: { contractId?: string; currency?: 'EUR' }): FeeSchedule => ({
    id: 'flat-per-signup', version: 1,
    computeFee: (c) => ({
      ok: true,
      value: {
        amount: must(moneyFromMinor(250n, over.currency ?? 'GBP')), scheduleId: 'flat-per-signup', scheduleVersion: 1,
        contractId: (over.contractId ?? c.contract.id) as ContractId, basis: 'rogue',
      },
    }),
  })

  it('refuses a quote for another contract', async () => {
    const { service, repo } = setup({ schedules: [rogue({ contractId: 'ctr_beta' })] })
    expect(expectErr(await service.recordSignup({ email: 'bob@student.example', referralTouches: [alphaTouch] }, 'k-1'))).toBe('FEE_QUOTE_MISMATCH')
    expect(await repo.listLedger()).toHaveLength(0)
  })

  it('refuses a quote in another currency', async () => {
    const { service } = setup({ schedules: [rogue({ currency: 'EUR' })] })
    expect(expectErr(await service.recordSignup({ email: 'bob@student.example', referralTouches: [alphaTouch] }, 'k-1'))).toBe('CURRENCY_MISMATCH')
  })

  it('the shipped flat schedule still posts', async () => {
    const { service } = setup({ schedules: [flatFeePerSignup] })
    expect(must(await service.recordSignup({ email: 'bob@student.example', referralTouches: [alphaTouch] }, 'k-1')).fee?.amountMinor).toBe(250n)
  })
})

describe('9. catalog entries are normalised', () => {
  it('a lower-case code and a mixed-case domain still match', async () => {
    const ps: Partner[] = partners().map((p) => p.id === PTN_ALPHA
      ? { ...p, referralCodes: ['alpha2026' as Partner['referralCodes'][number]], emailDomains: ['Alpha-Lettings.Example' as Partner['emailDomains'][number]] }
      : p)
    const cat = must(buildPartnerCatalog(ps, contracts()))
    const { service } = setup({ catalog: cat })
    const byCode = must(await service.recordSignup({ email: 'bob@student.example', referralTouches: [alphaTouch] }, 'k-1'))
    expect(byCode.attribution.kind === 'partner' && byCode.attribution.partnerId).toBe(PTN_ALPHA)
    const byDomain = must(await service.recordSignup({ email: 'sue@alpha-lettings.example' }, 'k-2'))
    expect(byDomain.attribution.kind === 'partner' && byDomain.attribution.rule).toBe('email_domain')
  })

  it('an invalid partner code is refused when the catalog is built', () => {
    const ps: Partner[] = partners().map((p) => (p.id === PTN_ALPHA ? { ...p, referralCodes: ['AB' as Partner['referralCodes'][number]] } : p))
    expect(expectErr(buildPartnerCatalog(ps, contracts()))).toBe('INVALID_REFERRAL_CODE')
  })
})

describe('10. PII detector and canonical JSON', () => {
  it.each(['alice@localhost', 'alice%40uni.example', 'alice [at] uni.example', 'alice(at)uni.example'])('flags %s', (s) => {
    expect(containsPii(s)).toBe(true)
  })

  it('leaves ordinary memos alone', () => {
    expect(containsPii('[SIMULATED] signup fee for Palatine Lettings (fictional)')).toBe(false)
    expect(containsPii('psn_v1_k1_' + 'a'.repeat(64))).toBe(false)
  })

  it('refuses Maps, Dates and class instances instead of encoding them as {}', () => {
    expect(() => canonicalJson({ m: new Map([['a', 1]]) })).toThrow(InvariantError)
    expect(() => canonicalJson({ d: new Date(0) })).toThrow(InvariantError)
    class Thing { x = 1 }
    expect(() => canonicalJson(new Thing())).toThrow(InvariantError)
  })

  it('refuses cycles with InvariantError but accepts shared references', () => {
    const o: Record<string, unknown> = {}
    o.self = o
    expect(() => canonicalJson(o)).toThrow(InvariantError)
    const shared = { a: 1 }
    expect(canonicalJson({ x: shared, y: shared })).toBe('{"x":{"a":1},"y":{"a":1}}')
  })
})

describe('11. money string grammar', () => {
  it('minor units refuse leading zeros and negative zero', () => {
    expect(expectErr(moneyFromMinor('007', 'GBP'))).toBe('INVALID_AMOUNT')
    expect(expectErr(moneyFromMinor('-0', 'GBP'))).toBe('INVALID_AMOUNT')
    expect(must(moneyFromMinor('0', 'GBP')).amountMinor).toBe(0n)
    expect(must(moneyFromMinor('-5', 'GBP')).amountMinor).toBe(-5n)
  })

  it('huge strings are refused before BigInt parses them', () => {
    const huge = '9'.repeat(1_000_000)
    expect(expectErr(moneyFromMinor(huge, 'GBP'))).toBe('AMOUNT_OUT_OF_RANGE')
    expect(expectErr(parseMoney(huge, 'GBP'))).toBe('AMOUNT_OUT_OF_RANGE')
  })

  it('the largest valid amounts still parse', () => {
    expect(must(moneyFromMinor('-9223372036854775807', 'GBP')).amountMinor).toBe(-(2n ** 63n - 1n))
    expect(must(parseMoney('-92233720368547758.07', 'GBP')).amountMinor).toBe(-(2n ** 63n - 1n))
  })
})

