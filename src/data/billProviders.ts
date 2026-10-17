// Curated "set it up" links for the Bills result. From research/utilities.json + research/broadband.json (checked 2026-10-17).
// No energy suppliers were researched, so energy links to Ofgem's official price-cap page rather than naming a supplier.
// priceText only where research verified it; otherwise null ("Check price").
import type { AreaId, Provider } from '../lib/types'

const ALL: AreaId[] = ['gilesgate', 'viaduct', 'cityCentre', 'langleyMoor']
const CHECKED = '2026-10-17'

export const BILL_PROVIDERS: Provider[] = [
  {
    id: 'ofgem-cap',
    name: 'Ofgem price cap: compare energy',
    website: 'https://ofgem.gov.uk/your-energy-supply/your-energy-bill/energy-price-cap-unit-rates-and-standing-charges',
    category: 'electricity',
    areas: ALL,
    priceText: '25.46p/kWh + 61.58p/day (NE)',
    tags: ['Electricity & gas', 'Official'],
    source: 'https://www.moneysavingexpert.com/utilities/what-are-the-price-cap-unit-rates-/',
    checkedDate: CHECKED,
  },
  {
    id: 'nwl',
    name: 'Northumbrian Water',
    website: 'https://www.nwl.co.uk/tariffsandcharges',
    category: 'water',
    areas: ALL,
    priceText: '£3.23/m³ + £184.91/yr (metered)',
    tags: ['Water', 'Your only supplier'],
    source: 'https://www.nwl.co.uk/tariffsandcharges',
    checkedDate: CHECKED,
  },
  {
    id: 'virgin-student',
    name: 'Virgin Media Student',
    website: 'https://www.virginmedia.com/broadband/student',
    category: 'broadband',
    areas: ['gilesgate', 'viaduct', 'cityCentre'],
    priceText: 'From £26.99/mo · 12 months',
    tags: ['Student', 'Virgin streets only'],
    source: 'https://www.virginmedia.com/broadband/student',
    checkedDate: CHECKED,
  },
  {
    id: 'bt-student',
    name: 'BT Student Broadband',
    website: 'https://www.bt.com/broadband',
    category: 'broadband',
    areas: ALL,
    priceText: null,
    tags: ['Student', '9-month term'],
    source: 'https://selectra.co.uk/tv-broadband/guides/compare/student-broadband-deals',
    checkedDate: CHECKED,
  },
  {
    id: 'cuckoo',
    name: 'Cuckoo Full Fibre',
    website: 'https://www.cuckoo.co/broadband',
    category: 'broadband',
    areas: ALL,
    priceText: null,
    tags: ['No contract'],
    source: 'https://www.cuckoo.co/broadband',
    checkedDate: CHECKED,
  },
  {
    id: 'vodafone-ff150',
    name: 'Vodafone Full Fibre 150',
    website: 'https://www.vodafone.co.uk/broadband',
    category: 'broadband',
    areas: ALL,
    priceText: '£21/mo · 24 months',
    tags: ['Cheapest', 'Long contract'],
    source: 'https://broadband.co.uk/broadband/in/durham',
    checkedDate: CHECKED,
  },
  {
    id: 'now-fibre',
    name: 'NOW Full Fibre 75',
    website: 'https://www.nowtv.com/broadband',
    category: 'broadband',
    areas: ALL,
    priceText: '£23/mo · 24 months',
    tags: ['Long contract'],
    source: 'https://www.nowtv.com/broadband',
    checkedDate: CHECKED,
  },
  {
    id: 'tv-licensing',
    name: 'TV Licensing',
    website: 'https://www.tvlicensing.co.uk/',
    category: 'tv',
    areas: ALL,
    priceText: '£180/yr per house',
    tags: ['TV licence'],
    source: 'https://www.gov.uk/government/news/cost-of-tv-licence-fee-set-for-202627',
    checkedDate: CHECKED,
  },
]

/** Providers relevant to the selected area and the bills the household needs. */
export function providersFor(area: AreaId, opts: { wifi: boolean; tvLicence: boolean }): Provider[] {
  return BILL_PROVIDERS.filter(
    (p) =>
      p.areas.includes(area) &&
      (p.category !== 'broadband' || opts.wifi) &&
      (p.category !== 'tv' || opts.tvLicence),
  )
}
