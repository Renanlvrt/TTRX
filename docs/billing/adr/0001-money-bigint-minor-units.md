# ADR 0001: Money is BigInt minor units

Status: accepted, 2026-10-20. All amounts are simulated (sandbox only).

## Context
A floating-point `number` cannot hold most decimal fractions exactly: `0.1 + 0.2 !== 0.3`. Over thousands of fees, those errors add up to pennies that will not reconcile.

## Decision
- `Money = { amountMinor: bigint; currency: CurrencyCode }`, branded and frozen.
- Currencies:
  - GBP and EUR, with exponent 2.
  - JPY, with exponent 0. It is in the set only to prove the exponent logic.
- Bounds are plus or minus (2^63 - 1) minor units, the same range as a Postgres `bigint`. Anything outside that returns `AMOUNT_OUT_OF_RANGE`.
- Amounts are parsed from strings only, using the grammar `^-?(0|[1-9]\d*)(\.\d{1,exp})?$`.
  - A JS `number` returns `INVALID_AMOUNT_TYPE`.
  - `1e3`, `+12`, `1,000.00` and extra decimal places are all rejected.
- `JSON.stringify` throws on BigInt (MDN), so DTOs carry `amountMinor` as a decimal string.
- `allocate` uses the largest-remainder method, with ties going to the lowest index. The parts always sum to the original.
- Billing code never does `number` arithmetic on money.

## Consequences
- Display formatting (`formatMoney`) is a separate step and never feeds back into calculations.
- Mixing currencies returns `CURRENCY_MISMATCH`. Nothing converts implicitly.

## Sources
- https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Errors/BigInt_not_serializable
- https://verraes.net/2011/04/fowler-money-pattern-in-php/
