import type { EmailDomain, IdempotencyKey, Instant, ReferralCode } from './brand'
import type { Result } from './result'
import { fail, ok } from './result'

export interface NormalisedEmail { readonly local: string; readonly domain: EmailDomain }

const INSTANT_RE = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})(\.\d{1,3})?(Z|[+-]\d{2}:\d{2})$/

const daysInMonth = (y: number, m: number) => new Date(Date.UTC(y, m, 0)).getUTCDate()

/** ISO 8601 with an explicit zone only. Rejects dates that `Date` would silently roll over (Feb 30). */
export function parseInstant(x: unknown): Result<Instant> {
  if (typeof x !== 'string') return fail('INVALID_INSTANT', 'instant must be a string')
  const m = INSTANT_RE.exec(x)
  if (!m) return fail('INVALID_INSTANT', 'instant must be ISO 8601 with a zone')
  const [y, mo, d, h, mi, s] = m.slice(1, 7).map(Number)
  if (mo < 1 || mo > 12 || d < 1 || d > daysInMonth(y, mo) || h > 23 || mi > 59 || s > 59) {
    return fail('INVALID_INSTANT', 'instant is not a real calendar time')
  }
  const zone = m[8]
  if (zone !== 'Z' && (Number(zone.slice(1, 3)) > 23 || Number(zone.slice(4, 6)) > 59)) {
    return fail('INVALID_INSTANT', 'zone offset out of range')
  }
  const ms = Date.parse(x)
  if (Number.isNaN(ms)) return fail('INVALID_INSTANT', 'instant does not parse')
  return ok(new Date(ms).toISOString() as Instant)
}

export const instantMs = (i: Instant): number => Date.parse(i)

const LOCAL_RE = /^[a-z0-9!#$%&'*+/=?^_`{|}~-]+(\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*$/
const LABEL_RE = /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/

/** Trims and lowercases. One @, a dot-atom local part, and at least two DNS labels with an alphabetic TLD. */
export function parseEmail(x: unknown): Result<NormalisedEmail> {
  if (typeof x !== 'string') return fail('INVALID_EMAIL', 'email must be a string')
  const s = x.trim().toLowerCase()
  if (s.length > 254) return fail('INVALID_EMAIL', 'email too long')
  const parts = s.split('@')
  if (parts.length !== 2) return fail('INVALID_EMAIL', 'email needs exactly one @')
  const [local, domain] = parts
  if (!local || local.length > 64 || !LOCAL_RE.test(local)) return fail('INVALID_EMAIL', 'invalid local part')
  const labels = domain.split('.')
  if (domain.length > 253 || labels.length < 2 || !labels.every((l) => LABEL_RE.test(l))) {
    return fail('INVALID_EMAIL', 'invalid domain')
  }
  if (!/^[a-z]{2,63}$/.test(labels[labels.length - 1])) return fail('INVALID_EMAIL', 'invalid top-level domain')
  return ok(Object.freeze({ local, domain: domain as EmailDomain }))
}

export function parseReferralCode(x: unknown): Result<ReferralCode> {
  if (typeof x !== 'string') return fail('INVALID_REFERRAL_CODE', 'referral code must be a string')
  const s = x.trim().toUpperCase()
  if (!/^[A-Z0-9]{4,16}$/.test(s)) return fail('INVALID_REFERRAL_CODE', 'referral code must be 4 to 16 letters or digits')
  return ok(s as ReferralCode)
}

export function parseIdempotencyKey(x: unknown): Result<IdempotencyKey> {
  if (typeof x !== 'string' || !/^[A-Za-z0-9_-]{1,255}$/.test(x)) {
    return fail('INVALID_IDEMPOTENCY_KEY', 'idempotency key must be 1 to 255 URL-safe characters')
  }
  return ok(x as IdempotencyKey)
}

/** Freezes an object graph in place. Already-frozen nodes are still walked so nested values end up frozen. */
export function deepFreeze<T>(x: T): Readonly<T> {
  const seen = new Set<object>()
  const walk = (v: unknown) => {
    if (v === null || typeof v !== 'object' || seen.has(v)) return
    seen.add(v)
    for (const child of Object.values(v)) walk(child)
    Object.freeze(v)
  }
  walk(x)
  return x
}
