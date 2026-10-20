// Frozen QA suite for move-out cleaning advice (SPEC §3 Storage & Cleaning).
import { describe, expect, it } from 'vitest'
import { DIY_MAX_ITEMS, cleaningAdvice, estimateCleanCost } from './cleaning'
import type { PriceBand } from './cleaning'
import { CLEANING_BANDS } from '../data/cleaningPrices'

const advice = (over: Partial<Parameters<typeof cleaningAdvice>[0]> = {}) =>
  cleaningAdvice({ bedrooms: 4, people: 4, depositPerPersonGBP: 400, dirtyItems: 5, bands: CLEANING_BANDS, ...over })

describe('estimateCleanCost with the Durham bands', () => {
  const expected: [number, number][] = [[0, 135], [1, 210], [2, 265], [3, 360], [4, 425], [5, 510], [6, 510]]
  for (const [beds, price] of expected) it(`${beds} bedroom(s) = £${price}`, () => expect(estimateCleanCost(beds, CLEANING_BANDS)).toBe(price))
  it('7+ bedrooms extend by the last step (5→6 is £0), so stay £510', () => {
    expect(estimateCleanCost(7, CLEANING_BANDS)).toBe(510)
    expect(estimateCleanCost(10, CLEANING_BANDS)).toBe(510)
  })
  it('is non-decreasing in bedrooms 0–10', () => {
    for (let b = 1; b <= 10; b++) expect(estimateCleanCost(b, CLEANING_BANDS)).toBeGreaterThanOrEqual(estimateCleanCost(b - 1, CLEANING_BANDS))
  })
})

describe('estimateCleanCost with sparse/unsorted bands', () => {
  const sparse: PriceBand[] = [{ bedrooms: 4, priceGBP: 400 }, { bedrooms: 1, priceGBP: 100 }]
  it('interpolates linearly between bands and rounds to whole pounds', () => {
    expect(estimateCleanCost(2, sparse)).toBe(200)
    expect(estimateCleanCost(3, sparse)).toBe(300)
  })
  it('works regardless of band order', () => expect(estimateCleanCost(4, sparse)).toBe(400))
  it('below the smallest band uses the smallest band price', () => expect(estimateCleanCost(0, sparse)).toBe(100))
  it('above the largest band extends by the last step per bedroom', () => expect(estimateCleanCost(6, sparse)).toBe(600))
  it('a single band beyond its range stays flat', () => expect(estimateCleanCost(5, [{ bedrooms: 2, priceGBP: 250 }])).toBe(250))
  it('does not mutate the bands array', () => {
    const bands = [...sparse]
    estimateCleanCost(3, bands)
    expect(bands).toEqual(sparse)
  })
})

describe('cleaningAdvice verdicts', () => {
  it('0 dirty items → "nothing", keep the money', () => {
    const a = advice({ dirtyItems: 0 })
    expect(a.verdict).toBe('nothing')
    expect(a.detail).toContain('£425')
  })
  it('1 dirty item → "diy" with singular wording', () => {
    const a = advice({ dirtyItems: 1 })
    expect(a.verdict).toBe('diy')
    expect(a.headline).toBe('Only 1 thing to clean. Do it yourself.')
  })
  it(`${DIY_MAX_ITEMS} dirty items is still DIY (plural wording)`, () => {
    const a = advice({ dirtyItems: DIY_MAX_ITEMS })
    expect(a.verdict).toBe('diy')
    expect(a.headline).toBe('Only 2 things to clean. Do it yourself.')
  })
  it('DIY_MAX_ITEMS is 2', () => expect(DIY_MAX_ITEMS).toBe(2))
  it('3+ items and cleaner share < deposit → "hire"', () => expect(advice({ dirtyItems: 3 }).verdict).toBe('hire'))
  it('launch-video case: 4-bed, 4 people, £400 deposit → £425 house, £106.25 each, hire', () => {
    const a = advice()
    expect(a.houseCostGBP).toBe(425)
    expect(a.perPersonCostGBP).toBe(106.25)
    expect(a.verdict).toBe('hire')
    expect(a.headline).toBe('Book a cleaner. It costs less than your deposit.')
  })
  it('cleaner share > deposit → "diyCheaper"', () => expect(advice({ depositPerPersonGBP: 100 }).verdict).toBe('diyCheaper'))
  it('cleaner share exactly equal to the deposit → "diyCheaper" (strictly cheaper needed to hire)', () =>
    expect(advice({ depositPerPersonGBP: 106.25 }).verdict).toBe('diyCheaper'))
  it('a negative deposit is treated as £0 → "diyCheaper"', () => expect(advice({ depositPerPersonGBP: -50 }).verdict).toBe('diyCheaper'))
  it('a £0 deposit never recommends hiring', () => expect(advice({ depositPerPersonGBP: 0, dirtyItems: 9 }).verdict).toBe('diyCheaper'))
  it('detail mentions the number of dirty items when hiring', () => expect(advice({ dirtyItems: 7 }).detail).toContain('7 items'))
  it('DIY detail quotes the per-person cleaner cost rounded to whole pounds', () => expect(advice({ dirtyItems: 1 }).detail).toContain('£106 each'))
})

describe('cleaningAdvice inputs', () => {
  it('people is rounded and at least 1', () => {
    expect(advice({ people: 0 }).perPersonCostGBP).toBe(425)
    expect(advice({ people: 3.6 }).perPersonCostGBP).toBe(106.25)
  })
  it('bedrooms are rounded (3.6 → 4) and floored at 0', () => {
    expect(advice({ bedrooms: 3.6 }).houseCostGBP).toBe(425)
    expect(advice({ bedrooms: -2 }).houseCostGBP).toBe(135)
  })
  it('per person = house cost ÷ people for 1–8 people', () => {
    for (let p = 1; p <= 8; p++) expect(advice({ people: p }).perPersonCostGBP).toBeCloseTo(425 / p, 10)
  })
  it('more housemates can flip "diyCheaper" to "hire"', () => {
    expect(advice({ bedrooms: 5, people: 1, depositPerPersonGBP: 300 }).verdict).toBe('diyCheaper')
    expect(advice({ bedrooms: 5, people: 5, depositPerPersonGBP: 300 }).verdict).toBe('hire')
  })
})
