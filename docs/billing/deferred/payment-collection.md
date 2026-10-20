# Payment collection (deferred)

Today there is no payment provider, no network call and no real money. Billing runs only in `BILLING_MODE='sandbox'`.

## When we build it
- **Provider:**
  - Stripe Invoicing (card and bank transfer, hosted invoice pages), or
  - GoCardless (Direct Debit). Direct Debit suits partners who pay every month.
- **PCI scope:** card details only ever reach the provider's hosted pages. Our systems never see or store card numbers, which keeps us in the lightest PCI category.
- **Matching:** a payment confirmation from the provider posts a ledger transaction: debit `asset:bank`, credit `receivable:<partner>`.
  - Use the provider's event ID as the idempotency key, because providers resend webhooks.
- **Dunning:** a reminder at +7 days, a second at +21, and the partner is suspended at +45. These timings are proposals.
- **Bad debt:** write it off with its own transaction (debit `expense:bad_debt`). VAT bad-debt relief rules apply. Do not use a credit note for this.

## Going live checklist
1. Partner contracts signed, with the fee schedule, attribution model (ADR 0005), terms and dispute process.
2. A server with Postgres. The idempotency and student uniqueness rules become database constraints.
3. The HMAC key in a KMS (`security/key-management.md`).
4. VAT registration decided (`vat.md`).
5. `BILLING_MODE='live'` added behind a reviewed change. Today, live mode throws.
