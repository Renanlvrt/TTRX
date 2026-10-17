import { describe, expect, it } from 'vitest'
import { compareInspections, flagFor, hasAnyRecord, inspectionProgress, sortRows, summarize } from './inspection'
import { CHECKLIST } from '../data/checklist'
import { demoMoveIn, demoMoveOut } from '../data/demoSeed'
import type { Condition, Inspection, ItemRecord } from './types'

const rec = (condition: Condition | null, photo = true): ItemRecord => ({
  itemId: 'x',
  condition,
  note: '',
  photoId: photo ? 'url:/demo/x.svg' : null,
  recordedAt: '2025-07-01T10:00:00.000Z',
})

describe('flagFor', () => {
  it('good -> damaged is a new issue', () => expect(flagFor(rec('good'), rec('damaged'))).toBe('newIssue'))
  it('damaged at both is pre-existing', () => expect(flagFor(rec('damaged'), rec('damaged'))).toBe('preExisting'))
  it('damaged -> good is still pre-existing (documented at move-in)', () => expect(flagFor(rec('damaged'), rec('good'))).toBe('preExisting'))
  it('good at both is unchanged', () => expect(flagFor(rec('good'), rec('good'))).toBe('unchanged'))
  it('N/A on either side wins', () => {
    expect(flagFor(rec('na', false), rec('damaged'))).toBe('notApplicable')
    expect(flagFor(rec('good'), rec('na', false))).toBe('notApplicable')
    expect(flagFor(null, rec('na'))).toBe('notApplicable')
  })
  it('missing photo, record or condition is unmatched', () => {
    expect(flagFor(rec('good'), rec('damaged', false))).toBe('unmatched')
    expect(flagFor(rec('good', false), rec('damaged'))).toBe('unmatched')
    expect(flagFor(rec('good'), null)).toBe('unmatched')
    expect(flagFor(rec(null), rec('good'))).toBe('unmatched')
  })
})

describe('compare + summarize', () => {
  it('demo seed: 2 missing items are unmatched before upload', () => {
    const rows = compareInspections(CHECKLIST, demoMoveIn(), demoMoveOut())
    expect(summarize(rows)).toEqual({ newIssue: 0, preExisting: 3, unchanged: 5, unmatched: 2, notApplicable: 0 })
  })

  it('demo script: 2 live damaged uploads become 2 NEW ISSUES, sorted first', () => {
    const out = demoMoveOut()
    for (const id of ['kitchen-oven', 'bedroom-walls']) out.records[id] = { ...rec('damaged'), itemId: id }
    const rows = compareInspections(CHECKLIST, demoMoveIn(), out)
    expect(summarize(rows)).toEqual({ newIssue: 2, preExisting: 3, unchanged: 5, unmatched: 0, notApplicable: 0 })
    const sorted = sortRows(rows)
    expect(sorted.slice(0, 2).map((r) => r.item.id)).toEqual(['kitchen-oven', 'bedroom-walls'])
  })
})

describe('inspectionProgress', () => {
  const empty: Inspection = { kind: 'moveIn', records: {} }
  it('counts nothing for an empty inspection', () => {
    const p = inspectionProgress(empty, CHECKLIST)
    expect(p).toMatchObject({ done: 0, total: 10 })
    expect(p.missing).toHaveLength(10)
    expect(hasAnyRecord(empty)).toBe(false)
  })
  it('needs condition + photo, except N/A needs no photo', () => {
    const i: Inspection = {
      kind: 'moveIn',
      records: {
        'kitchen-oven': rec('good'),
        'kitchen-fridge': rec('na', false),
        'bathroom-shower': rec('damaged', false),
        'bathroom-sink': rec(null, true),
      },
    }
    const p = inspectionProgress(i, CHECKLIST)
    expect(p.done).toBe(2)
    expect(p.missing.map((m) => m.id)).toContain('bathroom-shower')
    expect(hasAnyRecord(i)).toBe(true)
  })
  it('demo seeds: move-in 10/10, move-out 8/10', () => {
    expect(inspectionProgress(demoMoveIn(), CHECKLIST).done).toBe(10)
    const out = inspectionProgress(demoMoveOut(), CHECKLIST)
    expect(out.done).toBe(8)
    expect(out.missing.map((m) => m.id)).toEqual(['kitchen-oven', 'bedroom-walls'])
  })
})
