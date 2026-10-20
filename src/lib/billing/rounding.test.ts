import { describe, expect, it } from 'vitest'
import { divRound } from './rounding'
import { InvariantError } from './errors'

describe('divRound', () => {
  it('HALF_UP rounds .5 up and leaves the rest to the nearest', () => {
    expect(divRound(25n, 10n, 'HALF_UP')).toBe(3n)
    expect(divRound(24n, 10n, 'HALF_UP')).toBe(2n)
    expect(divRound(26n, 10n, 'HALF_UP')).toBe(3n)
  })

  it('HALF_UP rounds negative halves away from zero', () => {
    expect(divRound(-25n, 10n, 'HALF_UP')).toBe(-3n)
  })

  it('HALF_EVEN rounds halves to the even neighbour', () => {
    expect(divRound(25n, 10n, 'HALF_EVEN')).toBe(2n)
    expect(divRound(35n, 10n, 'HALF_EVEN')).toBe(4n)
    expect(divRound(-25n, 10n, 'HALF_EVEN')).toBe(-2n)
  })

  it('DOWN truncates toward zero', () => {
    expect(divRound(26n, 10n, 'DOWN')).toBe(2n)
    expect(divRound(-26n, 10n, 'DOWN')).toBe(-2n)
  })

  it('exact division is identical in every mode', () => {
    for (const mode of ['HALF_UP', 'HALF_EVEN', 'DOWN'] as const) expect(divRound(30n, 10n, mode)).toBe(3n)
  })

  it('keeps full precision beyond Number.MAX_SAFE_INTEGER', () => {
    expect(divRound(10n ** 20n + 5n, 10n, 'HALF_UP')).toBe(10n ** 19n + 1n)
    expect(divRound(10n ** 20n + 5n, 10n, 'HALF_EVEN')).toBe(10n ** 19n)
  })

  it('throws InvariantError on a zero or negative divisor', () => {
    expect(() => divRound(1n, 0n, 'HALF_UP')).toThrow(InvariantError)
    expect(() => divRound(1n, -1n, 'HALF_UP')).toThrow(InvariantError)
  })
})
