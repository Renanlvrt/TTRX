import { describe, expect, it } from 'vitest'
import { createFeeScheduleRegistry, flatFeePerSignup } from './fees'
import { moneyFromMinor } from './money'
import { PTN_ALPHA, at, contracts, expectErr, money, must, stubSchedule } from './test-fixtures'

const ctx = (contract = contracts()[0]) => ({ contract, partnerId: PTN_ALPHA, signupAt: at(0) })

describe('flatFeePerSignup', () => {
  it('quotes the contract flat fee with schedule metadata, frozen', () => {
    const q = must(flatFeePerSignup.computeFee(ctx()))
    expect(q.amount.amountMinor).toBe(250n)
    expect(q.amount.currency).toBe('GBP')
    expect(q).toMatchObject({ scheduleId: 'flat-per-signup', scheduleVersion: 1, contractId: 'ctr_alpha' })
    expect(Object.isFrozen(q)).toBe(true)
  })

  it('quotes in the contract currency', () => {
    const q = must(flatFeePerSignup.computeFee(ctx({ ...contracts()[0], flatFee: money('3.00', 'EUR') })))
    expect(q.amount.currency).toBe('EUR')
    expect(q.amount.amountMinor).toBe(300n)
  })

  it('refuses a zero or negative fee even when the catalog was bypassed', () => {
    expect(expectErr(flatFeePerSignup.computeFee(ctx({ ...contracts()[0], flatFee: must(moneyFromMinor(0n, 'GBP')) })))).toBe('NON_POSITIVE_AMOUNT')
    expect(expectErr(flatFeePerSignup.computeFee(ctx({ ...contracts()[0], flatFee: must(moneyFromMinor(-1n, 'GBP')) })))).toBe('NON_POSITIVE_AMOUNT')
  })
})

describe('FeeScheduleRegistry', () => {
  it('reports unknown schedules and refuses duplicate ids', () => {
    const reg = must(createFeeScheduleRegistry([flatFeePerSignup]))
    expect(expectErr(reg.resolve('nope'))).toBe('UNKNOWN_FEE_SCHEDULE')
    expect(expectErr(createFeeScheduleRegistry([flatFeePerSignup, flatFeePerSignup]))).toBe('DUPLICATE_FEE_SCHEDULE')
  })

  it('resolves a pluggable schedule', () => {
    const reg = must(createFeeScheduleRegistry([flatFeePerSignup, stubSchedule]))
    const s = must(reg.resolve('stub'))
    expect(s.version).toBe(7)
    expect(must(s.computeFee(ctx())).amount.amountMinor).toBe(999n)
  })
})
