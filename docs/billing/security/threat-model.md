# Threat model

Scope: signup recording, partner attribution, fee posting. Assets: ledger integrity, partner trust, student personal data.

| Threat | Example | Control in code | Control needed in production |
|---|---|---|---|
| Client tampering | Request body includes `fee: "0.00"` or `partnerId` | Strict body allowlist: `UNEXPECTED_FIELD` | Same check server-side; client is never trusted |
| Replay / double charge | Client retries a timed-out signup | Idempotency key + fingerprint; `replayed: true` (ADR 0004) | Unique index on key; 24h retention |
| Concurrent duplicates | Two tabs submit at once | Claim lock, optimistic version, `DUPLICATE_STUDENT` guard | DB constraints, `SERIALIZABLE` or row locks |
| Attribution fraud | Partner registers `gmail.com`, or a lookalike domain | Exact domain match; webmail banned; code allowlist regex | Partner onboarding review |
| Referral stuffing | Fake touches injected after signup | Touches after signup or outside 30 days rejected with reason | Touches recorded server-side at click time, not sent by client |
| Clock skew | Device clock set back into an old contract | Injected clock; client timestamps rejected | Server UTC clock, NTP |
| Insider edit | Someone edits a posted fee | Append-only ledger; reversal only; hash-chained audit (`AUDIT_CHAIN_BROKEN`) | DB permissions: insert-only role; separate admin audit log |
| PII leak | Email lands in a memo or log | `PII_REJECTED` on memos and audit data; emails stored as HMAC pseudonyms | Log scrubbing; access control; DPIA |
| Key compromise | HMAC key leaked | `keyId` in every pseudonym for rotation | KMS, rotation runbook (`key-management.md`) |
| Arithmetic error | Float rounding, overflow | BigInt minor units, bounds check, explicit rounding | Same; DB `bigint` columns |
| Accidental real charge | Test data reaches a payment provider | `BILLING_MODE='sandbox'` only; live throws; `[SIMULATED]` memos; no network | Separate live keys and environments |
