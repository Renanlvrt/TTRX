# Student email pseudonymisation

## How it works
1. Normalise the email: trim it and lowercase it (`parseEmail`).
2. Compute `HMAC-SHA256(key, "local@domain")` with WebCrypto.
3. Store the result as `psn_v1_<keyId>_<64 hex>`.

The ledger, the audit log and the signup records hold this ID and the email **domain**. They never hold the local part, which is the student's name in most university addresses.

## Why HMAC and not plain SHA-256
Student emails follow guessable patterns. Anyone could hash a list of likely addresses and match a plain hash. A keyed HMAC prevents that, provided the key stays secret.

## Legal status
- The ICO's 2025 guidance says pseudonymised data is **still personal data** for anyone who holds the key or can re-identify it.
- Pseudonymisation reduces risk. It does not take data out of UK GDPR.
- The EDPB's 2025 pseudonymisation guidelines say the same and name keyed MACs as a suitable technique.

## Before going live
- Write a DPIA covering partner billing.
- Erasure requests: either delete the mapping from student to pseudonym, or rotate the key and drop the old one ("crypto-shredding"). Ledger rows stay for tax retention, but nobody can link them to a person any more.
- Partners see counts and pseudonymous IDs only (`deferred/open-questions.md`, question 8).

## Sources
- https://www.taylorwessing.com/de/global-data-hub/2025/spotlight-on-the-uk-data-landscape/gdh---new-ico-guidance-on-anonymisation-and-pseudonymisation
- https://www.scl.org/ico-publishes-anonymisation-guidance/
- https://stibbe.com/publications-and-insights/key-takeaways-and-insights-from-the-edpb-pseudonymisation-guidelines
