import { describe, expect, it } from 'vitest'
import { fixedClock } from './clock'
import { sequentialIds } from './ids'
import { InvariantError } from './errors'
import { T } from './test-fixtures'

describe('fixedClock', () => {
  it('returns the same instant until advanced', () => {
    const c = fixedClock(T)
    expect(c.now()).toBe(T)
    expect(c.now()).toBe(T)
    c.advance(1000)
    expect(c.now()).toBe('2026-10-20T10:00:01.000Z')
  })

  it('refuses a start that is not a full UTC instant', () => {
    expect(() => fixedClock('2026-10-20')).toThrow(InvariantError)
  })
})

describe('sequentialIds', () => {
  it('counts per prefix with zero padding', () => {
    const ids = sequentialIds()
    expect(ids.next('sig')).toBe('sig_000001')
    expect(ids.next('sig')).toBe('sig_000002')
    expect(ids.next('txn')).toBe('txn_000001')
  })
})
