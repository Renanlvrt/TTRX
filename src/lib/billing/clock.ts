import type { Instant } from './brand'
import { InvariantError } from './errors'
import { instantMs, parseInstant } from './validate'

export interface Clock { now(): Instant }

/** Test clock: frozen at `start` until advanced. */
export function fixedClock(start: string): Clock & { advance(ms: number): void } {
  const r = parseInstant(start)
  if (!r.ok) throw new InvariantError(`fixedClock: ${start} is not a full UTC instant`)
  let ms = instantMs(r.value)
  return {
    now: () => new Date(ms).toISOString() as Instant,
    advance: (d: number) => { ms += d },
  }
}

export function systemClock(): Clock {
  return { now: () => new Date().toISOString() as Instant }
}
