# Utilities research (Durham / North East), checked 2026-10-17

Machine-readable data is in `utilities.json`.

## Key numbers
| Item | Value | Source |
|---|---|---|
| Electricity, North East, DD, single-rate (1 Oct-31 Dec 2026) | 25.46p/kWh, 61.58p/day (0% VAT) | [MSE](https://www.moneysavingexpert.com/utilities/what-are-the-price-cap-unit-rates-/), [Uswitch](https://www.uswitch.com/gas-electricity/guides/regional-energy-prices/) |
| Gas, North East, DD | 7.92p/kWh, 29.79p/day (incl. 5% VAT) | same |
| GB average (Ofgem) | Elec 26.32p / 54.83p; Gas 7.97p / 29.68p | [Ofgem](https://ofgem.gov.uk/your-energy-supply/your-energy-bill/energy-price-cap-unit-rates-and-standing-charges) |
| Headline cap | £1,723/yr DD (E7 £1,046) | [Ofgem letter, 26 Aug 2026](https://www.ofgem.gov.uk/sites/default/files/2026-08/Summary-of-changes-to-energy-price-cap-1-October-to-31-December-2026.pdf) |
| TDCV elec single-rate (L/M/H) | 1,600 / 2,500 / 3,800 kWh | [Ofgem TDCV decision, 27 May 2026](https://www.ofgem.gov.uk/sites/default/files/2026-05/Review%20of%20typical%20domestic%20consumption%20values%20decision.pdf) |
| TDCV elec multi-rate / E7 | 1,900 / 3,400 / 6,100 kWh (58% day / 42% night) | same |
| TDCV gas | 6,000 / 9,500 / 14,000 kWh | same |
| Northumbrian Water metered | Water £61.16 + £1.6169/m³; Sewerage £123.75 + £1.6121/m³ | [nwl.co.uk](https://www.nwl.co.uk/tariffsandcharges) |
| NW average bill 2026/27 | £536 overall (measured £459, unmeasured £610); £1.47/day | [NWL statement](https://www.nwl.co.uk/globalassets/customer-pdfs/charges-2026/nwl-statement-of-significant-changes-to-charges-scheme-charges-2026-27.pdf) |
| Water use per person | 142 L/day (Water UK/Waterwise); CCW says 139 L/day | [Cambridge Water](https://www.cambridge-water.co.uk/news/vast-majority-of-brits-have-no-idea-how-much-water-they-use-each-day), [CCW](https://www.ccw.org.uk/?p=1410) |
| Shower flow | Electric 5-6 L/min, mixer 8-15 L/min, power 13-15 L/min | CCW, Cambridge Water |
| TV licence | £180/yr from 1 Apr 2026 | [GOV.UK](https://www.gov.uk/government/news/cost-of-tv-licence-fee-set-for-202627) |
| Space heating share of gas | 77.2% | [E3G annex](https://www.e3g.org/wp-content/uploads/E3G-Briefing-Annex-Low-carbon-lower-heating-bills.pdf) citing BEAMA 2022 |

## Caveats
- **Regional rates source:** I could not fetch the regional table from Ofgem directly because it sits behind a postcode lookup. The North East figures come from two independent comparison sites that agree exactly. energyplus.co.uk is unreliable because it mixes quarters.
- **VAT:** Electricity is VAT-free only from 1 Oct 2026 to 31 Mar 2027. The cap also resets on 1 Jan 2027.
- **Electric-only homes:** Ofgem has no all-electric TDCV. The E7 multi-rate TDCV is the nearest official proxy.
- **NW document headers:** The Appendix 1 table headers are mislabelled (2024/25 / 2025/26). The drivers table in the same document confirms 26/27 = £536.
- **Labelled ASSUMPTIONS (not sourced):**
  - heating-pattern multipliers (all-day winter 1.3, normal 1.0, nights only 0.6, extreme-cold months only 0.35), applied to the 77.2% space-heating share only
  - low/high water tiers (110 / 180 L per person per day)
  - shower tiers (4 / 8 / 15 min)
  - Oct-Mar heating seasonality (~70%)
  - unmetered prevalence in student houses
