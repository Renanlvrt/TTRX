// Bills estimator: pure, deterministic, no UI imports.
// Every number comes from src/data/rates.ts (sourced) or a labelled assumption surfaced in `assumptions`.
import type { AreaId, BillLine, BillsResult, BillsSurvey, HeatingPattern, Money, WaterUse } from './types'
import { AREAS } from './types'
import { ASSUMED, BROADBAND_FALLBACK, ELECTRICITY, GAS, SPACE_HEATING_SHARE, TDCV, TV_LICENCE, WATER } from '../data/rates'

/** Flat rate table so tests can null out a value and check "unavailable" handling. */
export interface BillRates {
  elecUnit: number | null
  elecStanding: number | null
  gasUnit: number | null
  gasStanding: number | null
  waterPerM3: number | null
  waterFixed: number | null
  tvAnnual: number | null
  broadbandMonthly: number | null
}

export const DEFAULT_RATES: BillRates = {
  elecUnit: ELECTRICITY.unitGBP.value,
  elecStanding: ELECTRICITY.standingGBPPerDay.value,
  gasUnit: GAS.unitGBP.value,
  gasStanding: GAS.standingGBPPerDay.value,
  waterPerM3: WATER.combinedPerM3GBP.value,
  waterFixed: WATER.combinedFixedGBPPerYear.value,
  tvAnnual: TV_LICENCE.annualGBP.value,
  broadbandMonthly: BROADBAND_FALLBACK.monthlyGBP.value,
}

export const DEFAULT_TENANCY_WEEKS = 51

export const DEMO_SURVEY: BillsSurvey = {
  packagePppw: 25,
  area: 'gilesgate',
  people: 5,
  water: 'normal',
  heating: 'nights',
  hasGas: true,
  wifi: true,
  tvLicence: false,
  tenancyWeeks: DEFAULT_TENANCY_WEEKS,
}

export const HEATING_LABEL: Record<HeatingPattern, string> = {
  allDay: 'all day in winter',
  nights: 'only at night',
  coldMonths: 'only in the coldest months',
}

export const WATER_LABEL: Record<WaterUse, string> = { low: 'low', normal: 'normal', high: 'high' }

const round2 = (n: number) => Math.round(n * 100) / 100
const fmt = (n: number) => '£' + (Math.abs(n) >= 100 ? Math.round(n).toLocaleString('en-GB') : n.toFixed(2))

/** Household consumption scale vs Ofgem's medium home (~2.4 people). 1.0 at 2.4 people, grows a little slower than headcount. */
export function householdScale(people: number): number {
  return ASSUMED.scaleIntercept + (ASSUMED.scaleSlope * people) / ASSUMED.typicalHomePeople
}

/** Annual gas kWh for a gas-heated house. */
export function gasKwh(people: number, heating: HeatingPattern): number {
  const share = SPACE_HEATING_SHARE.value
  return TDCV.gas.medium * householdScale(people) * (1 - share + share * ASSUMED.heatingMultiplier[heating])
}

export function electricityKwh(people: number): number {
  return TDCV.electricitySingleRate.medium * householdScale(people)
}

export function waterM3(people: number, water: WaterUse): number {
  return (WATER.litresPerPersonPerDay[water] * people * 365) / 1000
}

/** Money per person from a weekly per-person amount. */
export function moneyFromPppw(pppw: number, tenancyWeeks: number): Money {
  return {
    perWeek: round2(pppw),
    perMonth: round2((pppw * ASSUMED.weeksPerYear) / 12),
    tenancy: round2(pppw * tenancyWeeks),
  }
}

function annual(units: number, unitRate: number | null, standingPerDay: number | null): number | null {
  if (unitRate == null || standingPerDay == null) return null
  return round2(units * unitRate + 365 * standingPerDay)
}

export function estimateBills(survey: BillsSurvey, rates: BillRates = DEFAULT_RATES): BillsResult {
  const people = Math.max(1, Math.round(survey.people))
  const weeks = survey.tenancyWeeks > 0 ? survey.tenancyWeeks : DEFAULT_TENANCY_WEEKS
  const scale = householdScale(people)
  const lines: BillLine[] = []

  // Energy
  const baseElec = electricityKwh(people)
  const gas = gasKwh(people, survey.heating)
  if (survey.hasGas) {
    lines.push({
      id: 'electricity',
      label: 'Electricity',
      householdAnnualGBP: annual(baseElec, rates.elecUnit, rates.elecStanding),
      assumption: `${Math.round(baseElec).toLocaleString('en-GB')} kWh/yr at 25.46p/kWh + 61.58p/day standing charge.`,
      source: ELECTRICITY.unitGBP.source,
    })
    lines.push({
      id: 'gas',
      label: 'Gas',
      householdAnnualGBP: annual(gas, rates.gasUnit, rates.gasStanding),
      assumption: `${Math.round(gas).toLocaleString('en-GB')} kWh/yr (heating ${HEATING_LABEL[survey.heating]}) at 7.92p/kWh + 29.79p/day.`,
      source: GAS.unitGBP.source,
    })
  } else {
    const heatElec = gas * ASSUMED.boilerEfficiency
    const total = baseElec + heatElec
    lines.push({
      id: 'electricity',
      label: 'Electricity (incl. heating)',
      householdAnnualGBP: annual(total, rates.elecUnit, rates.elecStanding),
      assumption: `${Math.round(total).toLocaleString('en-GB')} kWh/yr: appliances plus electric heating, hot water and cooking (heating ${HEATING_LABEL[survey.heating]}).`,
      source: ELECTRICITY.unitGBP.source,
    })
  }

  // Water (metered estimate)
  const m3 = waterM3(people, survey.water)
  lines.push({
    id: 'water',
    label: 'Water',
    householdAnnualGBP:
      rates.waterPerM3 == null || rates.waterFixed == null ? null : round2(m3 * rates.waterPerM3 + rates.waterFixed),
    assumption: `${Math.round(m3)} m³/yr (${WATER.litresPerPersonPerDay[survey.water]} L/person/day, metered) at £3.23/m³ + £184.91/yr fixed.`,
    source: WATER.combinedPerM3GBP.source,
  })

  if (survey.wifi) {
    lines.push({
      id: 'broadband',
      label: 'Wi-Fi',
      householdAnnualGBP: rates.broadbandMonthly == null ? null : round2(rates.broadbandMonthly * 12),
      assumption: 'Typical UK home broadband, about £31/month. Local deals listed below.',
      source: BROADBAND_FALLBACK.monthlyGBP.source,
    })
  }

  if (survey.tvLicence) {
    lines.push({
      id: 'tv',
      label: 'TV licence',
      householdAnnualGBP: rates.tvAnnual,
      assumption: 'One £180 licence for the whole house on a joint tenancy.',
      source: TV_LICENCE.annualGBP.source,
    })
  }

  const householdAnnual = lines.reduce((sum, l) => sum + (l.householdAnnualGBP ?? 0), 0)
  const separatePppw = householdAnnual / ASSUMED.weeksPerYear / people
  const separate = moneyFromPppw(separatePppw, weeks)

  const pkg = survey.packagePppw != null && survey.packagePppw >= 0 ? moneyFromPppw(survey.packagePppw, weeks) : null

  let verdict: BillsResult['verdict'] = 'noPackage'
  let verdictText: string
  let differenceTenancy: number | null = null
  if (pkg) {
    differenceTenancy = round2(pkg.tenancy - separate.tenancy)
    const perWeekDiff = pkg.perWeek - separatePppw
    if (Math.abs(perWeekDiff) < 1) {
      verdict = 'similar'
      verdictText = `Both options cost about the same: within £1 a week each.`
    } else if (perWeekDiff > 0) {
      verdict = 'separate'
      verdictText = `Arranging bills yourself looks ${fmt(differenceTenancy)} cheaper per person over ${weeks} weeks.`
    } else {
      verdict = 'package'
      verdictText = `The bills package looks ${fmt(-differenceTenancy)} cheaper per person over ${weeks} weeks.`
    }
  } else {
    verdictText = `Expect about ${fmt(separate.perWeek)} per person per week if you arrange bills yourself.`
  }

  const unavailable = lines.filter((l) => l.householdAnnualGBP == null).map((l) => l.label)
  const assumptions = [
    `Energy uses the Ofgem price cap for the North East, 1 Oct – 31 Dec 2026. Electricity VAT is 0% only until 31 Mar 2027 and the cap resets on 1 Jan 2027, so a ${weeks}-week tenancy will see changes.`,
    `Usage starts from Ofgem's medium home (2,500 kWh electricity, 9,500 kWh gas, about 2.4 people), scaled by ${scale.toFixed(2)}× for ${people} ${people === 1 ? 'person' : 'people'} (our assumption: 0.2 + 0.8 × people ÷ 2.4, since student houses add a heated bedroom per tenant).`,
    survey.hasGas
      ? `Gas: 77.2% is space heating (sourced), the rest hot water and cooking. Heating pattern multipliers are our assumption: all day 1.3×, nights 0.6×, cold months only 0.35×.`
      : `No gas: heating, hot water and cooking run on electricity. We convert the gas we'd expect at 90% boiler efficiency to electric kWh (our assumption), with no gas standing charge.`,
    `Water assumes a meter with Northumbrian Water. Low/normal/high = 110/142/180 L per person per day (142 L is the UK average; the others are our bands). Unmetered homes average ${fmt(WATER.unmeteredAverageGBP.value)}/yr.`,
    `Per person = household cost ÷ ${people}. Weekly figures use a 52-week year; monthly = weekly × 52 ÷ 12; tenancy = weekly × ${weeks} weeks.`,
    ...(survey.tvLicence ? ['A TV licence is only needed if anyone watches live TV or BBC iPlayer.'] : []),
    ...(unavailable.length ? [`Unavailable (not counted in totals): ${unavailable.join(', ')}.`] : []),
    'Bills packages often have a fair-use cap: check the contract for what happens if the house uses more.',
  ]

  return { lines, separate, package: pkg, differenceTenancy, verdict, verdictText, assumptions }
}

/** "dh1 4ab" / "DH14" → "DH1 4" (outward code + sector digit); null when too short. */
export function postcodePrefix(input: string): string | null {
  const raw = input.toUpperCase().replace(/\s+/g, '')
  if (raw.length < 4) return null
  // Full postcode: inward part is the last 3 chars. Partial ("DH14"): Durham outward codes are 3 chars.
  const outward = raw.length >= 6 ? raw.slice(0, raw.length - 3) : raw.slice(0, 3)
  const sector = raw.length >= 6 ? raw[raw.length - 3] : raw[3]
  return /^[0-9]$/.test(sector) ? `${outward} ${sector}` : null
}

/** All areas whose postcode sectors match (DH1 1 matches both Gilesgate and City Centre). */
export function areasForPostcode(input: string): AreaId[] {
  const prefix = postcodePrefix(input)
  if (!prefix) return []
  return AREAS.filter((a) => a.postcodes.includes(prefix)).map((a) => a.id)
}

/** The single matching area, or null when unknown or ambiguous. */
export function areaFromPostcode(input: string): AreaId | null {
  const m = areasForPostcode(input)
  return m.length === 1 ? m[0] : null
}

// ---------- Energy tariff comparison ----------

export interface TariffRates {
  elecUnit: number
  elecStanding: number
  gasUnit: number
  gasStanding: number
}

/** Annual household kWh for this survey (gas = 0 when the house is all-electric). */
export function energyKwh(survey: BillsSurvey): { elec: number; gas: number } {
  const people = Math.max(1, Math.round(survey.people))
  const base = electricityKwh(people)
  const gas = gasKwh(people, survey.heating)
  return survey.hasGas ? { elec: base, gas } : { elec: base + gas * ASSUMED.boilerEfficiency, gas: 0 }
}

/** Estimated energy cost on a given tariff: whole house per year and per person per week. */
export function energyCostFor(survey: BillsSurvey, r: TariffRates): { householdAnnual: number; perPersonWeek: number } {
  const { elec, gas } = energyKwh(survey)
  const people = Math.max(1, Math.round(survey.people))
  let total = elec * r.elecUnit + 365 * r.elecStanding
  if (survey.hasGas) total += gas * r.gasUnit + 365 * r.gasStanding
  return { householdAnnual: round2(total), perPersonWeek: round2(total / ASSUMED.weeksPerYear / people) }
}
