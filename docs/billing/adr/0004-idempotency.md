# ADR 0004: Idempotency keys for signups

Status: accepted, 2026-10-20.

## Context
Networks fail and clients retry, so a retried signup must not post a second fee.

Stripe's model:
- The client sends a unique key with each request: up to 255 characters, ideally a V4 UUID, and never personal data.
- The server stores the first result and returns it for every retry.
- Reusing a key with different parameters is an error.
- Keys can be pruned after 24 hours.

## Decision
- Keys must match `^[A-Za-z0-9_-]{1,255}$`. Anything else returns `INVALID_IDEMPOTENCY_KEY`, which also blocks emails used as keys.
- Fingerprint: `sha256(canonicalJson({studentRef, emailDomain, touches}))`.
- Each key is claimed, then completed or released:
  - `claimed`: the signup is processed.
  - `in_progress`: returns `IDEMPOTENCY_IN_PROGRESS` (HTTP 409 equivalent), and the client retries later.
  - `completed` with the same fingerprint: returns the stored outcome with `replayed: true`.
  - `completed` with a different fingerprint: returns `IDEMPOTENCY_KEY_REUSED`.
  - Any failure after the claim releases the key, so a retry can succeed.
- Completed keys are kept for 24 hours. A claim that is never completed goes stale after 60 seconds and can be taken over.
- As a second guard, each `studentRef` can sign up only once, whatever the key. A second signup returns `DUPLICATE_STUDENT`.
- Commits use optimistic versioning (`expectedVersion`), with up to 3 attempts after a `VERSION_CONFLICT`.

## Production mapping
- In Postgres, unique indexes on `idempotency_key` and `student_ref` do this job. One transaction writes the signup, the ledger rows and the audit rows together.
- The in-memory repository mimics this: each method yields once, then runs its compare-and-set with no `await` in between.

## Sources
- https://docs.stripe.com/api/idempotent_requests
- https://brandur.org/idempotency-keys
