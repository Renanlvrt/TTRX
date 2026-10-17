import { useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { ChevronDown, Droplets, ExternalLink, Flame, Pencil, Tv, Wifi, Zap } from 'lucide-react'
import { Button, Fine, Page, cx, gbp } from '../../components/ui'
import { AREAS } from '../../lib/types'
import type { BillId, BillsSurvey, Money } from '../../lib/types'
import { energyCostFor, estimateBills } from '../../lib/bills'
import { ENERGY_TARIFFS, tariffsFor } from '../../data/energyTariffs'
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
  electricity: <Zap size={20} />,
  gas: <Flame size={20} />,
  water: <Droplets size={20} />,
  broadband: <Wifi size={20} />,
  tv: <Tv size={20} />,
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
    <Page
      title="Your bills"
      subtitle={`${area?.label} · ${survey.people} ${survey.people === 1 ? 'person' : 'people'} · per person`}
    >
      <div className="rounded-3xl border border-highlight-strong bg-highlight p-5">
        <p className="text-2xl font-extrabold leading-tight tracking-tight md:text-3xl">{r.verdictText}</p>
        <div className={cx('mt-4 grid gap-3', r.package && 'grid-cols-2')}>
          {r.package && <WeekTile label="Bills package" money={r.package} weeks={weeks} cheaper={r.verdict === 'package'} />}
          <WeekTile label="Do it yourself" money={r.separate} weeks={weeks} cheaper={r.verdict === 'separate'} estimate />
        </div>
      </div>
      <div className="mt-2 text-right">
        <Button variant="ghost" size="md" onClick={onEdit}>
          <Pencil size={16} /> Edit answers
        </Button>
      </div>

      <section className="mt-8">
        <h2 className="text-xl font-bold">{r.verdict === 'package' ? 'Prefer to set bills up yourself?' : 'Set up & pay your bills'}</h2>
        <Fine className="mb-4">Cheapest first. One tap to each provider.</Fine>
        <div className="space-y-5">
          {providers.map((g) => (
            <div key={g.group}>
              <div className="mb-2 flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-slate-500">
                <span className="text-brand">{GROUP_ICON[g.group]}</span>
                {g.label}
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                {sortCheapestFirst(g.providers, survey).filter((_, i) => i === 0 || expanded.has(g.group)).map((p, i) => {
                  const best = i === 0 && g.providers.length > 1 && cheapestKnown(p, survey) != null
                  const link = primaryLink(p)
                  return (
                  <div key={p.id} className={cx('flex flex-col justify-between gap-3 rounded-2xl border p-5', best ? 'border-highlight-strong bg-highlight' : 'border-line')}>
                    <div>
                      <div className="flex items-center gap-2 text-lg font-semibold">
                        {p.name}
                        {best && <span className="rounded-full bg-highlight-strong px-2 py-0.5 text-xs font-bold">Cheapest</span>}
                      </div>
                      {p.group !== 'energy' && <div className="mt-0.5 text-sm text-slate-500">{p.tags.join(' · ')}</div>}
                      {p.group !== 'energy' && (p.priceText ? <div className="mt-2 text-base font-semibold">{p.priceText}</div> : <div className="mt-2 text-base font-semibold text-slate-400">Price shown after postcode</div>)}
                      {p.group === 'energy' && <TariffOptions survey={survey} supplierId={p.id} />}
                    </div>
                    <a
                      href={link.url}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex h-11 w-fit items-center gap-1.5 rounded-xl bg-brand px-4 text-sm font-semibold text-white transition hover:bg-brand-hover"
                    >
                      {link.label} <ExternalLink size={14} />
                    </a>
                  </div>
                  )
                })}
              </div>
              {g.providers.length > 1 && (
                <button type="button" onClick={() => toggleGroup(g.group)} className="mt-2 text-sm font-semibold text-slate-500 underline-offset-4 hover:text-slate-900 hover:underline">
                  {expanded.has(g.group) ? 'Show only the cheapest' : `Show all ${g.providers.length} options`}
                </button>
              )}
            </div>
          ))}
        </div>
      </section>

      <section className="mt-8">
        <h2 className="mb-3 text-xl font-bold">Your share, bill by bill</h2>
        <div className="divide-y divide-line rounded-3xl border border-line">
          {r.lines.map((l) => (
            <div key={l.id} className="flex items-center gap-3 px-4 py-3 sm:px-6">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-soft text-brand">{BILL_ICON[l.id]}</span>
              <span className="flex-1 text-lg font-semibold">{l.label}</span>
              {l.householdAnnualGBP == null ? (
                <span className="font-medium text-slate-400">unavailable</span>
              ) : (
                <span className="text-right leading-tight">
                  <span className="block text-lg font-bold tabular-nums">
                    {gbp(l.householdAnnualGBP / 52 / survey.people)}
                    <span className="text-sm font-semibold text-slate-500">/wk</span>
                  </span>
                  <span className="block text-xs text-slate-500 tabular-nums">{gbp(l.householdAnnualGBP)}/yr whole house</span>
                </span>
              )}
            </div>
          ))}
        </div>
      </section>

      <details className="group mt-4 rounded-3xl border border-line px-6 py-4">
        <summary className="flex cursor-pointer list-none items-center justify-between text-lg font-semibold [&::-webkit-details-marker]:hidden">
          How we estimated
          <ChevronDown size={20} className="text-slate-400 transition group-open:rotate-180" />
        </summary>
        <div className="mt-3 flex items-center gap-2 text-base text-slate-600">
          <label htmlFor="weeks">Tenancy length</label>
          <input
            id="weeks"
            type="number"
            min={1}
            max={104}
            value={weeksText}
            onChange={(e) => {
              setWeeksText(e.target.value)
              const n = Number(e.target.value)
              if (Number.isInteger(n) && n >= 1 && n <= 104) onTenancyChange(n)
            }}
            onBlur={() => setWeeksText(String(weeks))}
            className="h-10 w-20 rounded-xl border-2 border-line px-3 text-center font-semibold text-slate-900 outline-none focus:border-brand"
          />
          weeks
        </div>
        <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-slate-600">
          <li>Real Durham prices, checked {fmtDate(RATES_CHECKED)}.</li>
          <li>Usage scaled to your house and habits.</li>
          <li>One Durham listing prices bills at £20 pppw.</li>
          <li>Check any package's fair-use limits. We earn nothing from links.</li>
        </ul>
        <details className="mt-3">
          <summary className="cursor-pointer text-sm font-semibold text-slate-500 hover:text-slate-900">Show the maths</summary>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            {r.lines.map((l) => (
              <li key={l.id} className="text-xs leading-relaxed text-slate-500">
                <span className="font-semibold text-slate-700">{l.label}:</span> {l.assumption}
              </li>
            ))}
            {r.assumptions.map((a) => (
              <li key={a} className="text-xs leading-relaxed text-slate-500">
                {a}
              </li>
            ))}
            <li className="text-xs leading-relaxed text-slate-500">
              “up to” = Ofgem price cap (the most a standard variable tariff can charge); “≈” = from the supplier’s advertised saving vs the cap. {PACKAGE_BENCHMARK.text}{' '}
              <a href={PACKAGE_BENCHMARK.url} target="_blank" rel="noreferrer" className="underline underline-offset-2">Listing</a>
            </li>
          </ul>
        </details>
        <Fine className="mt-3">
          Sources:{' '}
          {r.lines
            .filter((l) => l.source)
            .map((l, i) => (
              <span key={l.id}>
                {i > 0 && ' · '}
                <a href={l.source} target="_blank" rel="noreferrer" className="underline underline-offset-2 hover:text-slate-900">
                  {l.label}
                </a>
              </span>
            ))}
        </Fine>
      </details>


      <section className="mt-8">
        <h2 className="mb-3 text-xl font-bold">Don&apos;t forget</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          {EXTRAS.map((x) => (
            <div key={x.id} className={cx('flex flex-col justify-between gap-3 rounded-2xl border p-5', x.id === 'councilTax' ? 'border-highlight-strong bg-highlight' : 'border-line')}>
              <div>
                <div className="text-sm font-bold uppercase tracking-wide text-slate-500">{x.title}</div>
                <div className="mt-1 text-lg font-bold">{x.headline}</div>
                <p className="mt-1 text-sm text-slate-600">{x.detail}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                {x.links.map((l, i) => (
                  <a
                    key={l.url}
                    href={l.url}
                    target="_blank"
                    rel="noreferrer"
                    className={cx('inline-flex h-10 items-center gap-1.5 rounded-xl px-4 text-sm font-semibold transition', i === 0 ? 'bg-brand text-white hover:bg-brand-hover' : 'border border-line bg-white hover:bg-slate-50')}
                  >
                    {l.label} <ExternalLink size={14} />
                  </a>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      <div className="no-print mt-10 text-center">
        <button type="button" onClick={onReset} className="text-sm font-medium text-slate-400 underline-offset-4 hover:text-slate-900 hover:underline">
          Reset compare bills
        </button>
      </div>
    </Page>
  )
}

/** Tariff rows for one energy supplier, costed for this household. Cheapest published/capped option overall is highlighted. */
function TariffOptions({ survey, supplierId }: { survey: BillsSurvey; supplierId: string }) {
  const costs = ENERGY_TARIFFS.filter((t) => t.rates).map((t) => energyCostFor(survey, t.rates!).perPersonWeek)
  const cheapest = Math.min(...costs)
  return (
    <ul className="mt-3 space-y-1.5">
      {tariffsFor(supplierId).map((t) => {
        const cost = t.rates ? energyCostFor(survey, t.rates) : null
        const best = cost && cost.perPersonWeek === cheapest
        return (
          <li key={t.name} className={cx('flex items-center justify-between gap-3 rounded-xl px-3 py-2 text-sm', best ? 'bg-highlight' : 'bg-slate-50')}>
            <span className="min-w-0">
              <span className="font-semibold">{t.name}</span>
            </span>
            {cost ? (
              <span className="shrink-0 text-right leading-tight">
                <span className="block font-bold">{t.basis === 'capMax' ? 'up to ' : t.basis === 'approx' ? '≈ ' : ''}{gbp(cost.perPersonWeek)}/wk</span>
                <span className="block text-xs text-slate-500">{gbp(cost.householdAnnual)}/yr house</span>
              </span>
            ) : (
              <span className="shrink-0 text-slate-400">Get a quote</span>
            )}
          </li>
        )
      })}
    </ul>
  )
}

/** Weekly cost per person; the cheaper side is solid green so it stands out. */
function WeekTile({ label, money, weeks, cheaper, estimate }: { label: string; money: Money; weeks: number; cheaper: boolean; estimate?: boolean }) {
  return (
    <div className={cx('min-w-0 rounded-2xl p-3 sm:p-4', cheaper ? 'bg-brand text-white' : 'bg-white')}>
      <div className={cx('text-xs font-bold uppercase tracking-wide', cheaper ? 'text-white/80' : 'text-slate-500')}>{label}</div>
      {cheaper && <div className="text-xs font-bold uppercase tracking-wide text-white">✓ Cheaper</div>}
      <div className="mt-1 whitespace-nowrap text-2xl font-extrabold tracking-tight sm:text-3xl">
        {estimate && <span className={cx('text-lg', cheaper ? 'text-white/70' : 'text-slate-400')}>~</span>}
        {gbp(money.perWeek)}
        <span className={cx('text-sm font-semibold', cheaper ? 'text-white/80' : 'text-slate-500')}>/wk</span>
      </div>
      <div className={cx('text-sm', cheaper ? 'text-white/80' : 'text-slate-500')}>{gbp(money.tenancy)} / {weeks} wks</div>
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
