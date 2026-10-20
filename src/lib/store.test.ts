// Frozen QA suite for the app store (SPEC §9 decision 29: every reload is a brand-new user; Alt+D loads the demo house).
import { beforeEach, describe, expect, it, vi } from 'vitest'

const mem = vi.hoisted(() => {
  const data = new Map<string, string>()
  const ls = {
    getItem: (k: string) => (data.has(k) ? data.get(k)! : null),
    setItem: (k: string, v: string) => void data.set(k, String(v)),
    removeItem: (k: string) => void data.delete(k),
    clear: () => data.clear(),
  }
  // A stale session from "yesterday" that must be forgotten on load.
  data.set('rentready:v3', '{"stale":true}')
  ;(globalThis as unknown as { localStorage: typeof ls }).localStorage = ls
  return { data, clear: vi.fn(() => Promise.resolve()) }
})
vi.mock('idb-keyval', () => ({ get: vi.fn(), set: vi.fn(), del: vi.fn(), clear: mem.clear }))

import { demoState, getState, initialState, resetState, setState, setTask } from './store'
import { enterDemoMode, resetToNewUser } from './demoMode'

describe('load: every page load is a brand-new user', () => {
  it('forgets the saved session in localStorage on load', () => expect(mem.data.get('rentready:v3')).not.toBe('{"stale":true}'))
  it('clears uploaded photos from IndexedDB on load', () => expect(mem.clear).toHaveBeenCalled())
  it('starts from initialState, not the demo', () => {
    expect(getState().demoMode).toBe(false)
    expect(getState().bills.survey).toBeNull()
  })
})

describe('initialState', () => {
  const s = initialState()
  it('has no survey, no records, no email draft', () => {
    expect(s.bills.survey).toBeNull()
    expect(s.moveIn).toEqual({ kind: 'moveIn', records: {} })
    expect(s.moveOut).toEqual({ kind: 'moveOut', records: {} })
    expect(s.emailDraft).toBeNull()
  })
  it('every task starts notStarted', () => {
    expect(Object.keys(s.tasks).sort()).toEqual(['bills', 'cleaning', 'comparison', 'email', 'inspection', 'storage'])
    expect(Object.values(s.tasks).every((t) => t === 'notStarted')).toBe(true)
  })
  it('deposit is unknown until the student says (null, not a guess)', () => expect(s.cleaning).toEqual({ bedrooms: null, depositPerPerson: null, dirtyItems: null }))
  it('storage defaults to no boxes for a 15-week summer', () => expect(s.storageNeeds).toEqual({ boxes: { small: 0, medium: 0, large: 0 }, weeks: 15 }))
  it('no personal data: placeholder tenant and "Landlord"', () => {
    expect(s.property.tenantName).toBe('Alex')
    expect(s.property.landlordName).toBe('Landlord')
  })
  it('returns a fresh object each call (no shared mutable state)', () => {
    const a = initialState()
    a.tasks.bills = 'done'
    a.storageNeeds.boxes.small = 9
    expect(initialState().tasks.bills).toBe('notStarted')
    expect(initialState().storageNeeds.boxes.small).toBe(0)
  })
  it('is JSON-serialisable (mirrored to localStorage)', () => expect(JSON.parse(JSON.stringify(s))).toEqual(s))
})

describe('demoState', () => {
  const d = demoState()
  it('turns demo mode on with the real demo house', () => {
    expect(d.demoMode).toBe(true)
    expect(d.property.label).toBe('Gilesgate, Durham DH1')
    expect(Object.keys(d.moveIn.records)).toHaveLength(10)
    expect(Object.keys(d.moveOut.records)).toHaveLength(9)
  })
  it('pre-fills a £400 deposit and marks inspection done, comparison in progress', () => {
    expect(d.cleaning.depositPerPerson).toBe(400)
    expect(d.tasks.inspection).toBe('done')
    expect(d.tasks.comparison).toBe('inProgress')
    expect(d.tasks.bills).toBe('notStarted')
  })
})

describe('mutations', () => {
  beforeEach(() => resetState())
  it('setState replaces state and mirrors it to localStorage', () => {
    setState((s) => ({ ...s, emailDraft: 'draft' }))
    expect(getState().emailDraft).toBe('draft')
    expect(JSON.parse(mem.data.get('rentready:v3')!).emailDraft).toBe('draft')
  })
  it('setTask updates one task only', () => {
    setTask('bills', 'done')
    expect(getState().tasks.bills).toBe('done')
    expect(getState().tasks.storage).toBe('notStarted')
  })
  it('setTask with the same status keeps the same state object (no needless re-render)', () => {
    const before = getState()
    setTask('bills', 'notStarted')
    expect(getState()).toBe(before)
  })
  it('resetState returns to initialState', () => {
    setTask('email', 'done')
    resetState()
    expect(getState()).toEqual(initialState())
  })
  it('enterDemoMode (Alt+D) loads the demo house', () => {
    enterDemoMode()
    expect(getState()).toEqual(demoState())
  })
  it('resetToNewUser (Alt+R) wipes photos and state', async () => {
    enterDemoMode()
    mem.clear.mockClear()
    await resetToNewUser()
    expect(mem.clear).toHaveBeenCalledTimes(1)
    expect(getState()).toEqual(initialState())
  })
  it('resetToNewUser still resets state when IndexedDB fails', async () => {
    enterDemoMode()
    mem.clear.mockImplementationOnce(() => Promise.reject(new Error('blocked')))
    await resetToNewUser()
    expect(getState().demoMode).toBe(false)
  })
})
