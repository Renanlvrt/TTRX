// Money as BigInt minor units (pence). No `number` ever holds an amount, and every rounding names its mode.
import type { Brand } from './brand'
import type { Result } from './result'
import { fail, ok } from './result'
import type { RoundingMode } from './rounding'
import { divRound } from './rounding'

export type CurrencyCode = 'GBP' | 'EUR' | 'JPY'

export const CURRENCY_EXPONENT: Readonly<Record<CurrencyCode, 0 | 2>> = Object.freeze({ GBP: 2, EUR: 2, JPY: 0 })
const SYMBOL: Readonly<Record<CurrencyCode, string>> = Object.freeze({ GBP: '£', EUR: '€', JPY: '¥' })

/** Postgres bigint range, so a value we accept always fits the production column. */
export const MAX_MINOR = 2n ** 63n - 1n
export const MIN_MINOR = -MAX_MINOR

export type Money = Brand<Readonly<{ amountMinor: bigint; currency: CurrencyCode }>, 'Money'>

export interface MoneyDTO { readonly amountMinor: string; readonly currency: CurrencyCode }

const inRange = (n: bigint) => n >= MIN_MINOR && n <= MAX_MINOR

function make(amountMinor: bigint, currency: CurrencyCode): Result<Money> {
  if (!inRange(amountMinor)) return fail('AMOUNT_OUT_OF_RANGE', 'amount outside the supported range')
  return ok(Object.freeze({ amountMinor, currency }) as Money)
}

export function parseCurrency(c: unknown): Result<CurrencyCode> {
  if (c === 'GBP' || c === 'EUR' || c === 'JPY') return ok(c)
  return fail('UNSUPPORTED_CURRENCY', 'currency must be GBP, EUR or JPY')
}

/** Parses a major-unit decimal string such as "12.34". Numbers are refused: they may already have lost precision. */
export function parseMoney(major: unknown, currency: unknown): Result<Money> {
  if (typeof major !== 'string') return fail('INVALID_AMOUNT_TYPE', 'amounts arrive as strings')
  const c = parseCurrency(currency)
  if (!c.ok) return c
  const exp = CURRENCY_EXPONENT[c.value]
  const re = exp === 0 ? /^(-?)(0|[1-9]\d*)$/ : new RegExp(`^(-?)(0|[1-9]\\d*)(?:\\.(\\d{1,${exp}}))?$`)
  const m = re.exec(major)
  if (!m) return fail('INVALID_AMOUNT', 'amount is not a plain decimal for this currency')
  const frac = (m[3] ?? '').padEnd(exp, '0')
  const magnitude = BigInt(m[2] + frac)
  return make(m[1] === '-' ? -magnitude : magnitude, c.value)
}

/** Builds Money from minor units given as a bigint or an integer string. */
export function moneyFromMinor(minor: unknown, currency: unknown): Result<Money> {
  let n: bigint
  if (typeof minor === 'bigint') n = minor
  else if (typeof minor === 'string') {
    if (!/^-?\d+$/.test(minor)) return fail('INVALID_AMOUNT', 'minor units must be an integer string')
    n = BigInt(minor)
  } else return fail('INVALID_AMOUNT_TYPE', 'minor units must be a bigint or an integer string')
  const c = parseCurrency(currency)
  if (!c.ok) return c
  return make(n, c.value)
}

function sameCurrency(a: Money, b: Money): Result<CurrencyCode> {
  return a.currency === b.currency ? ok(a.currency) : fail('CURRENCY_MISMATCH', `${a.currency} and ${b.currency} cannot mix`)
}

export function add(a: Money, b: Money): Result<Money> {
  const c = sameCurrency(a, b)
  return c.ok ? make(a.amountMinor + b.amountMinor, c.value) : c
}

export function subtract(a: Money, b: Money): Result<Money> {
  const c = sameCurrency(a, b)
  return c.ok ? make(a.amountMinor - b.amountMinor, c.value) : c
}

/** The range is symmetric, so negation never overflows. */
export function negate(m: Money): Money {
  return Object.freeze({ amountMinor: -m.amountMinor, currency: m.currency }) as Money
}

export function compare(a: Money, b: Money): Result<-1 | 0 | 1> {
  const c = sameCurrency(a, b)
  if (!c.ok) return c
  return ok(a.amountMinor < b.amountMinor ? -1 : a.amountMinor > b.amountMinor ? 1 : 0)
}

export function sum(currency: CurrencyCode, items: readonly Money[]): Result<Money> {
  let total = 0n
  for (const m of items) {
    if (m.currency !== currency) return fail('CURRENCY_MISMATCH', `${m.currency} in a ${currency} sum`)
    total += m.amountMinor
  }
  return make(total, currency)
}

/** m × num / den with an explicit rounding mode (used for VAT and percentages later). */
export function multiplyRatio(m: Money, num: bigint, den: bigint, mode: RoundingMode): Result<Money> {
  if (den <= 0n || num < 0n) return fail('INVALID_RATIO', 'ratio needs num >= 0 and den > 0')
  return make(divRound(m.amountMinor * num, den, mode), m.currency)
}

/**
 * Splits m by weights with the largest-remainder method: the parts always sum to m exactly.
 * Ties go to the lower index; negative amounts mirror positive ones.
 */
export function allocate(m: Money, weights: readonly bigint[]): Result<readonly Money[]> {
  if (weights.length === 0 || weights.some((w) => w < 0n)) return fail('INVALID_WEIGHTS', 'weights must be non-negative')
  const total = weights.reduce((s, w) => s + w, 0n)
  if (total === 0n) return fail('INVALID_WEIGHTS', 'weights must not all be zero')
  const negative = m.amountMinor < 0n
  const abs = negative ? -m.amountMinor : m.amountMinor
  const shares = weights.map((w) => (abs * w) / total)
  const remainders = weights.map((w, i) => ({ i, r: (abs * w) % total }))
  let leftover = abs - shares.reduce((s, x) => s + x, 0n)
  remainders.sort((a, b) => (a.r === b.r ? a.i - b.i : a.r > b.r ? -1 : 1))
  for (const { i } of remainders) {
    if (leftover === 0n) break
    shares[i] += 1n
    leftover -= 1n
  }
  return ok(Object.freeze(shares.map((s) => Object.freeze({ amountMinor: negative ? -s : s, currency: m.currency }) as Money)))
}

export function formatMoney(m: Money): string {
  const exp = CURRENCY_EXPONENT[m.currency]
  const abs = m.amountMinor < 0n ? -m.amountMinor : m.amountMinor
  const digits = abs.toString().padStart(exp + 1, '0')
  const whole = digits.slice(0, digits.length - exp).replace(/\B(?=(\d{3})+(?!\d))/g, ',')
  const frac = exp > 0 ? `.${digits.slice(digits.length - exp)}` : ''
  return `${m.amountMinor < 0n ? '-' : ''}${SYMBOL[m.currency]}${whole}${frac}`
}

/** Every amount the billing screens show is simulated; this label keeps that visible. */
export const formatSimulated = (m: Money): string => `SIM ${formatMoney(m)}`

export function toDTO(m: Money): MoneyDTO {
  return Object.freeze({ amountMinor: m.amountMinor.toString(), currency: m.currency })
}

export function fromDTO(x: unknown): Result<Money> {
  if (x === null || typeof x !== 'object') return fail('INVALID_AMOUNT_TYPE', 'DTO must be an object')
  const { amountMinor, currency } = x as { amountMinor?: unknown; currency?: unknown }
  if (typeof amountMinor !== 'string') return fail('INVALID_AMOUNT_TYPE', 'DTO amounts are strings')
  return moneyFromMinor(amountMinor, currency)
}
