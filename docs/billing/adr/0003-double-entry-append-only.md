# ADR 0003: Double-entry, append-only ledger

Status: accepted, 2026-10-20.

## Decision
- A `LedgerTransaction` has at least 2 entries, all with positive amounts in one currency, and its debits equal its credits.
  - Otherwise it fails with `UNBALANCED_TRANSACTION`, `TOO_FEW_ENTRIES`, `NON_POSITIVE_AMOUNT` or `CURRENCY_MISMATCH`.
- Accounts:
  - `receivable:<partnerId>`: the partner owes us. The normal balance is a debit.
  - `revenue:signup_fees`: money we have earned. The normal balance is a credit.
- A signup fee debits the receivable and credits revenue.
- Nothing is ever edited or deleted.
  - A correction is a new reversing transaction (`reverses: originalId`) with each entry's direction swapped.
  - A transaction can only be reversed once (`ALREADY_REVERSED`).
- `balanceOf` returns debits minus credits.
- `trialBalance` totals each currency on its own and checks that each one balances. It never adds currencies together.
- Memos and audit data are scanned. Anything that looks like an email returns `PII_REJECTED`.
- In sandbox mode, every memo starts with `[SIMULATED]`.

## Why
- Every pound has an equal entry on the other side, so `reconcile` can show the books are complete.
- An append-only log gives auditors and HMRC record-keeping a history that nobody can rewrite.

## Sources
- https://docs.tigerbeetle.com/develop/recipes/multi-debit-credit-transfers
- https://www.moderntreasury.com/journal/enforcing-immutability-in-your-double-entry-ledger
