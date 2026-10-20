import { describe, expect, it } from 'vitest'
import {
  MAX_MINOR, add, allocate, compare, formatMoney, fromDTO, moneyFromMinor, multiplyRatio, negate, parseMoney, subtract, sum, toDTO,
} from './money'
import { expectErr, gbp, money, must } from './test-fixtures'

const minor = (m: { amountMinor: bigint }) => m.amountMinor
const minorOf = (n: bigint) => must(moneyFromMinor(n, 'GBP'))

describe('parseMoney', () => {
  it('parses a GBP string into pence', () => {
    const m = must(parseMoney('12.34', 'GBP'))
    expect(m.amountMinor).toBe(1234n)
    expect(m.currency).toBe('GBP')
  })

  it('accepts whole, one-decimal and zero amounts', () => {
    expect(minor(gbp('12'))).toBe(1200n)
    expect(minor(gbp('12.3'))).toBe(1230n)
    expect(minor(gbp('0.01'))).toBe(1n)
    expect(minor(gbp('0'))).toBe(0n)
  })

  it('accepts negatives and normalises -0.00 to 0', () => {
    expect(minor(gbp('-12.34'))).toBe(-1234n)
    expect(minor(gbp('-0.00'))).toBe(0n)
  })

  it('rejects more decimals than the currency allows', () => {
    expect(expectErr(parseMoney('12.345', 'GBP'))).toBe('INVALID_AMOUNT')
  })

  it.each(['1e3', '+12', ' 12', '12 ', '', '12.', '.5', '1,000.00', '012', '0x10', 'NaN', 'Infinity'])(
    'rejects the malformed amount %j',
    (s) => {
      expect(expectErr(parseMoney(s, 'GBP'))).toBe('INVALID_AMOUNT')
    },
  )

  it('rejects numbers and bigints: amounts arrive as strings only', () => {
    expect(expectErr(parseMoney(12.34, 'GBP'))).toBe('INVALID_AMOUNT_TYPE')
    expect(expectErr(parseMoney(1234n, 'GBP'))).toBe('INVALID_AMOUNT_TYPE')
  })

  it('uses currency exponents: JPY has no minor unit', () => {
    expect(minor(money('100', 'JPY'))).toBe(100n)
    expect(expectErr(parseMoney('100.5', 'JPY'))).toBe('INVALID_AMOUNT')
  })

  it('rejects lowercase or unsupported currencies', () => {
    expect(expectErr(parseMoney('1', 'gbp'))).toBe('UNSUPPORTED_CURRENCY')
    expect(expectErr(parseMoney('1', 'USD'))).toBe('UNSUPPORTED_CURRENCY')
  })

  it('accepts exactly MAX_MINOR and rejects one penny beyond either bound', () => {
    expect(minor(gbp('92233720368547758.07'))).toBe(2n ** 63n - 1n)
    expect(MAX_MINOR).toBe(2n ** 63n - 1n)
    expect(expectErr(parseMoney('92233720368547758.08', 'GBP'))).toBe('AMOUNT_OUT_OF_RANGE')
    expect(expectErr(parseMoney('-92233720368547758.08', 'GBP'))).toBe('AMOUNT_OUT_OF_RANGE')
  })
})

describe('arithmetic', () => {
  it('0.10 + 0.20 is exactly 30 pence (no float drift)', () => {
    expect(minor(must(add(gbp('0.10'), gbp('0.20'))))).toBe(30n)
  })

  it('moneyFromMinor accepts bigint or integer strings only', () => {
    expect(minor(must(moneyFromMinor(1234n, 'GBP')))).toBe(1234n)
    expect(minor(must(moneyFromMinor('1234', 'GBP')))).toBe(1234n)
    expect(expectErr(moneyFromMinor(1234, 'GBP'))).toBe('INVALID_AMOUNT_TYPE')
    expect(expectErr(moneyFromMinor('12.5', 'GBP'))).toBe('INVALID_AMOUNT')
  })

  it('adds and subtracts in minor units', () => {
    expect(minor(must(add(minorOf(1234n), minorOf(66n))))).toBe(1300n)
    expect(minor(must(subtract(minorOf(100n), minorOf(250n))))).toBe(-150n)
  })

  it('refuses to mix currencies', () => {
    expect(expectErr(add(gbp('1'), money('1', 'EUR')))).toBe('CURRENCY_MISMATCH')
    expect(expectErr(subtract(gbp('1'), money('1', 'JPY')))).toBe('CURRENCY_MISMATCH')
    expect(expectErr(compare(gbp('1'), money('1', 'EUR')))).toBe('CURRENCY_MISMATCH')
  })

  it('reports overflow instead of wrapping', () => {
    expect(expectErr(add(minorOf(MAX_MINOR), minorOf(1n)))).toBe('AMOUNT_OUT_OF_RANGE')
  })

  it('negate flips the sign', () => {
    expect(minor(negate(minorOf(250n)))).toBe(-250n)
  })

  it('multiplyRatio applies the requested rounding mode', () => {
    expect(minor(must(multiplyRatio(minorOf(1238n), 20n, 100n, 'HALF_UP')))).toBe(248n)
    expect(minor(must(multiplyRatio(minorOf(1238n), 20n, 100n, 'DOWN')))).toBe(247n)
  })

  it('multiplyRatio rejects a zero denominator and requires a mode', () => {
    expect(expectErr(multiplyRatio(minorOf(100n), 1n, 0n, 'HALF_UP'))).toBe('INVALID_RATIO')
    const typeCheck = () => {
      // @ts-expect-error the rounding mode is mandatory
      multiplyRatio(minorOf(100n), 1n, 2n)
    }
    expect(typeof typeCheck).toBe('function')
  })
})

describe('allocate', () => {
  it('splits 10.00 three ways as 3.34 / 3.33 / 3.33', () => {
    expect(must(allocate(minorOf(1000n), [1n, 1n, 1n])).map(minor)).toEqual([334n, 333n, 333n])
  })

  it('breaks remainder ties toward the lower index', () => {
    expect(must(allocate(minorOf(5n), [3n, 7n])).map(minor)).toEqual([2n, 3n])
    expect(must(allocate(minorOf(1001n), [50n, 50n])).map(minor)).toEqual([501n, 500n])
  })

  it('is sign-symmetric and handles zero', () => {
    expect(must(allocate(minorOf(-1000n), [1n, 1n, 1n])).map(minor)).toEqual([-334n, -333n, -333n])
    expect(must(allocate(minorOf(0n), [1n, 2n])).map(minor)).toEqual([0n, 0n])
  })

  it('rejects empty, all-zero or negative weights', () => {
    expect(expectErr(allocate(minorOf(100n), []))).toBe('INVALID_WEIGHTS')
    expect(expectErr(allocate(minorOf(100n), [0n, 0n]))).toBe('INVALID_WEIGHTS')
    expect(expectErr(allocate(minorOf(100n), [1n, -1n]))).toBe('INVALID_WEIGHTS')
  })
})

describe('immutability, formatting and DTOs', () => {
  it('Money values are frozen and operations never mutate inputs', () => {
    const a = gbp('1.00')
    const b = gbp('2.00')
    expect(Object.isFrozen(a)).toBe(true)
    expect(Reflect.set(a, 'amountMinor', 1n)).toBe(false)
    add(a, b)
    expect(a.amountMinor).toBe(100n)
    expect(b.amountMinor).toBe(200n)
  })

  it('formats with symbol, thousands separator and sign', () => {
    expect(formatMoney(minorOf(123456n))).toBe('£1,234.56')
    expect(formatMoney(minorOf(-5n))).toBe('-£0.05')
    expect(formatMoney(must(moneyFromMinor(250n, 'EUR')))).toBe('€2.50')
    expect(formatMoney(must(moneyFromMinor(100n, 'JPY')))).toBe('¥100')
  })

  it('DTOs carry amounts as strings and round-trip exactly', () => {
    const m = minorOf(1234n)
    const dto = toDTO(m)
    expect(dto).toEqual({ amountMinor: '1234', currency: 'GBP' })
    expect(() => JSON.stringify(dto)).not.toThrow()
    expect(must(fromDTO(dto))).toEqual(m)
    expect(expectErr(fromDTO({ amountMinor: 1234, currency: 'GBP' }))).toBe('INVALID_AMOUNT_TYPE')
  })

  it('compare orders amounts', () => {
    expect(must(compare(minorOf(1n), minorOf(2n)))).toBe(-1)
    expect(must(compare(minorOf(2n), minorOf(2n)))).toBe(0)
    expect(must(compare(minorOf(3n), minorOf(2n)))).toBe(1)
  })

  it('sum of nothing is zero; sum refuses mixed currencies', () => {
    expect(minor(must(sum('GBP', [])))).toBe(0n)
    expect(expectErr(sum('GBP', [minorOf(1n), must(moneyFromMinor(1n, 'EUR'))]))).toBe('CURRENCY_MISMATCH')
  })
})
