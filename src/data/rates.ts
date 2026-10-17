// Sourced rates for the Bills calculator. Transcribed from research/utilities.json and research/broadband.json.
// Every value carries its source and the date it was checked. null = not verified ("unavailable" in the UI).

export const RATES_CHECKED = '2026-10-17'

export interface Sourced<T> {
  value: T
  source: string
  checkedDate: string
}

const MSE = 'https://www.moneysavingexpert.com/utilities/what-are-the-price-cap-unit-rates-/'
const TDCV_SRC = 'https://www.ofgem.gov.uk/sites/default/files/2026-05/Review%20of%20typical%20domestic%20consumption%20values%20decision.pdf'
const NWL = 'https://www.nwl.co.uk/tariffsandcharges'

export const ELECTRICITY = {
  region: 'North East',
  period: '1 Oct – 31 Dec 2026 price cap',
  /** £ per kWh (25.46p, 0% VAT until 31 Mar 2027). */
  unitGBP: { value: 0.2546, source: MSE, checkedDate: RATES_CHECKED } as Sourced<number | null>,
  /** £ per day (61.58p). */
  standingGBPPerDay: { value: 0.6158, source: MSE, checkedDate: RATES_CHECKED } as Sourced<number | null>,
}

export const GAS = {
  region: 'North East',
  period: '1 Oct – 31 Dec 2026 price cap',
  /** £ per kWh (7.92p incl. 5% VAT). */
  unitGBP: { value: 0.0792, source: MSE, checkedDate: RATES_CHECKED } as Sourced<number | null>,
  /** £ per day (29.79p). */
  standingGBPPerDay: { value: 0.2979, source: MSE, checkedDate: RATES_CHECKED } as Sourced<number | null>,
}

/** Ofgem typical domestic consumption values, kWh per year. */
export const TDCV = {
  source: TDCV_SRC,
  checkedDate: RATES_CHECKED,
  electricitySingleRate: { low: 1600, medium: 2500, high: 3800 },
  electricityEconomy7: { low: 1900, medium: 3400, high: 6100 },
  gas: { low: 6000, medium: 9500, high: 14000 },
}

/** Share of household gas used for space heating (rest = hot water + cooking). */
export const SPACE_HEATING_SHARE = {
  value: 0.772,
  source: 'https://www.e3g.org/wp-content/uploads/E3G-Briefing-Annex-Low-carbon-lower-heating-bills.pdf',
  checkedDate: RATES_CHECKED,
}

export const WATER = {
  supplier: 'Northumbrian Water',
  year: '2026/27',
  /** Water + sewerage, £ per m³ (1.6169 + 1.6121). */
  combinedPerM3GBP: { value: 3.229, source: NWL, checkedDate: RATES_CHECKED } as Sourced<number | null>,
  /** Water + sewerage fixed charges, £ per year (61.16 + 123.75). */
  combinedFixedGBPPerYear: { value: 184.91, source: NWL, checkedDate: RATES_CHECKED } as Sourced<number | null>,
  /** Average unmeasured household bill (depends on rateable value). */
  unmeteredAverageGBP: {
    value: 610,
    source: 'https://www.nwl.co.uk/globalassets/customer-pdfs/charges-2026/nwl-statement-of-significant-changes-to-charges-scheme-charges-2026-27.pdf',
    checkedDate: RATES_CHECKED,
  },
  /** Litres per person per day. Normal = sourced 142 L; low/high are labelled assumptions. */
  litresPerPersonPerDay: { low: 110, normal: 142, high: 180 },
  litresSource: 'https://www.cambridge-water.co.uk/news/vast-majority-of-brits-have-no-idea-how-much-water-they-use-each-day',
}

export const TV_LICENCE = {
  annualGBP: { value: 180, source: 'https://www.gov.uk/government/news/cost-of-tv-licence-fee-set-for-202627', checkedDate: RATES_CHECKED } as Sourced<number | null>,
}

export const BROADBAND_FALLBACK = {
  monthlyGBP: { value: 31, source: 'https://movingtotheuk.co.uk/cost-of-living-in-the-uk/uk-utility-bills', checkedDate: RATES_CHECKED } as Sourced<number | null>,
}

/** Our labelled assumptions (not sourced). */
export const ASSUMED = {
  /** Ofgem's medium TDCV describes a typical home of about this many people. */
  typicalHomePeople: 2.4,
  /** Household scaling factor = intercept + slope × people / 2.4 (equals 1.0 at 2.4 people). */
  scaleIntercept: 0.2,
  scaleSlope: 0.8,
  heatingMultiplier: { allDay: 1.3, nights: 0.6, coldMonths: 0.35 },
  /** Gas boiler efficiency vs 100%-efficient electric resistance heating. */
  boilerEfficiency: 0.9,
  weeksPerYear: 52,
}
