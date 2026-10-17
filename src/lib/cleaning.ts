// Move-out cleaning advice: pure, deterministic, no UI imports.
// Answers "pay a cleaner or risk the deposit?" from house size, deposit and how many items the move-out photos flagged.

export interface PriceBand {
  bedrooms: number
  priceGBP: number
}

/** Up to this many flagged items is a manageable DIY job. */
export const DIY_MAX_ITEMS = 2

/** Whole-house professional clean for a bedroom count. Beyond the table, extend by the last step per bedroom. */
export function estimateCleanCost(bedrooms: number, bands: PriceBand[]): number {
  const sorted = [...bands].sort((a, b) => a.bedrooms - b.bedrooms)
  const exact = sorted.find((b) => b.bedrooms === bedrooms)
  if (exact) return exact.priceGBP
  const lower = [...sorted].reverse().find((b) => b.bedrooms < bedrooms)
  const upper = sorted.find((b) => b.bedrooms > bedrooms)
  if (lower && upper) {
    const t = (bedrooms - lower.bedrooms) / (upper.bedrooms - lower.bedrooms)
    return Math.round(lower.priceGBP + t * (upper.priceGBP - lower.priceGBP))
  }
  if (!lower) return sorted[0].priceGBP
  const prev = sorted[sorted.length - 2]
  const step = prev ? (lower.priceGBP - prev.priceGBP) / (lower.bedrooms - prev.bedrooms) : 0
  return Math.round(lower.priceGBP + step * (bedrooms - lower.bedrooms))
}

export type CleaningVerdict = 'nothing' | 'diy' | 'hire' | 'diyCheaper'

export interface CleaningAdvice {
  verdict: CleaningVerdict
  headline: string
  detail: string
  houseCostGBP: number
  perPersonCostGBP: number
}

const gbp = (n: number) => '£' + Math.round(n).toLocaleString('en-GB')

export function cleaningAdvice(input: {
  bedrooms: number
  people: number
  depositPerPersonGBP: number
  dirtyItems: number
  bands: PriceBand[]
}): CleaningAdvice {
  const people = Math.max(1, Math.round(input.people))
  const houseCostGBP = estimateCleanCost(Math.max(0, Math.round(input.bedrooms)), input.bands)
  const perPersonCostGBP = houseCostGBP / people
  const deposit = Math.max(0, input.depositPerPersonGBP)
  const base = { houseCostGBP, perPersonCostGBP }
  const each = `${gbp(perPersonCostGBP)} each`

  if (input.dirtyItems === 0) {
    return {
      ...base,
      verdict: 'nothing',
      headline: 'Nothing new to clean. Do a quick tidy yourself.',
      detail: `Your move-out photos match move-in. Use the checklist and keep the ${gbp(houseCostGBP)} a cleaner would cost.`,
    }
  }
  if (input.dirtyItems <= DIY_MAX_ITEMS) {
    return {
      ...base,
      verdict: 'diy',
      headline: `Only ${input.dirtyItems} thing${input.dirtyItems === 1 ? '' : 's'} to fix. Clean it yourself.`,
      detail: `That's an afternoon's work. A cleaner would cost ${each}; tick through the checklist instead.`,
    }
  }
  if (perPersonCostGBP < deposit) {
    return {
      ...base,
      verdict: 'hire',
      headline: `Book a cleaner: about ${each}, less than the ${gbp(deposit)} deposit at risk.`,
      detail: `${input.dirtyItems} items need serious cleaning, which is too much to do well yourself. Left dirty, the landlord can deduct cleaning costs from your deposit.`,
    }
  }
  return {
    ...base,
    verdict: 'diyCheaper',
    headline: `A cleaner (${each}) costs more than your ${gbp(deposit)} deposit. Clean it yourselves.`,
    detail: `${input.dirtyItems} items need cleaning. Split them between housemates using the checklist.`,
  }
}
