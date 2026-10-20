import { describe, expect, it } from 'vitest'
import type { PseudonymousId, SignupId, TransactionId } from './brand'
import type { LedgerTransaction } from './ledger'
import { SIGNUP_REVENUE, appendTransaction, buildTransaction, receivableAccount, reverseTransaction } from './ledger'
import type { SignupRecord } from './repository'
import { reconcile } from './reconcile'
import { moneyFromMinor } from './money'
import type { CurrencyCode } from './money'
import { PTN_ALPHA, T, at, domain, must, setup } from './test-fixtures'

const REC = receivableAccount(PTN_ALPHA)

function signup(n: number, feeMinor: string | null, currency: CurrencyCode = 'GBP'): SignupRecord {
  return {
    id: `sig_${n}` as SignupId, studentRef: `psn_v1_k1_${n}` as PseudonymousId, emailDomain: domain('alpha-lettings.example'), at: at(0),
    attribution: { kind: 'unattributed', rejected: [] },
    fee: feeMinor === null ? null : { amountMinor: feeMinor, currency },
    transactionId: feeMinor === null ? null : (`txn_${n}` as TransactionId),
  }
}

function posting(id: string, causationId: string, minor: bigint, currency: CurrencyCode = 'GBP'): LedgerTransaction {
  const amount = must(moneyFromMinor(minor, currency))
  return must(buildTransaction({
    id, at: T, causationId, memo: '[SIMULATED] signup fee',
    entries: [{ accountId: REC, direction: 'debit', amount }, { accountId: SIGNUP_REVENUE, direction: 'credit', amount }],
  }))
}

const kinds = (r: ReturnType<typeof reconcile>) => r.discrepancies.map((d) => d.kind)

describe('reconcile', () => {
  it('a clean run of real signups balances per partner', async () => {
    const { service, repo } = setup({ maxCommitAttempts: 5 })
    for (const [i, email] of ['s1@alpha-lettings.example', 's2@alpha-lettings.example', 's3@alpha-lettings.example', 's4@beta-homes.example'].entries()) {
      must(await service.recordSignup({ email }, `k-${i}`))
    }
    const r = reconcile({ transactions: await repo.listLedger(), signups: await repo.listSignups() })
    expect(r.balanced).toBe(true)
    expect(r.totals.GBP).toEqual({ debits: '1150', credits: '1150' })
    expect(r.receivableByPartner.ptn_alpha.amountMinor).toBe('750')
    expect(r.receivableByPartner.ptn_beta.amountMinor).toBe('400')
    expect(r.discrepancies).toEqual([])
  })

  it('empty books are balanced', () => {
    const r = reconcile({ transactions: [], signups: [] })
    expect(r.balanced).toBe(true)
    expect(r.totals).toEqual({})
    expect(r.discrepancies).toEqual([])
  })

  it('flags a transaction that bypassed the builder and does not balance', () => {
    const bad: LedgerTransaction = {
      id: 'txn_bad' as TransactionId, at: T, causationId: 'sig_1', memo: 'hand built', reverses: null, sandbox: true,
      entries: [
        { accountId: REC, direction: 'debit', amount: must(moneyFromMinor(250n, 'GBP')) },
        { accountId: SIGNUP_REVENUE, direction: 'credit', amount: must(moneyFromMinor(249n, 'GBP')) },
      ],
    }
    const r = reconcile({ transactions: [bad], signups: [signup(1, '250')] })
    expect(r.balanced).toBe(false)
    expect(r.discrepancies).toContainEqual({ kind: 'UNBALANCED_TRANSACTION', ref: 'txn_bad' })
  })

  it('flags a billed signup with no posting', () => {
    expect(kinds(reconcile({ transactions: [], signups: [signup(1, '250')] }))).toContain('MISSING_POSTING')
  })

  it('flags two postings for one signup', () => {
    const r = reconcile({ transactions: [posting('txn_1', 'sig_1', 250n), posting('txn_1b', 'sig_1', 250n)], signups: [signup(1, '250')] })
    expect(kinds(r)).toContain('DUPLICATE_POSTING')
  })

  it('flags a posting that disagrees with the signup fee', () => {
    const r = reconcile({ transactions: [posting('txn_1', 'sig_1', 300n)], signups: [signup(1, '250')] })
    expect(r.discrepancies).toContainEqual({ kind: 'AMOUNT_MISMATCH', ref: 'txn_1' })
  })

  it('flags a posting with no signup behind it', () => {
    const r = reconcile({ transactions: [posting('txn_9', 'sig_9', 250n)], signups: [] })
    expect(r.discrepancies).toContainEqual({ kind: 'ORPHAN_POSTING', ref: 'txn_9' })
  })

  it('a posting and its reversal net to zero without discrepancies', () => {
    let ledger: readonly LedgerTransaction[] = [posting('txn_1', 'sig_1', 250n)]
    ledger = must(appendTransaction(ledger, must(reverseTransaction(ledger, ledger[0].id, { id: 'txn_1r', at: T, memo: '[SIMULATED] reversal' }))))
    const r = reconcile({ transactions: ledger, signups: [signup(1, '250')] })
    expect(r.receivableByPartner.ptn_alpha.amountMinor).toBe('0')
    expect(r.discrepancies).toEqual([])
  })

  it('never adds different currencies together', () => {
    const r = reconcile({ transactions: [posting('txn_1', 'sig_1', 250n), posting('txn_2', 'sig_2', 300n, 'EUR')], signups: [signup(1, '250'), signup(2, '300', 'EUR')] })
    expect(r.totals.GBP).toEqual({ debits: '250', credits: '250' })
    expect(r.totals.EUR).toEqual({ debits: '300', credits: '300' })
  })
})
