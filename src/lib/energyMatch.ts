// Energy offers for one house: only suppliers confirmed to take its meter, cheapest first. Pure, no UI imports.
import type { BillsSurvey, MeterType } from './types'
import { energyCostFor, energyKwh } from './bills'
import { ENERGY_TARIFFS, FUSE_ELECTRICITY } from '../data/energyTariffs'
import type { EnergyTariff, ElectricityTariff } from '../data/energyTariffs'
import { METER_ELIGIBILITY, eligibilityFor } from '../data/meterEligibility'
import type { JoinRoute } from '../data/meterEligibility'
import { ASSUMED } from '../data/rates'

const METERS: MeterType[] = ['credit', 'prepayKey', 'smartPrepay']

export interface EnergyOffer {
  supplierId: string
  /** Cheapest priced tariff, or null when no price fits this house. */
  tariff: string | null
  route: JoinRoute
  householdAnnual: number | null
  perPersonWeek: number | null
  /** 'published' = exact; 'capMax' = Ofgem cap, an upper limit. */
  basis: 'published' | 'capMax' | null
  exitFeePerFuel: number | null
  note?: string
  /** Why there is no price, when there is none. */
  noPrice?: 'quote' | 'gasOnQuote' | 'nightRate'
}

const round2 = (n: number) => Math.round(n * 100) / 100

/** Meter types the student's answer could mean: 'unsure' or no answer = all of them. */
export function metersFor(survey: BillsSurvey): MeterType[] {
  return !survey.meter || survey.meter === 'unsure' ? METERS : [survey.meter]
}

/** How to join a supplier for these meters: null if any of them is not confirmed; 'support' if any needs a call. */
export function routeFor(supplierId: string, meters: MeterType[]): JoinRoute | null {
  const all = meters.map((m) => eligibilityFor(supplierId, m))
  if (all.some((e) => e == null)) return null
  return all.some((e) => e!.route === 'support') ? 'support' : 'online'
}

const fits = (tariffMeters: MeterType[] | undefined, meter: MeterType) => (tariffMeters ?? ['credit']).includes(meter)
const live = (validUntil: string, today: string) => today <= validUntil

/** Yearly cost of an electricity-only tariff for this house (null if the house has gas: that price is unknown). */
export function electricityOnlyCost(survey: BillsSurvey, t: ElectricityTariff): { householdAnnual: number; perPersonWeek: number } | null {
  if (survey.hasGas) return null
  const people = Math.max(1, Math.round(survey.people))
  const total = energyKwh(survey).elec * t.elecUnit + 365 * t.elecStanding
  return { householdAnnual: round2(total), perPersonWeek: round2(total / ASSUMED.weeksPerYear / people) }
}

/**
 * Offers for this house on `today` (ISO date). The price is for the meter the student named;
 * when unsure, it is the monthly-bills price and only suppliers that take every meter are listed.
 */
export function energyOffers(survey: BillsSurvey, today: string): EnergyOffer[] {
  const meters = metersFor(survey)
  const priceMeter = meters.length === 1 ? meters[0] : 'credit'
  const nightRate = survey.economy7 === true
  const offers: EnergyOffer[] = []

  for (const supplierId of Object.keys(METER_ELIGIBILITY)) {
    const route = routeFor(supplierId, meters)
    if (!route) continue
    const note = meters.map((m) => eligibilityFor(supplierId, m)!.note).find(Boolean)
    const base: EnergyOffer = { supplierId, tariff: null, route, householdAnnual: null, perPersonWeek: null, basis: null, exitFeePerFuel: null, note }

    if (nightRate) {
      offers.push({ ...base, noPrice: 'nightRate' })
      continue
    }

    const dual = ENERGY_TARIFFS.filter((t): t is EnergyTariff & { rates: NonNullable<EnergyTariff['rates']> } =>
      t.supplierId === supplierId && t.rates != null && t.basis !== 'quote' && fits(t.meters, priceMeter) && live(t.validUntil, today))
    const elecOnly = FUSE_ELECTRICITY.filter((t) => t.supplierId === supplierId && fits(t.meters, priceMeter) && live(t.validUntil, today))

    const priced = [
      ...dual.map((t) => ({ tariff: t.name, cost: energyCostFor(survey, t.rates), basis: t.basis as 'published' | 'capMax', exit: t.exitFeePerFuel ?? 0 })),
      ...elecOnly.flatMap((t) => {
        const cost = electricityOnlyCost(survey, t)
        return cost ? [{ tariff: t.name, cost, basis: 'published' as const, exit: t.exitFee ?? 0 }] : []
      }),
    ].sort((a, b) => a.cost.householdAnnual - b.cost.householdAnnual)

    const best = priced[0]
    if (best) {
      offers.push({ ...base, tariff: best.tariff, householdAnnual: best.cost.householdAnnual, perPersonWeek: best.cost.perPersonWeek, basis: best.basis, exitFeePerFuel: best.exit })
    } else {
      offers.push({ ...base, noPrice: elecOnly.length > 0 && survey.hasGas ? 'gasOnQuote' : 'quote' })
    }
  }

  // Exact prices first (cheapest first), then "up to" cap prices, then no price.
  const rank = (o: EnergyOffer) => (o.basis === 'published' ? 0 : o.basis === 'capMax' ? 1 : 2)
  return offers.sort((a, b) => rank(a) - rank(b) || (a.householdAnnual ?? 0) - (b.householdAnnual ?? 0))
}

/** Number of suppliers listed with an exact published price. */
export const exactCount = (offers: EnergyOffer[]) => offers.filter((o) => o.basis === 'published').length
