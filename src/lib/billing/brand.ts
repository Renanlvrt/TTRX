export type Brand<T, B extends string> = T & { readonly __brand: B }

/** Canonical UTC instant: "YYYY-MM-DDTHH:mm:ss.sssZ". */
export type Instant = Brand<string, 'Instant'>
export type EmailDomain = Brand<string, 'EmailDomain'>
export type ReferralCode = Brand<string, 'ReferralCode'>
export type IdempotencyKey = Brand<string, 'IdempotencyKey'>
export type PartnerId = Brand<string, 'PartnerId'>
export type ContractId = Brand<string, 'ContractId'>
export type SignupId = Brand<string, 'SignupId'>
export type TransactionId = Brand<string, 'TransactionId'>
export type AccountId = Brand<string, 'AccountId'>
export type PseudonymousId = Brand<string, 'PseudonymousId'>
