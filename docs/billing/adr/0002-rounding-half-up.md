# ADR 0002: HALF_UP rounding by default, always explicit

Status: accepted, 2026-10-20.

## Context
- HMRC says that, when you work out VAT per line or per unit, a fraction under 0.5p rounds down and 0.5p or more rounds up (VATREC12030).
- Banker's rounding (half-even) is common in finance libraries, but HMRC does not describe it.
- HMRC also lets a business round the total VAT on an invoice down to a whole penny (VATREC12010).

## Decision
- `RoundingMode = 'HALF_UP' | 'HALF_EVEN' | 'DOWN'`.
- No default: every function that rounds requires a mode, and leaving it out is a type error.
- `HALF_UP` rounds half away from zero, so -2.5p becomes -3p and a credit note mirrors its invoice. Use it for VAT lines, invoice lines and percentage fees.
- `DOWN` (toward zero) is reserved for the invoice-total VAT concession.
- `HALF_EVEN` is for internal statistics only and never appears on a document HMRC sees.
- BigInt `/` truncates toward zero (`-5n / 2n === -2n`), so all rounding goes through `divRound`.

## Consequences
- The flat-fee schedule shipped today never rounds. Rounding first matters once VAT and tiered pricing arrive (see `deferred/`).
- Whichever VAT rounding method we choose (per line or per invoice), we must use it on every invoice (see `deferred/vat.md`).

## Sources
- https://www.gov.uk/hmrc-internal-manuals/vat-trader-records/vatrec12030
- https://www.gov.uk/hmrc-internal-manuals/vat-trader-records/vatrec12010
