# Tiered volume pricing (deferred)

## What it is
The fee for each signup drops as a partner sends more students in a billing period.

## Two models to choose between

| Model | How it works | Example: 1-100 at £3.00, 101+ at £2.00, 150 signups |
|---|---|---|
| **Graduated** | Each signup is priced at the tier it falls in | 100 × £3.00 + 50 × £2.00 = £400.00 |
| **Volume** | Once a tier is reached, every signup in the period takes that tier's price | 150 × £2.00 = £300.00 |

- **Graduated** never makes the 101st signup cheaper than the 100th was. Partners can predict it.
- **Volume** creates a cliff: signup 101 lowers the price of the 100 signups before it. That needs a credit-note adjustment at the end of the period.

The recommended default is graduated.

## Decisions to make before building
1. **Counting period.** Calendar month in `Europe/London`, or the academic year (September to August)? Tier counters reset at the start of each period.
2. **What counts.** Only attributed, non-reversed signups. A reversal inside the same period lowers the count.
3. **Re-pricing.** Never edit a posted transaction. Under the volume model, post a correcting credit at period end (see `refunds-credit-notes.md`).
4. **Contract shape.** Add `tiers: { upTo: number | null; unitFee: Money }[]`, sorted. The final tier has `upTo: null`.
5. **Rounding.** The unit fees are whole pence, so no division is needed. If a tier is ever a percentage, pass `HALF_UP` explicitly (ADR 0002).

## Tests to write first
- Tier boundaries (100, 101).
- Reset at the period boundary: 2026-03-31T23:30Z is already April in BST.
- Reversal lowers the count.
- Graduated and volume totals for the same input.
