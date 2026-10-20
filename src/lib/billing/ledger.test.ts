import { describe, expect, it } from 'vitest'
import type { LedgerEntry, LedgerTransaction } from './ledger'
import { SIGNUP_REVENUE, appendTransaction, balanceOf, buildTransaction, receivableAccount, reverseTransaction, trialBalance } from './ledger'
import { moneyFromMinor } from './money'
import type { CurrencyCode } from './money'
import type { TransactionId } from './brand'
import { PTN_ALPHA, T, expectErr, must } from './test-fixtures'

const REC = receivableAccount(PTN_ALPHA)
const amt = (n: bigint, c: CurrencyCode = 'GBP') => must(moneyFromMinor(n, c))
const debit = (n: bigint, c: CurrencyCode = 'GBP', accountId = REC): LedgerEntry => ({ accountId, direction: 'debit', amount: amt(n, c) })
const credit = (n: bigint, c: CurrencyCode = 'GBP', accountId = SIGNUP_REVENUE): LedgerEntry => ({ accountId, direction: 'credit', amount: amt(n, c) })
const tx = (id: string, entries: LedgerEntry[], extra: { memo?: string; at?: string } = {}) =>
  buildTransaction({ id, at: extra.at ?? T, causationId: `sig_${id}`, memo: extra.memo ?? 'signup fee', entries })

function postN(n: number): readonly LedgerTransaction[] {
  let ledger: readonly LedgerTransaction[] = []
  for (let i = 1; i <= n; i++) ledger = must(appendTransaction(ledger, must(tx(`txn_${i}`, [debit(250n), credit(250n)]))))
  return ledger
}

describe('buildTransaction', () => {
  it('accepts a balanced two-leg posting and freezes it', () => {
    const t = must(tx('txn_1', [debit(250n), credit(250n)]))
    expect(t.entries).toHaveLength(2)
    expect(Object.isFrozen(t)).toBe(true)
    expect(Object.isFrozen(t.entries)).toBe(true)
    expect(Object.isFrozen(t.entries[0])).toBe(true)
  })

  it('rejects unbalanced postings', () => {
    expect(expectErr(tx('txn_1', [debit(250n), credit(249n)]))).toBe('UNBALANCED_TRANSACTION')
  })

  it('rejects a single entry', () => {
    expect(expectErr(tx('txn_1', [debit(250n)]))).toBe('TOO_FEW_ENTRIES')
  })

  it('rejects zero and negative entry amounts', () => {
    expect(expectErr(tx('txn_1', [debit(0n), credit(0n)]))).toBe('NON_POSITIVE_AMOUNT')
    expect(expectErr(tx('txn_1', [debit(-250n), credit(-250n)]))).toBe('NON_POSITIVE_AMOUNT')
  })

  it('rejects entries in different currencies', () => {
    expect(expectErr(tx('txn_1', [debit(100n, 'GBP'), credit(100n, 'EUR')]))).toBe('CURRENCY_MISMATCH')
  })

  it('accepts multi-leg postings that balance', () => {
    const t = must(tx('txn_1', [debit(300n), credit(250n), credit(50n, 'GBP', SIGNUP_REVENUE)]))
    expect(t.entries).toHaveLength(3)
  })

  it('rejects PII in the memo and non-canonical instants', () => {
    expect(expectErr(tx('txn_1', [debit(250n), credit(250n)], { memo: 'alice@student.example' }))).toBe('PII_REJECTED')
    expect(expectErr(tx('txn_1', [debit(250n), credit(250n)], { at: '2026-10-20' }))).toBe('INVALID_INSTANT')
  })
})

describe('append-only ledger', () => {
  it('rejects a duplicate transaction id', () => {
    const ledger = postN(1)
    expect(expectErr(appendTransaction(ledger, must(tx('txn_1', [debit(250n), credit(250n)]))))).toBe('DUPLICATE_TRANSACTION_ID')
  })

  it('balances are debits minus credits and the trial balance agrees', () => {
    const ledger = postN(3)
    expect(balanceOf(ledger, REC, 'GBP').amountMinor).toBe(750n)
    expect(balanceOf(ledger, SIGNUP_REVENUE, 'GBP').amountMinor).toBe(-750n)
    const tb = trialBalance(ledger).GBP
    expect(tb.debits.amountMinor).toBe(750n)
    expect(tb.credits.amountMinor).toBe(750n)
    expect(tb.balanced).toBe(true)
  })

  it('reversal swaps directions, links the original and nets to zero', () => {
    const ledger = postN(1)
    const original = ledger[0]
    const rev = must(reverseTransaction(ledger, original.id, { id: 'txn_rev', at: T, memo: 'reversal' }))
    expect(rev.reverses).toBe(original.id)
    expect(rev.entries.map((e) => e.direction)).toEqual(original.entries.map((e) => (e.direction === 'debit' ? 'credit' : 'debit')))
    const after = must(appendTransaction(ledger, rev))
    expect(balanceOf(after, REC, 'GBP').amountMinor).toBe(0n)
    expect(after[0]).toBe(original)
    expect(original.entries[0].direction).toBe('debit')
  })

  it('cannot reverse twice or reverse an unknown transaction', () => {
    const ledger = postN(1)
    const rev = must(reverseTransaction(ledger, ledger[0].id, { id: 'txn_rev', at: T, memo: 'reversal' }))
    const after = must(appendTransaction(ledger, rev))
    expect(expectErr(reverseTransaction(after, ledger[0].id, { id: 'txn_rev2', at: T, memo: 'reversal' }))).toBe('ALREADY_REVERSED')
    expect(expectErr(reverseTransaction(after, 'txn_nope' as TransactionId, { id: 'txn_rev3', at: T, memo: 'reversal' }))).toBe('UNKNOWN_TRANSACTION')
  })
})
