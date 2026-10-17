// Storage recommender data: who to show and how they charge. Checked 2026-10-17 — see research/storage-pricing.json.
// Only published prices are used. A size with no published price is null, so that provider becomes "Get a quote".
import type { BoxSize, StoragePricing } from '../lib/storage'

export const STORAGE_CHECKED = '2026-10-17'

export const BOX_LABELS: Record<BoxSize, { label: string; hint: string }> = {
  small: { label: 'Small', hint: 'Books, kitchenware · ~46×30×30 cm' },
  medium: { label: 'Medium', hint: 'Clothes, shoes · ~46×46×30 cm' },
  large: { label: 'Large', hint: 'Bedding, duvet · ~46×46×46 cm' },
}

export const DURATIONS: { weeks: number; label: string; hint?: string }[] = [
  { weeks: 4, label: '1 month' },
  { weeks: 15, label: 'Summer', hint: '~15 weeks' },
  { weeks: 26, label: '6 months' },
  { weeks: 52, label: '1 year' },
]

export interface StorageListing {
  id: string
  name: string
  kind: string
  bookingUrl: string
  tags: string[]
  /** Published price wording, shown as-is. */
  priceText: string | null
  pricing: StoragePricing
  source: string
}

export const STORAGE_LISTINGS: StorageListing[] = [
  {
    id: 'dumove',
    name: 'DUmove · DU Storage',
    kind: 'Box storage · collect & redeliver',
    bookingUrl: 'https://www.dumove.co.uk/store/p/du-storage-box',
    tags: ['Durham students', 'Summer only', 'Back 28 Sep–11 Oct'],
    priceText: '£44 per box / £49 per suitcase, whole summer',
    pricing: {
      providerId: 'dumove',
      kind: 'box',
      perBox: { small: { amountGBP: 44, per: 'term' }, medium: { amountGBP: 44, per: 'term' }, large: { amountGBP: 49, per: 'term' } },
      maxWeeks: 17,
    },
    source: 'https://www.dumove.co.uk/du-storage',
  },
  {
    id: 'seven-seas',
    name: 'Seven Seas Worldwide',
    kind: 'Box storage · collect & deliver',
    bookingUrl: 'https://account.sevenseasworldwide.com/getquote?lang=en-gb&rs=585850',
    tags: ['Student discount', 'Free collection', '£84 minimum'],
    priceText: '£1.30/week per Standard box; minimum £84',
    pricing: {
      providerId: 'seven-seas',
      kind: 'box',
      // Smallest box is the 51×41×31 cm "Standard"; their Large box is quote-only.
      perBox: { small: { amountGBP: 1.3, per: 'week' }, medium: { amountGBP: 1.3, per: 'week' }, large: null },
      minimumChargeGBP: 84,
    },
    source: 'https://www.sevenseasworldwide.com/students/storage/durham/',
  },
  {
    id: 'theboxco',
    name: 'The Box Co.',
    kind: 'Box storage · collect & deliver',
    bookingUrl: 'https://booking.theboxco.co.uk/',
    tags: ['40% off 3 months'],
    priceText: 'From £3.56/month (small box)',
    pricing: { providerId: 'theboxco', kind: 'box', perBox: { small: { amountGBP: 3.56, per: 'month' }, medium: null, large: null } },
    source: 'https://theboxco.co.uk/pages/durham-student-storage',
  },
  {
    id: 'lovespace',
    name: 'LOVESPACE',
    kind: 'Box storage · collect & deliver',
    bookingUrl: 'https://lovespace.co.uk/apps/order/',
    tags: ['Free halls collection', '40% off 3+ months'],
    priceText: 'From £3.25/box/month (size not stated)',
    pricing: { providerId: 'lovespace', kind: 'box' },
    source: 'https://lovespace.co.uk/student-storage/durham/',
  },
  {
    id: 'ssb',
    name: 'Student Storage Box',
    kind: 'Box storage · bundles',
    bookingUrl: 'https://www.studentstoragebox.co.uk/student-storage-durham.php',
    tags: ['Bundles from £65 upfront'],
    priceText: null,
    pricing: { providerId: 'ssb', kind: 'box' },
    source: 'https://www.studentstoragebox.co.uk/student-storage-durham.php',
  },
  {
    id: 'payless',
    name: 'Payless For Storage',
    kind: 'Self-storage · Langley Moor DH7 8XD',
    bookingUrl: 'https://paylessforstorage.co.uk/get-a-quote/?loc_id=100&unit_id=212',
    tags: ['20ft container', 'Split with housemates', 'You drive it there'],
    // Listing says £140/mo; the same page's FAQ says £130.
    priceText: '£140/month (20ft container)',
    pricing: { providerId: 'payless', kind: 'unit', unit: { amountGBP: 140, per: 'month', label: '20ft container' } },
    source: 'https://paylessforstorage.co.uk/self-storage/durham/',
  },
  {
    id: 'yard',
    name: 'Yard Self Storage',
    kind: 'Self-storage · Meadowfield DH7 8RL',
    bookingUrl: 'https://bookings.yardselfstorage.co.uk/sites/durham-self-storage-units/order/contact-details?unit_type_slug=20ft-container',
    tags: ['20ft container', 'Split with housemates', 'You drive it there'],
    priceText: '£159.99/month (20ft container)',
    pricing: { providerId: 'yard', kind: 'unit', unit: { amountGBP: 159.99, per: 'month', label: '20ft container' } },
    source: 'https://yardselfstorage.co.uk/self-storage-durham/',
  },
]
