# VAT (deferred)

All figures here are for planning only. Confirm them with an accountant before charging anyone.

## When RentReady must register
- You must register once taxable turnover over the last 12 months goes above **£90,000**, checked at the end of each month on a rolling basis.
- You must also register if you expect to exceed £90,000 in the next 30 days alone.
- You may deregister if turnover falls below **£88,000**.
- These are the thresholds GOV.UK showed on 2026-10-20.
- Voluntary registration is allowed earlier. Partners that are VAT-registered can reclaim the VAT we charge, so registering early costs them nothing.

## Rate
- Signup fees are business-to-business services, and the standard rate of **20%** applies.
- Before going live, record a rate effective-date table rather than a constant, so a future rate change is a data edit.

## How to calculate
- Calculate VAT on the net fee: `vat = multiplyRatio(net, 20n, 100n, mode)`.
- Choose **one** method and use it on every invoice:
  - **Per line:** `HALF_UP` on each line (VATREC12030).
  - **Per invoice:** compute VAT on the invoice total. HMRC lets the total VAT be rounded **down** to the whole penny (`DOWN`, VATREC12010).
- Ledger shape when VAT arrives:
  - debit `receivable:<partner>` gross
  - credit `revenue:signup_fees` net
  - credit `liability:vat_output` VAT
- Keep the net, VAT and gross amounts on each line as `Money`. Never derive one from the other two after rounding.

## Not covered yet
Reverse charge for overseas partners, zero-rated or exempt supplies, the VAT cash accounting scheme.

## Sources
- https://www.gov.uk/how-vat-works/vat-thresholds
- https://www.gov.uk/hmrc-internal-manuals/vat-trader-records/vatrec12030
- https://www.gov.uk/hmrc-internal-manuals/vat-trader-records/vatrec12010
- https://www.gov.uk/guidance/vat-guide-notice-700
