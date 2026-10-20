import { describe, expect, it } from 'vitest'
import type { IdempotencyKey, Instant, PseudonymousId, SignupId, TransactionId } from './brand'
import type { SignupRecord, UnitOfWork } from './repository'
import { createMemoryRepository } from './repository'
import type { SignupOutcome } from './signup'
import { buildTransaction, SIGNUP_REVENUE, receivableAccount } from './ledger'
import { moneyFromMinor } from './money'
import { parseIdempotencyKey } from './validate'
import { DAY, PTN_ALPHA, T, at, domain, expectErr, must } from './test-fixtures'

const key = (k: string): IdempotencyKey => must(parseIdempotencyKey(k))
const T0: Instant = at(0)

function outcome(): SignupOutcome {
  return {
    signupId: 'sig_1' as SignupId, studentRef: 'psn_v1_k1_x' as PseudonymousId, signedUpAt: T0,
    attribution: { kind: 'unattributed', rejected: [] }, fee: null, transactionId: null, replayed: false, sandbox: true,
  }
}

function unit(n: number, studentRef = `psn_v1_k1_${n}`): UnitOfWork {
  const txId = `txn_${n}`
  const signup: SignupRecord = {
    id: `sig_${n}` as SignupId, studentRef: studentRef as PseudonymousId, emailDomain: domain('alpha-lettings.example'),
    at: T0, attribution: { kind: 'unattributed', rejected: [] }, fee: { amountMinor: '250', currency: 'GBP' }, transactionId: txId as TransactionId,
  }
  const amount = must(moneyFromMinor(250n, 'GBP'))
  const transaction = must(buildTransaction({
    id: txId, at: T, causationId: `sig_${n}`, memo: '[SIMULATED] signup fee',
    entries: [{ accountId: receivableAccount(PTN_ALPHA), direction: 'debit', amount }, { accountId: SIGNUP_REVENUE, direction: 'credit', amount }],
  }))
  return { signup, transaction, audit: [] }
}

describe('idempotency claims', () => {
  it('first claim wins, a second is in progress', async () => {
    const repo = createMemoryRepository()
    expect(await repo.claimIdempotencyKey(key('k1'), 'fp', T0)).toEqual({ status: 'claimed' })
    expect(await repo.claimIdempotencyKey(key('k1'), 'fp', T0)).toEqual({ status: 'in_progress' })
  })

  it('a completed key replays for the same fingerprint and refuses a different one', async () => {
    const repo = createMemoryRepository()
    await repo.claimIdempotencyKey(key('k1'), 'fp', T0)
    await repo.completeIdempotencyKey(key('k1'), outcome())
    const again = await repo.claimIdempotencyKey(key('k1'), 'fp', T0)
    expect(again.status).toBe('completed')
    if (again.status === 'completed') expect(again.response).toEqual(outcome())
    expect(await repo.claimIdempotencyKey(key('k1'), 'other', T0)).toEqual({ status: 'fingerprint_mismatch' })
  })

  it('a released key can be claimed again', async () => {
    const repo = createMemoryRepository()
    await repo.claimIdempotencyKey(key('k1'), 'fp', T0)
    await repo.releaseIdempotencyKey(key('k1'))
    expect(await repo.claimIdempotencyKey(key('k1'), 'fp', T0)).toEqual({ status: 'claimed' })
  })

  it('ten concurrent claims: exactly one wins', async () => {
    const repo = createMemoryRepository()
    const rs = await Promise.all(Array.from({ length: 10 }, () => repo.claimIdempotencyKey(key('k1'), 'fp', T0)))
    expect(rs.filter((r) => r.status === 'claimed')).toHaveLength(1)
    expect(rs.filter((r) => r.status === 'in_progress')).toHaveLength(9)
  })

  it('completed keys are kept for 24h, measured from the claim', async () => {
    const repo = createMemoryRepository()
    await repo.claimIdempotencyKey(key('k1'), 'fp', T0)
    await repo.completeIdempotencyKey(key('k1'), outcome())
    expect((await repo.claimIdempotencyKey(key('k1'), 'fp', at(DAY - 1))).status).toBe('completed')
    expect((await repo.claimIdempotencyKey(key('k1'), 'fp', at(DAY))).status).toBe('claimed')
  })

  it('a stale in-progress lock is taken over after 60s', async () => {
    const repo = createMemoryRepository()
    await repo.claimIdempotencyKey(key('k1'), 'fp', T0)
    expect((await repo.claimIdempotencyKey(key('k1'), 'fp', at(59_999))).status).toBe('in_progress')
    expect((await repo.claimIdempotencyKey(key('k1'), 'fp', at(60_000))).status).toBe('claimed')
  })
})

describe('atomic commit', () => {
  it('optimistic versioning rejects a stale writer', async () => {
    const repo = createMemoryRepository()
    expect(must(await repo.commit(unit(1), 0))).toEqual({ version: 1 })
    expect(expectErr(await repo.commit(unit(2), 0))).toBe('VERSION_CONFLICT')
    expect(await repo.listLedger()).toHaveLength(1)
  })

  it('two concurrent writers at the same version: one wins', async () => {
    const repo = createMemoryRepository()
    const rs = await Promise.all([repo.commit(unit(1), 0), repo.commit(unit(2), 0)])
    expect(rs.filter((r) => r.ok)).toHaveLength(1)
    expect(rs.filter((r) => !r.ok && r.error.code === 'VERSION_CONFLICT')).toHaveLength(1)
  })

  it('the same student cannot be committed twice, even concurrently with retries', async () => {
    const repo = createMemoryRepository()
    const attempt = async (n: number) => {
      for (;;) {
        const r = await repo.commit(unit(n, 'psn_v1_k1_same'), await repo.getVersion())
        if (r.ok || r.error.code !== 'VERSION_CONFLICT') return r
      }
    }
    const rs = await Promise.all([1, 2, 3, 4, 5].map(attempt))
    expect(rs.filter((r) => r.ok)).toHaveLength(1)
    expect(rs.filter((r) => !r.ok && r.error.code === 'DUPLICATE_STUDENT')).toHaveLength(4)
    expect(await repo.listLedger()).toHaveLength(1)
  })

  it('a duplicate transaction id is refused', async () => {
    const repo = createMemoryRepository()
    must(await repo.commit(unit(1), 0))
    const dup = { ...unit(1, 'psn_v1_k1_other'), signup: { ...unit(2).signup, studentRef: 'psn_v1_k1_other' as PseudonymousId } }
    expect(expectErr(await repo.commit(dup, 1))).toBe('DUPLICATE_TRANSACTION_ID')
  })

  it('listings are frozen snapshots', async () => {
    const repo = createMemoryRepository()
    must(await repo.commit(unit(1), 0))
    const l = await repo.listLedger()
    expect(Object.isFrozen(l)).toBe(true)
    expect(() => Reflect.apply(Array.prototype.push, l, [l[0]])).toThrow(TypeError)
    expect(await repo.listLedger()).toHaveLength(1)
  })
})
