import { InvariantError } from './errors'

/** HALF_UP = half away from zero (HMRC VATREC12030). DOWN = toward zero. HALF_EVEN = banker's, internal use only. */
export type RoundingMode = 'HALF_UP' | 'HALF_EVEN' | 'DOWN'

/** Divide n by a positive d and round with an explicit mode. BigInt `/` alone truncates toward zero. */
export function divRound(n: bigint, d: bigint, mode: RoundingMode): bigint {
  if (d <= 0n) throw new InvariantError('divRound: divisor must be positive')
  const q = n / d
  const r = n % d
  if (r === 0n || mode === 'DOWN') return q
  const away = q + (n < 0n ? -1n : 1n)
  const twice = 2n * (r < 0n ? -r : r)
  if (twice > d) return away
  if (twice < d) return q
  if (mode === 'HALF_UP') return away
  return q % 2n === 0n ? q : away
}
