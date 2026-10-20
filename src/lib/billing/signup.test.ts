import { describe, expect, it } from 'vitest'
import type { BillingRepository } from './repository'
import { createMemoryRepository } from './repository'
import { canonicalJson } from './canonical'
import { reconcile } from './reconcile'
import { SIGNUP_REVENUE, balanceOf, receivableAccount } from './ledger'
import { flatFeePerSignup } from './fees'
import { parseIdempotencyKey } from './validate'
import { PTN_ALPHA, T, catalog, expectErr, must, setup, stubSchedule } from './test-fixtures'

const alphaTouch = { code: 'ALPHA2026', at: '2026-10-20T09:00:00Z' }
const body = (email: string, touches: unknown[] = []) => (touches.length ? { email, referralTouches: touches } : { email })

describe('recordSignup: happy path', () => {
  it('records, attributes, prices and posts a referral signup', async () => {
    const { service, repo } = setup()
    const out = must(await service.recordSignup(body('bob@student.example', [alphaTouch]), 'k-1'))
    expect(out).toMatchObject({ signupId: 'sig_000001', transactionId: 'txn_000001', replayed: false, signedUpAt: T })
    expect(out.fee?.amountMinor).toBe(250n)
    const ledger = await repo.listLedger()
    expect(ledger).toHaveLength(1)
    expect(ledger[0].entries).toEqual([
      expect.objectContaining({ accountId: receivableAccount(PTN_ALPHA), direction: 'debit' }),
      expect.objectContaining({ accountId: SIGNUP_REVENUE, direction: 'credit' }),
    ])
    expect(ledger[0].entries.map((e) => e.amount.amountMinor)).toEqual([250n, 250n])
  })
})

describe('recordSignup: idempotency', () => {
  it('a retry with the same key and body replays the original outcome', async () => {
    const { service, repo } = setup()
    const first = must(await service.recordSignup(body('bob@student.example', [alphaTouch]), 'k-1'))
    const again = must(await service.recordSignup(body('bob@student.example', [alphaTouch]), 'k-1'))
    expect(again.replayed).toBe(true)
    expect(again.signupId).toBe(first.signupId)
    expect(again.transactionId).toBe(first.transactionId)
    expect(await repo.listLedger()).toHaveLength(1)
  })

  it('reusing a key with a different body is refused', async () => {
    const { service, repo } = setup()
    must(await service.recordSignup(body('bob@student.example', [alphaTouch]), 'k-1'))
    expect(expectErr(await service.recordSignup(body('carol@student.example', [alphaTouch]), 'k-1'))).toBe('IDEMPOTENCY_KEY_REUSED')
    expect(await repo.listLedger()).toHaveLength(1)
  })

  it('ten concurrent identical requests post exactly once', async () => {
    const { service, repo } = setup()
    const rs = await Promise.all(Array.from({ length: 10 }, () => service.recordSignup(body('bob@student.example', [alphaTouch]), 'k-1')))
    const fresh = rs.filter((r) => r.ok && !r.value.replayed)
    expect(fresh).toHaveLength(1)
    const txnId = fresh[0].ok ? fresh[0].value.transactionId : null
    for (const r of rs) {
      if (r.ok) expect(r.value.transactionId).toBe(txnId)
      else expect(r.error.code).toBe('IDEMPOTENCY_IN_PROGRESS')
    }
    expect(await repo.listLedger()).toHaveLength(1)
    const retry = must(await service.recordSignup(body('bob@student.example', [alphaTouch]), 'k-1'))
    expect(retry.replayed).toBe(true)
    expect(retry.transactionId).toBe(txnId)
  })

  it('five concurrent distinct students all post and the books balance', async () => {
    const { service, repo } = setup({ maxCommitAttempts: 5 })
    const rs = await Promise.all([1, 2, 3, 4, 5].map((i) => service.recordSignup(body(`s${i}@alpha-lettings.example`), `k-${i}`)))
    expect(rs.every((r) => r.ok)).toBe(true)
    expect(await repo.getVersion()).toBe(5)
    const ledger = await repo.listLedger()
    expect(ledger).toHaveLength(5)
    expect(balanceOf(ledger, receivableAccount(PTN_ALPHA), 'GBP').amountMinor).toBe(1250n)
    const report = reconcile({ transactions: ledger, signups: await repo.listSignups() })
    expect(report.balanced).toBe(true)
    expect(report.discrepancies).toEqual([])
  })

  it('the same student under three keys concurrently is billed once', async () => {
    const { service, repo } = setup()
    const rs = await Promise.all(['a', 'b', 'c'].map((k) => service.recordSignup(body('s1@alpha-lettings.example'), `k-${k}`)))
    expect(rs.filter((r) => r.ok)).toHaveLength(1)
    expect(rs.filter((r) => !r.ok && r.error.code === 'DUPLICATE_STUDENT')).toHaveLength(2)
    expect(await repo.listLedger()).toHaveLength(1)
  })

  it('email normalisation catches the same student written differently', async () => {
    const { service } = setup()
    const a = must(await service.recordSignup(body(' Alice@ALPHA-LETTINGS.example '), 'a'))
    expect(a.attribution).toMatchObject({ kind: 'partner', rule: 'email_domain' })
    expect(expectErr(await service.recordSignup(body('alice@alpha-lettings.example'), 'b'))).toBe('DUPLICATE_STUDENT')
  })
})

describe('recordSignup: unattributed and invalid input', () => {
  it('an unattributed signup is recorded without a fee or posting', async () => {
    const { service, repo } = setup()
    const out = must(await service.recordSignup(body('bob@student.example'), 'k-1'))
    expect(out.fee).toBeNull()
    expect(out.transactionId).toBeNull()
    expect(await repo.listLedger()).toHaveLength(0)
    expect((await repo.listAudit()).map((e) => e.type)).toContain('SIGNUP_UNATTRIBUTED')
  })

  it.each([{ fee: '0.00' }, { partnerId: 'ptn_alpha' }, { occurredAt: '2026-10-20T10:00:00Z' }])(
    'rejects client-supplied field %j before touching the store',
    async (extra) => {
      const { service, repo } = setup()
      expect(expectErr(await service.recordSignup({ email: 'bob@student.example', ...extra }, 'k-1'))).toBe('UNEXPECTED_FIELD')
      expect(await repo.listAudit()).toHaveLength(0)
      expect(await repo.listLedger()).toHaveLength(0)
    },
  )

  it('rejects an invalid email without side effects', async () => {
    const { service, repo } = setup()
    expect(expectErr(await service.recordSignup(body('not-an-email'), 'k-1'))).toBe('INVALID_EMAIL')
    expect(await repo.listAudit()).toHaveLength(0)
  })

  it('rejects an invalid idempotency key without side effects', async () => {
    const { service, repo } = setup()
    expect(expectErr(await service.recordSignup(body('bob@student.example'), 'a b'))).toBe('INVALID_IDEMPOTENCY_KEY')
    expect(await repo.listAudit()).toHaveLength(0)
  })

  it('rejects a touch instant without a zone without side effects', async () => {
    const { service, repo } = setup()
    expect(expectErr(await service.recordSignup(body('bob@student.example', [{ code: 'ALPHA2026', at: '2026-10-20T09:00:00' }]), 'k-1'))).toBe('INVALID_INSTANT')
    expect(await repo.listAudit()).toHaveLength(0)
  })

  it('referral codes are case-insensitive', async () => {
    const { service } = setup()
    const out = must(await service.recordSignup(body('bob@student.example', [{ code: 'alpha2026', at: '2026-10-20T09:00:00Z' }]), 'k-1'))
    expect(out.attribution).toMatchObject({ kind: 'partner', partnerId: PTN_ALPHA })
  })
})

describe('recordSignup: privacy, retries and pluggable fees', () => {
  it('stores no raw email anywhere, only the domain and a pseudonym', async () => {
    const { service, repo } = setup()
    const out = must(await service.recordSignup(body('alice@alpha-lettings.example'), 'k-1'))
    const dump = canonicalJson({ s: await repo.listSignups(), l: await repo.listLedger(), a: await repo.listAudit() })
    expect(dump).not.toContain('alice')
    expect(dump).toContain('alpha-lettings.example')
    expect(dump).toContain(out.studentRef)
  })

  it('gives up after 3 version conflicts and releases the key', async () => {
    const base = createMemoryRepository()
    let commits = 0
    const repo: BillingRepository = {
      claimIdempotencyKey: (k, f, n) => base.claimIdempotencyKey(k, f, n),
      completeIdempotencyKey: (k, r) => base.completeIdempotencyKey(k, r),
      releaseIdempotencyKey: (k) => base.releaseIdempotencyKey(k),
      getVersion: () => base.getVersion(),
      getAuditHead: () => base.getAuditHead(),
      commit: async () => {
        commits++
        return { ok: false, error: { code: 'VERSION_CONFLICT', message: 'stub' } }
      },
      listSignups: () => base.listSignups(),
      listLedger: () => base.listLedger(),
      listAudit: () => base.listAudit(),
    }
    const { service, clock } = setup({ repo })
    expect(expectErr(await service.recordSignup(body('s1@alpha-lettings.example'), 'k-1'))).toBe('VERSION_CONFLICT')
    expect(commits).toBe(3)
    expect(await repo.claimIdempotencyKey(must(parseIdempotencyKey('k-1')), 'any', clock.now())).toEqual({ status: 'claimed' })
  })

  it('posts whatever a plugged-in schedule quotes and audits its version', async () => {
    const cat = catalog({ alpha: { feeScheduleId: 'stub' } })
    const { service, repo } = setup({ catalog: cat, schedules: [flatFeePerSignup, stubSchedule] })
    const out = must(await service.recordSignup(body('s1@alpha-lettings.example'), 'k-1'))
    expect(out.fee?.amountMinor).toBe(999n)
    const feeEvent = (await repo.listAudit()).find((e) => e.type === 'FEE_CALCULATED')
    expect(feeEvent?.data.scheduleVersion).toBe('7')
    expect(Object.isFrozen(out)).toBe(true)
    expect(Object.isFrozen(out.attribution)).toBe(true)
    expect(Object.isFrozen(out.fee)).toBe(true)
  })
})
