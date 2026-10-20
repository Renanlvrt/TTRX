# Refunds, cancellations and credit notes (deferred)

## When a fee gets cancelled
| Trigger | Proposed rule |
|---|---|
| Student cancels within a **cooling-off window** | Full credit if the account is deleted within N days of signup. N is not decided yet; 14 days matches the consumer cooling-off period students already know. |
| Duplicate or fraudulent signup found later | Full credit, with the reason recorded |
| Signup attributed to the wrong partner | Credit to the wrong partner, then a new posting for the right one |
| Partner dispute settled in their favour | Partial or full credit |

## Ledger mapping
- **Before invoicing:** post a reversing transaction with `reverseTransaction` (ADR 0003). The fee never reaches an invoice.
- **After invoicing:** issue a credit note **and** post the reversal. The credit note references the original invoice.
- **Partial credits:** use `allocate` or `multiplyRatio` with an explicit `HALF_UP` mode, so the pence always add up.

## What a credit note must show
Regulation 15C of the VAT Regulations 1995 and HMRC's VATREC13040 cover this. A credit note shows:
- its own identifying number and date of issue;
- our name, address and VAT number;
- the partner's name and address;
- the number and date of the invoice it corrects;
- a description of the service;
- the amount credited excluding VAT;
- the VAT rate and the amount of VAT credited.

A credit note must correct a genuine change in the price charged. You cannot use one to write off a bad debt; bad-debt relief is a separate process. HMRC sources differ on the deadline (14 days, or one month after the change is agreed). Confirm this with an accountant before going live.

## Sources
- https://www.gov.uk/hmrc-internal-manuals/vat-trader-records/vatrec13040
- https://www.legislation.gov.uk/uksi/1995/2518/regulation/15C
- https://www.gov.uk/guidance/vat-guide-notice-700
