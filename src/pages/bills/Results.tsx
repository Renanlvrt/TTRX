import { useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { ChevronDown, Droplets, ExternalLink, Flame, Pencil, Tv, Wifi, Zap } from 'lucide-react'
import { Button, Card, Fine, Page, Stat, cx, gbp } from '../../components/ui'
import { AREAS } from '../../lib/types'
import type { BillId, BillsSurvey } from '../../lib/types'
import { estimateBills } from '../../lib/bills'
import { providersFor } from '../../data/billProviders'
import type { BillGroup } from '../../data/billProviders'
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
  const sub = (m: { perMonth: number; tenancy: number }) => `${gbp(m.perMonth)}/month · ${gbp(m.tenancy)} over ${weeks} wks`

  return (
    <Page
      title="Your bills"
      subtitle={`${area?.label} · ${survey.people} ${survey.people === 1 ? 'person' : 'people'} · per person`}
      actions={
        <>
          <Button variant="secondary" size="md" onClick={onEdit}>
            <Pencil size={16} /> Edit answers
          </Button>
          <Link to="/" className="inline-flex h-11 items-center justify-center rounded-2xl bg-brand px-5 text-base font-semibold text-white transition hover:bg-brand-hover">
            Done
          </Link>
        </>
      }
    >
      <Card highlight>
        <p className="text-3xl font-extrabold leading-tight tracking-tight">{r.verdictText}</p>
        <Fine className="mt-2 text-slate-600">Estimate under the assumptions below. Prices checked {fmtDate(RATES_CHECKED)}.</Fine>
      </Card>

      <div className={cx('mt-4 grid gap-4', r.package && 'md:grid-cols-2')}>
        {r.package && <Stat label={r.verdict === 'package' ? 'Bills package · cheaper' : 'Bills package'} value={`${gbp(r.package.perWeek)}/wk`} sub={sub(r.package)} />}
        <Stat label={r.verdict === 'separate' ? 'Arrange yourself (est.) · cheaper' : 'Arrange yourself (est.)'} value={`${gbp(r.separate.perWeek)}/wk`} sub={sub(r.separate)} />
      </div>

      <div className="mt-4 flex items-center justify-end gap-2 text-base text-slate-500">
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

      <section className="mt-8">
        <h2 className="text-xl font-bold">{r.verdict === 'package' ? 'Prefer to set bills up yourself?' : 'Set up & pay your bills'}</h2>
        <Fine className="mb-4">Straight to each provider. Moving in? Use their moving-in page, not "switch".</Fine>
        <div className="space-y-5">
          {providers.map((g) => (
            <div key={g.group}>
              <div className="mb-2 flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-slate-500">
                <span className="text-brand">{GROUP_ICON[g.group]}</span>
                {g.label}
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                {g.providers.map((p) => (
                  <div key={p.id} className="flex flex-col justify-between gap-3 rounded-2xl border border-line p-5">
                    <div>
                      <div className="text-lg font-semibold">{p.name}</div>
                      <div className="mt-0.5 text-sm text-slate-500">{p.tags.join(' · ')}</div>
                      {p.priceText && <div className="mt-2 text-base font-semibold">{p.priceText}</div>}
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <a
                        href={p.website}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex h-11 items-center gap-1.5 rounded-xl bg-brand px-4 text-sm font-semibold text-white transition hover:bg-brand-hover"
                      >
                        {p.cta} <ExternalLink size={14} />
                      </a>
                      {p.secondary && (
                        <a
                          href={p.secondary.url}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex h-11 items-center gap-1.5 rounded-xl border border-line px-4 text-sm font-semibold transition hover:bg-slate-50"
                        >
                          {p.secondary.label} <ExternalLink size={14} />
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
        <Fine className="mt-3">Links checked {fmtDate(RATES_CHECKED)}. Prices shown only where the provider states them; we earn nothing from these links.</Fine>
      </section>

      <section className="mt-8">
        <h2 className="mb-3 text-xl font-bold">Breakdown</h2>
        <div className="divide-y divide-line rounded-3xl border border-line">
          <div className="grid grid-cols-[1fr_auto_auto] gap-6 px-6 py-3 text-sm font-medium uppercase tracking-wide text-slate-400">
            <span>Bill</span>
            <span className="w-24 text-right">House / yr</span>
            <span className="w-24 text-right">You / wk</span>
          </div>
          {r.lines.map((l) => (
            <div key={l.id} className="grid grid-cols-[1fr_auto_auto] items-center gap-6 px-6 py-4">
              <div className="flex min-w-0 items-center gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-soft text-brand">{BILL_ICON[l.id]}</span>
                <div className="min-w-0">
                  <div className="text-lg font-semibold">{l.label}</div>
                  <div className="truncate text-sm text-slate-500" title={l.assumption}>
                    {l.assumption}
                  </div>
                </div>
              </div>
              {l.householdAnnualGBP == null ? (
                <span className="col-span-2 w-[13.5rem] text-right font-medium text-slate-400">unavailable</span>
              ) : (
                <>
                  <span className="w-24 text-right text-lg tabular-nums text-slate-600">{gbp(l.householdAnnualGBP)}</span>
                  <span className="w-24 text-right text-lg font-bold tabular-nums">{gbp(l.householdAnnualGBP / 52 / survey.people)}</span>
                </>
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
        <ul className="mt-3 list-disc space-y-1.5 pl-5">
          {r.assumptions.map((a) => (
            <li key={a} className="text-sm leading-relaxed text-slate-500">
              {a}
            </li>
          ))}
        </ul>
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


      <div className="no-print mt-10 text-center">
        <button type="button" onClick={onReset} className="text-sm font-medium text-slate-400 underline-offset-4 hover:text-slate-900 hover:underline">
          Reset compare bills
        </button>
      </div>
    </Page>
  )
}

function fmtDate(iso: string) {
  return new Date(iso + 'T00:00:00').toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}
