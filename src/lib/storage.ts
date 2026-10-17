// Storage recommender: pure, deterministic, no UI imports.
// Costs a box count + duration against each provider's published prices; unpriced providers stay as "Get a quote".

export type BoxSize = 'small' | 'medium' | 'large'
export const BOX_SIZES: BoxSize[] = ['small', 'medium', 'large']

export interface StorageNeeds {
  boxes: Record<BoxSize, number>
  weeks: number
}

export interface Price {
  amountGBP: number
  /** 'term' = one flat charge for the whole storage period. */
  per: 'day' | 'week' | 'month' | 'term'
}

export interface StoragePricing {
  providerId: string
  kind: 'box' | 'unit'
  /** Box services: price per box by size (null = size not offered / not published). */
  perBox?: Record<BoxSize, Price | null>
  /** Self-storage units: flat price, regardless of box count. */
  unit?: Price & { label: string }
  minimumChargeGBP?: number | null
  collectionFeeGBP?: number | null
  /** Longest period the price covers (e.g. a summer-only service). */
  maxWeeks?: number
}

export interface StorageOption {
  providerId: string
  /** Total for the whole period in £; null = needs a quote. */
  total: number | null
  perWeek: number | null
  /** What the total is made of, in plain English. */
  breakdown: string
  kind: 'box' | 'unit'
}

const WEEKS_PER_MONTH = 52 / 12
const round2 = (n: number) => Math.round(n * 100) / 100

/** Billing periods: days are exact, weeks and months are charged whole. */
export function periods(per: Price['per'], weeks: number): number {
  if (per === 'term') return 1
  if (per === 'day') return Math.round(weeks * 7)
  if (per === 'week') return Math.ceil(weeks)
  return Math.ceil(weeks / WEEKS_PER_MONTH - 1e-9)
}

export const totalBoxes = (n: StorageNeeds) => BOX_SIZES.reduce((s, k) => s + Math.max(0, n.boxes[k]), 0)

export function costOption(needs: StorageNeeds, p: StoragePricing): StorageOption {
  const weeks = Math.max(1, needs.weeks)
  const none = (breakdown: string): StorageOption => ({ providerId: p.providerId, total: null, perWeek: null, breakdown, kind: p.kind })

  if (p.maxWeeks && weeks > p.maxWeeks) return none(`Only covers up to ${p.maxWeeks} weeks`)

  let total = 0
  const parts: string[] = []
  const unitWord = (per: Price['per'], n: number) => (per === 'term' ? 'whole summer' : `${n} ${per}${n === 1 ? '' : 's'}`)
  if (p.kind === 'unit') {
    if (!p.unit) return none('Price on quote')
    const n = periods(p.unit.per, weeks)
    total = n * p.unit.amountGBP
    parts.push(`${p.unit.label}: ${unitWord(p.unit.per, n)} × £${p.unit.amountGBP.toFixed(2)}`)
  } else {
    if (!p.perBox) return none('Price on quote')
    for (const size of BOX_SIZES) {
      const count = Math.max(0, needs.boxes[size])
      if (!count) continue
      const price = p.perBox[size]
      if (!price) return none(`No published ${size} box price`)
      const n = periods(price.per, weeks)
      total += count * n * price.amountGBP
      parts.push(`${count} ${size} × ${unitWord(price.per, n)} × £${price.amountGBP.toFixed(2)}`)
    }
    if (p.collectionFeeGBP) {
      total += p.collectionFeeGBP
      parts.push(`collection £${p.collectionFeeGBP.toFixed(2)}`)
    }
    if (p.minimumChargeGBP && total < p.minimumChargeGBP) {
      total = p.minimumChargeGBP
      parts.push(`minimum charge £${p.minimumChargeGBP.toFixed(2)} applies`)
    }
  }
  total = round2(total)
  return { providerId: p.providerId, total, perWeek: round2(total / weeks), breakdown: parts.join(' + '), kind: p.kind }
}

/** Cheapest priced option is `best`; the rest (priced first, cheapest first; then quote-only) are alternatives. */
export function recommendStorage(needs: StorageNeeds, pricing: StoragePricing[]): { best: StorageOption | null; alternatives: StorageOption[] } {
  if (totalBoxes(needs) === 0) return { best: null, alternatives: [] }
  const options = pricing.map((p) => costOption(needs, p))
  const priced = options.filter((o) => o.total != null).sort((a, b) => a.total! - b.total!)
  const quote = options.filter((o) => o.total == null)
  const [best = null, ...rest] = priced
  return { best, alternatives: [...rest, ...quote] }
}
