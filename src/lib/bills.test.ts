import { describe, expect, it } from 'vitest'
import type { BillsSurvey } from './types'
import { DEFAULT_RATES, DEMO_SURVEY, areaFromPostcode, areasForPostcode, energyCostFor, estimateBills, householdScale } from './bills'

const line = (r: ReturnType<typeof estimateBills>, id: string) => r.lines.find((l) => l.id === id)
const total = (r: ReturnType<typeof estimateBills>) => r.lines.reduce((s, l) => s + (l.householdAnnualGBP ?? 0), 0)

describe('householdScale', () => {
  it('is 1.0 for a typical 2.4-person home and grows slower than headcount', () => {
    expect(householdScale(2.4)).toBeCloseTo(1, 6)
    expect(householdScale(5) / householdScale(1)).toBeLessThan(5)
    expect(householdScale(5)).toBeCloseTo(0.2 + (0.8 * 5) / 2.4, 6)
  })
})

describe('estimateBills: SPEC demo case', () => {
  const r = estimateBills(DEMO_SURVEY)

  it('produces deterministic line items', () => {
    const scale = 0.2 + (0.8 * 5) / 2.4
    const elec = 2500 * scale * 0.2546 + 365 * 0.6158
    const gas = 9500 * scale * (0.228 + 0.772 * 0.6) * 0.0792 + 365 * 0.2979
    const water = ((142 * 5 * 365) / 1000) * 3.229 + 184.91
    expect(line(r, 'electricity')!.householdAnnualGBP).toBeCloseTo(elec, 1)
    expect(line(r, 'gas')!.householdAnnualGBP).toBeCloseTo(gas, 1)
    expect(line(r, 'water')!.householdAnnualGBP).toBeCloseTo(water, 1)
    expect(line(r, 'broadband')!.householdAnnualGBP).toBe(372)
    expect(line(r, 'tv')).toBeUndefined()
  })

  it('lands in a plausible student range and pins the figure', () => {
    expect(r.separate.perWeek).toBeGreaterThan(14)
    expect(r.separate.perWeek).toBeLessThan(30)
    expect(r.separate.perWeek).toBeCloseTo(14.95, 2)
  })

  it('compares package vs separate over 51 weeks', () => {
    expect(r.package).toEqual({ perWeek: 25, perMonth: 108.33, tenancy: 1275 })
    expect(r.separate.tenancy).toBeCloseTo((total(r) / 52 / 5) * 51, 1)
    expect(r.differenceTenancy).toBeCloseTo(1275 - r.separate.tenancy, 1)
    expect(r.verdict).toBe('separate')
    expect(r.verdictText).toMatch(/cheaper per person over 51 weeks/)
    expect(r.assumptions.some((a) => /fair-use/.test(a))).toBe(true)
  })
})

describe('estimateBills: options', () => {
  const base: BillsSurvey = { ...DEMO_SURVEY }

  it('per-person maths: household ÷ people ÷ 52, month = week × 52/12', () => {
    const r = estimateBills(base)
    const pppw = total(r) / 52 / 5
    expect(r.separate.perWeek).toBeCloseTo(pppw, 2)
    expect(r.separate.perMonth).toBeCloseTo((pppw * 52) / 12, 1)
  })

  it('honours a custom tenancy length', () => {
    const r = estimateBills({ ...base, tenancyWeeks: 44 })
    expect(r.package!.tenancy).toBe(25 * 44)
    expect(r.verdictText).toMatch(/44 weeks/)
  })

  it('no package ⇒ estimate only', () => {
    const r = estimateBills({ ...base, packagePppw: null })
    expect(r.package).toBeNull()
    expect(r.differenceTenancy).toBeNull()
    expect(r.verdict).toBe('noPackage')
  })

  it('no gas ⇒ one electricity bill, more expensive overall', () => {
    const withGas = estimateBills(base)
    const noGas = estimateBills({ ...base, hasGas: false })
    expect(line(noGas, 'gas')).toBeUndefined()
    expect(noGas.lines.filter((l) => l.id === 'electricity')).toHaveLength(1)
    expect(total(noGas)).toBeGreaterThan(total(withGas))
  })

  it('heating pattern orders gas cost: allDay > nights > coldMonths', () => {
    const g = (h: BillsSurvey['heating']) => line(estimateBills({ ...base, heating: h }), 'gas')!.householdAnnualGBP!
    expect(g('allDay')).toBeGreaterThan(g('nights'))
    expect(g('nights')).toBeGreaterThan(g('coldMonths'))
  })

  it('water tiers and TV licence', () => {
    const w = (x: BillsSurvey['water']) => line(estimateBills({ ...base, water: x }), 'water')!.householdAnnualGBP!
    expect(w('high')).toBeGreaterThan(w('normal'))
    expect(w('normal')).toBeGreaterThan(w('low'))
    expect(line(estimateBills({ ...base, tvLicence: true }), 'tv')!.householdAnnualGBP).toBe(180)
    expect(line(estimateBills({ ...base, wifi: false }), 'broadband')).toBeUndefined()
  })

  it('verdict thresholds: similar within £1/week, package when cheaper', () => {
    const sep = estimateBills(base).separate.perWeek
    expect(estimateBills({ ...base, packagePppw: sep + 0.5 }).verdict).toBe('similar')
    expect(estimateBills({ ...base, packagePppw: sep - 0.5 }).verdict).toBe('similar')
    expect(estimateBills({ ...base, packagePppw: sep + 1.5 }).verdict).toBe('separate')
    const cheap = estimateBills({ ...base, packagePppw: sep - 3 })
    expect(cheap.verdict).toBe('package')
    expect(cheap.differenceTenancy!).toBeLessThan(0)
  })

  it('null rate ⇒ line unavailable and excluded from totals', () => {
    const r = estimateBills(base, { ...DEFAULT_RATES, waterPerM3: null })
    expect(line(r, 'water')!.householdAnnualGBP).toBeNull()
    expect(r.assumptions.some((a) => /Unavailable/.test(a))).toBe(true)
    expect(r.separate.perWeek).toBeLessThan(estimateBills(base).separate.perWeek)
  })
})

describe('postcode → area', () => {
  it('resolves unique sectors and flags ambiguity', () => {
    expect(areaFromPostcode('dh1 4ab')).toBe('viaduct')
    expect(areaFromPostcode('DH14')).toBe('viaduct')
    expect(areaFromPostcode('DH7 8XX')).toBe('langleyMoor')
    expect(areaFromPostcode('DH1 2')).toBe('gilesgate')
    expect(areaFromPostcode('DH1 1AA')).toBeNull()
    expect(areasForPostcode('DH1 1AA')).toEqual(['gilesgate', 'cityCentre'])
    expect(areaFromPostcode('SW1A 1AA')).toBeNull()
    expect(areaFromPostcode('DH')).toBeNull()
  })
})

describe('energyCostFor', () => {
  const cap = { elecUnit: 0.2546, elecStanding: 0.6158, gasUnit: 0.0792, gasStanding: 0.2979 }

  it('matches the electricity + gas lines of estimateBills at cap rates', () => {
    const r = estimateBills(DEMO_SURVEY)
    const energyLines = r.lines.filter((l) => l.id === 'electricity' || l.id === 'gas')
    const fromLines = energyLines.reduce((s, l) => s + (l.householdAnnualGBP ?? 0), 0)
    expect(energyCostFor(DEMO_SURVEY, cap).householdAnnual).toBeCloseTo(fromLines, 0)
  })

  it('ignores gas rates for an all-electric house', () => {
    const s = { ...DEMO_SURVEY, hasGas: false }
    expect(energyCostFor(s, cap).householdAnnual).toBe(energyCostFor(s, { ...cap, gasUnit: 9, gasStanding: 9 }).householdAnnual)
  })

  it('a pricier tariff costs more', () => {
    expect(energyCostFor(DEMO_SURVEY, { ...cap, elecUnit: 0.2976 }).perPersonWeek).toBeGreaterThan(energyCostFor(DEMO_SURVEY, cap).perPersonWeek)
  })
})
