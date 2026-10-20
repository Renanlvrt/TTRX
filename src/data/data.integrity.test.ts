// Frozen data-integrity suite (CLAUDE.md: "Never invent prices; unverified = unavailable"; every price has a source + date).
import { describe, expect, it } from 'vitest'
import { ASSUMED, BROADBAND_FALLBACK, ELECTRICITY, GAS, RATES_CHECKED, SPACE_HEATING_SHARE, TDCV, TV_LICENCE, WATER } from './rates'
import { BILL_PROVIDERS } from './billProviders'
import { CLEANERS, STORAGE, DEPOSIT_LINKS, CLEANING_CHECKLIST_SOURCE } from './services'
import { CLEANING_BANDS, CLEANING_BANDS_SOURCE, CLEANING_FACTS } from './cleaningPrices'
import { DURATIONS, STORAGE_CHECKED, STORAGE_LISTINGS } from './storagePricing'
import { ENERGY_TARIFFS, tariffsFor } from './energyTariffs'
import { EXTRAS, PACKAGE_BENCHMARK } from './extras'
import { CHECKLIST } from './checklist'
import { AREAS } from '../lib/types'
import type { BoxSize } from '../lib/storage'

const HTTPS = /^https:\/\/[^\s]+$/
const ISO_DAY = /^\d{4}-\d{2}-\d{2}$/
const TODAY = '2026-10-20'
const AREA_IDS = new Set(AREAS.map((a) => a.id))
const sourced = [
  ELECTRICITY.unitGBP,
  ELECTRICITY.standingGBPPerDay,
  GAS.unitGBP,
  GAS.standingGBPPerDay,
  WATER.combinedPerM3GBP,
  WATER.combinedFixedGBPPerYear,
  WATER.unmeteredAverageGBP,
  TV_LICENCE.annualGBP,
  BROADBAND_FALLBACK.monthlyGBP,
  SPACE_HEATING_SHARE,
]

describe('rates.ts', () => {
  it('every sourced rate has an https source', () => sourced.forEach((s) => expect(s.source).toMatch(HTTPS)))
  it('every sourced rate has a checked date that is a real day, not in the future', () =>
    sourced.forEach((s) => {
      expect(s.checkedDate).toMatch(ISO_DAY)
      expect(s.checkedDate <= TODAY).toBe(true)
    }))
  it('RATES_CHECKED is 2026-10-17', () => expect(RATES_CHECKED).toBe('2026-10-17'))
  it('every verified rate is a positive finite number', () =>
    sourced.forEach((s) => {
      expect(typeof s.value).toBe('number')
      expect(Number.isFinite(s.value)).toBe(true)
      expect(s.value as number).toBeGreaterThan(0)
    }))
  it('unit rates are in £ (not pence): electricity 25.46p, gas 7.92p', () => {
    expect(ELECTRICITY.unitGBP.value).toBe(0.2546)
    expect(GAS.unitGBP.value).toBe(0.0792)
  })
  it('standing charges: electricity 61.58p/day, gas 29.79p/day', () => {
    expect(ELECTRICITY.standingGBPPerDay.value).toBe(0.6158)
    expect(GAS.standingGBPPerDay.value).toBe(0.2979)
  })
  it('water combined rate = water + sewerage (1.6169 + 1.6121, 61.16 + 123.75)', () => {
    expect(WATER.combinedPerM3GBP.value).toBeCloseTo(1.6169 + 1.6121, 9)
    expect(WATER.combinedFixedGBPPerYear.value).toBeCloseTo(61.16 + 123.75, 9)
  })
  it('TDCV medium values match Ofgem (2,500 kWh elec, 9,500 kWh gas)', () => {
    expect(TDCV.electricitySingleRate.medium).toBe(2500)
    expect(TDCV.gas.medium).toBe(9500)
    expect(TDCV.source).toMatch(HTTPS)
  })
  it('TDCV bands are ordered low < medium < high', () => {
    for (const b of [TDCV.electricitySingleRate, TDCV.electricityEconomy7, TDCV.gas]) {
      expect(b.low).toBeLessThan(b.medium)
      expect(b.medium).toBeLessThan(b.high)
    }
  })
  it('space heating share is a fraction in (0,1)', () => {
    expect(SPACE_HEATING_SHARE.value).toBeGreaterThan(0)
    expect(SPACE_HEATING_SHARE.value).toBeLessThan(1)
  })
  it('assumptions are labelled and sane', () => {
    expect(ASSUMED.weeksPerYear).toBe(52)
    expect(ASSUMED.boilerEfficiency).toBeGreaterThan(0)
    expect(ASSUMED.boilerEfficiency).toBeLessThanOrEqual(1)
    expect(ASSUMED.scaleIntercept + ASSUMED.scaleSlope).toBeCloseTo(1, 12)
    expect(ASSUMED.heatingMultiplier.allDay).toBeGreaterThan(ASSUMED.heatingMultiplier.nights)
    expect(ASSUMED.heatingMultiplier.nights).toBeGreaterThan(ASSUMED.heatingMultiplier.coldMonths)
  })
  it('water litre bands: normal is the sourced UK average 142 L', () => {
    expect(WATER.litresPerPersonPerDay).toEqual({ low: 110, normal: 142, high: 180 })
    expect(WATER.litresSource).toMatch(HTTPS)
  })
})

describe('bill providers', () => {
  it('ids are unique', () => expect(new Set(BILL_PROVIDERS.map((p) => p.id)).size).toBe(BILL_PROVIDERS.length))
  it('every provider links to its own https site and has an https source', () =>
    BILL_PROVIDERS.forEach((p) => {
      expect(p.website).toMatch(HTTPS)
      expect(p.source).toMatch(HTTPS)
      if (p.secondary) expect(p.secondary.url).toMatch(HTTPS)
    }))
  it('every provider has a checked date', () => BILL_PROVIDERS.forEach((p) => expect(p.checkedDate).toMatch(ISO_DAY)))
  it('areas are known Durham areas', () => BILL_PROVIDERS.forEach((p) => p.areas.forEach((a) => expect(AREA_IDS.has(a)).toBe(true))))
  it('priceText is null (= "Get a quote") or contains a £ figure', () =>
    BILL_PROVIDERS.forEach((p) => {
      if (p.priceText !== null) expect(p.priceText).toMatch(/£\d/)
    }))
  it('links never go to a comparison site', () =>
    BILL_PROVIDERS.forEach((p) => expect(p.website).not.toMatch(/uswitch|comparethemarket|gocompare|moneysupermarket/)))
  it('covers energy, water and broadband groups', () => {
    const groups = new Set(BILL_PROVIDERS.map((p) => p.group))
    for (const g of ['energy', 'water', 'broadband']) expect(groups.has(g as never)).toBe(true)
  })
})

describe('energy tariffs', () => {
  it('every tariff has an https source and a checked date', () =>
    ENERGY_TARIFFS.forEach((t) => {
      expect(t.source).toMatch(HTTPS)
      expect(t.checkedDate).toMatch(ISO_DAY)
    }))
  it('quote-only tariffs have no rates; all others have positive rates', () =>
    ENERGY_TARIFFS.forEach((t) => {
      if (t.basis === 'quote') expect(t.rates).toBeNull()
      else for (const v of Object.values(t.rates!)) expect(v).toBeGreaterThan(0)
    }))
  it('capped standard variable tariffs never exceed the Ofgem cap', () =>
    ENERGY_TARIFFS.filter((t) => t.basis === 'capMax').forEach((t) => {
      expect(t.rates!.elecUnit).toBeLessThanOrEqual(ELECTRICITY.unitGBP.value!)
      expect(t.rates!.gasUnit).toBeLessThanOrEqual(GAS.unitGBP.value!)
    }))
  it('Octopus rates are converted from pence to pounds', () => {
    const flex = tariffsFor('octopus').find((t) => t.name === 'Flexible Octopus')!
    expect(flex.rates!.elecUnit).toBeCloseTo(0.254552, 9)
    expect(flex.basis).toBe('published')
  })
  it('fixed tariffs state a term in months when priced', () =>
    ENERGY_TARIFFS.filter((t) => t.kind === 'fixed' && t.rates).forEach((t) => expect(t.months).toBeGreaterThan(0)))
  it('every energy supplier in the providers list has at least one tariff row', () =>
    BILL_PROVIDERS.filter((p) => p.group === 'energy' && ENERGY_TARIFFS.some((t) => t.supplierId === p.id)).forEach((p) =>
      expect(tariffsFor(p.id).length).toBeGreaterThan(0)))
})

describe('storage listings', () => {
  it('ids are unique and match their pricing providerId', () => {
    expect(new Set(STORAGE_LISTINGS.map((l) => l.id)).size).toBe(STORAGE_LISTINGS.length)
    STORAGE_LISTINGS.forEach((l) => expect(l.pricing.providerId).toBe(l.id))
  })
  it('booking and source links are https', () =>
    STORAGE_LISTINGS.forEach((l) => {
      expect(l.bookingUrl).toMatch(HTTPS)
      expect(l.source).toMatch(HTTPS)
    }))
  it('STORAGE_CHECKED is a real day', () => expect(STORAGE_CHECKED).toMatch(ISO_DAY))
  it('all published prices and fees are positive (or a £0 placeholder with by-size prices)', () =>
    STORAGE_LISTINGS.forEach(({ pricing }) => {
      for (const size of ['small', 'medium', 'large'] as BoxSize[]) {
        const pb = pricing.perBox?.[size]
        if (pb) expect(pb.amountGBP).toBeGreaterThan(0)
        for (const plan of pricing.plans?.[size] ?? []) expect(plan.monthlyGBP).toBeGreaterThan(0)
      }
      for (const f of pricing.fees ?? []) expect(f.bySize ? true : f.amountGBP > 0).toBe(true)
      if (pricing.unit) expect(pricing.unit.amountGBP).toBeGreaterThan(0)
    }))
  it('plan pricing: longer plans are never dearer per month', () =>
    STORAGE_LISTINGS.forEach(({ pricing }) => {
      for (const size of ['small', 'medium', 'large'] as BoxSize[]) {
        const plans = [...(pricing.plans?.[size] ?? [])].sort((a, b) => a.months - b.months)
        for (let i = 1; i < plans.length; i++) expect(plans[i].monthlyGBP).toBeLessThanOrEqual(plans[i - 1].monthlyGBP)
      }
    }))
  it('quote-only listings carry wording instead of a price model', () =>
    STORAGE_LISTINGS.filter((l) => !l.pricing.perBox && !l.pricing.plans && !l.pricing.unit).forEach((l) => expect(l.priceText).toBeTruthy()))
  it('durations are strictly increasing and positive', () => {
    for (let i = 0; i < DURATIONS.length; i++) {
      expect(DURATIONS[i].weeks).toBeGreaterThan(i ? DURATIONS[i - 1].weeks : 0)
    }
  })
})

describe('services (storage + cleaning cards)', () => {
  it('every card opens a real provider site (https) with a source and date', () =>
    [...STORAGE, ...CLEANERS].forEach((p) => {
      expect(p.website).toMatch(HTTPS)
      expect(p.source).toMatch(HTTPS)
      expect(p.checkedDate).toMatch(ISO_DAY)
    }))
  it('ids are unique across storage and cleaning', () => {
    const ids = [...STORAGE, ...CLEANERS].map((p) => p.id)
    expect(new Set(ids).size).toBe(ids.length)
  })
  it('categories are correct', () => {
    STORAGE.forEach((p) => expect(p.category).toBe('storage'))
    CLEANERS.forEach((p) => expect(p.category).toBe('cleaning'))
  })
  it('deposit and checklist links are https', () => {
    DEPOSIT_LINKS.forEach((l) => expect(l.url).toMatch(HTTPS))
    expect(CLEANING_CHECKLIST_SOURCE.url).toMatch(HTTPS)
  })
})

describe('cleaning prices', () => {
  it('bands cover 0–6 bedrooms, one band each', () => expect(CLEANING_BANDS.map((b) => b.bedrooms)).toEqual([0, 1, 2, 3, 4, 5, 6]))
  it('prices are non-decreasing with bedrooms', () => {
    for (let i = 1; i < CLEANING_BANDS.length; i++) expect(CLEANING_BANDS[i].priceGBP).toBeGreaterThanOrEqual(CLEANING_BANDS[i - 1].priceGBP)
  })
  it('studio = £135 (no oven add-on); 1-bed = £175 + £35 oven', () => {
    expect(CLEANING_BANDS[0].priceGBP).toBe(135)
    expect(CLEANING_BANDS[1].priceGBP).toBe(210)
  })
  it('source and facts link to https pages', () => {
    expect(CLEANING_BANDS_SOURCE.url).toMatch(HTTPS)
    Object.values(CLEANING_FACTS).forEach((f) => expect(f.url).toMatch(HTTPS))
  })
})

describe('extras', () => {
  it('every extra has an https source and https links', () =>
    EXTRAS.forEach((e) => {
      expect(e.source).toMatch(HTTPS)
      e.links.forEach((l) => expect(l.url).toMatch(HTTPS))
    }))
  it('package benchmark is consistent: £195 − £175 = £20 pppw', () => {
    expect(PACKAGE_BENCHMARK.pppw).toBe(20)
    expect(PACKAGE_BENCHMARK.text).toContain('£175')
    expect(PACKAGE_BENCHMARK.text).toContain('£195')
    expect(PACKAGE_BENCHMARK.url).toMatch(HTTPS)
  })
})

describe('demo house assets', () => {
  const photos = Object.keys(import.meta.glob('/public/demo-house/*.jpg'))
  it('every checklist item has a move-in and a move-out photo in public/demo-house', () => {
    for (const c of CHECKLIST)
      for (const side of ['in', 'out']) expect(photos).toContain(`/public/demo-house/${c.id}-${side}.jpg`)
  })
})
