import { useMemo, useState } from 'react'
import { Button, Page, cx, gbp } from '../../components/ui'
import type { BillsSurvey, Money } from '../../lib/types'
import { estimateBills } from '../../lib/bills'
import { energyOffers, exactCount } from '../../lib/energyMatch'
import type { EnergyOffer } from '../../lib/energyMatch'
import { ACTIVE_SUPPLIERS } from '../../data/energyTariffs'
import { EXTRAS, PACKAGE_BENCHMARK } from '../../data/extras'
import { providersFor } from '../../data/billProviders'
import type { BillProvider } from '../../data/billProviders'
import { RATES_CHECKED } from '../../data/rates'

export default function Results({ survey, onEdit, onReset, onTenancyChange }: { survey: BillsSurvey; onEdit: () => void; onReset: () => void; onTenancyChange: (weeks: number) => void }) {
  const r = useMemo(() => estimateBills(survey), [survey])
  const weeks = survey.tenancyWeeks
  const [weeksText, setWeeksText] = useState(String(weeks))
  const providers = providersFor(survey.area, survey)
  const [expanded, setExpanded] = useState<Set<string>>(new Set())
  const toggleGroup = (g: string) => setExpanded((prev) => { const next = new Set(prev); if (next.has(g)) next.delete(g); else next.add(g); return next })

  return (
    <Page title="Your bills">
      <div className="rounded-lg border border-highlight-strong bg-highlight p-5">
        <p className="text-2xl font-display font-semibold leading-tight md:text-3xl">{r.verdictText}</p>
        <div className={cx('mt-4 grid gap-3', r.package && 'grid-cols-2')}>
          {r.package && <WeekTile label="Bills package" money={r.package} cheaper={r.verdict === 'package'} />}
          <WeekTile label="Do it yourself" money={r.separate} cheaper={r.verdict === 'separate'} estimate />
        </div>
      </div>
      <div className="mt-2 text-right">
        <Button variant="ghost" size="md" onClick={onEdit}>
          Edit answers
        </Button>
      </div>

      <section className="mt-8">
        <h2 className="mb-4 text-xl font-bold">{r.verdict === 'package' ? 'Prefer to set bills up yourself?' : 'Set up your bills'}</h2>
        <div className="space-y-5">
          {providers.map((g) => {
            if (g.group === 'energy') return <EnergyGroup key={g.group} label={g.label} survey={survey} providers={g.providers} />
            const sorted = sortCheapestFirst(g.providers)
            const shown = expanded.has(g.group) ? sorted : sorted.slice(0, 1)
            return (
              <div key={g.group}>
                <div className="mb-2 text-sm font-semibold text-muted">
                  {g.label}
                </div>
                <div className="divide-y divide-line rounded-md border border-line bg-card">
                  {shown.map((p) => {
                    const link = primaryLink(p)
                    return (
                      <div key={p.id} className="flex items-center justify-between gap-3 p-4">
                        <div className="min-w-0">
                          <div className="text-lg font-semibold">{p.name}</div>
                          <div className="text-sm text-muted">{priceLine(p)}</div>
                        </div>
                        <a
                          href={link.url}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex h-11 shrink-0 items-center gap-1.5 rounded-md bg-brand px-4 text-sm font-semibold text-on-brand transition hover:bg-brand-hover"
                        >
                          {link.label}
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

      <details className="group mt-8 rounded-lg border border-line bg-card px-5 py-3">
        <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between text-lg font-semibold [&::-webkit-details-marker]:hidden">
          Details
        </summary>

        <h3 className="mt-3 text-base font-semibold">Your share, bill by bill</h3>
        <div className="mt-1 divide-y divide-line">
          {r.lines.map((l) => (
            <div key={l.id} className="flex items-center gap-3 py-2">
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
                    {l.label}
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
              “Up to” = Ofgem price cap, the most a standard variable tariff can charge. {PACKAGE_BENCHMARK.text}{' '}
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

/** Gas and electricity: only suppliers confirmed to take this house's meter, cheapest exact price first. */
function EnergyGroup({ label, survey, providers }: { label: string; survey: BillsSurvey; providers: BillProvider[] }) {
  const [all, setAll] = useState(false)
  const offers = energyOffers(survey, new Date().toISOString().slice(0, 10))
  const shown = all ? offers : offers.slice(0, 1)
  const site = (id: string) => providers.find((p) => p.id === id)
  return (
    <div>
      <div className="mb-2 text-sm font-semibold text-muted">{label}</div>
      <div className="divide-y divide-line rounded-md border border-line bg-card">
        {shown.map((o) => {
          const p = site(o.supplierId)
          if (!p) return null
          return (
            <div key={o.supplierId} className="flex items-center justify-between gap-3 p-4">
              <div className="min-w-0">
                <div className="text-lg font-semibold">{p.name}</div>
                <div className="text-sm text-muted">{offerLine(o)}</div>
              </div>
              <a
                href={p.website}
                target="_blank"
                rel="noreferrer"
                className="inline-flex h-11 shrink-0 items-center rounded-md bg-brand px-4 text-sm font-semibold text-on-brand transition hover:bg-brand-hover"
              >
                {o.route === 'online' ? 'Join online' : 'Contact to join'}
              </a>
            </div>
          )
        })}
      </div>
      {offers.length > 1 && (
        <button type="button" onClick={() => setAll(!all)} className="mt-1 min-h-11 text-sm font-semibold text-muted underline-offset-4 hover:text-ink hover:underline">
          {all ? 'Show only the cheapest' : `Show all ${offers.length} options`}
        </button>
      )}
      <p className="mt-1 text-xs text-subtle">
        Exact prices from {exactCount(offers)} of {ACTIVE_SUPPLIERS.value} suppliers. Only suppliers that take your meter.
      </p>
    </div>
  )
}

function offerLine(o: EnergyOffer): string {
  const extra = [o.exitFeePerFuel ? `£${o.exitFeePerFuel}/fuel exit fee` : null, o.note].filter(Boolean).join(' · ')
  if (o.noPrice === 'nightRate') return ['Night-rate price on quote', o.note].filter(Boolean).join(' · ')
  if (o.noPrice === 'gasOnQuote') return ['Gas price on quote', o.note].filter(Boolean).join(' · ')
  if (o.perPersonWeek == null) return ['Price on quote', o.note].filter(Boolean).join(' · ')
  const price = `${o.basis === 'capMax' ? 'Up to ' : ''}${gbp(o.perPersonWeek)}/wk each`
  return [price, o.basis === 'published' ? o.tariff : null, extra].filter(Boolean).join(' · ')
}

/** One short price line per provider: the advertised price. */
function priceLine(p: BillProvider): string {
  return p.priceText ?? 'Price shown after postcode'
}

/** Weekly cost per person; the cheaper side is solid silver so it stands out. */
function WeekTile({ label, money, cheaper, estimate }: { label: string; money: Money; cheaper: boolean; estimate?: boolean }) {
  return (
    <div className={cx('min-w-0 rounded-md p-3 sm:p-4', cheaper ? 'bg-brand text-on-brand' : 'bg-card')}>
      <div className={cx('text-sm font-semibold', cheaper ? 'text-on-brand' : 'text-muted')}>{label}</div>
      <div className="mt-1 whitespace-nowrap text-2xl font-display font-semibold sm:text-3xl">
        {estimate && <span className={cx('text-lg', cheaper ? 'text-on-brand/70' : 'text-subtle')}>~</span>}
        {gbp(money.perWeek)}
        <span className={cx('text-sm font-semibold', cheaper ? 'text-on-brand/70' : 'text-muted')}>/wk</span>
      </div>
    </div>
  )
}

/** Advertised monthly price, used to sort non-energy providers. */
function cheapestKnown(p: BillProvider): number | null {
  const m = p.priceText?.match(/£([\d.]+)/)
  return m ? Number(m[1]) : null
}

function sortCheapestFirst(list: BillProvider[]): BillProvider[] {
  const key = (p: BillProvider) => cheapestKnown(p) ?? Infinity
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
