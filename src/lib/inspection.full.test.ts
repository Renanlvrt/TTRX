// Frozen QA suite for the before/after report (SPEC §3 "Before / after report", §8: live uploads → correct NEW ISSUE flags).
import { describe, expect, it } from 'vitest'
import { FLAG_ORDER, compareInspections, flagFor, hasAnyRecord, inspectionProgress, isItemDone, sortRows, summarize } from './inspection'
import type { Condition, Inspection, ItemRecord } from './types'
import { CHECKLIST } from '../data/checklist'
import { demoHouseMoveIn, demoHouseMoveOut } from '../data/demoHouse'
import { demoMoveIn, demoMoveOut } from '../data/demoSeed'

const rec = (condition: Condition | null, photo = true, note = ''): ItemRecord => ({
  itemId: 'x',
  condition,
  note,
  photoId: photo ? 'p1' : null,
  recordedAt: null,
})
const insp = (kind: Inspection['kind'], records: Record<string, ItemRecord> = {}): Inspection => ({ kind, records })

describe('flagFor truth table', () => {
  it('good → damaged = newIssue', () => expect(flagFor(rec('good'), rec('damaged'))).toBe('newIssue'))
  it('good → good = unchanged', () => expect(flagFor(rec('good'), rec('good'))).toBe('unchanged'))
  it('damaged → damaged = preExisting', () => expect(flagFor(rec('damaged'), rec('damaged'))).toBe('preExisting'))
  it('damaged → good = preExisting (documented at move-in protects the tenant)', () => expect(flagFor(rec('damaged'), rec('good'))).toBe('preExisting'))
  it('N/A at move-in = notApplicable', () => expect(flagFor(rec('na'), rec('damaged'))).toBe('notApplicable'))
  it('N/A at move-out = notApplicable', () => expect(flagFor(rec('good'), rec('na'))).toBe('notApplicable'))
  it('N/A wins even when the other side has no photo', () => expect(flagFor(rec('good', false), rec('na', false))).toBe('notApplicable'))
  it('missing move-out record = unmatched', () => expect(flagFor(rec('good'), null)).toBe('unmatched'))
  it('missing move-in record = unmatched', () => expect(flagFor(null, rec('damaged'))).toBe('unmatched'))
  it('both missing = unmatched', () => expect(flagFor(null, null)).toBe('unmatched'))
  it('a condition without a photo is not evidence → unmatched', () => expect(flagFor(rec('good'), rec('damaged', false))).toBe('unmatched'))
  it('a photo without a condition is not evidence → unmatched', () => expect(flagFor(rec(null), rec('damaged'))).toBe('unmatched'))
  it('flags never come from notes (image/notes are never analysed)', () =>
    expect(flagFor(rec('good', true, 'broken!'), rec('good', true, 'smashed'))).toBe('unchanged'))
})

describe('FLAG_ORDER, sorting and summary', () => {
  it('orders the most important first', () => expect(FLAG_ORDER).toEqual(['newIssue', 'unmatched', 'preExisting', 'unchanged', 'notApplicable']))
  it('sortRows puts newIssue first and keeps checklist order within a flag', () => {
    const rows = compareInspections(CHECKLIST, demoHouseMoveIn(), demoHouseMoveOut())
    const sorted = sortRows(rows)
    expect(sorted.map((r) => r.flag)).toEqual([...sorted.map((r) => r.flag)].sort((a, b) => FLAG_ORDER.indexOf(a) - FLAG_ORDER.indexOf(b)))
    const news = sorted.filter((r) => r.flag === 'newIssue').map((r) => r.item.id)
    expect(news).toEqual(['bathroom-shower', 'bathroom-sink', 'living-walls', 'living-furniture'])
  })
  it('sortRows does not mutate its input', () => {
    const rows = compareInspections(CHECKLIST, demoHouseMoveIn(), demoHouseMoveOut())
    const before = rows.map((r) => r.item.id)
    sortRows(rows)
    expect(rows.map((r) => r.item.id)).toEqual(before)
  })
  it('summarize counts every flag, zero-filled', () => expect(summarize([])).toEqual({ newIssue: 0, preExisting: 0, unchanged: 0, unmatched: 0, notApplicable: 0 }))
  it('summary counts add up to the checklist length', () => {
    const s = summarize(compareInspections(CHECKLIST, demoHouseMoveIn(), demoHouseMoveOut()))
    expect(Object.values(s).reduce((a, b) => a + b, 0)).toBe(CHECKLIST.length)
  })
  it('compareInspections returns one row per checklist item, in checklist order', () => {
    const rows = compareInspections(CHECKLIST, insp('moveIn'), insp('moveOut'))
    expect(rows.map((r) => r.item.id)).toEqual(CHECKLIST.map((c) => c.id))
    expect(rows.every((r) => r.flag === 'unmatched' && r.moveIn === null && r.moveOut === null)).toBe(true)
  })
})

describe('demo house (Alt+D) — the pitch flow', () => {
  const rows = compareInspections(CHECKLIST, demoHouseMoveIn(), demoHouseMoveOut())
  it('before the live upload: 4 new issues, 2 pre-existing, 3 unchanged, 1 unmatched (Oven & Hob)', () =>
    expect(summarize(rows)).toEqual({ newIssue: 4, preExisting: 2, unchanged: 3, unmatched: 1, notApplicable: 0 }))
  it('the unmatched item is Oven & Hob, left empty for the live upload', () =>
    expect(rows.filter((r) => r.flag === 'unmatched').map((r) => r.item.id)).toEqual(['kitchen-oven']))
  it('uploading a damaged Oven & Hob photo makes 5 new issues', () => {
    const out = demoHouseMoveOut()
    out.records['kitchen-oven'] = { itemId: 'kitchen-oven', condition: 'damaged', note: '', photoId: 'photo_1', recordedAt: '2026-06-18T11:00:00.000Z' }
    expect(summarize(compareInspections(CHECKLIST, demoHouseMoveIn(), out)).newIssue).toBe(5)
  })
  it('uploading a good Oven & Hob photo leaves 4 new issues and 4 unchanged', () => {
    const out = demoHouseMoveOut()
    out.records['kitchen-oven'] = { itemId: 'kitchen-oven', condition: 'good', note: '', photoId: 'photo_1', recordedAt: null }
    const s = summarize(compareInspections(CHECKLIST, demoHouseMoveIn(), out))
    expect(s.newIssue).toBe(4)
    expect(s.unchanged).toBe(4)
  })
  it('bedroom marks documented at move-in stay pre-existing (tenant protected)', () =>
    expect(rows.filter((r) => r.flag === 'preExisting').map((r) => r.item.id)).toEqual(['bedroom-walls', 'bedroom-floor']))
  it('every demo photo reference points at /demo-house/<itemId>-in|out.jpg', () => {
    for (const [kind, ins] of [['in', demoHouseMoveIn()], ['out', demoHouseMoveOut()]] as const)
      for (const r of Object.values(ins.records)) expect(r.photoId).toBe(`url:/demo-house/${r.itemId}-${kind}.jpg`)
  })
  it('demo timestamps are valid ISO dates on the move-in/move-out days', () => {
    for (const r of Object.values(demoHouseMoveIn().records)) expect(r.recordedAt!.startsWith('2025-07-01T')).toBe(true)
    for (const r of Object.values(demoHouseMoveOut().records)) expect(r.recordedAt!.startsWith('2026-06-18T')).toBe(true)
    for (const r of [...Object.values(demoHouseMoveIn().records), ...Object.values(demoHouseMoveOut().records)])
      expect(Number.isNaN(Date.parse(r.recordedAt!))).toBe(false)
  })
  it('each call returns a fresh object (demo state cannot be mutated across sessions)', () => {
    const a = demoHouseMoveOut()
    a.records['kitchen-fridge'].condition = 'damaged'
    expect(demoHouseMoveOut().records['kitchen-fridge'].condition).toBe('good')
  })
  it('demo records only use checklist item ids', () => {
    const ids = new Set(CHECKLIST.map((c) => c.id))
    for (const k of [...Object.keys(demoHouseMoveIn().records), ...Object.keys(demoHouseMoveOut().records)]) expect(ids.has(k)).toBe(true)
  })
})

describe('legacy SVG demo seed', () => {
  const rows = compareInspections(CHECKLIST, demoMoveIn(), demoMoveOut())
  it('leaves 2 items for live uploads (Oven & Hob, bedroom walls)', () =>
    expect(rows.filter((r) => r.flag === 'unmatched').map((r) => r.item.id)).toEqual(['kitchen-oven', 'bedroom-walls']))
  it('has no new issues before the uploads, 3 pre-existing', () => {
    const s = summarize(rows)
    expect(s.newIssue).toBe(0)
    expect(s.preExisting).toBe(3)
  })
  it('2 damaged live uploads produce exactly 2 NEW ISSUE flags', () => {
    const out = demoMoveOut()
    for (const id of ['kitchen-oven', 'bedroom-walls']) out.records[id] = { itemId: id, condition: 'damaged', note: '', photoId: 'p', recordedAt: null }
    expect(summarize(compareInspections(CHECKLIST, demoMoveIn(), out)).newIssue).toBe(2)
  })
})

describe('progress helpers', () => {
  it('isItemDone needs a condition AND (a photo or N/A)', () => {
    expect(isItemDone(rec('good'))).toBe(true)
    expect(isItemDone(rec('good', false))).toBe(false)
    expect(isItemDone(rec('na', false))).toBe(true)
    expect(isItemDone(rec(null))).toBe(false)
    expect(isItemDone(null)).toBe(false)
    expect(isItemDone(undefined)).toBe(false)
  })
  it('inspectionProgress on an empty inspection: 0 of 10, all missing', () => {
    const p = inspectionProgress(insp('moveIn'), CHECKLIST)
    expect(p).toMatchObject({ done: 0, total: 10 })
    expect(p.missing).toHaveLength(10)
  })
  it('inspectionProgress on the demo move-in is complete', () => {
    const p = inspectionProgress(demoHouseMoveIn(), CHECKLIST)
    expect(p.done).toBe(10)
    expect(p.missing).toEqual([])
  })
  it('inspectionProgress on the demo move-out misses only Oven & Hob', () =>
    expect(inspectionProgress(demoHouseMoveOut(), CHECKLIST).missing.map((i) => i.id)).toEqual(['kitchen-oven']))
  it('hasAnyRecord is false for an empty inspection', () => expect(hasAnyRecord(insp('moveIn'))).toBe(false))
  it('hasAnyRecord ignores whitespace-only notes', () => expect(hasAnyRecord(insp('moveIn', { a: rec(null, false, '   ') }))).toBe(false))
  it('hasAnyRecord is true for a note, a photo, or a condition alone', () => {
    expect(hasAnyRecord(insp('moveIn', { a: rec(null, false, 'crack') }))).toBe(true)
    expect(hasAnyRecord(insp('moveIn', { a: rec(null, true) }))).toBe(true)
    expect(hasAnyRecord(insp('moveIn', { a: rec('good', false) }))).toBe(true)
  })
})

describe('checklist', () => {
  it('has 10 items with unique ids', () => {
    expect(CHECKLIST).toHaveLength(10)
    expect(new Set(CHECKLIST.map((c) => c.id)).size).toBe(10)
  })
  it('2 items per shared room and 4 for the bedroom', () => {
    const count = (room: string) => CHECKLIST.filter((c) => c.room === room).length
    expect([count('kitchen'), count('bathroom'), count('living'), count('bedroom')]).toEqual([2, 2, 2, 4])
  })
  it('every item id starts with its room and has a label and a photo hint', () => {
    for (const c of CHECKLIST) {
      expect(c.id.startsWith(c.room + '-')).toBe(true)
      expect(c.label.trim()).not.toBe('')
      expect(c.hint.trim()).not.toBe('')
    }
  })
})
