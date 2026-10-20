# Monthly invoices (deferred)

## Period
- One invoice per partner per calendar month in **`Europe/London`** time.
- Store instants in UTC, but convert to `Europe/London` when assigning a month.
- Example: `2026-03-31T23:30Z` is 00:30 on 1 April in BST, so it belongs to April.
- The month boundaries need tests for the March and October clock changes.

## What a full VAT invoice must show (VAT Notice 700/21, section 4.1)
1. A unique sequential number. A series may be used.
2. The time of supply, plus the date of issue if it differs.
3. Our name, address and VAT registration number.
4. The partner's name and address.
5. A description that identifies the service: "Student signups, March 2027, flat fee per signup".
6. For each line: the quantity, the unit price, the VAT rate, and the amount excluding VAT.
7. The total excluding VAT.
8. The rate of any cash discount offered.
9. The total VAT, in sterling.

Simplified invoices are allowed only for supplies of £250 or less including VAT (section 4.5). Partner invoices will usually be larger, so plan for full invoices.

## Numbering
- Numbers must have no gaps and must never be reused. Allocate the number inside the same transaction that finalises the invoice.
- A void invoice keeps its number and is cancelled by a credit note. It is never deleted.

## Other decisions
- **Payment terms.** For example, 30 days.
- **Minimum invoice.** Below an amount such as £10, carry the balance forward.
- **Draft vs final.** Drafts can change. Final invoices are immutable.
- **Making Tax Digital.** Once VAT-registered, VAT records must be kept digitally, in MTD-compatible software.

## Retention
Keep VAT records for at least **6 years** (Notice 700/21, section 2.4).

## Sources
- https://www.gov.uk/guidance/record-keeping-for-vat-notice-70021
