// Storage recommender data: who to show and how they charge, ALL-IN (storage + required fees). Checked 2026-10-17.
// Sources: research/kitkeeper.json, research/storage-fees.json, research/storage-pricing.json.
// Only published or provider-quoted prices are used; unknown = "Get a quote".
import type { BoxSize, StoragePricing } from '../lib/storage'

export const STORAGE_CHECKED = '2026-10-17'

export const BOX_LABELS: Record<BoxSize, { label: string; hint: string }> = {
  small: { label: 'Small', hint: 'Books, kitchenware' },
  medium: { label: 'Medium', hint: 'Clothes, shoes' },
  large: { label: 'Large', hint: 'Bedding, duvet' },
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
  /** Short price wording for quote-only rows. */
  priceText: string | null
  /** Optional extra worth knowing (not in the total). */
  note?: string
  pricing: StoragePricing
  source: string
}

export const STORAGE_LISTINGS: StorageListing[] = [
  {
    id: 'kitkeeper',
    name: 'Kit Keeper',
    kind: 'Box storage · collect & return',
    bookingUrl: 'https://book.kitkeeper.co.uk/storage/boxes',
    tags: ['Covers all Durham colleges', '1-month minimum'],
    priceText: '£3–£10 per box per month + fees',
    note: 'Their boxes are required (own box £15/month). No insurance sold; liability £100/box.',
    pricing: {
      providerId: 'kitkeeper',
      kind: 'box',
      // Small 30cm / Medium 35cm / Large 40cm cubes.
      perBox: { small: { amountGBP: 3, per: 'month' }, medium: { amountGBP: 8.5, per: 'month' }, large: { amountGBP: 10, per: 'month' } },
      fees: [
        { label: 'Collection', amountGBP: 45 },
        { label: 'Boxes', amountGBP: 0, bySize: { small: 3, medium: 4.5, large: 5.5 } },
        { label: 'Box delivery', amountGBP: 12.99 },
        { label: 'Return', amountGBP: 6.95, perItem: true },
      ],
    },
    source: 'https://www.kitkeeper.co.uk/location/student-storage-in-durham',
  },
  {
    id: 'lovespace',
    name: 'LOVESPACE',
    kind: 'Box storage · collect & return',
    bookingUrl: 'https://lovespace.co.uk/apps/order/',
    tags: ['Free collection', '£100/box cover included'],
    priceText: 'From £3.25 per box per month',
    note: 'Use your own double-walled boxes, or buy theirs (£2.95–£5.95 + £6.95 delivery).',
    pricing: {
      providerId: 'lovespace',
      kind: 'box',
      plans: {
        small: [{ months: 1, monthlyGBP: 9.65 }, { months: 4, monthlyGBP: 5.35 }, { months: 6, monthlyGBP: 4.4 }, { months: 12, monthlyGBP: 3.25 }],
        medium: [{ months: 1, monthlyGBP: 12.1 }, { months: 4, monthlyGBP: 6.7 }, { months: 6, monthlyGBP: 5.45 }, { months: 12, monthlyGBP: 5.45 }],
        large: [{ months: 1, monthlyGBP: 21.5 }, { months: 4, monthlyGBP: 11.85 }, { months: 6, monthlyGBP: 9.7 }, { months: 12, monthlyGBP: 9.7 }],
      },
      fees: [{ label: 'Return', amountGBP: 7.95, perItem: true }],
    },
    source: 'https://lovespace.co.uk/student-storage/durham/',
  },
  {
    id: 'theboxco',
    name: 'The Box Co.',
    kind: 'Box storage · collect & return',
    bookingUrl: 'https://booking.theboxco.co.uk/?postcode=DH1',
    tags: ['Free collection', '£100/box cover included'],
    priceText: 'From £3.84 per box per month',
    note: 'Use your own double-walled boxes, or buy theirs (£4.65–£7.25). Some busy dates add £29.95.',
    pricing: {
      providerId: 'theboxco',
      kind: 'box',
      plans: {
        small: [{ months: 1, monthlyGBP: 9.6 }, { months: 4, monthlyGBP: 4.8 }, { months: 6, monthlyGBP: 4.42 }, { months: 12, monthlyGBP: 3.84 }],
        medium: [{ months: 1, monthlyGBP: 14.95 }, { months: 4, monthlyGBP: 7.48 }, { months: 6, monthlyGBP: 6.88 }, { months: 12, monthlyGBP: 5.98 }],
        large: [{ months: 1, monthlyGBP: 19.95 }, { months: 4, monthlyGBP: 9.98 }, { months: 6, monthlyGBP: 9.18 }, { months: 12, monthlyGBP: 7.98 }],
      },
      // Site says "free returns" but its booking catalogue charges £14.95 per box.
      fees: [{ label: 'Return', amountGBP: 14.95, perItem: true }],
    },
    source: 'https://theboxco.co.uk/pages/durham-student-storage',
  },
  {
    id: 'dumove',
    name: 'DUmove · DU Storage',
    kind: 'Box storage · collect & redeliver',
    bookingUrl: 'https://www.dumove.co.uk/store/p/du-storage-box',
    tags: ['Durham students', 'Summer only', 'Back 28 Sep–11 Oct'],
    priceText: '£44 per box, whole summer',
    pricing: {
      providerId: 'dumove',
      kind: 'box',
      // One box size (up to 60×40×40 cm); collection, storage and redelivery included.
      perBox: { small: { amountGBP: 44, per: 'term' }, medium: { amountGBP: 44, per: 'term' }, large: { amountGBP: 44, per: 'term' } },
      maxWeeks: 17,
      fees: [{ label: 'Early retrieval', amountGBP: 35, onlyIfWeeksUnder: 12 }],
    },
    source: 'https://www.dumove.co.uk/du-storage',
  },
  {
    id: 'seven-seas',
    name: 'Seven Seas Worldwide',
    kind: 'Box storage · collect & return',
    bookingUrl: 'https://account.sevenseasworldwide.com/getquote?lang=en-gb&rs=585850',
    tags: ['Boxes supplied', 'Free return within 50km'],
    priceText: '£1.30–£2.60 per box per week + Durham charge',
    pricing: {
      providerId: 'seven-seas',
      kind: 'box',
      perBox: { small: { amountGBP: 1.3, per: 'week' }, medium: { amountGBP: 1.3, per: 'week' }, large: { amountGBP: 2.6, per: 'week' } },
      // Live Durham quotes include a fixed ~£210.10 per order (London/York quotes don't).
      fees: [{ label: 'Durham order charge', amountGBP: 210.1 }],
    },
    source: 'https://www.sevenseasworldwide.com/students/storage/durham/',
  },
  {
    id: 'ssb',
    name: 'Student Storage Box',
    kind: 'Box storage · bundles',
    bookingUrl: 'https://www.studentstoragebox.co.uk/secure/StorageQuote.php?source=durham',
    tags: ['Boxes supplied', '£65 non-refundable upfront'],
    priceText: '£65 upfront + monthly + return (not published)',
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
