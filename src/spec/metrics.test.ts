// Frozen suite for SPEC.md §8 acceptance criteria and CLAUDE.md architecture rules.
import { describe, expect, it, vi } from 'vitest'
// The store clears IndexedDB on load; node has none.
vi.mock('idb-keyval', () => ({ get: vi.fn(), set: vi.fn(), del: vi.fn(), clear: () => Promise.resolve() }))

import { estimateBills, DEMO_SURVEY } from '../lib/bills'
import { buildMoveInEmail, mailtoLink } from '../lib/email'
import { compareInspections, summarize } from '../lib/inspection'
import { CHECKLIST } from '../data/checklist'
import { demoHouseMoveIn, demoHouseMoveOut } from '../data/demoHouse'
import { initialState } from '../lib/store'
import { CLEANERS, STORAGE } from '../data/services'
import { STORAGE_LISTINGS } from '../data/storagePricing'

const libSources = import.meta.glob(['/src/lib/**/*.ts', '!/src/lib/**/*.test.ts'], { query: '?raw', import: 'default', eager: true }) as Record<string, string>
const allSources = import.meta.glob(['/src/**/*.{ts,tsx}', '!/src/**/*.test.ts'], { query: '?raw', import: 'default', eager: true }) as Record<string, string>
const importsOf = (src: string) => [...src.matchAll(/^\s*import\s[^'"]*['"]([^'"]+)['"]/gm)].map((m) => m[1])

describe('§8: src/lib has no UI imports', () => {
  // store.ts owns state (CLAUDE.md: "state in src/lib/store.ts") and may use React's useSyncExternalStore.
  const pure = Object.entries(libSources).filter(([path]) => !path.endsWith('/store.ts'))
  it('found the logic files', () => expect(pure.length).toBeGreaterThanOrEqual(6))
  it('no logic file imports react, react-dom, lucide or router', () => {
    for (const [path, src] of pure)
      for (const spec of importsOf(src)) expect(`${path} → ${spec}`).not.toMatch(/→ (react|react-dom|react-router-dom|lucide-react)(\/|$)/)
  })
  it('no logic file imports from pages or components', () => {
    for (const [path, src] of Object.entries(libSources))
      for (const spec of importsOf(src)) expect(`${path} → ${spec}`).not.toMatch(/(pages|components)\//)
  })
  it('no logic file touches the DOM directly (except store photo helpers)', () => {
    for (const [path, src] of pure) expect(`${path}:${/\b(document|window)\./.test(src)}`).toBe(`${path}:false`)
  })
})

describe('§8: Bills', () => {
  it('works with a package', () => expect(estimateBills(DEMO_SURVEY).package).not.toBeNull())
  it('works without a package', () => expect(estimateBills({ ...DEMO_SURVEY, packagePppw: null }).verdict).toBe('noPackage'))
  it('both options are compared over the same 51 weeks', () => {
    const r = estimateBills(DEMO_SURVEY)
    expect(r.package!.tenancy).toBe(r.package!.perWeek * 51)
    expect(r.verdictText).toContain('51 weeks')
  })
})

describe('§8: before/after report', () => {
  it('the live oven upload produces a NEW ISSUE flag on that item', () => {
    const out = demoHouseMoveOut()
    out.records['kitchen-oven'] = { itemId: 'kitchen-oven', condition: 'damaged', note: '', photoId: 'photo_x', recordedAt: null }
    const row = compareInspections(CHECKLIST, demoHouseMoveIn(), out).find((r) => r.item.id === 'kitchen-oven')!
    expect(row.flag).toBe('newIssue')
  })
  it('summary counts equal the per-row flags', () => {
    const rows = compareInspections(CHECKLIST, demoHouseMoveIn(), demoHouseMoveOut())
    const s = summarize(rows)
    for (const flag of Object.keys(s) as (keyof typeof s)[]) expect(s[flag]).toBe(rows.filter((r) => r.flag === flag).length)
  })
})

describe('§8: email', () => {
  it('produces editable plain text (subject + body strings)', () => {
    const e = buildMoveInEmail(initialState().property, demoHouseMoveIn(), CHECKLIST)
    expect(typeof e.subject).toBe('string')
    expect(typeof e.body).toBe('string')
  })
  it('the mail link only opens a draft (mailto:), it never posts anywhere', () => expect(mailtoLink('s', 'b').startsWith('mailto:')).toBe(true))
  it('no source file sends email over the network (no fetch/XMLHttpRequest/sendBeacon)', () => {
    for (const [path, src] of Object.entries(allSources)) expect(`${path}:${/\b(fetch\(|XMLHttpRequest|sendBeacon)/.test(src)}`).toBe(`${path}:false`)
  })
})

describe('§8: storage / cleaning cards open real provider sites', () => {
  it('every storage and cleaning provider has an https website', () => {
    for (const p of [...STORAGE, ...CLEANERS]) expect(p.website).toMatch(/^https:\/\//)
    for (const l of STORAGE_LISTINGS) expect(l.bookingUrl).toMatch(/^https:\/\//)
  })
})

describe('§8 / decision 29: privacy', () => {
  it('the new-user state holds no real personal data', () => {
    const s = JSON.stringify(initialState())
    expect(s).not.toMatch(/@/)
    expect(s).not.toMatch(/\b\d{5,}\b/)
  })
})
