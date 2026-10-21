import { useEffect } from 'react'
import type { ReactNode } from 'react'
import { Fine, Page, cx, gbp } from '../../components/ui'
import { setState, setTask, useAppState } from '../../lib/store'
import { BOX_SIZES, recommendStorage, totalBoxes } from '../../lib/storage'
import type { BoxSize, StorageOption } from '../../lib/storage'
import { BOX_LABELS, DURATIONS, STORAGE_CHECKED, STORAGE_LISTINGS } from '../../data/storagePricing'
import type { StorageListing } from '../../data/storagePricing'

const listing = (id: string) => STORAGE_LISTINGS.find((l) => l.pricing.providerId === id)!

export default function StoragePage() {
  const { storageNeeds: needs, tasks } = useAppState()
  useEffect(() => {
    if (tasks.storage === 'notStarted') setTask('storage', 'inProgress')
  }, [tasks.storage])

  const setBoxes = (size: BoxSize, n: number) =>
    setState((s) => ({ ...s, storageNeeds: { ...s.storageNeeds, boxes: { ...s.storageNeeds.boxes, [size]: Math.max(0, Math.min(40, n)) } } }))
  const setWeeks = (weeks: number) => setState((s) => ({ ...s, storageNeeds: { ...s.storageNeeds, weeks } }))

  const { best, alternatives } = recommendStorage(needs, STORAGE_LISTINGS.map((l) => l.pricing))
  const count = totalBoxes(needs)

  return (
    <Page title="Find storage">
      <div className="grid gap-6 md:grid-cols-2">
        <Question title="How many boxes?">
          <div className="space-y-2">
            {BOX_SIZES.map((size) => (
              <div key={size} className="flex items-center gap-3 rounded-md border border-line px-4 py-3">
                <div className="flex-1">
                  <div className="text-lg font-semibold">{BOX_LABELS[size].label}</div>
                </div>
                <StepButton label={`Fewer ${size} boxes`} onClick={() => setBoxes(size, needs.boxes[size] - 1)} disabled={needs.boxes[size] === 0}>
                  <span aria-hidden className="text-2xl leading-none">−</span>
                </StepButton>
                <span className="w-8 text-center text-2xl font-semibold tabular-nums">{needs.boxes[size]}</span>
                <StepButton label={`More ${size} boxes`} onClick={() => setBoxes(size, needs.boxes[size] + 1)}>
                  <span aria-hidden className="text-2xl leading-none">+</span>
                </StepButton>
              </div>
            ))}
          </div>
        </Question>

        <Question title="For how long?">
          <div role="radiogroup" aria-label="Storage length" className="grid grid-cols-2 gap-2">
            {DURATIONS.map((d) => {
              const on = needs.weeks === d.weeks
              return (
                <button
                  key={d.weeks}
                  type="button"
                  role="radio"
                  aria-checked={on}
                  onClick={() => setWeeks(d.weeks)}
                  className={cx('rounded-md border-2 px-4 py-4 text-left transition', on ? 'border-brand bg-brand-soft' : 'border-line hover:border-line-strong')}
                >
                  <span className="block text-lg font-semibold">{d.label}</span>
                </button>
              )
            })}
          </div>
        </Question>
      </div>

      <section className="mt-10">
        {count === 0 ? (
          null
        ) : (
          <>
            {best && <BestCard option={best} item={listing(best.providerId)} />}
            <details className="group mt-6 rounded-lg border border-line bg-card px-5 py-3">
              <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between text-lg font-semibold [&::-webkit-details-marker]:hidden">
                Other options ({alternatives.length})
              </summary>
              <div className="divide-y divide-line">
                {alternatives.map((o) => (
                  <AltRow key={o.providerId} option={o} item={listing(o.providerId)} />
                ))}
              </div>
              <Fine className="mt-3">
                Prices checked {new Date(STORAGE_CHECKED).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}.
              </Fine>
            </details>
          </>
        )}
      </section>
    </Page>
  )
}

function Question({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div>
      <h2 className="mb-3 text-xl font-bold">{title}</h2>
      {children}
    </div>
  )
}

function StepButton({ label, onClick, disabled, children }: { label: string; onClick: () => void; disabled?: boolean; children: ReactNode }) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      disabled={disabled}
      className="flex h-11 w-11 items-center justify-center rounded-md border border-line transition hover:bg-canvas disabled:opacity-30"
    >
      {children}
    </button>
  )
}

function BookLink({ item, primary }: { item: StorageListing; primary?: boolean }) {
  return (
    <a
      href={item.bookingUrl}
      target="_blank"
      rel="noopener noreferrer"
      onClick={() => setTask('storage', 'done')}
      className={cx(
        'inline-flex shrink-0 items-center justify-center gap-1.5 rounded-md font-semibold transition',
        primary ? 'h-12 bg-brand px-6 text-lg text-on-brand hover:bg-brand-hover' : 'h-10 border border-line px-4 text-sm hover:bg-canvas',
      )}
    >
      {primary ? 'Book' : 'Visit'}
    </a>
  )
}

function BestCard({ option, item }: { option: StorageOption; item: StorageListing }) {
  return (
    <div className="rounded-lg border border-highlight-strong bg-highlight p-6">
      <div className="text-sm font-semibold text-muted">Best option</div>
      <div className="mt-3 flex flex-wrap items-start justify-between gap-4">
        <h3 className="text-2xl font-bold leading-tight">{item.name}</h3>
        <div className="text-right">
          <div className="text-4xl font-display font-semibold">{gbp(option.total!)}</div>
          <div className="text-sm text-muted">all-in</div>
        </div>
      </div>
      <div className="mt-4">
        <BookLink item={item} primary />
      </div>
      <details className="mt-3">
        <summary className="flex min-h-11 cursor-pointer items-center text-sm font-semibold text-muted hover:text-ink">Price breakdown</summary>
        <div>
          <dl className="mt-1 space-y-0.5 text-sm text-ink">
            <div className="flex gap-2">
              <dt>Storage{option.rate && <span className="text-muted"> ({option.rate})</span>}</dt>
              <dd className="font-semibold">{gbp(option.storageGBP!)}</dd>
            </div>
            {option.feeLines.map((f) => (
              <div key={f.label} className="flex gap-2">
                <dt>+ {f.label}</dt>
                <dd className="font-semibold">{f.amountGBP === 0 ? 'free' : gbp(f.amountGBP)}</dd>
              </div>
            ))}
          </dl>
          {option.rate?.includes('/month') && (
            <p className="mt-2 text-sm font-medium text-ink">Billed monthly, so their checkout shows {option.rate.split('/')[0]} due today. Return is paid when you get your boxes back.</p>
          )}
          {item.note && <p className="mt-2 text-sm text-muted">{item.note}</p>}
        </div>
      </details>
    </div>
  )
}

function AltRow({ option, item }: { option: StorageOption; item: StorageListing }) {
  return (
    <div className="flex items-center gap-4 px-5 py-4">
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline justify-between gap-3">
          <span className="text-lg font-semibold">{item.name}</span>
          {option.total != null ? (
            <span className="shrink-0 text-xl font-bold">{gbp(option.total)}</span>
          ) : (
            <span className="shrink-0 text-sm font-semibold text-subtle">{option.breakdown.startsWith('Only covers') ? 'Not available' : 'Get a quote'}</span>
          )}
        </div>
        {option.total == null && (
          <div className="text-sm text-muted">
            {option.breakdown.startsWith('Only covers') ? `${option.breakdown} (summer only)` : (item.priceText ?? option.breakdown)}
          </div>
        )}
      </div>
      <BookLink item={item} />
    </div>
  )
}
