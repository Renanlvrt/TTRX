import { useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { ChevronDown, Droplets, ExternalLink, Flame, Pencil, Tv, Wifi, Zap } from 'lucide-react'
import { Button, Page, cx, gbp } from '../../components/ui'
import { AREAS } from '../../lib/types'
import type { BillId, BillsSurvey, Money } from '../../lib/types'
import { energyCostFor, estimateBills } from '../../lib/bills'
import { tariffsFor } from '../../data/energyTariffs'
import { EXTRAS, PACKAGE_BENCHMARK } from '../../data/extras'
import { providersFor } from '../../data/billProviders'
import type { BillGroup, BillProvider } from '../../data/billProviders'
import { RATES_CHECKED } from '../../data/rates'

const GROUP_ICON: Record<BillGroup, ReactNode> = {
  energy: <Zap size={16} />,
  water: <Droplets size={16} />,
  broadband: <Wifi size={16} />,
  tv: <Tv size={16} />,
}

const BILL_ICON: Record<BillId, ReactNode> = {
  electricity: <Zap size={18} />,
  gas: <Flame size={18} />,
  water: <Droplets size={18} />,
  broadband: <Wifi size={18} />,
  tv: <Tv size={18} />,
}

export default function Results({ survey, onEdit, onReset, onTenancyChange }: { survey: BillsSurvey; onEdit: () => void; onReset: () => void; onTenancyChange: (weeks: number) => void }) {
  const r = useMemo(() => estimateBills(survey), [survey])
  const weeks = survey.tenancyWeeks
  const [weeksText, setWeeksText] = useState(String(weeks))
  const area = AREAS.find((a) => a.id === survey.area)
  const providers = providersFor(survey.area, survey)
  const [expanded, setExpanded] = useState<Set<string>>(new Set())
  const toggleGroup = (g: string) => setExpanded((prev) => { const next = new Set(prev); if (next.has(g)) next.delete(g); else next.add(g); return next })

  return (
    <Page title="Your bills" subtitle={`${area?.label}, ${survey.people} ${survey.people === 1 ? 'person' : 'people'}`}>
      <div className="rounded-lg border border-highlight-strong bg-highlight p-5">
        <p className="text-2xl font-display font-semibold leading-tight md:text-3xl">{r.verdictText}</p>
        <div className={cx('mt-4 grid gap-3', r.package && 'grid-cols-2')}>
          {r.package && <WeekTile label="Bills package" money={r.package} cheaper={r.verdict === 'package'} />}
          <WeekTile label="Do it yourself" money={r.separate} cheaper={r.verdict === 'separate'} estimate />
        </div>
      </div>
      <div className="mt-2 text-right">
        <Button variant="ghost" size="md" onClick={onEdit}>
          <Pencil size={16} /> Edit answers
        </Button>
      </div>

      <section className="mt-8">
        <h2 className="mb-4 text-xl font-bold">{r.verdict === 'package' ? 'Prefer to set bills up yourself?' : 'Set up your bills'}</h2>
        <div className="space-y-5">
          {providers.map((g) => {
            const sorted = sortCheapestFirst(g.providers, survey)
            const shown = expanded.has(g.group) ? sorted : sorted.slice(0, 1)
            return (
              <div key={g.group}>
                <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-muted">
                  <span className="text-brand">{GROUP_ICON[g.group]}</span>
                  {g.label}
                </div>
                <div className="divide-y divide-line rounded-md border border-line bg-white">
                  {shown.map((p) => {
                    const link = primaryLink(p)
                    return (
                      <div key={p.id} className="flex items-center justify-between gap-3 p-4">
                        <div className="min-w-0">
                          <div className="text-lg font-semibold">{p.name}</div>
                          <div className="text-sm text-muted">{priceLine(p, survey)}</div>
                        </div>
                        <a
                          href={link.url}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex h-11 shrink-0 items-center gap-1.5 rounded-md bg-brand px-4 text-sm font-semibold text-white transition hover:bg-brand-hover"
                        >
                          {link.label} <ExternalLink size={14} />
                        </a>
                      </div>
                    )
                  })}
                </div>
                {g.providers.length > 1 && (
                  <button type="button" onClick={() => toggleGroup(g.group)} className="mt-1 min-h-11 text-sm font-semibold text-muted underline-offset-4 hover:text-ink hover:underline">
                    {expanded.has(g.group) ? 'Show only the cheapest' : `Show all ${g.providers.length} options`}
                  </button>
                )}
              </div>
            )
          })}
        </div>
      </section>

      <details className="group mt-8 rounded-lg border border-line bg-white px-5 py-3">
        <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between text-lg font-semibold [&::-webkit-details-marker]:hidden">
          Details
          <ChevronDown size={20} className="text-subtle transition group-open:rotate-180" />
        </summary>

        <h3 className="mt-3 text-base font-semibold">Your share, bill by bill</h3>
        <div className="mt-1 divide-y divide-line">
          {r.lines.map((l) => (
            <div key={l.id} className="flex items-center gap-3 py-2">
              <span className="text-brand">{BILL_ICON[l.id]}</span>
              <span className="flex-1 font-semibold">{l.label}</span>
              {l.householdAnnualGBP == null ? (
                <span className="text-subtle">unavailable</span>
              ) : (
                <span className="font-semibold tabular-nums">{gbp(l.householdAnnualGBP / 52 / survey.people)}/wk</span>
              )}
            </div>
          ))}
        </div>

        <div className="mt-4 flex items-center gap-2 text-base text-muted">
          <label htmlFor="weeks">Tenancy length</label>
          <input
            id="weeks"
            type="number"
            inputMode="numeric"
            min={1}
            max={104}
            value={weeksText}
            onChange={(e) => {
              setWeeksText(e.target.value)
              const n = Number(e.target.value)
              if (Number.isInteger(n) && n >= 1 && n <= 104) onTenancyChange(n)
            }}
            onBlur={() => setWeeksText(String(weeks))}
            className="h-11 w-20 rounded-md border-2 border-field-border px-3 text-center font-semibold text-ink outline-none focus:border-brand focus:ring-2 focus:ring-brand focus:ring-offset-1"
          />
          weeks
        </div>

        <h3 className="mt-5 text-base font-semibold">Also sort out</h3>
        <div className="mt-1 space-y-2">
          {EXTRAS.map((x) => (
            <div key={x.id}>
              <div className="font-semibold">{x.title}: {x.headline}</div>
              <div className="flex flex-wrap gap-x-4">
                {x.links.map((l) => (
                  <a key={l.url} href={l.url} target="_blank" rel="noreferrer" className="inline-flex min-h-11 items-center gap-1 text-sm font-semibold text-brand underline-offset-4 hover:underline">
                    {l.label} <ExternalLink size={12} />
                  </a>
                ))}
              </div>
            </div>
          ))}
        </div>

        <details className="mt-3">
          <summary className="flex min-h-11 cursor-pointer items-center text-sm font-semibold text-muted hover:text-ink">How we estimated</summary>
          <ul className="mt-1 list-disc space-y-1 pl-5 text-xs leading-relaxed text-muted">
            <li>Real Durham prices, checked {fmtDate(RATES_CHECKED)}.</li>
            {r.lines.map((l) => (
              <li key={l.id}>
                <span className="font-semibold text-ink">{l.label}:</span> {l.assumption}
              </li>
            ))}
            {r.assumptions.map((a) => (
              <li key={a}>{a}</li>
            ))}
            <li>
              “up to” = Ofgem price cap; “≈” = from the supplier’s advertised saving vs the cap. {PACKAGE_BENCHMARK.text}{' '}
              <a href={PACKAGE_BENCHMARK.url} target="_blank" rel="noreferrer" className="underline underline-offset-2">Listing</a>
            </li>
            <li>
              Sources:{' '}
              {r.lines
                .filter((l) => l.source)
                .map((l, i) => (
                  <span key={l.id}>
                    {i > 0 && ', '}
                    <a href={l.source} target="_blank" rel="noreferrer" className="underline underline-offset-2 hover:text-ink">
                      {l.label}
                    </a>
                  </span>
                ))}
            </li>
          </ul>
        </details>

        <button type="button" onClick={onReset} className="no-print min-h-11 text-sm font-medium text-subtle underline-offset-4 hover:text-ink hover:underline">
          Reset compare bills
        </button>
      </details>
    </Page>
  )
}

/** One short price line per provider: the best energy tariff for this house, or the advertised price. */
function priceLine(p: BillProvider, survey: BillsSurvey): string {
  if (p.group === 'energy') {
    const best = cheapestKnown(p, survey)
    return best == null ? 'Price on quote' : `From ${gbp(best)}/wk each`
  }
  return p.priceText ?? 'Price shown after postcode'
}

/** Weekly cost per person; the cheaper side is solid Palatinate so it stands out. */
function WeekTile({ label, money, cheaper, estimate }: { label: string; money: Money; cheaper: boolean; estimate?: boolean }) {
  return (
    <div className={cx('min-w-0 rounded-md p-3 sm:p-4', cheaper ? 'bg-brand text-white' : 'bg-white')}>
      <div className={cx('text-sm font-semibold', cheaper ? 'text-white' : 'text-muted')}>{label}</div>
      <div className="mt-1 whitespace-nowrap text-2xl font-display font-semibold sm:text-3xl">
        {estimate && <span className={cx('text-lg', cheaper ? 'text-white/80' : 'text-subtle')}>~</span>}
        {gbp(money.perWeek)}
        <span className={cx('text-sm font-semibold', cheaper ? 'text-white/80' : 'text-muted')}>/wk</span>
      </div>
    </div>
  )
}

/** Cheapest known weekly price for a provider (energy: best tariff for this house; others: their advertised monthly price). */
function cheapestKnown(p: BillProvider, survey: BillsSurvey): number | null {
  if (p.group === 'energy') {
    const costs = tariffsFor(p.id).filter((t) => t.rates).map((t) => energyCostFor(survey, t.rates!).perPersonWeek)
    return costs.length ? Math.min(...costs) : null
  }
  const m = p.priceText?.match(/£([\d.]+)/)
  return m ? Number(m[1]) : null
}

function sortCheapestFirst(list: BillProvider[], survey: BillsSurvey): BillProvider[] {
  const key = (p: BillProvider) => cheapestKnown(p, survey) ?? Infinity
  return [...list].sort((a, b) => key(a) - key(b))
}

/** One link per provider: the quote page when there is one, otherwise their sign-up/setup page. */
function primaryLink(p: BillProvider): { url: string; label: string } {
  if (p.secondary && /quote/i.test(p.secondary.label)) return { url: p.secondary.url, label: 'Get a quote' }
  if (p.group === 'energy') return { url: p.website, label: 'Get a quote' }
  return { url: p.website, label: p.cta }
}

function fmtDate(iso: string) {
  return new Date(iso + 'T00:00:00').toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}
