# Audit trail and retention

## Hash chain
- Every audit event stores the hash of the event before it:
  - `hash = sha256(canonicalJson({seq, at, type, subjectId, data, prevHash}))`.
  - The first event's `prevHash` is 64 zeros.
- `verifyAuditChain` recomputes every hash. It returns `AUDIT_CHAIN_BROKEN` with `details.atSeq` if any event was edited, removed or reordered.
- Event types:
  - `SIGNUP_RECEIVED`
  - `SIGNUP_ATTRIBUTED`
  - `SIGNUP_UNATTRIBUTED`
  - `FEE_CALCULATED` (with schedule id and version)
  - `LEDGER_POSTED`
  - `LEDGER_REVERSED`
- Audit data is string-only and is scanned for emails (`PII_REJECTED`).

## Limits
- A hash chain shows that someone tampered with the log. It does not stop them: an attacker who can rewrite the whole chain can recompute every hash.
- In production, publish the chain head (the latest hash) somewhere the database role cannot write to. A daily copy to write-once object storage works.

## Retention
- HMRC requires VAT records to be kept for at least 6 years (Notice 700/21, section 2.4). Company accounting records follow a similar rule.
- Keep the ledger, the audit log and invoices for 6 years after the end of the financial year they relate to.
- Erasure requests remove the link to the person (`pii-pseudonymisation.md`), not the financial record.
- Admin actions (contract edits, manual reversals) go to a separate admin audit log, with who did it and why.

## Sources
- https://www.gov.uk/guidance/record-keeping-for-vat-notice-70021
- https://www.gov.uk/running-a-limited-company/company-and-accounting-records
