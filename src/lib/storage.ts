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
  /** Box services with plan pricing: monthly price per box falls with plan length. The shortest plan covering the period is used. */
  plans?: Record<BoxSize, Plan[] | null>
  /** Self-storage units: flat price, regardless of box count. */
  unit?: Price & { label: string }
  /** Minimum charge for the storage itself (before fees). */
  minimumChargeGBP?: number | null
  /** One-off charges on top of storage, e.g. collection and return. perItem = charged per box. */
  fees?: Fee[]
  /** Longest period the price covers (e.g. a summer-only service). */
  maxWeeks?: number
}

export interface Plan {
  months: number
  monthlyGBP: number
}

export interface Fee {
  label: string
  amountGBP: number
  /** Charged per box. */
  perItem?: boolean
  /** Charged per box at a size-specific price (amountGBP ignored). */
  bySize?: Record<BoxSize, number>
  /** Only charged when storing for fewer weeks than this (e.g. early retrieval). */
  onlyIfWeeksUnder?: number
}

export interface StorageOption {
  providerId: string
  /** Total for the whole period in £; null = needs a quote. */
  total: number | null
  perWeek: number | null
  /** What the total is made of, in plain English. */
  breakdown: string
  /** Storage part of the total (after any minimum charge), and each fee added on top. */
  storageGBP: number | null
  /** How storage is billed, matching the provider's own checkout, e.g. "£23.90/month × 4". null when mixed or a minimum applies. */
  rate: string | null
  feeLines: { label: string; amountGBP: number }[]
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
  const none = (breakdown: string): StorageOption => ({ providerId: p.providerId, total: null, perWeek: null, breakdown, kind: p.kind, storageGBP: null, rate: null, feeLines: [] })

  if (p.maxWeeks && weeks > p.maxWeeks) return none(`Only covers up to ${p.maxWeeks} weeks`)

  let total = 0
  const parts: string[] = []
  const unitWord = (per: Price['per'], n: number) => (per === 'term' ? 'whole summer' : `${n} ${per}${n === 1 ? '' : 's'}`)
  // Combined billing rate across all boxes (e.g. £23.90 per month), when every box bills the same way.
  let rateGBP = 0
  let ratePer: Price['per'] | null = null
  let rateN = 0
  let rateOk = true
  const addRate = (amount: number, per: Price['per'], n: number) => {
    if (ratePer && (ratePer !== per || rateN !== n)) rateOk = false
    ratePer = per
    rateN = n
    rateGBP += amount
  }
  if (p.kind === 'unit') {
    if (!p.unit) return none('Price on quote')
    const n = periods(p.unit.per, weeks)
    total = n * p.unit.amountGBP
    addRate(p.unit.amountGBP, p.unit.per, n)
    parts.push(`${p.unit.label}: ${unitWord(p.unit.per, n)} × £${p.unit.amountGBP.toFixed(2)}`)
  } else {
    if (p.plans) {
      const months = periods('month', weeks)
      for (const size of BOX_SIZES) {
        const count = Math.max(0, needs.boxes[size])
        if (!count) continue
        const plans = p.plans[size]
        if (!plans?.length) return none(`No published ${size} box price`)
        const plan = [...plans].sort((a, b) => a.months - b.months).find((pl) => pl.months >= months) ?? plans[plans.length - 1]
        total += count * months * plan.monthlyGBP
        addRate(count * plan.monthlyGBP, 'month', months)
        parts.push(`${count} ${size} × ${months} month${months === 1 ? '' : 's'} × £${plan.monthlyGBP.toFixed(2)} (${plan.months}-month plan)`)
      }
    } else if (!p.perBox) return none('Price on quote')
    else for (const size of BOX_SIZES) {
      const count = Math.max(0, needs.boxes[size])
      if (!count) continue
      const price = p.perBox[size]
      if (!price) return none(`No published ${size} box price`)
      const n = periods(price.per, weeks)
      total += count * n * price.amountGBP
      addRate(count * price.amountGBP, price.per, n)
      parts.push(`${count} ${size} × ${unitWord(price.per, n)} × £${price.amountGBP.toFixed(2)}`)
    }
    if (p.minimumChargeGBP && total < p.minimumChargeGBP) {
      total = p.minimumChargeGBP
      rateOk = false
      parts.push(`minimum £${p.minimumChargeGBP.toFixed(2)} applies`)
    }
  }
  const storageGBP = round2(total)
  const rate =
    rateOk && ratePer
      ? ratePer === 'term'
        ? `£${rateGBP.toFixed(2)} for the summer`
        : `£${rateGBP.toFixed(2)}/${ratePer} × ${rateN}`
      : null
  const items = totalBoxes(needs)
  const feeLines = (p.fees ?? [])
    .filter((f) => !f.onlyIfWeeksUnder || weeks < f.onlyIfWeeksUnder)
    .map((f) => {
      if (f.bySize) return { label: f.label, amountGBP: round2(BOX_SIZES.reduce((sum, k) => sum + Math.max(0, needs.boxes[k]) * f.bySize![k], 0)) }
      return {
        label: f.perItem ? `${f.label} (${items} × £${f.amountGBP.toFixed(2)})` : f.label,
        amountGBP: round2(f.perItem ? f.amountGBP * items : f.amountGBP),
      }
    })
  for (const f of feeLines) {
    total += f.amountGBP
    parts.push(`${f.label} £${f.amountGBP.toFixed(2)}`)
  }
  total = round2(total)
  return { providerId: p.providerId, total, perWeek: round2(total / weeks), breakdown: parts.join(' + '), kind: p.kind, storageGBP, rate, feeLines }
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
