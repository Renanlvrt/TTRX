// Error vocabulary. Expected failures travel as Result values; InvariantError is for bugs and bad config only.

export type BillingErrorCode =
  | 'INVALID_AMOUNT' | 'INVALID_AMOUNT_TYPE' | 'AMOUNT_OUT_OF_RANGE' | 'UNSUPPORTED_CURRENCY' | 'CURRENCY_MISMATCH'
  | 'INVALID_RATIO' | 'INVALID_WEIGHTS' | 'NON_POSITIVE_AMOUNT' | 'INVALID_INSTANT' | 'INVALID_EMAIL' | 'INVALID_REFERRAL_CODE'
  | 'INVALID_IDEMPOTENCY_KEY' | 'UNEXPECTED_FIELD' | 'INVALID_REQUEST' | 'TOO_FEW_ENTRIES' | 'UNBALANCED_TRANSACTION'
  | 'DUPLICATE_TRANSACTION_ID' | 'ALREADY_REVERSED' | 'UNKNOWN_TRANSACTION' | 'PII_REJECTED' | 'DUPLICATE_REFERRAL_CODE'
  | 'DUPLICATE_EMAIL_DOMAIN' | 'FORBIDDEN_DOMAIN' | 'UNKNOWN_PARTNER' | 'INVALID_CONTRACT_WINDOW' | 'OVERLAPPING_CONTRACTS'
  | 'UNKNOWN_FEE_SCHEDULE' | 'DUPLICATE_FEE_SCHEDULE' | 'IDEMPOTENCY_KEY_REUSED' | 'IDEMPOTENCY_IN_PROGRESS'
  | 'VERSION_CONFLICT' | 'DUPLICATE_STUDENT' | 'AUDIT_CHAIN_BROKEN'

export interface BillingError {
  readonly code: BillingErrorCode
  readonly message: string
  readonly details?: Readonly<Record<string, string>>
}

export function billingError(code: BillingErrorCode, message: string, details?: Record<string, string>): BillingError {
  return Object.freeze(details ? { code, message, details: Object.freeze({ ...details }) } : { code, message })
}

export class InvariantError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'InvariantError'
  }
}
