import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowUpRight, Camera, Check, ChevronDown } from 'lucide-react'
import { ButtonLink, Fine, Page, cx } from '../../components/ui'
import { setState, setTask, useAppState } from '../../lib/store'
import { cleaningAdvice } from '../../lib/cleaning'
import { compareInspections, hasAnyRecord } from '../../lib/inspection'
import { CHECKLIST } from '../../data/checklist'
import { CLEANING_BANDS, CLEANING_BANDS_SOURCE, CLEANING_FACTS } from '../../data/cleaningPrices'
import { CLEANERS, CLEANING_CHECKLIST, DEPOSIT_LINKS } from '../../data/services'
import { Photo } from '../inspection/ItemCard'
import type { AppState } from '../../lib/types'

const key = (i: number) => `clean-${i}`
const setCleaning = (patch: Partial<AppState['cleaning']>) => setState((s) => ({ ...s, cleaning: { ...s.cleaning, ...patch } }))
// Tenancy.Cleaning's published Durham prices are the ones our estimate uses, so it's the main quote link.
const MAIN_CLEANER = CLEANERS.find((c) => c.id === 'tenancy-cleaning-nationwide') ?? CLEANERS[0]

export default function CleaningPage() {
  const { cleaningDone, cleaning, bills, moveIn, moveOut } = useAppState()
  const [editing, setEditing] = useState(false)

  if (!hasAnyRecord(moveOut)) {
    return (
      <Page title="Move-out cleaning">
        <div className="rounded-lg border-2 border-dashed border-line p-8 text-center">
          <Camera size={32} className="mx-auto text-subtle" />
          <p className="mt-3 text-xl font-bold">Do your move-out photos first</p>
          <p className="mt-1 text-muted">We use them to work out what needs cleaning.</p>
          <ButtonLink to="/move-out/compare" className="mt-5">Take move-out photos</ButtonLink>
        </div>
      </Page>
    )
  }

  // Everything comes from the report: NEW ISSUES = things to clean.
  const issues = compareInspections(CHECKLIST, moveIn, moveOut).filter((r) => r.flag === 'newIssue')
  const bedrooms = cleaning.bedrooms ?? bills.survey?.people ?? 4
  const deposit = cleaning.depositPerPerson
  const advice = cleaningAdvice({ bedrooms, people: bedrooms, depositPerPersonGBP: deposit ?? 0, dirtyItems: issues.length, bands: CLEANING_BANDS })
  const hire = advice.verdict === 'hire'
  const each = Math.round(advice.perPersonCostGBP)

  const done = new Set(cleaningDone)
  const toggle = (id: string) => {
    const next = done.has(id) ? cleaningDone.filter((x) => x !== id) : [...cleaningDone, id]
    setState((s) => ({ ...s, cleaningDone: next }))
    const n = CLEANING_CHECKLIST.filter((_, i) => next.includes(key(i))).length
    setTask('cleaning', n === CLEANING_CHECKLIST.length ? 'done' : n > 0 ? 'inProgress' : 'notStarted')
  }

  return (
    <Page title="Move-out cleaning">
      {/* The one question */}
      <label className="mb-4 block rounded-lg border border-line p-5">
        <span className="text-xl font-bold">How much was your deposit?</span>
        <span className="mt-1 block text-sm text-muted">Your share, per person.</span>
        <span className="mt-3 flex h-14 items-center rounded-md border-2 border-line px-4 focus-within:border-brand">
          <span className="text-2xl font-bold text-muted">£</span>
          <input
            type="number"
            inputMode="numeric"
            min={0}
            placeholder="e.g. 400"
            value={deposit ?? ''}
            onChange={(e) => setCleaning({ depositPerPerson: e.target.value === '' ? null : Math.max(0, Number(e.target.value) || 0) })}
            className="ml-2 w-full bg-transparent text-2xl font-bold text-ink outline-none placeholder:font-semibold placeholder:text-line-strong"
          />
        </span>
      </label>

      {/* The answer */}
      {deposit !== null && (
      <div className="rounded-lg border border-highlight-strong bg-highlight p-5">
        <p className="text-2xl font-display font-semibold leading-tight md:text-3xl">{advice.headline}</p>

        <div className="mt-4 grid grid-cols-2 gap-3">
          <div className={cx('rounded-md p-3 sm:p-4', hire ? 'bg-brand text-white' : 'bg-white')}>
            <div className={cx('text-xs font-bold uppercase tracking-wide', hire ? 'text-white/80' : 'text-muted')}>Cleaner</div>
            <div className="mt-1 text-2xl font-display font-semibold sm:text-3xl">£{each}<span className={cx('text-sm font-semibold', hire ? 'text-white/80' : 'text-muted')}> each</span></div>
            <div className={cx('text-sm', hire ? 'text-white/80' : 'text-muted')}>£{advice.houseCostGBP} for a {bedrooms}-bed</div>
          </div>
          <div className={cx('rounded-md p-3 sm:p-4', !hire ? 'bg-brand text-white' : 'bg-white')}>
            <div className={cx('text-xs font-bold uppercase tracking-wide', !hire ? 'text-white/80' : 'text-muted')}>Your deposit</div>
            <div className="mt-1 text-2xl font-display font-semibold sm:text-3xl">£{deposit}<span className={cx('text-sm font-semibold', !hire ? 'text-white/80' : 'text-muted')}> each</span></div>
            <div className={cx('text-sm', !hire ? 'text-white/80' : 'text-muted')}>{hire ? 'at risk if left dirty' : 'keep it by cleaning'}</div>
          </div>
        </div>

        {hire ? (
          <a
            href={MAIN_CLEANER.website}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => setTask('cleaning', 'done')}
            className="mt-4 inline-flex h-12 w-full items-center justify-center gap-2 rounded-md bg-brand text-lg font-semibold text-white hover:bg-brand-hover sm:w-auto sm:px-6"
          >
            Get a cleaner quote <ArrowUpRight size={20} />
          </a>
        ) : (
          <a href="#diy" className="mt-4 inline-flex h-12 w-full items-center justify-center rounded-md bg-brand text-lg font-semibold text-white hover:bg-brand-hover sm:w-auto sm:px-6">
            Open the cleaning checklist
          </a>
        )}

        <button type="button" onClick={() => setEditing((e) => !e)} className="mt-3 block text-sm font-semibold text-muted underline-offset-4 hover:underline">
          {editing ? 'Done' : 'Not a ' + bedrooms + '-bed? Change'}
        </button>
        {editing && (
          <label className="mt-3 block max-w-[50%] rounded-md bg-white p-3 text-sm font-semibold text-muted">
            Bedrooms
            <input
              type="number"
              min={1}
              max={10}
              value={bedrooms}
              onChange={(e) => setCleaning({ bedrooms: Math.min(10, Math.max(1, Number(e.target.value) || 1)) })}
              className="mt-1 block h-11 w-full rounded-md border-2 border-line px-3 text-xl font-bold text-ink outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
            />
          </label>
        )}
      </div>
      )}

      {/* What the report found */}
      <section className="mt-8">
        <div className="mb-3 flex items-baseline justify-between gap-3">
          <h2 className="text-xl font-bold">
            {issues.length === 0 ? 'Your report: nothing new to clean' : `Your report: ${issues.length} thing${issues.length === 1 ? '' : 's'} to clean`}
          </h2>
          <Link to="/move-out/report" className="shrink-0 text-sm font-semibold text-muted underline-offset-4 hover:underline">
            See report
          </Link>
        </div>
        {issues.length > 0 && (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {issues.map((r) => (
              <div key={r.item.id}>
                <Photo photoId={r.moveOut?.photoId ?? null} alt={`${r.item.label} at move-out`} />
                <div className="mt-1 text-sm font-semibold">{r.item.label}</div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* DIY checklist: open by default when DIY is the answer */}
      <details id="diy" className="group mt-8 rounded-lg border border-line px-5 py-4" open={!hire}>
        <summary className="flex cursor-pointer list-none items-center justify-between text-lg font-semibold [&::-webkit-details-marker]:hidden">
          Clean it yourself: checklist
          <ChevronDown size={20} className="text-subtle transition group-open:rotate-180" />
        </summary>
        <ul className="mt-3 space-y-2">
          {CLEANING_CHECKLIST.map((text, i) => {
            const id = key(i)
            const on = done.has(id)
            return (
              <li key={id}>
                <button
                  type="button"
                  role="checkbox"
                  aria-checked={on}
                  onClick={() => toggle(id)}
                  className={cx('flex w-full items-start gap-3 rounded-md border p-3 text-left text-sm transition', on ? 'border-brand bg-brand-soft text-muted line-through' : 'border-line hover:border-line-strong')}
                >
                  <span className={cx('mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border-2', on ? 'border-brand bg-brand text-white' : 'border-line-strong')}>
                    {on && <Check size={12} strokeWidth={3} />}
                  </span>
                  {text}
                </button>
              </li>
            )
          })}
        </ul>
      </details>

      {/* Other cleaners */}
      <details className="group mt-3 rounded-lg border border-line px-5 py-4">
        <summary className="flex cursor-pointer list-none items-center justify-between text-lg font-semibold [&::-webkit-details-marker]:hidden">
          Other cleaners in Durham
          <ChevronDown size={20} className="text-subtle transition group-open:rotate-180" />
        </summary>
        <div className="mt-3 divide-y divide-line">
          {CLEANERS.map((c) => (
            <div key={c.id} className="flex items-center gap-3 py-3">
              <div className="min-w-0 flex-1">
                <div className="font-semibold">{c.name}</div>
                <div className="text-sm text-muted">{c.priceText ?? 'Price on quote'}</div>
              </div>
              <a href={c.website} target="_blank" rel="noopener noreferrer" onClick={() => setTask('cleaning', 'done')} className="inline-flex h-10 shrink-0 items-center gap-1 rounded-md border border-line px-3 text-sm font-semibold hover:bg-canvas">
                Quote <ArrowUpRight size={14} />
              </a>
            </div>
          ))}
        </div>
      </details>

      <Fine className="mt-6">
        Estimate from{' '}
        <a href={CLEANING_BANDS_SOURCE.url} target="_blank" rel="noopener noreferrer" className="underline underline-offset-2">{CLEANING_BANDS_SOURCE.label}</a>.{' '}
        {CLEANING_FACTS.noProRequired.text} Cleaning won't fix mould or damp; report those.{' '}
        <a href={DEPOSIT_LINKS[0].url} target="_blank" rel="noopener noreferrer" className="underline underline-offset-2">Deposit rules</a>
      </Fine>
    </Page>
  )
}
