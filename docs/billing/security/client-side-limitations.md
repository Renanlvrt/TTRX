# Why browser-side billing is a simulation

On this branch the billing module runs in the browser, so every amount is simulated. This page explains why it cannot handle real money, and what a production setup needs.

| Problem in the browser | Effect | What production needs |
|---|---|---|
| The user controls the page | Anyone can edit fees, partner IDs and timestamps in DevTools. OWASP's guidance is to recompute prices on the server and treat client input as untrusted. | The server recomputes everything. The client sends only `{email, referralTouches}` and an idempotency key. Extra fields return `UNEXPECTED_FIELD`. |
| The HMAC key ships in the bundle | Anyone can read a key bundled by Vite. With it, a student email can be recovered by guessing and comparing hashes. | Keep the key in a KMS or secret store, with a `keyId` for rotation. The demo key is labelled as a demo key. |
| The device clock is under the user's control | Changing the clock moves a signup across a contract window or month boundary. | The server's UTC clock sets `signedUpAt`. A client-supplied `occurredAt` is rejected. |
| There is no shared store (every reload starts fresh, SPEC §7) | Idempotency and duplicate checks only work within one tab. | Postgres, with unique constraints on the idempotency key and `student_ref`, plus optimistic versioning or `SERIALIZABLE` transactions. |
| There is no atomic commit | Two tabs can both act as the first signup. | One transaction writes the signup, the ledger rows and the audit rows together. |
| Nothing is tamper-evident | Local data can be rewritten without trace. | An append-only ledger, a hash-chained audit log, a separate admin audit trail, and 6-year retention. |

## Sandbox guarantees in code
- `BILLING_MODE = 'sandbox'` is the only mode. Asking for `'live'` throws an `InvariantError`.
- Every ledger memo starts with `[SIMULATED]`.
- No payment provider, no network calls, no real card or bank data.
- Partners are fictional, with `.example` domains, for example "Palatine Lettings (fictional)" at `alpha-lettings.example` and "Wearside Homes (fictional)" at `beta-homes.example`.

## Sources
- https://cheatsheetseries.owasp.org/cheatsheets/Business_Logic_Security_Cheat_Sheet.html
- https://brandur.org/idempotency-keys
