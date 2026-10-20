# RentReady B2B billing

> **SIMULATED. Every amount in this module is fake.** No real money moves:
> - `BILLING_MODE = 'sandbox'` is the only mode. Asking for live mode throws an error.
> - Every ledger memo starts with `[SIMULATED]`.
> - There is no payment provider and no network call.
> - Every partner is fictional and uses an `.example` domain, for example "Palatine Lettings (fictional)" at `alpha-lettings.example` and "Wearside Homes (fictional)" at `beta-homes.example`.

Status: a domain module on `Durham_testing_branch`, added 2026-10-20. There is no server.

## What it does
When a student signs up, the module does three things:
1. It attributes the signup to a billing partner, such as a students' union or a letting agent.
2. It works out the fee under that partner's contract.
3. It posts the fee to an append-only, double-entry ledger.

The partner owes the fee to RentReady. Students never pay anything.

## Module map (`src/lib/billing/`)

| File | Job |
|---|---|
| `result.ts`, `errors.ts` | `Result<T>` for expected errors. `InvariantError` for bugs and bad config only. |
| `rounding.ts` | `divRound` with `HALF_UP`, `HALF_EVEN` or `DOWN`, and no default |
| `money.ts` | `Money` as BigInt minor units, parsed from strings, plus `allocate` and DTOs |
| `brand.ts`, `validate.ts` | Branded IDs. Parsers for UTC instants, emails, referral codes and idempotency keys. |
| `clock.ts`, `ids.ts` | Injected clock and ID generator |
| `canonical.ts`, `pii.ts` | Canonical JSON, SHA-256, and the HMAC email pseudonymiser |
| `ledger.ts` | Double-entry transactions, reversals, balances and the trial balance |
| `audit.ts` | Hash-chained audit events and verification |
| `attribution.ts` | The partner catalogue and the attribution rules |
| `fees.ts` | The `FeeSchedule` interface, the `flatFeePerSignup` schedule and the schedule registry |
| `repository.ts` | The async storage port and an in-memory version, with idempotency and optimistic versioning |
| `signup.ts` | `recordSignup`: validate, pseudonymise, claim the key, attribute, calculate the fee, commit |
| `reconcile.ts` | Checks that the ledger matches the signups |

## Folders
- `DESIGN.md`: the full design, the API signatures and the frozen test list.
- `adr/`: decisions already made, and why.
- `deferred/`: fee-model details written down for later and not built: tiers, VAT, invoices, refunds and payments.
- `security/`: the threat model, browser limits, pseudonymisation, keys and audit retention.
- `operations/`: the reconciliation runbook.

## Glossary
- **Minor units:** the smallest unit of a currency (pence for GBP). £2.50 is stored as `250n`.
- **Debit and credit:** every transaction has entries on both sides, and the two sides are equal. `balanceOf` returns debits minus credits.
- **Receivable:** money a partner owes us (`receivable:<partnerId>`).
- **Revenue:** money we have earned (`revenue:signup_fees`). Its balance shows as negative under debits minus credits.
- **Idempotency key:** a client-chosen ID for a request. A retry with the same key never charges twice.
- **Pseudonym:** a keyed hash of a student's email. It is still personal data under UK GDPR (`security/pii-pseudonymisation.md`).

SPEC.md §9 #30 records this decision. On this branch it overrides the SPEC §4 exclusion of payments and affiliate tracking.
