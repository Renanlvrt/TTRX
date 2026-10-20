import type { BillingError, BillingErrorCode } from './errors'
import { billingError } from './errors'

export type Result<T, E = BillingError> =
  | { readonly ok: true; readonly value: T }
  | { readonly ok: false; readonly error: E }

export const ok = <T>(value: T): Result<T, never> => Object.freeze({ ok: true as const, value })
export const err = <E>(error: E): Result<never, E> => Object.freeze({ ok: false as const, error })

/** Shorthand for an error Result carrying a BillingError. */
export const fail = (code: BillingErrorCode, message: string, details?: Record<string, string>): Result<never, BillingError> =>
  err(billingError(code, message, details))
