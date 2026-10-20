// Frozen QA suite for the Bills estimator (SPEC §3 "Bills — the MAIN demo", §8 acceptance).
// Expected values were re-derived independently from src/data/rates.ts (Ofgem NE cap, NWL 2026/27, TV licence, broadband fallback).
import { describe, expect, it } from 'vitest'
import {
  DEFAULT_RATES,
  DEFAULT_TENANCY_WEEKS,
  DEMO_SURVEY,
  areaFromPostcode,
  areasForPostcode,
  electricityKwh,
  energyCostFor,
  energyKwh,
  estimateBills,
  gasKwh,
  householdScale,
  moneyFromPppw,
  postcodePrefix,
  waterM3,
} from './bills'
import type { AreaId, BillsSurvey, HeatingPattern, WaterUse } from './types'
import { AREAS } from './types'

const AREA_IDS: AreaId[] = ['gilesgate', 'viaduct', 'cityCentre', 'langleyMoor']
const HEATING: HeatingPattern[] = ['allDay', 'nights', 'coldMonths']
const WATER: WaterUse[] = ['low', 'normal', 'high']

/** The launch-video golden case: Gilesgate, 4 people, low water, warm all day, gas, Wi-Fi, £25 pppw package, 51 weeks. */
const GOLDEN: BillsSurvey = {
  packagePppw: 25,
  area: 'gilesgate',
  people: 4,
  water: 'low',
  heating: 'allDay',
  hasGas: true,
  wifi: true,
  tvLicence: false,
  tenancyWeeks: 51,
}
const survey = (over: Partial<BillsSurvey> = {}): BillsSurvey => ({ ...GOLDEN, ...over })
const line = (s: BillsSurvey, id: string) => estimateBills(s).lines.find((l) => l.id === id)

describe('golden case: "You save £342"', () => {
  const r = estimateBills(GOLDEN)
  it('electricity line = £1,200.73/yr', () => expect(line(GOLDEN, 'electricity')!.householdAnnualGBP).toBe(1200.73))
  it('gas line = £1,529.61/yr', () => expect(line(GOLDEN, 'gas')!.householdAnnualGBP).toBe(1529.61))
  it('water line = £703.49/yr', () => expect(line(GOLDEN, 'water')!.householdAnnualGBP).toBe(703.49))
  it('Wi-Fi line = £372/yr', () => expect(line(GOLDEN, 'broadband')!.householdAnnualGBP).toBe(372))
  it('lines are electricity, gas, water, broadband in that order', () =>
    expect(r.lines.map((l) => l.id)).toEqual(['electricity', 'gas', 'water', 'broadband']))
  it('separate per person: £18.30/wk, £79.29/month, £933.16 over 51 weeks', () =>
    expect(r.separate).toEqual({ perWeek: 18.3, perMonth: 79.29, tenancy: 933.16 }))
  it('package per person: £25/wk, £108.33/month, £1,275 over 51 weeks', () =>
    expect(r.package).toEqual({ perWeek: 25, perMonth: 108.33, tenancy: 1275 }))
  it('difference over the tenancy is £341.84', () => expect(r.differenceTenancy).toBe(341.84))
  it('verdict is "separate"', () => expect(r.verdict).toBe('separate'))
  it('verdict text rounds to whole pounds: £342', () =>
    expect(r.verdictText).toBe('You save £342 by doing it yourself (over 51 weeks).'))
  it('every line carries an https source', () => r.lines.forEach((l) => expect(l.source).toMatch(/^https:\/\//)))
})

describe('demo survey (5 people, normal water, nights)', () => {
  const r = estimateBills(DEMO_SURVEY)
  it('DEMO_SURVEY is a 51-week Gilesgate survey with a £25 package', () => {
    expect(DEMO_SURVEY.tenancyWeeks).toBe(51)
    expect(DEMO_SURVEY.packagePppw).toBe(25)
    expect(DEMO_SURVEY.area).toBe('gilesgate')
  })
  it('line totals match the published rates', () =>
    expect(r.lines.map((l) => l.householdAnnualGBP)).toEqual([1412.9, 1079.51, 1021.71, 372]))
  it('separate = £14.95/wk, £762.28 tenancy', () => expect(r.separate).toEqual({ perWeek: 14.95, perMonth: 64.77, tenancy: 762.28 }))
  it('saves £512.72 by doing it yourself', () => {
    expect(r.differenceTenancy).toBe(512.72)
    expect(r.verdictText).toBe('You save £513 by doing it yourself (over 51 weeks).')
  })
})

describe('householdScale', () => {
  it('is exactly 1 for Ofgem’s typical 2.4-person home', () => expect(householdScale(2.4)).toBeCloseTo(1, 12))
  it('follows 0.2 + 0.8 × people ÷ 2.4 for 1–8 people', () => {
    for (let p = 1; p <= 8; p++) expect(householdScale(p)).toBeCloseTo(0.2 + (0.8 * p) / 2.4, 12)
  })
  it('grows slower than headcount (sub-linear per person)', () => {
    for (let p = 2; p <= 8; p++) expect(householdScale(p) / p).toBeLessThan(householdScale(p - 1) / (p - 1))
  })
  it('is strictly increasing', () => {
    for (let p = 2; p <= 8; p++) expect(householdScale(p)).toBeGreaterThan(householdScale(p - 1))
  })
})

describe('consumption models', () => {
  it('electricityKwh(2.4) = Ofgem medium 2,500 kWh', () => expect(electricityKwh(2.4)).toBeCloseTo(2500, 9))
  it('electricityKwh(4) = 3,833.33 kWh', () => expect(electricityKwh(4)).toBeCloseTo(3833.333, 2))
  it('gasKwh at 2.4 people, nights = 9,500 × (0.228 + 0.772 × 0.6)', () =>
    expect(gasKwh(2.4, 'nights')).toBeCloseTo(9500 * (0.228 + 0.772 * 0.6), 6))
  it('gasKwh orders allDay > nights > coldMonths for every household size', () => {
    for (let p = 1; p <= 8; p++) {
      expect(gasKwh(p, 'allDay')).toBeGreaterThan(gasKwh(p, 'nights'))
      expect(gasKwh(p, 'nights')).toBeGreaterThan(gasKwh(p, 'coldMonths'))
    }
  })
  it('the non-heating 22.8% of gas never depends on the heating pattern', () => {
    // coldMonths floor: 0.228 + 0.772 × 0.35 > 0.228
    expect(gasKwh(1, 'coldMonths')).toBeGreaterThan(9500 * householdScale(1) * 0.228)
  })
  it('waterM3 = litres × people × 365 ÷ 1000', () => {
    expect(waterM3(1, 'normal')).toBeCloseTo(51.83, 9)
    expect(waterM3(4, 'low')).toBeCloseTo(160.6, 9)
    expect(waterM3(3, 'high')).toBeCloseTo(197.1, 9)
  })
  it('water bands are ordered low < normal < high', () => {
    expect(waterM3(2, 'low')).toBeLessThan(waterM3(2, 'normal'))
    expect(waterM3(2, 'normal')).toBeLessThan(waterM3(2, 'high'))
  })
})

describe('moneyFromPppw', () => {
  it('perMonth uses a 52-week year (× 52 ÷ 12)', () => expect(moneyFromPppw(12, 51).perMonth).toBe(52))
  it('tenancy = weekly × tenancy weeks', () => expect(moneyFromPppw(20, 44).tenancy).toBe(880))
  it('rounds every field to pence', () => expect(moneyFromPppw(10 / 3, 51)).toEqual({ perWeek: 3.33, perMonth: 14.44, tenancy: 170 }))
  it('zero stays zero', () => expect(moneyFromPppw(0, 51)).toEqual({ perWeek: 0, perMonth: 0, tenancy: 0 }))
})

describe('estimateBills: lines and toggles', () => {
  it('no gas: one "Electricity (incl. heating)" line and no gas line', () => {
    const r = estimateBills(survey({ hasGas: false }))
    expect(r.lines.map((l) => l.id)).toEqual(['electricity', 'water', 'broadband'])
    expect(r.lines[0].label).toBe('Electricity (incl. heating)')
  })
  it('no gas: electricity covers appliances + gas-equivalent × 90% boiler efficiency', () => {
    const s = survey({ hasGas: false, people: 4, heating: 'nights', wifi: false, tvLicence: true, packagePppw: null, water: 'normal' })
    const r = estimateBills(s)
    expect(r.lines.map((l) => l.householdAnnualGBP)).toEqual([3507.83, 854.35, 180])
    expect(r.separate).toEqual({ perWeek: 21.84, perMonth: 94.63, tenancy: 1113.71 })
  })
  it('energyKwh puts all heating on electricity when there is no gas', () => {
    const k = energyKwh(survey({ hasGas: false }))
    expect(k.gas).toBe(0)
    expect(k.elec).toBeCloseTo(electricityKwh(4) + gasKwh(4, 'allDay') * 0.9, 9)
  })
  it('Wi-Fi off removes the broadband line', () => expect(line(survey({ wifi: false }), 'broadband')).toBeUndefined())
  it('TV licence on adds one £180 licence for the whole house', () => expect(line(survey({ tvLicence: true }), 'tv')!.householdAnnualGBP).toBe(180))
  it('TV licence is per house, not per person', () => {
    const a = line(survey({ tvLicence: true, people: 2 }), 'tv')!.householdAnnualGBP
    const b = line(survey({ tvLicence: true, people: 7 }), 'tv')!.householdAnnualGBP
    expect(a).toBe(b)
  })
  it('TV licence adds exactly £180 ÷ 52 ÷ people per week (before rounding)', () => {
    const a = estimateBills(survey({ tvLicence: false, packagePppw: null }))
    const b = estimateBills(survey({ tvLicence: true, packagePppw: null }))
    expect(b.separate.perWeek - a.separate.perWeek).toBeCloseTo(180 / 52 / 4, 1)
  })
  it('broadband is £31 × 12 for the whole house regardless of size', () => {
    for (const p of [1, 3, 6]) expect(line(survey({ people: p }), 'broadband')!.householdAnnualGBP).toBe(372)
  })
  it('single person, cold months only, no Wi-Fi: £23.56/wk', () => {
    const r = estimateBills(survey({ people: 1, heating: 'coldMonths', water: 'normal', wifi: false, packagePppw: null }))
    expect(r.lines.map((l) => l.householdAnnualGBP)).toEqual([564.23, 308.65, 352.27])
    expect(r.separate.perWeek).toBe(23.56)
  })
  it('assumption strings quote the rates used', () => {
    const r = estimateBills(GOLDEN)
    expect(r.lines[0].assumption).toContain('25.46p/kWh')
    expect(r.lines[1].assumption).toContain('7.92p/kWh')
    expect(r.lines[2].assumption).toContain('£3.23/m³')
  })
  it('gas assumption names the heating pattern', () => expect(line(GOLDEN, 'gas')!.assumption).toContain('all day in winter'))
})

describe('estimateBills: per person and tenancy (SPEC §8)', () => {
  it('per person = household ÷ people (weekly, 52-week year)', () => {
    for (let p = 1; p <= 8; p++) {
      const r = estimateBills(survey({ people: p, packagePppw: null }))
      const household = r.lines.reduce((s, l) => s + (l.householdAnnualGBP ?? 0), 0)
      expect(r.separate.perWeek).toBe(Math.round((household / 52 / p) * 100) / 100)
    }
  })
  it('package and DIY are both costed over the same tenancy weeks', () => {
    for (const weeks of [40, 44, 48, 51, 52]) {
      const r = estimateBills(survey({ tenancyWeeks: weeks }))
      expect(r.package!.tenancy).toBe(25 * weeks)
      expect(r.verdictText).toContain(`over ${weeks} weeks`)
    }
  })
  it('separate per-person weekly cost falls as housemates are added (1→8)', () => {
    const weekly = [1, 2, 3, 4, 5, 6, 7, 8].map((p) => estimateBills(survey({ people: p, water: 'normal', heating: 'nights' })).separate.perWeek)
    expect(weekly).toEqual([32.2, 21.42, 17.82, 16.03, 14.95, 14.23, 13.71, 13.33])
  })
  it('household cost rises as housemates are added', () => {
    let prev = 0
    for (let p = 1; p <= 8; p++) {
      const r = estimateBills(survey({ people: p }))
      const hh = r.lines.reduce((s, l) => s + (l.householdAnnualGBP ?? 0), 0)
      expect(hh).toBeGreaterThan(prev)
      prev = hh
    }
  })
  it('people is rounded to a whole person (3.6 → 4)', () => expect(estimateBills(survey({ people: 3.6 }))).toEqual(estimateBills(survey({ people: 4 }))))
  it('people below 1 is treated as 1', () => {
    expect(estimateBills(survey({ people: 0 }))).toEqual(estimateBills(survey({ people: 1 })))
    expect(estimateBills(survey({ people: -3 }))).toEqual(estimateBills(survey({ people: 1 })))
  })
  it('tenancy weeks ≤ 0 fall back to the 51-week Durham default', () => {
    expect(DEFAULT_TENANCY_WEEKS).toBe(51)
    expect(estimateBills(survey({ tenancyWeeks: 0 }))).toEqual(estimateBills(survey({ tenancyWeeks: 51 })))
    expect(estimateBills(survey({ tenancyWeeks: -5 }))).toEqual(estimateBills(survey({ tenancyWeeks: 51 })))
  })
  it('separate.tenancy = separate weekly × weeks (within a penny of rounding)', () => {
    const r = estimateBills(survey({ tenancyWeeks: 44 }))
    expect(Math.abs(r.separate.tenancy - r.separate.perWeek * 44)).toBeLessThanOrEqual(44 * 0.005 + 0.005 + 1e-9)
  })
  it('differenceTenancy = package.tenancy − separate.tenancy exactly', () => {
    for (const pppw of [5, 15, 18.3, 25, 40]) {
      const r = estimateBills(survey({ packagePppw: pppw }))
      expect(r.differenceTenancy).toBe(Math.round((r.package!.tenancy - r.separate.tenancy) * 100) / 100)
    }
  })
})

describe('estimateBills: verdicts', () => {
  it('no package → "noPackage" with a weekly estimate', () => {
    const r = estimateBills(survey({ packagePppw: null }))
    expect(r.verdict).toBe('noPackage')
    expect(r.package).toBeNull()
    expect(r.differenceTenancy).toBeNull()
    expect(r.verdictText).toBe('About £18.30 a week each if you do it yourself.')
  })
  it('negative package price is treated as no package', () => expect(estimateBills(survey({ packagePppw: -1 })).verdict).toBe('noPackage'))
  it('a £0 package is a real package and wins', () => {
    const r = estimateBills(survey({ packagePppw: 0 }))
    expect(r.verdict).toBe('package')
    expect(r.verdictText).toBe('The package saves you £933 (over 51 weeks).')
  })
  it('cheap package → "package", saving phrased positively', () => {
    const r = estimateBills(survey({ packagePppw: 10 }))
    expect(r.verdict).toBe('package')
    expect(r.differenceTenancy).toBe(-423.16)
    expect(r.verdictText).toBe('The package saves you £423 (over 51 weeks).')
  })
  it('within £1/wk either way → "similar"', () => {
    expect(estimateBills(survey({ packagePppw: 18.3 })).verdict).toBe('similar')
    expect(estimateBills(survey({ packagePppw: 19.2 })).verdict).toBe('similar')
    expect(estimateBills(survey({ packagePppw: 17.4 })).verdict).toBe('similar')
    expect(estimateBills(survey({ packagePppw: 18.3 })).verdictText).toBe('About the same either way.')
  })
  it('just over £1/wk dearer → "separate"', () => expect(estimateBills(survey({ packagePppw: 19.4 })).verdict).toBe('separate'))
  it('just over £1/wk cheaper → "package"', () => expect(estimateBills(survey({ packagePppw: 17.2 })).verdict).toBe('package'))
  it('amounts under £100 keep pence in the verdict', () => {
    const r = estimateBills(survey({ packagePppw: 20 }))
    expect(r.verdictText).toBe('You save £86.84 by doing it yourself (over 51 weeks).')
  })
  it('amounts ≥ £1,000 use a thousands separator', () => {
    const r = estimateBills(survey({ packagePppw: 45 }))
    expect(r.verdictText).toBe('You save £1,362 by doing it yourself (over 51 weeks).')
  })
  it('verdict sign matches differenceTenancy for every package price £0–£50', () => {
    for (let pppw = 0; pppw <= 50; pppw += 0.5) {
      const r = estimateBills(survey({ packagePppw: pppw }))
      if (r.verdict === 'separate') expect(r.differenceTenancy!).toBeGreaterThan(0)
      if (r.verdict === 'package') expect(r.differenceTenancy!).toBeLessThan(0)
    }
  })
})

describe('estimateBills: unavailable prices (SPEC: unverified = "unavailable")', () => {
  it('null electricity unit rate → electricity line unavailable, not £0', () => {
    const r = estimateBills(GOLDEN, { ...DEFAULT_RATES, elecUnit: null })
    expect(r.lines.find((l) => l.id === 'electricity')!.householdAnnualGBP).toBeNull()
  })
  it('null gas standing charge → gas line unavailable', () =>
    expect(estimateBills(GOLDEN, { ...DEFAULT_RATES, gasStanding: null }).lines.find((l) => l.id === 'gas')!.householdAnnualGBP).toBeNull())
  it('null water fixed charge → water line unavailable', () =>
    expect(estimateBills(GOLDEN, { ...DEFAULT_RATES, waterFixed: null }).lines.find((l) => l.id === 'water')!.householdAnnualGBP).toBeNull())
  it('null broadband → Wi-Fi line unavailable', () =>
    expect(estimateBills(GOLDEN, { ...DEFAULT_RATES, broadbandMonthly: null }).lines.find((l) => l.id === 'broadband')!.householdAnnualGBP).toBeNull())
  it('null TV licence → TV line unavailable', () =>
    expect(estimateBills(survey({ tvLicence: true }), { ...DEFAULT_RATES, tvAnnual: null }).lines.find((l) => l.id === 'tv')!.householdAnnualGBP).toBeNull())
  it('unavailable lines are excluded from the totals', () => {
    const r = estimateBills(GOLDEN, { ...DEFAULT_RATES, broadbandMonthly: null })
    expect(r.separate.perWeek).toBe(Math.round(((1200.73 + 1529.61 + 703.49) / 52 / 4) * 100) / 100)
  })
  it('unavailable lines are named in the assumptions', () => {
    const r = estimateBills(GOLDEN, { ...DEFAULT_RATES, waterPerM3: null })
    expect(r.assumptions).toContain('Unavailable (not counted in totals): Water.')
  })
  it('no "Unavailable" note when every price is verified', () =>
    expect(estimateBills(GOLDEN).assumptions.some((a) => a.startsWith('Unavailable'))).toBe(false))
  it('DEFAULT_RATES has every price verified', () => Object.values(DEFAULT_RATES).forEach((v) => expect(typeof v).toBe('number')))
})

describe('estimateBills: assumptions', () => {
  it('says "1 person" for one tenant and "N people" otherwise', () => {
    expect(estimateBills(survey({ people: 1 })).assumptions[1]).toContain('for 1 person')
    expect(estimateBills(survey({ people: 4 })).assumptions[1]).toContain('for 4 people')
  })
  it('quotes the household scale to 2 d.p.', () => expect(estimateBills(survey({ people: 4 })).assumptions[1]).toContain('1.53×'))
  it('mentions the weeks used for the tenancy', () =>
    expect(estimateBills(survey({ tenancyWeeks: 44 })).assumptions.join(' ')).toContain('× 44 weeks'))
  it('explains no-gas conversion when there is no gas', () =>
    expect(estimateBills(survey({ hasGas: false })).assumptions[2]).toContain('90% boiler efficiency'))
  it('adds the TV licence caveat only when the licence is included', () => {
    const tv = 'A TV licence is only needed if anyone watches live TV or BBC iPlayer.'
    expect(estimateBills(survey({ tvLicence: true })).assumptions).toContain(tv)
    expect(estimateBills(survey({ tvLicence: false })).assumptions).not.toContain(tv)
  })
  it('always ends with the fair-use warning', () => {
    const a = estimateBills(GOLDEN).assumptions
    expect(a[a.length - 1]).toContain('fair-use cap')
  })
})

describe('estimateBills: full grid invariants (area × heating × water × gas × people 1–8)', () => {
  const grid: BillsSurvey[] = []
  for (const area of AREA_IDS)
    for (const heating of HEATING)
      for (const water of WATER)
        for (const hasGas of [true, false])
          for (let people = 1; people <= 8; people++) grid.push(survey({ area, heating, water, hasGas, people }))

  it('covers 4 × 3 × 3 × 2 × 8 = 576 surveys', () => expect(grid.length).toBe(576))
  it('never produces NaN, Infinity or negative money', () => {
    for (const s of grid) {
      const r = estimateBills(s)
      for (const v of [...Object.values(r.separate), ...Object.values(r.package!), r.differenceTenancy!]) expect(Number.isFinite(v)).toBe(true)
      for (const v of Object.values(r.separate)) expect(v).toBeGreaterThan(0)
      for (const l of r.lines) expect(l.householdAnnualGBP!).toBeGreaterThan(0)
    }
  })
  it('every money field is rounded to whole pence', () => {
    for (const s of grid) {
      const r = estimateBills(s)
      for (const v of [...Object.values(r.separate), r.differenceTenancy!]) expect(Math.round(v * 100) / 100).toBe(v)
    }
  })
  it('the area does not change the price (regional rates are North East-wide)', () => {
    for (const s of grid.filter((g) => g.area === 'gilesgate'))
      for (const area of AREA_IDS) expect(estimateBills({ ...s, area }).separate).toEqual(estimateBills(s).separate)
  })
  it('heating pattern ordering holds: allDay ≥ nights ≥ coldMonths', () => {
    for (const s of grid.filter((g) => g.heating === 'allDay')) {
      const a = estimateBills(s).separate.perWeek
      const n = estimateBills({ ...s, heating: 'nights' }).separate.perWeek
      const c = estimateBills({ ...s, heating: 'coldMonths' }).separate.perWeek
      expect(a).toBeGreaterThanOrEqual(n)
      expect(n).toBeGreaterThanOrEqual(c)
    }
  })
  it('water ordering holds: high ≥ normal ≥ low', () => {
    for (const s of grid.filter((g) => g.water === 'low')) {
      const l = estimateBills(s).separate.perWeek
      expect(estimateBills({ ...s, water: 'normal' }).separate.perWeek).toBeGreaterThanOrEqual(l)
      expect(estimateBills({ ...s, water: 'high' }).separate.perWeek).toBeGreaterThanOrEqual(estimateBills({ ...s, water: 'normal' }).separate.perWeek)
    }
  })
  it('per-person weekly cost is non-increasing with more housemates', () => {
    for (const s of grid.filter((g) => g.people === 1)) {
      let prev = Infinity
      for (let p = 1; p <= 8; p++) {
        const w = estimateBills({ ...s, people: p }).separate.perWeek
        expect(w).toBeLessThanOrEqual(prev)
        prev = w
      }
    }
  })
  it('is deterministic (same input → deep-equal output)', () => {
    for (const s of grid.slice(0, 50)) expect(estimateBills(s)).toEqual(estimateBills(s))
  })
  it('does not mutate the survey or the rates', () => {
    const s = survey()
    const copy = JSON.parse(JSON.stringify(s))
    const ratesCopy = { ...DEFAULT_RATES }
    estimateBills(s)
    expect(s).toEqual(copy)
    expect(DEFAULT_RATES).toEqual(ratesCopy)
  })
})

describe('energyCostFor (tariff comparison)', () => {
  const cap = { elecUnit: 0.2546, elecStanding: 0.6158, gasUnit: 0.0792, gasStanding: 0.2979 }
  it('on the price cap equals the electricity + gas lines of estimateBills', () => {
    const r = energyCostFor(GOLDEN, cap)
    expect(r.householdAnnual).toBeCloseTo(1200.73 + 1529.61, 1)
  })
  it('per person per week = household ÷ 52 ÷ people', () => {
    const r = energyCostFor(GOLDEN, cap)
    expect(r.perPersonWeek).toBe(Math.round((r.householdAnnual / 52 / 4) * 100) / 100)
  })
  it('ignores gas rates for an all-electric house', () => {
    const s = survey({ hasGas: false })
    expect(energyCostFor(s, cap)).toEqual(energyCostFor(s, { ...cap, gasUnit: 99, gasStanding: 99 }))
  })
  it('a cheaper unit rate always gives a lower cost', () =>
    expect(energyCostFor(GOLDEN, { ...cap, elecUnit: 0.2 }).householdAnnual).toBeLessThan(energyCostFor(GOLDEN, cap).householdAnnual))
  it('standing charges count 365 days', () =>
    expect(energyCostFor(GOLDEN, { ...cap, elecStanding: 1 }).householdAnnual - energyCostFor(GOLDEN, { ...cap, elecStanding: 0 }).householdAnnual).toBeCloseTo(365, 6))
})

describe('postcodes', () => {
  it('normalises case and spaces: "dh1 4ab" → "DH1 4"', () => expect(postcodePrefix('dh1 4ab')).toBe('DH1 4'))
  it('accepts a partial postcode "DH14"', () => expect(postcodePrefix('DH14')).toBe('DH1 4'))
  it('handles a full postcode with no space "DH78XD"', () => expect(postcodePrefix('DH78XD')).toBe('DH7 8'))
  it('returns null for input that is too short', () => {
    expect(postcodePrefix('DH1')).toBeNull()
    expect(postcodePrefix('')).toBeNull()
  })
  it('returns null when the sector is not a digit', () => expect(postcodePrefix('DH1X')).toBeNull())
  it('Viaduct (DH1 4) is unambiguous', () => expect(areaFromPostcode('DH1 4HP')).toBe('viaduct'))
  it('Langley Moor (DH7 8) is unambiguous', () => expect(areaFromPostcode('DH7 8XD')).toBe('langleyMoor'))
  it('DH1 1 matches Gilesgate and City Centre, so it is ambiguous', () => {
    expect(areasForPostcode('DH1 1AA').sort()).toEqual(['cityCentre', 'gilesgate'])
    expect(areaFromPostcode('DH1 1AA')).toBeNull()
  })
  it('DH1 2 is Gilesgate', () => expect(areaFromPostcode('DH1 2AB')).toBe('gilesgate'))
  it('a non-Durham postcode matches nothing', () => {
    expect(areasForPostcode('NE1 4ST')).toEqual([])
    expect(areaFromPostcode('SW1A 1AA')).toBeNull()
  })
  it('every area has at least one valid DHn n postcode sector', () => {
    for (const a of AREAS) {
      expect(a.postcodes.length).toBeGreaterThan(0)
      for (const p of a.postcodes) expect(p).toMatch(/^DH\d \d$/)
    }
  })
  it('AREAS lists exactly the four AreaIds, each once', () => expect(AREAS.map((a) => a.id).sort()).toEqual([...AREA_IDS].sort()))
})
