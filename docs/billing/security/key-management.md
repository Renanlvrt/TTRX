# Key management

## Today (sandbox)
- The pseudonymiser gets a key and a `keyId` passed in. Tests use 32 bytes of `0x01` with `keyId 'k1'`.
- Any key shipped to the browser is public. It is a **demo key** and protects nothing.
- A key shorter than 32 bytes throws `InvariantError`.

## Production
- **Storage:** keep the key in a cloud KMS or secret manager.
  - Never put it in source code, a `.env` committed to git, or the Vite bundle. Vite inlines any env var with the `VITE_` prefix into the bundle.
- **Access:** only the billing service role can use the key. Every use is logged by the KMS.
- **Rotation:** each pseudonym carries the `keyId` it was made with (`psn_v1_<keyId>_...`).
  - Rotate by adding a new key and pseudonymising new signups with it.
  - Re-pseudonymise existing students in a background job, which needs the plain email from the accounts system.
  - Retire the old key once nothing references it.
- **Compromise:** rotate at once, then re-pseudonymise. Treat the event as a possible personal-data breach and assess it within 72 hours under UK GDPR.
