// Reconciliation: do the books balance, and does every billed signup have exactly one matching posting?
import type { LedgerTransaction } from './ledger'
import type { CurrencyCode, MoneyDTO } from './money'
import type { SignupRecord } from './repository'
import { deepFreeze } from './validate'

export type DiscrepancyKind = 'UNBALANCED_TRANSACTION' | 'MISSING_POSTING' | 'DUPLICATE_POSTING' | 'AMOUNT_MISMATCH' | 'ORPHAN_POSTING'
export interface Discrepancy { readonly kind: DiscrepancyKind; readonly ref: string }

export interface ReconciliationReport {
  readonly balanced: boolean
  readonly totals: Readonly<Partial<Record<CurrencyCode, { readonly debits: string; readonly credits: string }>>>
  readonly receivableByPartner: Readonly<Record<string, MoneyDTO>>
  readonly discrepancies: readonly Discrepancy[]
}

const RECEIVABLE = 'receivable:'

export function reconcile(i: { transactions: readonly LedgerTransaction[]; signups: readonly SignupRecord[] }): ReconciliationReport {
  const discrepancies: Discrepancy[] = []
  const totals = new Map<CurrencyCode, { d: bigint; c: bigint }>()
  const receivable = new Map<string, { n: bigint; currency: CurrencyCode }>()
  let balanced = true

  for (const t of i.transactions) {
    const net = new Map<CurrencyCode, bigint>()
    for (const e of t.entries) {
      const cur = e.amount.currency
      const amt = e.amount.amountMinor
      const tot = totals.get(cur) ?? { d: 0n, c: 0n }
      if (e.direction === 'debit') tot.d += amt
      else tot.c += amt
      totals.set(cur, tot)
      net.set(cur, (net.get(cur) ?? 0n) + (e.direction === 'debit' ? amt : -amt))
      if (e.accountId.startsWith(RECEIVABLE)) {
        const p = e.accountId.slice(RECEIVABLE.length)
        const r = receivable.get(p) ?? { n: 0n, currency: cur }
        r.n += e.direction === 'debit' ? amt : -amt
        receivable.set(p, r)
      }
    }
    if ([...net.values()].some((n) => n !== 0n)) {
      balanced = false
      discrepancies.push({ kind: 'UNBALANCED_TRANSACTION', ref: t.id })
    }
  }
  for (const { d, c } of totals.values()) if (d !== c) balanced = false

  // Link postings to signups by causationId. A reversal settles its original, so the pair counts as no posting.
  const reversed = new Set(i.transactions.filter((t) => t.reverses !== null).map((t) => t.reverses))
  const signupsById = new Map(i.signups.map((s) => [s.id as string, s]))
  const live = new Map<string, LedgerTransaction[]>()
  for (const t of i.transactions) {
    if (!signupsById.has(t.causationId)) {
      discrepancies.push({ kind: 'ORPHAN_POSTING', ref: t.id })
      continue
    }
    if (t.reverses !== null || reversed.has(t.id)) continue
    live.set(t.causationId, [...(live.get(t.causationId) ?? []), t])
  }
  const settled = new Set(i.transactions.filter((t) => t.reverses !== null).map((t) => t.causationId))
  for (const s of i.signups) {
    const posts = live.get(s.id) ?? []
    if (s.fee !== null && posts.length === 0 && !settled.has(s.id)) discrepancies.push({ kind: 'MISSING_POSTING', ref: s.id })
    if (posts.length > 1) discrepancies.push({ kind: 'DUPLICATE_POSTING', ref: s.id })
    for (const t of posts) {
      const debits = t.entries.filter((e) => e.direction === 'debit')
      const debitTotal = debits.reduce((sum, e) => sum + e.amount.amountMinor, 0n)
      const currency = debits.length ? debits[0].amount.currency : null
      if (s.fee === null || s.fee.amountMinor !== debitTotal.toString() || s.fee.currency !== currency) {
        discrepancies.push({ kind: 'AMOUNT_MISMATCH', ref: t.id })
      }
    }
  }

  const totalsOut: Partial<Record<CurrencyCode, { debits: string; credits: string }>> = {}
  for (const [cur, { d, c }] of totals) totalsOut[cur] = { debits: d.toString(), credits: c.toString() }
  const receivableOut: Record<string, MoneyDTO> = {}
  for (const [p, { n, currency }] of receivable) receivableOut[p] = { amountMinor: n.toString(), currency }

  return deepFreeze({ balanced, totals: totalsOut, receivableByPartner: receivableOut, discrepancies })
}
