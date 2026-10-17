// Storage + cleaning providers, transcribed from research/services.json (checked 2026-10-17).
// priceText = the provider's own published wording; null = no price published ("Price on quote").
import type { AreaId, Provider } from '../lib/types'

export const SERVICES_CHECKED = '2026-10-17'
const ALL_AREAS: AreaId[] = ['gilesgate', 'viaduct', 'cityCentre', 'langleyMoor']

export interface ServiceProvider extends Provider {
  /** Short type line under the name. */
  kind: string
  /** Box collection services come first in the storage list. */
  collection?: boolean
  /** Key services (cleaning). */
  services?: string[]
  /** Coverage line (cleaning). */
  coverage?: string
}

// Excluded on purpose: Durham Storage Containers (Belmont) — site banner says "Not Opening Until 2027".
export const STORAGE: ServiceProvider[] = [
  {
    id: 'seven-seas-durham',
    name: 'Seven Seas Worldwide',
    kind: 'Box storage · they collect and deliver',
    website: 'https://www.sevenseasworldwide.com/students/storage/durham/',
    category: 'storage',
    areas: ALL_AREAS,
    collection: true,
    priceText: 'From 19p per day / £1.30 per week (Standard box); a minimum £84 charge applies',
    tags: ['Collection & delivery', 'Student discount', 'Packing materials supplied'],
    source: 'https://www.sevenseasworldwide.com/students/storage/durham/',
    checkedDate: SERVICES_CHECKED,
  },
  {
    id: 'lovespace-durham',
    name: 'LOVESPACE',
    kind: 'Box storage · they collect and deliver',
    website: 'https://lovespace.co.uk/student-storage/durham/',
    category: 'storage',
    areas: ALL_AREAS,
    collection: true,
    priceText: null,
    tags: ['Collection & delivery', 'From 1 month'],
    source: 'https://lovespace.co.uk/student-storage/durham/',
    checkedDate: SERVICES_CHECKED,
  },
  {
    id: 'yard-self-storage-meadowfield',
    name: 'Yard Self Storage',
    kind: 'Self-storage · Meadowfield DH7 8RL',
    website: 'https://yardselfstorage.co.uk/self-storage-durham/',
    category: 'storage',
    areas: ['langleyMoor'],
    priceText: '20ft Container: £159.99 /month (inc. tax)',
    tags: ['20ft container · split with housemates', 'Drive-up'],
    source: 'https://yardselfstorage.co.uk/self-storage-durham/',
    checkedDate: SERVICES_CHECKED,
  },
  {
    // Listing price used. The same page's FAQ says "£130 per month including the VAT" — confirm with provider.
    id: 'payless-langley-moor',
    name: 'Payless For Storage',
    kind: 'Self-storage · Langley Moor DH7 8XD',
    website: 'https://paylessforstorage.co.uk/self-storage/durham/',
    category: 'storage',
    areas: ['langleyMoor'],
    priceText: '20ft Storage Container: £140/mo (inc VAT)',
    tags: ['20ft container · split with housemates', 'Drive to door'],
    source: 'https://paylessforstorage.co.uk/self-storage/durham/',
    checkedDate: SERVICES_CHECKED,
  },
]

export const CLEANERS: ServiceProvider[] = [
  {
    id: 'tenancy-cleaning-nationwide',
    name: 'Tenancy.Cleaning',
    kind: 'End of tenancy clean',
    coverage: 'UK-wide via local teams',
    website: 'https://tenancy.cleaning/end-of-tenancy-cleaning-durham/',
    category: 'cleaning',
    areas: ALL_AREAS,
    priceText: 'From £135 for a studio flat and £175 for a 1-bed, 1-bath property',
    services: ['Oven from £35', 'Carpets £30/room', '72-hour re-clean'],
    tags: [],
    source: 'https://tenancy.cleaning/end-of-tenancy-cleaning-durham/',
    checkedDate: SERVICES_CHECKED,
  },
  {
    id: 'tenancy-cleaner-durham',
    name: 'Tenancy Cleaner',
    kind: 'End of tenancy clean',
    coverage: 'DH1, DH6, DH7 incl. Langley Moor',
    website: 'https://tenancycleaner.com/end-of-tenancy-cleaning/end-of-tenancy-cleaning-durham/',
    category: 'cleaning',
    areas: ALL_AREAS,
    priceText: 'From £209 (average Durham job £272)',
    services: ['Appliances add-on', 'Carpet steam add-on', 'Free re-clean within 7 days'],
    tags: [],
    source: 'https://tenancycleaner.com/end-of-tenancy-cleaning/end-of-tenancy-cleaning-durham/',
    checkedDate: SERVICES_CHECKED,
  },
  {
    id: 'fantastic-services-durham',
    name: 'Fantastic Services',
    kind: 'End of tenancy clean',
    coverage: 'DH1 to DH9, County Durham',
    website: 'https://fantasticservices.com/durham-end-of-tenancy-cleaning',
    category: 'cleaning',
    areas: ALL_AREAS,
    priceText: 'Area average £220 - £343, fixed price',
    services: ['Oven clean included', 'Carpets extra', 'Key pick-up'],
    tags: [],
    source: 'https://fantasticservices.com/durham-end-of-tenancy-cleaning',
    checkedDate: SERVICES_CHECKED,
  },
  {
    id: 'greenstar-cleaning',
    name: 'Greenstar Cleaning',
    kind: 'End of tenancy clean',
    coverage: 'North East incl. Durham',
    website: 'https://www.greenstar-cleaning.co.uk/cs/end-of-tenancy-cleaning-newcastle-gateshead/',
    category: 'cleaning',
    areas: ALL_AREAS,
    priceText: null,
    services: ['Specialist oven', 'Carpets', 'Upholstery'],
    tags: [],
    source: 'https://www.greenstar-cleaning.co.uk/cs/end-of-tenancy-cleaning-newcastle-gateshead/',
    checkedDate: SERVICES_CHECKED,
  },
]

export const CLEANING_CHECKLIST: string[] = [
  'Kitchen: clean appliances inside and out - oven, fridge, microwave (defrost the freezer first)',
  'Kitchen: degrease hob and extractor hood; clean or replace extractor filters',
  'Kitchen: scrub the sink and taps, wipe worktops and cupboard fronts/insides',
  'Bathroom: scrub toilet (inside and out), sink, bath/shower and screens; descale taps and showerhead',
  'Bathroom: clean mirrors and grout; wipe the extractor fan',
  'Floors: vacuum and mop everywhere; consider professional carpet cleaning if stained or heavily used',
  'Windows: clean glass and sills; dust blinds and curtains',
  'Walls and fixtures: remove wall marks, wipe skirting boards, light switches, door handles and light fittings',
  'Remove all rubbish and belongings (fridge, cupboards, under beds, bins emptied)',
  'Take dated photos or a video walkthrough of every room before check-out, and compare against the check-in inventory',
  'Keep receipts if you use a professional cleaner; a landlord cannot require you to use one',
  'Report damp, mould or leaks to your landlord/agent - ordinary cleaning won\'t fix mould caused by damp, condensation or leaks',
]

export const CLEANING_CHECKLIST_SOURCE = {
  label: 'mydeposits',
  url: 'https://www.mydeposits.co.uk/content-hub/tenant-top-tips-to-keep-your-home-clean/',
}

export const DEPOSIT_LINKS = [
  { label: 'GOV.UK - Tenancy deposit protection', url: 'https://www.gov.uk/tenancy-deposit-protection' },
  { label: 'mydeposits - Tenant tips to keep your home clean', url: 'https://www.mydeposits.co.uk/content-hub/tenant-top-tips-to-keep-your-home-clean/' },
]
