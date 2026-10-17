import { describe, expect, it } from 'vitest'
import { cleaningAdvice, estimateCleanCost } from './cleaning'

const bands = [
  { bedrooms: 1, priceGBP: 175 },
  { bedrooms: 2, priceGBP: 220 },
  { bedrooms: 4, priceGBP: 320 },
]
const base = { bedrooms: 4, people: 4, depositPerPersonGBP: 400, bands }

describe('estimateCleanCost', () => {
  it('uses exact bands, interpolates between them and extends past the last', () => {
    expect(estimateCleanCost(2, bands)).toBe(220)
    expect(estimateCleanCost(3, bands)).toBe(270)
    expect(estimateCleanCost(6, bands)).toBe(420)
    expect(estimateCleanCost(0, bands)).toBe(175)
  })
})

describe('cleaningAdvice', () => {
  it('nothing flagged = tidy yourself', () => {
    expect(cleaningAdvice({ ...base, dirtyItems: 0 }).verdict).toBe('nothing')
  })
  it('one or two items = DIY', () => {
    expect(cleaningAdvice({ ...base, dirtyItems: 2 }).verdict).toBe('diy')
  })
  it('many items and cleaner cheaper than deposit = hire', () => {
    const a = cleaningAdvice({ ...base, dirtyItems: 4 })
    expect(a.verdict).toBe('hire')
    expect(a.perPersonCostGBP).toBe(80)
    expect(a.headline).toBe('Book a cleaner. It costs less than your deposit.')
  })
  it('many items but deposit smaller than cleaner share = DIY is cheaper', () => {
    expect(cleaningAdvice({ ...base, dirtyItems: 4, depositPerPersonGBP: 50 }).verdict).toBe('diyCheaper')
  })
})
