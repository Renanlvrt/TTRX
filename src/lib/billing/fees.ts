// Pluggable fee schedules. Only a flat fee per signup ships; tiers, VAT and refunds are written up in docs/billing/deferred.
import type { ContractId, Instant, PartnerId } from './brand'
import type { Contract } from './attribution'
import type { Money } from './money'
import type { Result } from './result'
import { fail, ok } from './result'

export interface FeeContext { readonly contract: Contract; readonly partnerId: PartnerId; readonly signupAt: Instant }

export interface FeeQuote {
  readonly amount: Money
  readonly scheduleId: string
  readonly scheduleVersion: number
  readonly contractId: ContractId
  readonly basis: string
}

export interface FeeSchedule {
  readonly id: string
  readonly version: number
  computeFee(ctx: FeeContext): Result<FeeQuote>
}

export const flatFeePerSignup: FeeSchedule = Object.freeze({
  id: 'flat-per-signup',
  version: 1,
  computeFee(ctx: FeeContext): Result<FeeQuote> {
    const amount = ctx.contract.flatFee
    if (amount.amountMinor <= 0n) return fail('NON_POSITIVE_AMOUNT', 'a signup fee must be positive')
    return ok(Object.freeze({ amount, scheduleId: 'flat-per-signup', scheduleVersion: 1, contractId: ctx.contract.id, basis: 'flat fee per signup' }))
  },
})

export interface FeeScheduleRegistry { resolve(id: string): Result<FeeSchedule> }

export function createFeeScheduleRegistry(schedules: readonly FeeSchedule[]): Result<FeeScheduleRegistry> {
  const byId = new Map<string, FeeSchedule>()
  for (const s of schedules) {
    if (byId.has(s.id)) return fail('DUPLICATE_FEE_SCHEDULE', `fee schedule ${s.id} registered twice`)
    byId.set(s.id, s)
  }
  return ok(Object.freeze({
    resolve: (id: string): Result<FeeSchedule> => {
      const s = byId.get(id)
      return s ? ok(s) : fail('UNKNOWN_FEE_SCHEDULE', `no fee schedule ${id}`)
    },
  }))
}
