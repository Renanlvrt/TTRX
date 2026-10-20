import { describe, expect, it } from 'vitest'
import { parseEmail, parseIdempotencyKey, parseInstant, parseReferralCode } from './validate'
import { expectErr, must } from './test-fixtures'

describe('parseInstant', () => {
  it('canonicalises a Z instant to millisecond precision', () => {
    expect(must(parseInstant('2026-10-20T10:00:00Z'))).toBe('2026-10-20T10:00:00.000Z')
  })

  it('converts an offset to UTC (BST midnight-ish lands the previous UTC day)', () => {
    expect(must(parseInstant('2026-09-01T00:30:00+01:00'))).toBe('2026-08-31T23:30:00.000Z')
  })

  it('rejects instants without a zone and bare dates', () => {
    expect(expectErr(parseInstant('2026-10-20T10:00:00'))).toBe('INVALID_INSTANT')
    expect(expectErr(parseInstant('2026-10-20'))).toBe('INVALID_INSTANT')
  })

  it('rejects impossible calendar dates instead of rolling them over', () => {
    expect(expectErr(parseInstant('2026-02-30T00:00:00Z'))).toBe('INVALID_INSTANT')
    expect(expectErr(parseInstant('2026-13-01T00:00:00Z'))).toBe('INVALID_INSTANT')
  })

  it('rejects non-string inputs', () => {
    expect(expectErr(parseInstant(new Date('2026-10-20T10:00:00Z')))).toBe('INVALID_INSTANT')
    expect(expectErr(parseInstant(0))).toBe('INVALID_INSTANT')
  })
})

describe('parseEmail', () => {
  it('trims and lowercases, splitting local part and domain', () => {
    expect(must(parseEmail(' Alice.Smith@Student.EXAMPLE '))).toEqual({ local: 'alice.smith', domain: 'student.example' })
  })

  it.each(['a@b@c.example', '@student.example', 'alice@', 'alice', 'alice@student', 'alice@-x.example', 'a'.repeat(242) + '@student.example'])(
    'rejects %j',
    (e) => {
      expect(expectErr(parseEmail(e))).toBe('INVALID_EMAIL')
    },
  )
})

describe('parseReferralCode', () => {
  it('trims and uppercases', () => {
    expect(must(parseReferralCode(' alpha2026 '))).toBe('ALPHA2026')
  })

  it.each(['AB1', 'ALPHA 2026', 'ALPHA-2026', 'ÄBCD', 'A'.repeat(17)])('rejects %j', (c) => {
    expect(expectErr(parseReferralCode(c))).toBe('INVALID_REFERRAL_CODE')
  })
})

describe('parseIdempotencyKey', () => {
  it('accepts URL-safe keys', () => {
    expect(must(parseIdempotencyKey('signup-7f3a_0001'))).toBe('signup-7f3a_0001')
  })

  it.each(['', 'a'.repeat(256), 'has space', 'alice@student.example'])('rejects %j', (k) => {
    expect(expectErr(parseIdempotencyKey(k))).toBe('INVALID_IDEMPOTENCY_KEY')
  })
})
