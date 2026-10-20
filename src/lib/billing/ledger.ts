// Append-only double-entry ledger. Corrections are reversals, never edits. Balances are debits minus credits.
import type { AccountId, PartnerId, TransactionId } from './brand'
import { InvariantError } from './errors'
import type { CurrencyCode, Money } from './money'
import { CURRENCY_EXPONENT, moneyFromMinor } from './money'
import { containsPii } from './pii'
import type { Result } from './result'
import { fail, ok } from './result'
import { deepFreeze, parseInstant } from './validate'

export type Direction = 'debit' | 'credit'

export interface LedgerEntry { readonly accountId: AccountId; readonly direction: Direction; readonly amount: Money }

export interface LedgerTransaction {
  readonly id: TransactionId
  /** Canonical UTC instant. Typed as string so stored rows can be re-read; buildTransaction always validates it. */
  readonly at: string
  readonly causationId: string
  readonly memo: string
  readonly reverses: TransactionId | null
  readonly sandbox: true
  readonly entries: readonly LedgerEntry[]
}

export const receivableAccount = (p: PartnerId): AccountId => `receivable:${p}` as AccountId
export const SIGNUP_REVENUE = 'revenue:signup_fees' as AccountId

interface Draft { id: string; at: string; causationId: string; memo: string; entries: readonly LedgerEntry[]; reverses?: TransactionId | null }

/** The double-entry rules every posting obeys. The repository re-runs them on commit, so hand-built rows cannot skip them. */
export function checkEntries(entries: readonly LedgerEntry[]): Result<true> {
  if (entries.length < 2) return fail('TOO_FEW_ENTRIES', 'a posting needs at least two entries')
  if (entries.some((e) => e.amount.amountMinor <= 0n)) return fail('NON_POSITIVE_AMOUNT', 'entry amounts must be positive')
  const currency = entries[0].amount.currency
  if (entries.some((e) => e.amount.currency !== currency)) return fail('CURRENCY_MISMATCH', 'one transaction, one currency')
  let net = 0n
  for (const e of entries) net += e.direction === 'debit' ? e.amount.amountMinor : -e.amount.amountMinor
  if (net !== 0n) return fail('UNBALANCED_TRANSACTION', 'debits must equal credits')
  return ok(true as const)
}

function build(d: Draft): Result<LedgerTransaction> {
  if (!/^[A-Za-z0-9_-]{1,64}$/.test(d.id)) return fail('INVALID_REQUEST', 'transaction id must be 1 to 64 URL-safe characters')
  const at = parseInstant(d.at)
  if (!at.ok) return at
  if (containsPii(d.memo) || containsPii(d.causationId)) return fail('PII_REJECTED', 'ledger text must not contain personal data')
  const checked = checkEntries(d.entries)
  if (!checked.ok) return checked
  return ok(deepFreeze({
    id: d.id as TransactionId,
    at: at.value,
    causationId: d.causationId,
    memo: d.memo,
    reverses: d.reverses ?? null,
    sandbox: true as const,
    entries: d.entries.map((e) => ({ accountId: e.accountId, direction: e.direction, amount: e.amount })),
  }))
}

export function buildTransaction(d: { id: string; at: string; causationId: string; memo: string; entries: readonly LedgerEntry[] }): Result<LedgerTransaction> {
  return build(d)
}

/** Returns a new ledger; the input is never mutated. */
export function appendTransaction(ledger: readonly LedgerTransaction[], tx: LedgerTransaction): Result<readonly LedgerTransaction[]> {
  if (ledger.some((t) => t.id === tx.id)) return fail('DUPLICATE_TRANSACTION_ID', `transaction ${tx.id} already exists`)
  return ok(Object.freeze([...ledger, tx]))
}

/** Builds the contra transaction for `originalId`. It keeps the original causationId so reconciliation links them. */
export function reverseTransaction(
  ledger: readonly LedgerTransaction[], originalId: TransactionId, o: { id: string; at: string; memo: string },
): Result<LedgerTransaction> {
  const original = ledger.find((t) => t.id === originalId)
  if (!original) return fail('UNKNOWN_TRANSACTION', `no transaction ${originalId}`)
  if (ledger.some((t) => t.reverses === originalId)) return fail('ALREADY_REVERSED', `${originalId} is already reversed`)
  return build({
    id: o.id, at: o.at, memo: o.memo, causationId: original.causationId, reverses: originalId,
    entries: original.entries.map((e) => ({ ...e, direction: e.direction === 'debit' ? 'credit' : 'debit' })),
  })
}

function money(n: bigint, c: CurrencyCode): Money {
  const r = moneyFromMinor(n, c)
  if (!r.ok) throw new InvariantError(`ledger total out of range for ${c}`)
  return r.value
}

export function balanceOf(ledger: readonly LedgerTransaction[], account: AccountId, currency: CurrencyCode): Money {
  let n = 0n
  for (const t of ledger) {
    for (const e of t.entries) {
      if (e.accountId === account && e.amount.currency === currency) n += e.direction === 'debit' ? e.amount.amountMinor : -e.amount.amountMinor
    }
  }
  return money(n, currency)
}

export type TrialBalance = Readonly<Record<CurrencyCode, { readonly debits: Money; readonly credits: Money; readonly balanced: boolean }>>

/** Total debits and credits per currency. Currencies are never added together. */
export function trialBalance(ledger: readonly LedgerTransaction[]): TrialBalance {
  const out = {} as Record<CurrencyCode, { debits: Money; credits: Money; balanced: boolean }>
  for (const c of Object.keys(CURRENCY_EXPONENT) as CurrencyCode[]) {
    let d = 0n
    let cr = 0n
    for (const t of ledger) {
      for (const e of t.entries) {
        if (e.amount.currency !== c) continue
        if (e.direction === 'debit') d += e.amount.amountMinor
        else cr += e.amount.amountMinor
      }
    }
    out[c] = { debits: money(d, c), credits: money(cr, c), balanced: d === cr }
  }
  return deepFreeze(out)
}
