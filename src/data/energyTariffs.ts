// Energy tariffs per supplier, North East (region F), single-rate, inc. VAT. Checked 2026-10-21.
// - Octopus, EDF, E.ON Next: exact rates from each supplier's public API (Direct Debit rows, region F).
// - Fuse: exact rates from a Fuse quote for a Durham DH1 address. Fuse showed electricity only, so its
//   tariffs live in FUSE_ELECTRICITY and its gas price is "on quote". The address and meter number are not stored.
// - British Gas, OVO, Outfox publish no North East prices without a quote. Their standard variable tariffs are
//   capped by Ofgem, so we show the cap as a MAXIMUM ("up to"); fixed deals are quote-only (rates null).
// Every rate is valid until the cap period ends (31 Dec 2026); after that the app shows "unavailable".
import { ELECTRICITY, GAS } from './rates'
import type { MeterType } from '../lib/types'

export interface EnergyRates {
  elecUnit: number // £/kWh
  elecStanding: number // £/day
  gasUnit: number
  gasStanding: number
}

export interface EnergyTariff {
  supplierId: string
  name: string
  kind: 'variable' | 'fixed'
  months?: number
  /** null = price only via the supplier's quote. */
  rates: EnergyRates | null
  /** 'published' = the supplier's own rates; 'capMax' = Ofgem cap, the most a standard variable tariff can charge. */
  basis: 'published' | 'capMax' | 'quote'
  /** Meters this tariff is for; omitted = monthly bills (credit meter). */
  meters?: MeterType[]
  /** Early exit fee per fuel, £. */
  exitFeePerFuel?: number
  source: string
  checkedDate: string
  /** Last day these rates apply (ISO). */
  validUntil: string
}

/** Electricity-only tariff (the supplier gave no gas price). */
export interface ElectricityTariff {
  supplierId: string
  name: string
  kind: 'variable' | 'fixed'
  months?: number
  meters: MeterType[]
  elecUnit: number
  elecStanding: number
  exitFee?: number
  source: string
  checkedDate: string
  validUntil: string
}

const CHECKED = '2026-10-21'
export const TARIFFS_VALID_UNTIL = '2026-12-31'
const VALID = TARIFFS_VALID_UNTIL
const PREPAY: MeterType[] = ['prepayKey', 'smartPrepay']
const CAP_SOURCE = ELECTRICITY.unitGBP.source

const CAP: EnergyRates = {
  elecUnit: ELECTRICITY.unitGBP.value!,
  elecStanding: ELECTRICITY.standingGBPPerDay.value!,
  gasUnit: GAS.unitGBP.value!,
  gasStanding: GAS.standingGBPPerDay.value!,
}

const API = {
  octopus: 'https://api.octopus.energy/v1/products/',
  edf: 'https://api.edfgb-kraken.energy/v1/products/',
  'eon-next': 'https://api.eonnext-kraken.energy/v1/products/',
}

interface Row {
  name: string
  kind?: 'variable' | 'fixed'
  months?: number
  meters?: MeterType[]
  exit?: number
}

/** r = [elec p/kWh, elec p/day, gas p/kWh, gas p/day] inc. VAT, as the API publishes them. */
const published = (supplierId: keyof typeof API, code: string, r: [number, number, number, number], o: Row): EnergyTariff => ({
  supplierId,
  name: o.name,
  kind: o.kind ?? 'variable',
  months: o.months,
  rates: { elecUnit: r[0] / 100, elecStanding: r[1] / 100, gasUnit: r[2] / 100, gasStanding: r[3] / 100 },
  basis: 'published',
  meters: o.meters,
  exitFeePerFuel: o.exit,
  source: `${API[supplierId]}${code}/`,
  checkedDate: CHECKED,
  validUntil: VALID,
})

const capped = (supplierId: string, name: string): EnergyTariff[] => [
  { supplierId, name, kind: 'variable', rates: CAP, basis: 'capMax', source: CAP_SOURCE, checkedDate: CHECKED, validUntil: VALID },
  { supplierId, name: 'Fixed deals', kind: 'fixed', rates: null, basis: 'quote', source: CAP_SOURCE, checkedDate: CHECKED, validUntil: VALID },
]

export const ENERGY_TARIFFS: EnergyTariff[] = [
  published('octopus', 'VAR-22-11-01', [25.4552, 60.8011, 7.924875, 28.8351], { name: 'Flexible Octopus' }),
  published('octopus', 'OE-FIX-12M-26-10-17', [29.7574, 60.8011, 9.205245, 28.8351], { name: 'Octopus 12M Fixed', kind: 'fixed', months: 12, exit: 50 }),
  published('octopus', 'OE-FIX-18M-26-10-17', [27.6982, 60.8011, 9.031575, 28.8351], { name: 'Octopus 18M Fixed', kind: 'fixed', months: 18, exit: 75 }),
  published('octopus', 'PREPAY-VAR-18-09-21', [24.67, 60.0658, 7.663005, 28.279965], { name: 'Octopus Key and Card', meters: ['prepayKey'] }),
  published('octopus', 'SMART-PREPAY-VAR-22-10-22', [24.67, 60.0658, 7.663005, 28.279965], { name: 'Smart Pay As You Go', meters: ['smartPrepay'] }),
  published('edf', 'EDF_STANDARD_VARIABLE', [25.455, 61.583, 7.92435, 29.79375], { name: 'Standard Variable' }),
  published('edf', 'EDF_SIMPLY_TRACKER_JAN2028', [25.455, 54.733, 7.92435, 22.93725], { name: 'Simply Tracker to Jan 2028', exit: 50 }),
  published('edf', 'EDF_SIMPLY_FIXED_OCT2027_V4', [28.874, 61.583, 10.3845, 29.79375], { name: 'Simply Fixed to Oct 2027', kind: 'fixed', months: 12, exit: 50 }),
  published('edf', 'EDF_STANDARD_VARIABLE_PP', [24.678, 61.583, 7.6629, 29.79375], { name: 'Prepay Standard Variable', meters: ['prepayKey'] }),
  published('edf', 'EDF_STANDARD_VARIABLE_PAYG', [24.678, 61.583, 7.6629, 29.79375], { name: 'Pay As You Go Standard Variable', meters: ['smartPrepay'] }),
  published('eon-next', 'NEXT_FLEX', [25.455, 61.583, 7.92435, 29.79375], { name: 'Next Flex' }),
  published('eon-next', 'NEXT_PLEDGE_TRACKER_12M_V12', [24.455, 61.583, 7.6608, 29.79375], { name: 'Next Pledge Tracker 12m', months: 12, exit: 25 }),
  published('eon-next', 'NEXT_FIXED_12M_V163', [26.532, 60.3, 9.1098, 29.14905], { name: 'Next Fixed 12m', kind: 'fixed', months: 12, exit: 50 }),
  published('eon-next', 'NEXT_FLEX_PREPAYMENT', [24.67, 61.58, 7.6629, 29.7885], { name: 'Next Flex Prepayment', meters: PREPAY }),
  ...capped('british-gas', 'Standard Variable'),
  ...capped('ovo', 'Simpler Energy'),
  ...capped('outfox', 'Standard Variable'),
]

const FUSE_QUOTE = 'https://www.fuseenergy.com/app/boarding'
const fuse = (name: string, kind: 'variable' | 'fixed', unitP: number, standingP: number, months?: number, exitFee?: number, meters: MeterType[] = ['credit']): ElectricityTariff => ({
  supplierId: 'fuse',
  name,
  kind,
  months,
  meters,
  elecUnit: unitP / 100,
  elecStanding: standingP / 100,
  exitFee,
  source: FUSE_QUOTE,
  checkedDate: CHECKED,
  validUntil: VALID,
})

// Fuse quote, single-rate electricity, region F, 21 Oct 2026.
export const FUSE_ELECTRICITY: ElectricityTariff[] = [
  fuse('Single Rate Tracker 15m', 'variable', 26.11, 49.94, 15, 100),
  fuse('Single Rate Fixed 18m', 'fixed', 26.2, 51.39, 18, 50),
  fuse('Single Rate Fixed 24m', 'fixed', 26.32, 52.76, 24, 50),
  fuse('Single Rate Fixed 16m', 'fixed', 26.48, 51.39, 16, 50),
  fuse('Single Rate Variable', 'variable', 25.45, 61.58),
  fuse('Single Rate Fixed 12m', 'fixed', 27.35, 52.62, 12, 50),
  fuse('Prepayment Variable', 'variable', 24.66, 61.57, undefined, 0, PREPAY),
]

/** Active domestic suppliers in Great Britain (Ofgem, State of the Market report). */
export const ACTIVE_SUPPLIERS = { value: 23, source: 'https://www.ofgem.gov.uk/publications/state-market-report-retail' }

export const tariffsFor = (supplierId: string) => ENERGY_TARIFFS.filter((t) => t.supplierId === supplierId)
