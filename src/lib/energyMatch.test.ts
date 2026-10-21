import { describe, expect, it } from 'vitest'
import type { BillsSurvey } from './types'
import { DEMO_SURVEY, energyKwh } from './bills'
import { electricityOnlyCost, energyOffers, routeFor } from './energyMatch'
import { ENERGY_TARIFFS, FUSE_ELECTRICITY } from '../data/energyTariffs'
import { METER_ELIGIBILITY } from '../data/meterEligibility'
import { BILL_PROVIDERS } from '../data/billProviders'

const TODAY = '2026-10-21'
const house = (over: Partial<BillsSurvey>): BillsSurvey => ({ ...DEMO_SURVEY, meter: 'credit', economy7: false, ...over })
const ids = (s: BillsSurvey, today = TODAY) => energyOffers(s, today).map((o) => o.supplierId)

describe('meter filter', () => {
  it('a top-up key meter never gets an online Fuse sign-up', () => {
    const fuse = energyOffers(house({ meter: 'prepayKey' }), TODAY).find((o) => o.supplierId === 'fuse')!
    expect(fuse.route).toBe('support')
  })
  it('suppliers with no confirmed prepayment route are hidden for prepayment meters', () => {
    for (const meter of ['prepayKey', 'smartPrepay'] as const)
      for (const id of ['british-gas', 'ovo', 'outfox']) expect(ids(house({ meter }))).not.toContain(id)
  })
  it('"not sure" lists only suppliers confirmed for every meter type', () => {
    const list = ids(house({ meter: 'unsure' }))
    expect(list.length).toBeGreaterThan(0)
    list.forEach((id) => expect(Object.keys(METER_ELIGIBILITY[id]).sort()).toEqual(['credit', 'prepayKey', 'smartPrepay']))
  })
  it('a missing meter answer is treated as "not sure"', () => {
    expect(ids(house({ meter: undefined }))).toEqual(ids(house({ meter: 'unsure' })))
  })
  it('one unconfirmed meter is enough to hide a supplier', () => {
    expect(routeFor('ovo', ['credit'])).toBe('online')
    expect(routeFor('ovo', ['credit', 'prepayKey'])).toBeNull()
  })
  it('a prepayment house is priced on prepayment tariffs only', () => {
    const octopus = energyOffers(house({ meter: 'prepayKey' }), TODAY).find((o) => o.supplierId === 'octopus')!
    expect(octopus.tariff).toBe('Octopus Key and Card')
  })
})

describe('prices', () => {
  it('exact prices come first, cheapest first', () => {
    const offers = energyOffers(house({}), TODAY)
    const exact = offers.filter((o) => o.basis === 'published')
    expect(exact.length).toBeGreaterThan(0)
    expect(offers.slice(0, exact.length)).toEqual(exact)
    for (let i = 1; i < exact.length; i++) expect(exact[i].householdAnnual!).toBeGreaterThanOrEqual(exact[i - 1].householdAnnual!)
  })
  it('expired rates are never priced', () => {
    energyOffers(house({}), '2027-01-01').forEach((o) => {
      expect(o.perPersonWeek).toBeNull()
      expect(o.basis).toBeNull()
    })
  })
  it('night-rate houses get no single-rate price', () =>
    energyOffers(house({ economy7: true }), TODAY).forEach((o) => expect(o.noPrice).toBe('nightRate')))
  it('Fuse has no gas price, so a gas house sees "gas price on quote"', () => {
    const fuse = energyOffers(house({ hasGas: true }), TODAY).find((o) => o.supplierId === 'fuse')!
    expect(fuse.perPersonWeek).toBeNull()
    expect(fuse.noPrice).toBe('gasOnQuote')
  })
  it('Fuse electricity is priced exactly: kWh × unit rate + 365 × standing charge', () => {
    const s = house({ hasGas: false, people: 1 })
    const t = FUSE_ELECTRICITY.find((x) => x.name === 'Single Rate Tracker 15m')!
    const cost = electricityOnlyCost(s, t)!
    expect(Math.round(t.elecUnit * 10000)).toBe(2611)
    expect(Math.round(t.elecStanding * 10000)).toBe(4994)
    expect(cost.householdAnnual).toBe(Math.round((energyKwh(s).elec * t.elecUnit + 365 * t.elecStanding) * 100) / 100)
  })
  it('Fuse tracker matches the Fuse quote: 3,311.7 kWh a year ≈ £87.23 a month', () => {
    const t = FUSE_ELECTRICITY.find((x) => x.name === 'Single Rate Tracker 15m')!
    const monthly = (3311.7 * t.elecUnit + 365 * t.elecStanding) / 12
    expect(Math.abs(monthly - 87.23)).toBeLessThanOrEqual(0.05)
  })
})

describe('energy data', () => {
  it('no approximated prices: every priced tariff is published or the Ofgem cap', () =>
    ENERGY_TARIFFS.forEach((t) => expect(['published', 'capMax', 'quote']).toContain(t.basis)))
  it('every tariff has an expiry date on or after its checked date', () =>
    [...ENERGY_TARIFFS, ...FUSE_ELECTRICITY].forEach((t) => {
      expect(t.validUntil).toMatch(/^\d{4}-\d{2}-\d{2}$/)
      expect(t.validUntil >= t.checkedDate).toBe(true)
    }))
  it('every eligibility entry has an https source and a supplier with a link', () => {
    const energy = BILL_PROVIDERS.filter((p) => p.group === 'energy').map((p) => p.id)
    for (const [id, byMeter] of Object.entries(METER_ELIGIBILITY)) {
      expect(energy).toContain(id)
      Object.values(byMeter).forEach((e) => expect(e!.source).toMatch(/^https:\/\//))
    }
  })
  // The cap table rounds to 3 decimal places of a penny, so compare at that precision.
  const pence3 = (gbp: number) => Math.round(gbp * 100 * 1000) / 1000
  it('prepayment tariffs never exceed the Ofgem prepayment cap (24.678p, 7.663p)', () =>
    ENERGY_TARIFFS.filter((t) => t.meters?.some((m) => m !== 'credit') && t.rates).forEach((t) => {
      expect(pence3(t.rates!.elecUnit)).toBeLessThanOrEqual(24.678)
      expect(pence3(t.rates!.gasUnit)).toBeLessThanOrEqual(7.663)
    }))
})
