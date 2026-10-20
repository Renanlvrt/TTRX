# Deferred fee-model work

None of these files is built yet. The only fee schedule in code is `flat-per-signup` v1: each attributed signup posts the partner contract's `flatFee` (a simulated amount). Every option below plugs in as a new `FeeSchedule` (new `id`, or same `id` with a higher `version`). Old postings keep the schedule version they were priced with.

| Option the user listed | File | Status |
|---|---|---|
| Flat fee per signup | (built) `src/lib/billing/fees.ts` | Built, sandbox only |
| Tiered volume pricing | `tiered-pricing.md` | Deferred |
| VAT 20% | `vat.md` | Deferred |
| Monthly invoices | `monthly-invoices.md` | Deferred |
| Refunds / cancellations in a cooling-off window, producing credit notes | `refunds-credit-notes.md` | Deferred |
| Collecting payment | `payment-collection.md` | Deferred |
| Commercial questions to settle with partners | `open-questions.md` | Open |

Rule for picking any of these up: write the frozen tests first, add an ADR, then build.
