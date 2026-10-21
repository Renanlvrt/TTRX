// How a student can join each supplier with each kind of meter. Only primary sources count:
// a supplier with no entry for a meter is treated as "might refuse" and is not shown for it.
// online  = the supplier's own sign-up accepts it.
// support = the supplier sells a tariff for it, but joining needs a call or chat.
import type { MeterType } from '../lib/types'

export type JoinRoute = 'online' | 'support'

export interface Eligibility {
  route: JoinRoute
  source: string
  /** One short fact shown to the student, if any. */
  note?: string
}

export const ELIGIBILITY_CHECKED = '2026-10-21'

const FUSE_PREPAY = 'https://www.fuseenergy.com/blog/changing-from-prepayment-meter-to-direct-debit'
const EON_PREPAY = 'https://api.eonnext-kraken.energy/v1/products/NEXT_FLEX_PREPAYMENT/'

export const METER_ELIGIBILITY: Record<string, Partial<Record<MeterType, Eligibility>>> = {
  octopus: {
    credit: { route: 'online', source: 'https://octopus.energy/move-in/' },
    // Octopus sells a key-and-card tariff but shows no online route for joining with a key meter.
    prepayKey: { route: 'support', source: 'https://api.octopus.energy/v1/products/PREPAY-VAR-18-09-21/' },
    smartPrepay: { route: 'online', source: 'https://octopus.energy/help-and-faqs/articles/can-i-still-sign-up-with-you-if-i-have-smart-payg/', note: 'Some smart meter models only' },
  },
  edf: {
    credit: { route: 'online', source: 'https://www.edfenergy.com/quote/address-details' },
    prepayKey: { route: 'support', source: 'https://api.edfgb-kraken.energy/v1/products/EDF_STANDARD_VARIABLE_PP/' },
    smartPrepay: { route: 'support', source: 'https://www.edfenergy.com/help-support/faq/topping-when-you-first-move-home-payg-meter' },
  },
  'eon-next': {
    credit: { route: 'online', source: 'https://www.eonnext.com/moving-home/moving-in' },
    prepayKey: { route: 'support', source: EON_PREPAY },
    smartPrepay: { route: 'support', source: EON_PREPAY },
  },
  fuse: {
    credit: { route: 'online', source: 'https://www.fuseenergy.com/app/boarding' },
    // Online sign-up says "unsupported meter" for prepayment; Fuse's quote lists a prepayment tariff "after contacting support".
    prepayKey: { route: 'support', source: FUSE_PREPAY },
    smartPrepay: { route: 'support', source: FUSE_PREPAY },
  },
  'british-gas': { credit: { route: 'online', source: 'https://www.britishgas.co.uk/new-energy/sales' } },
  ovo: { credit: { route: 'online', source: 'https://products.ovoenergy.com/energy/customer-property' } },
  outfox: { credit: { route: 'online', source: 'https://signup.outfox.energy/#/get-a-quote' } },
}

export const eligibilityFor = (supplierId: string, meter: MeterType): Eligibility | null => METER_ELIGIBILITY[supplierId]?.[meter] ?? null
