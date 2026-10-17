// Direct "set up / pay" links for the Bills result: each goes to the provider's own sign-up or account page,
// never a comparison site. From research/direct-links.json + research/broadband.json (checked 2026-10-17).
// priceText only where the provider's own page (or research) verified it; otherwise null ("Get a quote").
import type { AreaId, Provider } from '../lib/types'

const ALL: AreaId[] = ['gilesgate', 'viaduct', 'cityCentre', 'langleyMoor']
const CHECKED = '2026-10-17'

export type BillGroup = 'energy' | 'water' | 'broadband' | 'tv'

export interface BillProvider extends Provider {
  group: BillGroup
  /** Button label for the main link, e.g. "Moving in". */
  cta: string
  /** Optional second direct link (e.g. pay a bill). */
  secondary?: { label: string; url: string }
}

export const BILL_PROVIDERS: BillProvider[] = [
  // Energy: link to each supplier's moving-home flow (students are moving in, not switching).
  {
    id: 'octopus',
    group: 'energy',
    name: 'Octopus Energy',
    website: 'https://octopus.energy/move-in/',
    cta: 'Moving in',
    secondary: { label: 'Get a quote', url: 'https://octopus.energy/quote/' },
    category: 'electricity',
    areas: ALL,
    priceText: null,
    tags: ['Flexible Octopus', 'Fixed 12/18 months'],
    source: 'https://octopus.energy/move-in/',
    checkedDate: CHECKED,
  },
  {
    id: 'british-gas',
    group: 'energy',
    name: 'British Gas',
    website: 'https://www.britishgas.co.uk/discover/home-move/',
    cta: 'Moving in',
    secondary: { label: 'Get a quote', url: 'https://www.britishgas.co.uk/new-energy/sales' },
    category: 'electricity',
    areas: ALL,
    priceText: null,
    tags: ['Standard Variable', 'Fixed available'],
    source: 'https://www.britishgas.co.uk/discover/home-move/',
    checkedDate: CHECKED,
  },
  {
    id: 'edf',
    group: 'energy',
    name: 'EDF',
    website: 'https://www.edfenergy.com/help-support/moving-home-energy',
    cta: 'Moving in',
    secondary: { label: 'Get a quote', url: 'https://www.edfenergy.com/quote/address-details' },
    category: 'electricity',
    areas: ALL,
    priceText: null,
    tags: ['Standard Variable', 'Fixed available'],
    source: 'https://www.edfenergy.com/help-support/moving-home-energy',
    checkedDate: CHECKED,
  },
  {
    id: 'eon-next',
    group: 'energy',
    name: 'E.ON Next',
    website: 'https://www.eonnext.com/moving-home/moving-in',
    cta: 'Moving in',
    secondary: { label: 'Tariffs', url: 'https://www.eonnext.com/tariffs' },
    category: 'electricity',
    areas: ALL,
    priceText: null,
    tags: ['Next Flex', 'Fixed available'],
    source: 'https://www.eonnext.com/moving-home/moving-in',
    checkedDate: CHECKED,
  },
  {
    id: 'ovo',
    group: 'energy',
    name: 'OVO',
    website: 'https://www.ovoenergy.com/moving-home',
    cta: 'Moving in',
    secondary: { label: 'Get a quote', url: 'https://products.ovoenergy.com/energy/customer-property' },
    category: 'electricity',
    areas: ALL,
    priceText: null,
    tags: ['Simpler Energy', 'Fixed available'],
    source: 'https://www.ovoenergy.com/moving-home',
    checkedDate: CHECKED,
  },

  // Water: one supplier for all of Durham.
  {
    id: 'nwl',
    group: 'water',
    name: 'Northumbrian Water',
    website: 'https://www.nwl.co.uk/moving/move-in-page/?step=1',
    cta: 'Set up account',
    secondary: { label: 'Pay a bill', url: 'https://www.nwl.co.uk/non-logged-payment/' },
    category: 'water',
    areas: ALL,
    priceText: '£3.23/m³ + £184.91/yr (metered)',
    tags: ['Your only water supplier'],
    source: 'https://www.nwl.co.uk/tariffsandcharges',
    checkedDate: CHECKED,
  },

  // Broadband: providers' own sign-up pages.
  {
    id: 'virgin-student',
    group: 'broadband',
    name: 'Virgin Media Student',
    website: 'https://www.virginmedia.com/broadband/student',
    cta: 'Sign up',
    category: 'broadband',
    areas: ['gilesgate', 'viaduct', 'cityCentre'],
    priceText: 'From £26.99/mo · 12 months',
    tags: ['Student', 'Needs .ac.uk email', 'Virgin streets only'],
    source: 'https://www.virginmedia.com/broadband/student',
    checkedDate: CHECKED,
  },
  {
    id: 'bt-student',
    group: 'broadband',
    name: 'BT Student',
    website: 'https://www.bt.com/broadband/student-deals',
    cta: 'Sign up',
    category: 'broadband',
    areas: ALL,
    priceText: null,
    tags: ['Student', 'Uni email discount'],
    source: 'https://www.bt.com/broadband/student-deals',
    checkedDate: CHECKED,
  },
  {
    id: 'cuckoo',
    group: 'broadband',
    name: 'Cuckoo Full Fibre',
    website: 'https://www.cuckoo.co/join',
    cta: 'Sign up',
    category: 'broadband',
    areas: ALL,
    priceText: null,
    tags: ['No contract', '£0 install'],
    source: 'https://www.cuckoo.co/join',
    checkedDate: CHECKED,
  },
  {
    id: 'vodafone-ff',
    group: 'broadband',
    name: 'Vodafone Full Fibre',
    website: 'https://www.vodafone.co.uk/broadband/full-fibre',
    cta: 'Sign up',
    category: 'broadband',
    areas: ALL,
    priceText: 'From £24/mo · 24 months',
    tags: ['Long contract', 'Rises each April'],
    source: 'https://www.vodafone.co.uk/broadband/full-fibre',
    checkedDate: CHECKED,
  },
  {
    id: 'now-fibre',
    group: 'broadband',
    name: 'NOW Broadband',
    website: 'https://www.nowtv.com/broadband',
    cta: 'Sign up',
    category: 'broadband',
    areas: ALL,
    priceText: 'From £23/mo · 24 months',
    tags: ['Long contract'],
    source: 'https://www.nowtv.com/broadband',
    checkedDate: CHECKED,
  },

  // TV licence: tvlicensing.co.uk blocks automated checks, so link the homepage ("Buy one now").
  {
    id: 'tv-licensing',
    group: 'tv',
    name: 'TV Licensing',
    website: 'https://www.tvlicensing.co.uk/',
    cta: 'Buy licence',
    category: 'tv',
    areas: ALL,
    priceText: '£180/yr per house',
    tags: ['Official'],
    source: 'https://www.gov.uk/government/news/cost-of-tv-licence-fee-set-for-202627',
    checkedDate: CHECKED,
  },
]

export const GROUP_LABEL: Record<BillGroup, string> = {
  energy: 'Gas & electricity',
  water: 'Water',
  broadband: 'Wi-Fi',
  tv: 'TV licence',
}

/** Providers relevant to the selected area and the bills the household needs, grouped by bill. */
export function providersFor(area: AreaId, opts: { wifi: boolean; tvLicence: boolean; hasGas?: boolean }): { group: BillGroup; label: string; providers: BillProvider[] }[] {
  const groups: BillGroup[] = ['energy', 'water', ...(opts.wifi ? (['broadband'] as const) : []), ...(opts.tvLicence ? (['tv'] as const) : [])]
  return groups.map((group) => ({
    group,
    label: group === 'energy' && opts.hasGas === false ? 'Electricity' : GROUP_LABEL[group],
    providers: BILL_PROVIDERS.filter((p) => p.group === group && p.areas.includes(area)),
  }))
}
