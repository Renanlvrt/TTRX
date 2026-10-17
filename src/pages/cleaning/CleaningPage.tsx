import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { AlertTriangle, ArrowUpRight, Check, Minus, Plus } from 'lucide-react'
import { Fine, Page, cx, gbp } from '../../components/ui'
import { setState, setTask, useAppState } from '../../lib/store'
import { cleaningAdvice, DIY_MAX_ITEMS } from '../../lib/cleaning'
import { compareInspections, hasAnyRecord } from '../../lib/inspection'
import { CHECKLIST } from '../../data/checklist'
import { CLEANING_BANDS, CLEANING_BANDS_SOURCE, CLEANING_FACTS } from '../../data/cleaningPrices'
import { CLEANERS, CLEANING_CHECKLIST, CLEANING_CHECKLIST_SOURCE, DEPOSIT_LINKS } from '../../data/services'
import type { AppState } from '../../lib/types'

const total = CLEANING_CHECKLIST.length
const key = (i: number) => `clean-${i}`

const setCleaning = (patch: Partial<AppState['cleaning']>) => setState((s) => ({ ...s, cleaning: { ...s.cleaning, ...patch } }))

export default function CleaningPage() {
  const { cleaningDone, cleaning, bills, moveIn, moveOut } = useAppState()

  // Automatic inputs: bedrooms from the bills survey, dirty items = NEW ISSUES in the move-out photos.
  const photosDone = hasAnyRecord(moveOut)
  const newIssues = compareInspections(CHECKLIST, moveIn, moveOut).filter((r) => r.flag === 'newIssue')
  const bedrooms = cleaning.bedrooms ?? bills.survey?.people ?? 4
  const dirtyItems = cleaning.dirtyItems ?? newIssues.length
  const advice = cleaningAdvice({ bedrooms, people: bedrooms, depositPerPersonGBP: cleaning.depositPerPerson, dirtyItems, bands: CLEANING_BANDS })

  const done = new Set(cleaningDone)
  const count = CLEANING_CHECKLIST.filter((_, i) => done.has(key(i))).length
  const toggle = (id: string) => {
    const next = done.has(id) ? cleaningDone.filter((x) => x !== id) : [...cleaningDone, id]
    setState((s) => ({ ...s, cleaningDone: next }))
    const n = CLEANING_CHECKLIST.filter((_, i) => next.includes(key(i))).length
    setTask('cleaning', n === total ? 'done' : n > 0 ? 'inProgress' : 'notStarted')
  }
  const hire = advice.verdict === 'hire'

  return (
    <Page title="Move-out cleaning" subtitle="Clean it yourself, or pay a pro?">
      {/* Three inputs */}
      <div className="grid gap-3 sm:grid-cols-3">
        <InputTile label="Bedrooms" hint={cleaning.bedrooms == null && bills.survey ? 'From your bills answers' : 'Splits the cost'}>
          <Stepper value={bedrooms} min={1} max={10} onChange={(v) => setCleaning({ bedrooms: v })} label="bedrooms" />
        </InputTile>
        <InputTile label="Deposit each" hint="What you paid">
          <div className="flex items-center rounded-xl border-2 border-line px-3 focus-within:border-brand">
            <span className="text-2xl font-extrabold text-slate-400">£</span>
            <input
              type="number"
              inputMode="numeric"
              min={0}
              aria-label="Deposit per person in pounds"
              value={cleaning.depositPerPerson}
              onChange={(e) => setCleaning({ depositPerPerson: Math.max(0, Number(e.target.value) || 0) })}
              className="h-12 w-full bg-transparent px-1 text-2xl font-extrabold outline-none"
            />
          </div>
        </InputTile>
        <InputTile
          label="Things to clean"
          hint={cleaning.dirtyItems == null ? (photosDone ? 'New issues in your move-out photos' : 'Do your move-out photos to count') : 'Set by you'}
        >
          <Stepper value={dirtyItems} min={0} max={10} onChange={(v) => setCleaning({ dirtyItems: v })} label="things to clean" />
        </InputTile>
      </div>

      {/* Verdict */}
      <div className="mt-6 rounded-3xl border border-highlight-strong bg-highlight p-6">
        <p className="text-2xl font-extrabold leading-tight tracking-tight md:text-3xl">{advice.headline}</p>
        <p className="mt-2 text-base text-slate-700">{advice.detail}</p>
        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          <Figure label={`Pro clean · ${bedrooms}-bed house`} value={`£${Math.round(advice.perPersonCostGBP)} each`} sub={`${gbp(advice.houseCostGBP)} for the house`} strong={hire} />
          <Figure label="Deposit at risk" value={`${gbp(cleaning.depositPerPerson)} each`} sub="Landlord can deduct reasonable cleaning costs" strong={!hire && advice.verdict === 'diyCheaper'} />
        </div>
        <p className="mt-4 text-sm text-slate-700">
          {CLEANING_FACTS.disputes.text}{' '}
          <a href={CLEANING_FACTS.disputes.url} target="_blank" rel="noopener noreferrer" className="underline underline-offset-2">Source</a>
          {' · '}
          {CLEANING_FACTS.noProRequired.text}{' '}
          <a href={CLEANING_FACTS.noProRequired.url} target="_blank" rel="noopener noreferrer" className="underline underline-offset-2">Shelter</a>
        </p>
        {newIssues.length > 0 && cleaning.dirtyItems == null && (
          <p className="mt-4 text-sm text-slate-700">
            From your photos: {newIssues.map((r) => r.item.label).join(', ')}.{' '}
            <Link to="/move-out/report" className="font-semibold underline underline-offset-2">See report</Link>
          </p>
        )}
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-[3fr_2fr]">
        {/* DIY checklist */}
        <section className={cx(hire && 'lg:order-2')}>
          <div className="mb-3 flex items-baseline justify-between">
            <h2 className="text-xl font-bold">{dirtyItems > DIY_MAX_ITEMS ? 'If you do it yourself' : 'Your cleaning checklist'}</h2>
            <span className="text-lg font-extrabold tabular-nums">
              {count} <span className="text-slate-400">/ {total}</span>
            </span>
          </div>
          <ul className="space-y-2">
            {CLEANING_CHECKLIST.map((text, i) => {
              const id = key(i)
              const on = done.has(id)
              const [head, ...rest] = text.split(': ')
              const hasHead = rest.length > 0
              return (
                <li key={id}>
                  <button
                    type="button"
                    role="checkbox"
                    aria-checked={on}
                    onClick={() => toggle(id)}
                    className={cx('flex w-full items-start gap-3 rounded-2xl border p-3 text-left transition', on ? 'border-brand bg-brand-soft' : 'border-line hover:border-slate-300')}
                  >
                    <span className={cx('mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md border-2', on ? 'border-brand bg-brand text-white' : 'border-slate-300')}>
                      {on && <Check size={14} strokeWidth={3} />}
                    </span>
                    <span className={cx('text-sm leading-snug', on && 'text-slate-500 line-through')}>
                      {hasHead ? (
                        <>
                          <span className="font-semibold">{head}:</span> {rest.join(': ')}
                        </>
                      ) : (
                        text
                      )}
                    </span>
                  </button>
                </li>
              )
            })}
          </ul>
          <Fine className="mt-2">
            Source:{' '}
            <a href={CLEANING_CHECKLIST_SOURCE.url} target="_blank" rel="noopener noreferrer" className="underline underline-offset-2">
              {CLEANING_CHECKLIST_SOURCE.label}
            </a>
          </Fine>
        </section>

        {/* Cleaners */}
        <section className={cx(hire && 'lg:order-1')}>
          <h2 className="mb-3 text-xl font-bold">Cleaners in Durham</h2>
          <div className="divide-y divide-line rounded-3xl border border-line">
            {CLEANERS.map((c) => (
              <div key={c.id} className="flex items-center gap-3 px-5 py-4">
                <div className="min-w-0 flex-1">
                  <div className="text-base font-semibold">{c.name}</div>
                  <div className={cx('text-sm', c.priceText ? 'text-slate-600' : 'text-slate-400')}>{c.priceText ?? 'Price on quote'}</div>
                </div>
                <a
                  href={c.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => setTask('cleaning', 'done')}
                  className={cx(
                    'inline-flex h-10 shrink-0 items-center gap-1.5 rounded-xl px-4 text-sm font-semibold transition',
                    hire ? 'bg-brand text-white hover:bg-brand-hover' : 'border border-line hover:bg-slate-50',
                  )}
                >
                  Quote <ArrowUpRight size={16} />
                </a>
              </div>
            ))}
          </div>
          <Fine className="mt-2">
            House estimate from{' '}
            <a href={CLEANING_BANDS_SOURCE.url} target="_blank" rel="noopener noreferrer" className="underline underline-offset-2">
              {CLEANING_BANDS_SOURCE.label}
            </a>
            . Durham jobs typically £196–£352. Get a quote for your exact house.
          </Fine>
        </section>
      </div>

      <div className="mt-8 flex items-start gap-3 rounded-2xl border border-line p-4">
        <AlertTriangle size={20} className="mt-0.5 shrink-0 text-slate-500" />
        <Fine>
          Cleaning won't fix mould, damp or leaks: report those to your landlord. A professional clean doesn't guarantee your deposit back.{' '}
          <a href={DEPOSIT_LINKS[0].url} target="_blank" rel="noopener noreferrer" className="underline underline-offset-2">
            Deposit rules on GOV.UK
          </a>
        </Fine>
      </div>
    </Page>
  )
}

function InputTile({ label, hint, children }: { label: string; hint: string; children: ReactNode }) {
  return (
    <div className="rounded-2xl border border-line p-4">
      <div className="text-sm font-bold uppercase tracking-wide text-slate-500">{label}</div>
      <div className="mt-2">{children}</div>
      <div className="mt-2 text-xs text-slate-500">{hint}</div>
    </div>
  )
}

function Stepper({ value, min, max, onChange, label }: { value: number; min: number; max: number; onChange: (v: number) => void; label: string }) {
  const btn = 'flex h-12 w-12 items-center justify-center rounded-xl border border-line transition hover:bg-slate-50 disabled:opacity-30'
  return (
    <div className="flex items-center justify-between gap-2">
      <button type="button" aria-label={`Fewer ${label}`} className={btn} disabled={value <= min} onClick={() => onChange(value - 1)}>
        <Minus size={18} />
      </button>
      <span className="text-3xl font-extrabold tabular-nums">{value}</span>
      <button type="button" aria-label={`More ${label}`} className={btn} disabled={value >= max} onClick={() => onChange(value + 1)}>
        <Plus size={18} />
      </button>
    </div>
  )
}

function Figure({ label, value, sub, strong }: { label: string; value: string; sub: string; strong?: boolean }) {
  return (
    <div className={cx('rounded-2xl bg-white p-4', strong && 'ring-2 ring-brand')}>
      <div className="text-xs font-bold uppercase tracking-wide text-slate-500">{label}</div>
      <div className="mt-1 text-3xl font-extrabold tracking-tight">{value}</div>
      <div className="text-sm text-slate-500">{sub}</div>
    </div>
  )
}
