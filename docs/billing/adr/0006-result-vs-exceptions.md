# ADR 0006: Result values for expected errors, exceptions for bugs

Status: accepted, 2026-10-20.

## Decision
- Failures caused by input or by business rules return `{ ok: false, error: { code, message, details? } }`.
  - Callers branch on `code`.
  - Tests assert on `code`, never on the message text.
- `InvariantError` is thrown only for programmer errors and bad configuration:
  - dividing by zero in `divRound`
  - a key shorter than 32 bytes
  - an invalid fixed-clock start
  - a value that `canonicalJson` cannot serialise
  - a request for live billing mode, which does not exist on this branch
- Every returned value is frozen. Inputs are never changed.

## Why
- A malformed request must not crash the billing path. The compiler makes every caller handle each error.
- Error codes are stable strings, so an HTTP layer can map them later (for example `IDEMPOTENCY_IN_PROGRESS` to 409 and `INVALID_*` to 422).
