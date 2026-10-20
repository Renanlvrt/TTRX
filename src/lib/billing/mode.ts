// Billing is a simulation. No real money moves and nothing leaves the device.
export const BILLING_MODE = 'sandbox' as const
export type BillingMode = 'sandbox' | 'live'
