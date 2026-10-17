import { describe, expect, it } from 'vitest'
import { costOption, periods, recommendStorage } from './storage'
import type { StoragePricing } from './storage'

const box: StoragePricing = {
  providerId: 'box',
  kind: 'box',
  perBox: { small: { amountGBP: 1, per: 'week' }, medium: { amountGBP: 1.3, per: 'week' }, large: { amountGBP: 2, per: 'week' } },
  minimumChargeGBP: 84,
}
const unit: StoragePricing = { providerId: 'unit', kind: 'unit', unit: { amountGBP: 140, per: 'month', label: '20ft container' } }
const quote: StoragePricing = { providerId: 'quote', kind: 'box' }
const needs = (s: number, m: number, l: number, weeks: number) => ({ boxes: { small: s, medium: m, large: l }, weeks })

describe('periods', () => {
  it('charges whole weeks and months, exact days', () => {
    expect(periods('week', 14.2)).toBe(15)
    expect(periods('month', 15)).toBe(4)
    expect(periods('month', 52 / 12)).toBe(1)
    expect(periods('day', 2)).toBe(14)
  })
})

describe('costOption', () => {
  it('sums boxes by size over the period', () => {
    expect(costOption(needs(2, 4, 2, 15), box).total).toBeCloseTo(15 * (2 * 1 + 4 * 1.3 + 2 * 2))
  })
  it('applies the minimum charge', () => {
    expect(costOption(needs(1, 0, 0, 4), box).total).toBe(84)
  })
  it('units cost the same whatever the box count', () => {
    expect(costOption(needs(1, 0, 0, 15), unit).total).toBe(560)
    expect(costOption(needs(9, 9, 9, 15), unit).total).toBe(560)
  })
  it('missing price = quote only', () => {
    expect(costOption(needs(1, 0, 0, 4), quote).total).toBeNull()
    const noLarge = { ...box, perBox: { ...box.perBox!, large: null } }
    expect(costOption(needs(0, 0, 1, 4), noLarge).total).toBeNull()
  })
})

describe('summer-only flat price', () => {
  const summer: StoragePricing = {
    providerId: 'summer',
    kind: 'box',
    perBox: { small: { amountGBP: 44, per: 'term' }, medium: { amountGBP: 44, per: 'term' }, large: { amountGBP: 49, per: 'term' } },
    maxWeeks: 17,
  }
  it('charges once per item regardless of weeks', () => {
    expect(costOption(needs(1, 2, 1, 15), summer).total).toBe(44 * 3 + 49)
  })
  it('is unavailable beyond its window', () => {
    expect(costOption(needs(1, 0, 0, 26), summer).total).toBeNull()
  })
})

describe('recommendStorage', () => {
  it('picks the cheapest priced option, quote-only last', () => {
    const r = recommendStorage(needs(2, 4, 2, 15), [unit, quote, box])
    expect(r.best?.providerId).toBe('box')
    expect(r.alternatives.map((a) => a.providerId)).toEqual(['unit', 'quote'])
  })
  it('a big load makes the container best', () => {
    expect(recommendStorage(needs(0, 0, 40, 15), [box, unit]).best?.providerId).toBe('unit')
  })
  it('no boxes = no recommendation', () => {
    expect(recommendStorage(needs(0, 0, 0, 15), [box]).best).toBeNull()
  })
})

describe('fees', () => {
  const withFees: StoragePricing = {
    ...box,
    minimumChargeGBP: null,
    fees: [
      { label: 'Collection', amountGBP: 20 },
      { label: 'Return', amountGBP: 5, perItem: true },
    ],
  }
  it('adds order and per-item fees on top of storage', () => {
    const o = costOption(needs(1, 1, 1, 4), withFees)
    expect(o.storageGBP).toBeCloseTo(4 * (1 + 1.3 + 2))
    expect(o.feeLines.map((f) => f.amountGBP)).toEqual([20, 15])
    expect(o.total).toBeCloseTo(4 * 4.3 + 35)
  })
  it('minimum charge applies to storage before fees', () => {
    const o = costOption(needs(1, 0, 0, 4), { ...box, fees: [{ label: 'Return', amountGBP: 10 }] })
    expect(o.storageGBP).toBe(84)
    expect(o.total).toBe(94)
  })
})

describe('plans and conditional fees', () => {
  const planned: StoragePricing = {
    providerId: 'plan',
    kind: 'box',
    plans: {
      small: [{ months: 1, monthlyGBP: 10 }, { months: 4, monthlyGBP: 5 }, { months: 12, monthlyGBP: 3 }],
      medium: [{ months: 1, monthlyGBP: 12 }, { months: 4, monthlyGBP: 6 }, { months: 12, monthlyGBP: 4 }],
      large: null,
    },
    fees: [
      { label: 'Boxes', amountGBP: 0, bySize: { small: 2, medium: 3, large: 4 } },
      { label: 'Early retrieval', amountGBP: 35, onlyIfWeeksUnder: 12 },
    ],
  }
  it('uses the shortest plan covering the period', () => {
    // 15 weeks = 4 months -> 4-month plan
    expect(costOption(needs(1, 1, 0, 15), planned).storageGBP).toBe(4 * 5 + 4 * 6)
    // 26 weeks = 6 months -> 12-month plan rate
    expect(costOption(needs(1, 0, 0, 26), planned).storageGBP).toBe(6 * 3)
  })
  it('size-priced and conditional fees', () => {
    const short = costOption(needs(2, 1, 0, 4), planned)
    expect(short.feeLines).toEqual([{ label: 'Boxes', amountGBP: 7 }, { label: 'Early retrieval', amountGBP: 35 }])
    expect(costOption(needs(2, 1, 0, 15), planned).feeLines.map((f) => f.label)).toEqual(['Boxes'])
  })
  it('missing size in plans = quote', () => {
    expect(costOption(needs(0, 0, 1, 4), planned).total).toBeNull()
  })
})
