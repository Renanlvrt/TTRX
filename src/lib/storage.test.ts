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
