// Frozen QA suite for the storage recommender, priced against the real Durham listings (src/data/storagePricing.ts).
// Launch-video case: 2 small + 3 medium + 1 large boxes for the summer (15 weeks) → LOVESPACE £218.30.
import { describe, expect, it } from 'vitest'
import { BOX_SIZES, costOption, periods, recommendStorage, totalBoxes } from './storage'
import type { StoragePricing } from './storage'
import { DURATIONS, STORAGE_LISTINGS } from '../data/storagePricing'

const p = (id: string) => STORAGE_LISTINGS.find((l) => l.id === id)!.pricing
const ALL = STORAGE_LISTINGS.map((l) => l.pricing)
const needs = (s: number, m: number, l: number, weeks: number) => ({ boxes: { small: s, medium: m, large: l }, weeks })
const SUMMER = needs(2, 3, 1, 15)

describe('periods', () => {
  it('"term" is always one charge', () => {
    expect(periods('term', 1)).toBe(1)
    expect(periods('term', 52)).toBe(1)
  })
  it('days are exact (weeks × 7, rounded)', () => expect(periods('day', 15)).toBe(105))
  it('weeks are charged whole (ceil)', () => {
    expect(periods('week', 15)).toBe(15)
    expect(periods('week', 15.01)).toBe(16)
  })
  it('months use 52/12 weeks and are charged whole', () => {
    expect(periods('month', 4)).toBe(1)
    expect(periods('month', 5)).toBe(2)
    expect(periods('month', 15)).toBe(4)
    expect(periods('month', 26)).toBe(6)
    expect(periods('month', 52)).toBe(12)
  })
  it('an exact multiple of a month is not rounded up by float error', () => {
    for (let m = 1; m <= 12; m++) expect(periods('month', (m * 52) / 12)).toBe(m)
  })
})

describe('totalBoxes', () => {
  it('sums all sizes', () => expect(totalBoxes(SUMMER)).toBe(6))
  it('ignores negative counts', () => expect(totalBoxes(needs(-3, 2, 0, 15))).toBe(2))
  it('BOX_SIZES is small, medium, large', () => expect(BOX_SIZES).toEqual(['small', 'medium', 'large']))
})

describe('real listings, summer (2S + 3M + 1L, 15 weeks)', () => {
  it('LOVESPACE: 4-month plan, £170.60 storage + £47.70 returns = £218.30', () => {
    const o = costOption(SUMMER, p('lovespace'))
    expect(o.storageGBP).toBe(170.6)
    expect(o.feeLines).toEqual([{ label: 'Return (6 × £7.95)', amountGBP: 47.7 }])
    expect(o.total).toBe(218.3)
    expect(o.rate).toBe('£42.65/month × 4')
    expect(o.perWeek).toBe(14.55)
  })
  it('The Box Co.: £168.08 + £89.70 returns = £257.78', () => {
    const o = costOption(SUMMER, p('theboxco'))
    expect(o.storageGBP).toBe(168.08)
    expect(o.total).toBe(257.78)
  })
  it('DUmove: £44 per box for the summer = £264, no early-retrieval fee', () => {
    const o = costOption(SUMMER, p('dumove'))
    expect(o.total).toBe(264)
    expect(o.feeLines).toEqual([])
    expect(o.rate).toBe('£264.00 for the summer')
  })
  it('Kit Keeper: £166 storage + collection, boxes, delivery, returns = £290.69', () => {
    const o = costOption(SUMMER, p('kitkeeper'))
    expect(o.storageGBP).toBe(166)
    expect(o.feeLines.map((f) => f.amountGBP)).toEqual([45, 25, 12.99, 41.7])
    expect(o.total).toBe(290.69)
  })
  it('Seven Seas: 15 weeks × £9.10 + £210.10 Durham charge = £346.60', () => {
    const o = costOption(SUMMER, p('seven-seas'))
    expect(o.rate).toBe('£9.10/week × 15')
    expect(o.total).toBe(346.6)
  })
  it('Payless 20ft container: 4 months × £140 = £560', () => expect(costOption(SUMMER, p('payless')).total).toBe(560))
  it('Yard 20ft container: 4 months × £159.99 = £639.96', () => expect(costOption(SUMMER, p('yard')).total).toBe(639.96))
  it('Student Storage Box has no published price → quote', () => {
    const o = costOption(SUMMER, p('ssb'))
    expect(o.total).toBeNull()
    expect(o.perWeek).toBeNull()
    expect(o.breakdown).toBe('Price on quote')
  })
  it('recommends LOVESPACE as best, then cheapest-first, quote-only last', () => {
    const r = recommendStorage(SUMMER, ALL)
    expect(r.best!.providerId).toBe('lovespace')
    expect(r.alternatives.map((o) => o.providerId)).toEqual(['theboxco', 'dumove', 'kitkeeper', 'seven-seas', 'payless', 'yard', 'ssb'])
  })
  it('total = storage + every fee line', () => {
    for (const pricing of ALL) {
      const o = costOption(SUMMER, pricing)
      if (o.total == null) continue
      const fees = o.feeLines.reduce((s, f) => s + f.amountGBP, 0)
      expect(o.total).toBeCloseTo(o.storageGBP! + fees, 9)
    }
  })
})

describe('provider rules', () => {
  it('DUmove does not cover more than 17 weeks', () => {
    const o = costOption(needs(1, 0, 0, 26), p('dumove'))
    expect(o.total).toBeNull()
    expect(o.breakdown).toBe('Only covers up to 17 weeks')
  })
  it('DUmove charges £35 early retrieval under 12 weeks', () => {
    const o = costOption(needs(1, 0, 0, 4), p('dumove'))
    expect(o.feeLines).toEqual([{ label: 'Early retrieval', amountGBP: 35 }])
    expect(o.total).toBe(79)
  })
  it('LOVESPACE uses the shortest plan that covers the period (1 month → 1-month plan)', () =>
    expect(costOption(needs(1, 0, 0, 4), p('lovespace')).storageGBP).toBe(9.65))
  it('LOVESPACE beyond 12 months falls back to the longest plan', () =>
    expect(costOption(needs(1, 0, 0, 60), p('lovespace')).storageGBP).toBe(14 * 3.25))
  it('a minimum charge replaces a smaller storage total and hides the rate', () => {
    const min: StoragePricing = { providerId: 'm', kind: 'box', perBox: { small: { amountGBP: 1, per: 'week' }, medium: null, large: null }, minimumChargeGBP: 84 }
    const o = costOption(needs(1, 0, 0, 4), min)
    expect(o.total).toBe(84)
    expect(o.rate).toBeNull()
    expect(o.breakdown).toContain('minimum £84.00 applies')
  })
  it('an unpublished size makes the provider quote-only', () => {
    const partial: StoragePricing = { providerId: 'x', kind: 'box', perBox: { small: { amountGBP: 1, per: 'week' }, medium: null, large: null } }
    expect(costOption(needs(0, 1, 0, 4), partial).breakdown).toBe('No published medium box price')
  })
  it('weeks below 1 are treated as 1', () => expect(costOption(needs(1, 0, 0, 0), p('seven-seas'))).toEqual(costOption(needs(1, 0, 0, 1), p('seven-seas'))))
  it('a self-storage unit costs the same whatever the box count', () =>
    expect(costOption(needs(1, 0, 0, 15), p('payless')).total).toBe(costOption(needs(9, 9, 9, 15), p('payless')).total))
})

describe('recommendStorage', () => {
  it('no boxes → no recommendation', () => expect(recommendStorage(needs(0, 0, 0, 15), ALL)).toEqual({ best: null, alternatives: [] }))
  it('only quote-only providers → best is null, all listed as alternatives', () => {
    const r = recommendStorage(SUMMER, [p('ssb')])
    expect(r.best).toBeNull()
    expect(r.alternatives).toHaveLength(1)
  })
  it('best is never more expensive than any priced alternative, for every preset duration and a range of loads', () => {
    for (const d of DURATIONS)
      for (const load of [needs(1, 0, 0, d.weeks), needs(2, 3, 1, d.weeks), needs(0, 0, 5, d.weeks), needs(4, 4, 4, d.weeks)]) {
        const r = recommendStorage(load, ALL)
        for (const alt of r.alternatives) if (alt.total != null) expect(r.best!.total!).toBeLessThanOrEqual(alt.total)
      }
  })
  it('every priced option is finite, positive, and rounded to pence', () => {
    for (const d of DURATIONS) {
      for (const o of ALL.map((pr) => costOption(needs(2, 3, 1, d.weeks), pr))) {
        if (o.total == null) continue
        expect(Number.isFinite(o.total)).toBe(true)
        expect(o.total).toBeGreaterThan(0)
        expect(Math.round(o.total * 100) / 100).toBe(o.total)
      }
    }
  })
  it('more boxes never make a box service cheaper', () => {
    for (const id of ['kitkeeper', 'lovespace', 'theboxco', 'dumove', 'seven-seas'])
      expect(costOption(needs(3, 3, 3, 15), p(id)).total!).toBeGreaterThanOrEqual(costOption(needs(1, 1, 1, 15), p(id)).total!)
  })
  it('preset durations are 1 month, summer (15 weeks), 6 months, 1 year', () => expect(DURATIONS.map((d) => d.weeks)).toEqual([4, 15, 26, 52]))
})
