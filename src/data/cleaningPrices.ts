// End-of-tenancy clean, whole house, by bedrooms (Durham). Checked 2026-10-17 — see research/cleaning-prices.json.
// Tenancy.Cleaning's fixed Durham prices (1 bathroom) + £35 single oven, which it only includes for studios.
// Its "5 bed or more" band is "from £475", so 6 bedrooms uses the same band.
import type { PriceBand } from '../lib/cleaning'

const OVEN = 35

export const CLEANING_BANDS: PriceBand[] = [
  { bedrooms: 0, priceGBP: 135 },
  { bedrooms: 1, priceGBP: 175 + OVEN },
  { bedrooms: 2, priceGBP: 230 + OVEN },
  { bedrooms: 3, priceGBP: 325 + OVEN },
  { bedrooms: 4, priceGBP: 390 + OVEN },
  { bedrooms: 5, priceGBP: 475 + OVEN },
  { bedrooms: 6, priceGBP: 475 + OVEN },
]

export const CLEANING_BANDS_SOURCE = {
  label: 'Tenancy.Cleaning Durham prices + oven',
  url: 'https://tenancy.cleaning/end-of-tenancy-cleaning-durham/',
}

/** Verified context lines for the page. */
export const CLEANING_FACTS = {
  disputes: { text: 'Cleaning comes up in 54% of TDS deposit disputes (2024/25).', url: 'https://www.nrla.org.uk/news/what-2025-taught-us-about-deposit-disputes' },
  noProRequired: { text: "You don't have to pay for a professional clean, only return the house as you found it.", url: 'https://england.shelter.org.uk/housing_advice/tenancy_deposits/what_can_your_landlord_deduct_from_your_deposit' },
}
