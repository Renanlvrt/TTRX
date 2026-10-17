import { describe, expect, it } from 'vitest'
import { recommendStorage, costOption } from './storage'
import { STORAGE_LISTINGS } from '../data/storagePricing'

// Cross-check the data against the research worked totals (1 small + 1 medium + 1 large, Durham DH1).
const p = (id: string) => STORAGE_LISTINGS.find((l) => l.id === id)!.pricing
const one = (weeks: number) => ({ boxes: { small: 1, medium: 1, large: 1 }, weeks })

describe('storage data matches research', () => {
  it('Kit Keeper 1 month = £113.34', () => expect(costOption(one(4), p('kitkeeper')).total).toBeCloseTo(113.34, 2))
  it('LOVESPACE 1 month = £67.10, summer = £119.45', () => {
    expect(costOption(one(4), p('lovespace')).total).toBeCloseTo(67.1, 2)
    expect(costOption(one(15), p('lovespace')).total).toBeCloseTo(119.45, 2)
  })
  it('Box Co 1 month = £89.35', () => expect(costOption(one(4), p('theboxco')).total).toBeCloseTo(89.35, 2))
  it('Seven Seas 4 weeks = £230.90', () => expect(costOption(one(4), p('seven-seas')).total).toBeCloseTo(230.9, 2))
  it('DUmove summer = £132, 1 month adds early retrieval', () => {
    expect(costOption(one(15), p('dumove')).total).toBe(132)
    expect(costOption(one(4), p('dumove')).total).toBe(167)
  })
  it('best for 1/1/1 for a month is LOVESPACE', () => {
    expect(recommendStorage(one(4), STORAGE_LISTINGS.map((l) => l.pricing)).best?.providerId).toBe('lovespace')
  })
})
