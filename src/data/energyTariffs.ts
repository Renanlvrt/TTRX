// Energy tariff options per supplier, North East (region F), single-rate, Direct Debit, inc. VAT. Checked 2026-10-17.
// - Octopus: live published rates from the Octopus public API (api.octopus.energy, region F).
// - Other suppliers publish no North East prices without a postcode quote. Their Standard Variable tariffs are
//   capped by Ofgem, so we show the cap as a MAXIMUM ("up to"); fixed deals are quote-only (rates null).
import { ELECTRICITY, GAS } from './rates'

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
  source: string
  checkedDate: string
}

const CHECKED = '2026-10-17'
const OCTOPUS_API = 'https://api.octopus.energy/v1/products/'
const CAP_SOURCE = ELECTRICITY.unitGBP.source

const CAP: EnergyRates = {
  elecUnit: ELECTRICITY.unitGBP.value!,
  elecStanding: ELECTRICITY.standingGBPPerDay.value!,
  gasUnit: GAS.unitGBP.value!,
  gasStanding: GAS.standingGBPPerDay.value!,
}

const octopus = (name: string, kind: 'variable' | 'fixed', code: string, r: [number, number, number, number], months?: number): EnergyTariff => ({
  supplierId: 'octopus',
  name,
  kind,
  months,
  rates: { elecUnit: r[0] / 100, elecStanding: r[1] / 100, gasUnit: r[2] / 100, gasStanding: r[3] / 100 },
  basis: 'published',
  source: `${OCTOPUS_API}${code}/`,
  checkedDate: CHECKED,
})

const capped = (supplierId: string, name: string): EnergyTariff[] => [
  { supplierId, name, kind: 'variable', rates: CAP, basis: 'capMax', source: CAP_SOURCE, checkedDate: CHECKED },
  { supplierId, name: 'Fixed deals', kind: 'fixed', rates: null, basis: 'quote', source: CAP_SOURCE, checkedDate: CHECKED },
]

export const ENERGY_TARIFFS: EnergyTariff[] = [
  // [elec p/kWh, elec p/day, gas p/kWh, gas p/day] inc. VAT
  octopus('Flexible Octopus', 'variable', 'VAR-22-11-01', [25.4552, 60.8011, 7.924875, 28.8351]),
  octopus('Octopus 12M Fixed', 'fixed', 'OE-FIX-12M-26-10-17', [29.7574, 60.8011, 9.205245, 28.8351], 12),
  octopus('Octopus 18M Fixed', 'fixed', 'OE-FIX-18M-26-10-17', [27.6982, 60.8011, 9.031575, 28.8351], 18),
  ...capped('british-gas', 'Standard Variable'),
  ...capped('edf', 'Standard Variable'),
  ...capped('eon-next', 'Next Flex'),
  ...capped('ovo', 'Simpler Energy'),
]

export const tariffsFor = (supplierId: string) => ENERGY_TARIFFS.filter((t) => t.supplierId === supplierId)
