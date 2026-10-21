# Energy suppliers: meters, exact prices, partners (research 21 Oct 2026)

Why: a student picked Fuse (cheapest shown) and Fuse's sign-up said "unsupported meter" for both electricity and gas at a Durham city-centre address. Goal: only show suppliers that accept the student's meters, at exact regional prices.

## 1. Finding the meter at an address

- The industry registers (EES for electricity, formerly ECOES; GES for gas, formerly DES) hold meter type, prepayment and smart status. Access is limited to qualified Retail Energy Code users: access agreement, security and data-protection audit, fees, annual compliance. Months of work. Scraping is forbidden. The 2016 order forcing access for comparison sites was revoked on 10 Jul 2024.
  - https://recportal.co.uk/rec-wiki-rec-services/-/knowledge_base/rec-services/enquiry-services-ees-and-ges-
  - https://www.gov.uk/government/publications/energy-market-investigation-ecoesdes-order-2016
- Smart-meter data through the DCC needs explicit consent for each meter and does not cover non-smart meters. Not a fit.
- **Region is free and exact.** `GET https://api.octopus.energy/v1/industry/grid-supply-points/?postcode=DH1%203LE` returns `{"group_id":"_F"}` (North East), tested live.
- Comparison sites ask the user: fuel, Economy 7 or not, prepayment or not. Suppliers then check the register and stall the switch on a mismatch.
  - https://uswitch.com/gas-electricity/guides/rejected-switch
- **Conclusion:** ask the student two short meter questions; never claim compatibility that has not been confirmed.

## 2. Which suppliers accept which meters

- **Fuse:** "does not currently support switching directly from a prepayment meter. You can switch to Fuse once you have a standard credit meter installed" (updated 23 Jul 2026). This is the most likely cause of "unsupported meter" on both fuels. Fuse also refuses RTS meters until they are replaced, and its terms allow credit checks and deposits.
  - https://www.fuseenergy.com/blog/changing-from-prepayment-meter-to-direct-debit
  - https://www.fuseenergy.com/blog/rts-meter
  - https://www.fuseenergy.com/terms-and-conditions
- **Outfox, So Energy:** no prepayment. Sources are search snippets only.
- **E.ON Next:** offers key/card and Smart Pay As You Go; RTS not accepted (forum evidence).
- **Octopus:** supports "certain types of smart prepayment meter"; new Smart PAYG customers sign up by phone.
  - https://octopus.energy/help-and-faqs/articles/can-i-still-sign-up-with-you-if-i-have-smart-payg/
- **EDF, OVO, British Gas, Scottish Power:** offer Smart PAYG (MoneySavingExpert, EnergyPlus). No primary page found for key/card switchers.
  - https://www.moneysavingexpert.com/utilities/switch-prepaid-gas-electricity/
- **Good Energy:** "traditional and smart prepayment". **Ecotricity:** prepayment terms exist.
- **Gone:** Rebel (Apr 2025) and Tomato (Nov 2025), customers moved to British Gas.
- **Tenants:** if the landlord pays the supplier, the student cannot switch. A tenant who pays can switch, prepayment included. A household can switch with up to £500 of prepayment debt per fuel.
  - https://www.citizensadvice.org.uk/consumer/energy/energy-supply/get-a-better-energy-deal/switching-energy-supplier-if-youre-a-tenant/
- **Rule for the app:** only "Yes, with a primary source" counts as accepted; everything else shows as "check with the supplier".

## 3. Exact North East (region F) prices, 1 Oct to 31 Dec 2026

Electricity carries 0% VAT from 1 Oct 2026 to 31 Mar 2027; gas carries 5%. All figures include VAT.

| Tariff | Elec p/kWh | Elec standing p/day | Gas p/kWh | Gas standing p/day | Exit fee |
|---|---|---|---|---|---|
| Ofgem cap, Direct Debit | 25.455 | 61.58 | 7.925 | 29.79 | 0 |
| Ofgem cap, prepayment | 24.678 | 61.58 | 7.663 | 29.79 | 0 |
| Octopus Flexible, DD | 25.4552 | 60.8011 | 7.9249 | 28.8351 | 0 |
| Octopus 12M Fixed | 29.7574 | 60.8011 | 9.2052 | 28.8351 | £50 per fuel |
| Octopus Prepay (key/card, elec) | 24.67 | 60.0658 | n/a | n/a | n/a |
| EDF Standard Variable, DD | 25.455 | 61.583 | 7.924 | 29.794 | 0 |
| E.ON Next Fixed 12m v163, DD | 26.532 | 60.30 | 9.110 | 29.149 | £50 per fuel |

Sources:
- Octopus public API (no login): `GET https://api.octopus.energy/v1/products/VAR-22-11-01/electricity-tariffs/E-1R-VAR-22-11-01-F/standard-unit-rates/`
- EDF and E.ON Next run the same platform at `api.edfgb-kraken.energy` and `api.eonnext-kraken.energy`. These are undocumented and have no published terms, so cache the data and credit the supplier.
- Ofgem cap tables: https://www.ofgem.gov.uk/sites/default/files/2026-08/17a-PDF-Cap-Tables.pdf

## 4. Rules for showing prices

- Ofgem's Confidence Code is voluntary. Without accreditation, never claim "whole of market". Say "compares published tariffs from N suppliers".
  - https://www.ofgem.gov.uk/decision/confidence-code-code-practice-online-domestic-price-comparison-services
- Affiliate links: label each one clearly ("Ad"); a footer disclaimer alone is not enough.
  - https://www.asa.org.uk/advice-online/affiliate-marketing.html

## 5. Partners

- **Octopus "High Referrer" (£50):** personal use only. A business or comparison app cannot use it.
  - https://octopus.energy/high-referrer-terms-and-conditions/high-referrer-affiliate-terms-and-conditions/
- **The Energy Shop:** free, Ofgem-accredited white-label, about £30–40 per dual-fuel customer (undated page). It also offers a tariff feed and a switching API covering all meter types. Contact: partners@theenergyshop.com.
  - https://theenergyshop.com/affiliates
- **Switchcraft Energy API:** whole market, address-level meter and supplier data, switching. Paid by supplier commission; rates not public.
  - https://switchcraft.co.uk/energy-api/
- **Broadband affiliates on Awin:** BT £25 broadband (+£20 TV), Sky £25, Virgin Media (rate not shown).
- **Student bill-splitters** (Fused, Split the Bills): no public partner terms; contact them directly.

## 6. Update after a real Fuse quote (21 Oct 2026)

- A Fuse quote for a DH1 address listed single-rate electricity at 26.11p/kWh and 49.94p/day (Tracker 15m, £100 exit fee); Fixed 18m/24m/16m/12m at 26.20, 26.32, 26.48 and 27.35p; Variable 25.45p and 61.58p/day. It also listed "Single Rate Prepayment (Variable)" at 24.66p and 61.57p/day, marked "Available after contacting support". So "unsupported meter" means "not through online sign-up", not "never". The quote showed no gas prices.
- The earlier app price for Fuse (cap x 0.991, from an MSE summary) was wrong and has been removed.
- The Kraken APIs publish Direct Debit and non-Direct Debit rows. The product page shows the non-DD price (for example EDF Standard Variable at 26.89p); the DD price (25.455p) is only in `/standard-unit-rates/` with `payment_method`.
- Live region F rates, Direct Debit, inc. VAT, 21 Oct 2026:

| Tariff | Elec p/kWh | Elec p/day | Gas p/kWh | Gas p/day | Exit fee per fuel |
|---|---|---|---|---|---|
| E.ON Next Pledge Tracker 12m v12 | 24.455 | 61.583 | 7.6608 | 29.79375 | £25 |
| EDF Simply Tracker Jan 2028 | 25.455 | 54.733 | 7.92435 | 22.93725 | £50 |
| EDF Simply Fixed Oct 2027 v4 | 28.874 | 61.583 | 10.3845 | 29.79375 | £50 |
| E.ON Next Flex / EDF Standard Variable | 25.455 | 61.583 | 7.92435 | 29.79375 | 0 |
| E.ON Next Fixed 12m v163 | 26.532 | 60.30 | 9.1098 | 29.14905 | £50 |
| Octopus Key and Card / Smart PAYG | 24.67 | 60.0658 | 7.663005 | 28.279965 | 0 |
| EDF Prepay / PAYG Standard Variable | 24.678 | 61.583 | 7.6629 | 29.79375 | 0 |
| E.ON Next Flex Prepayment | 24.67 | 61.58 | 7.6629 | 29.7885 | 0 |

- Suppliers that publish a prepayment tariff (Octopus, EDF, E.ON Next) or show one in a quote (Fuse) are listed for prepayment meters as "Contact to join". Octopus says online sign-up works for some smart pay-as-you-go meters.
- About 23 active domestic suppliers (Ofgem State of the Market). Getting all of them live, from an address, needs a licensed feed: The Energy Shop (Tariff Feed API covers payment methods and meter types; white-label finds the current supplier from industry data) or Switchcraft ("quick quote" returns supplier, meter details and plans for an address). Meter-point data by address also exists through the Loqate Utilities Register (RECCo data), by account only.
  - https://theenergyshop.com/affiliates
  - https://switchcraft.co.uk/energy-api/
  - https://docs.loqate.com/location-solutions/utilities-register/loqate-utilities-register
  - https://www.ofgem.gov.uk/publications/state-market-report-retail
