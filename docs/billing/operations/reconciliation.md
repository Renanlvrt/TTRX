# Reconciliation runbook

`reconcile({ transactions, signups })` checks that the ledger matches the signups.

## Checks and what to do

| Discrepancy | Meaning | Action |
|---|---|---|
| `UNBALANCED_TRANSACTION` | Debits do not equal credits in one transaction | Stop posting. This should never happen through `buildTransaction`, so someone wrote to the store directly. Investigate the audit log. |
| `MISSING_POSTING` | Attributed signup with a fee but no ledger posting | Repost with the original idempotency key so it cannot double-post. |
| `DUPLICATE_POSTING` | Two postings for one signup (`causationId`) | Reverse the extra one. Never delete it. |
| `AMOUNT_MISMATCH` | Posting amount differs from the signup's quoted fee | Reverse it and repost at the quoted fee. Check whether the fee schedule version changed. |
| `ORPHAN_POSTING` | Posting with no matching signup | Reverse it and investigate. |

## Daily routine (production)
1. Run `reconcile`. The trial balance must show `balanced: true` for each currency on its own.
2. Compare `receivableByPartner` with the provider's open invoices once payment collection exists.
3. Run `verifyAuditChain` and compare the head hash with the copy kept outside the database.
4. Record the run (time, totals, discrepancy count) in the admin audit log.

In sandbox mode every amount is simulated (`[SIMULATED]` memos), so a run only proves the logic.
