import { useEffect } from 'react'
import type { ReactNode } from 'react'
import { ArrowUpRight, Box, Minus, Plus, Warehouse } from 'lucide-react'
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
    <Page title="Find storage" subtitle="Over summer or between houses.">
      <div className="grid gap-6 md:grid-cols-2">
        <Question n={1} title="How many boxes?">
          <div className="space-y-2">
            {BOX_SIZES.map((size) => (
              <div key={size} className="flex items-center gap-3 rounded-md border border-line px-4 py-3">
                <div className="flex-1">
                  <div className="text-lg font-semibold">{BOX_LABELS[size].label}</div>
                  <div className="text-sm text-muted">{BOX_LABELS[size].hint}</div>
                </div>
                <StepButton label={`Fewer ${size} boxes`} onClick={() => setBoxes(size, needs.boxes[size] - 1)} disabled={needs.boxes[size] === 0}>
                  <Minus size={18} />
                </StepButton>
                <span className="w-8 text-center text-2xl font-semibold tabular-nums">{needs.boxes[size]}</span>
                <StepButton label={`More ${size} boxes`} onClick={() => setBoxes(size, needs.boxes[size] + 1)}>
                  <Plus size={18} />
                </StepButton>
              </div>
            ))}
          </div>
        </Question>

        <Question n={2} title="For how long?">
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
                  <span className="block text-sm text-muted">{d.hint ?? `${d.weeks} weeks`}</span>
                </button>
              )
            })}
          </div>
        </Question>
      </div>

      <section className="mt-10">
        {count === 0 ? (
          <div className="rounded-lg border-2 border-dashed border-line p-8 text-center text-lg text-muted">Add your boxes to see the best option.</div>
        ) : (
          <>
            {best && <BestCard option={best} item={listing(best.providerId)} boxes={count} />}
            {best?.kind === 'unit' && alternatives.some((a) => a.total == null && a.kind === 'box') && (
              <Fine className="mt-3">A whole container is the cheapest published price here, but box services below may cost less for {count} boxes. Get a quote.</Fine>
            )}
            <h2 className="mb-3 mt-8 text-xl font-bold">Alternatives</h2>
            <div className="divide-y divide-line rounded-lg border border-line">
              {alternatives.map((o) => (
                <AltRow key={o.providerId} option={o} item={listing(o.providerId)} />
              ))}
            </div>
          </>
        )}
      </section>

      <Fine className="mt-6">
        All-in estimates (storage + collection + return) from each provider's own prices, checked {new Date(STORAGE_CHECKED).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}. Box sizes vary by provider; confirm the final quote with them. No booking happens here.
      </Fine>
    </Page>
  )
}

function Question({ n, title, children }: { n: number; title: string; children: ReactNode }) {
  return (
    <div>
      <div className="mb-3 flex items-center gap-3">
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-brand text-sm font-bold text-white">{n}</span>
        <h2 className="text-xl font-bold">{title}</h2>
      </div>
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
        primary ? 'h-12 bg-brand px-6 text-lg text-white hover:bg-brand-hover' : 'h-10 border border-line px-4 text-sm hover:bg-canvas',
      )}
    >
      {primary ? 'Book' : 'Visit'} <ArrowUpRight size={primary ? 20 : 16} />
    </a>
  )
}

function KindIcon({ option }: { option: StorageOption }) {
  return option.kind === 'unit' ? <Warehouse size={22} /> : <Box size={22} />
}

function BestCard({ option, item, boxes }: { option: StorageOption; item: StorageListing; boxes: number }) {
  const unit = option.kind === 'unit'
  return (
    <div className="rounded-lg border border-highlight-strong bg-highlight p-6">
      <div className="text-sm font-bold uppercase tracking-wide text-muted">Best option for {boxes} box{boxes === 1 ? '' : 'es'}</div>
      <div className="mt-3 flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-md bg-white text-brand">
            <KindIcon option={option} />
          </span>
          <div>
            <h3 className="text-2xl font-bold leading-tight">{item.name}</h3>
            <p className="text-base text-muted">{item.kind}</p>
          </div>
        </div>
        <div className="text-right">
          <div className="text-4xl font-display font-semibold">{gbp(option.total!)}</div>
          <div className="text-sm text-muted">all-in{unit ? ' · split it with housemates' : ''}</div>
        </div>
      </div>
      <div className="mt-4 flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="flex flex-wrap gap-2">
            {item.tags.map((t) => (
              <span key={t} className="rounded-full bg-white px-3 py-1 text-sm font-medium">{t}</span>
            ))}
          </div>
          <dl className="mt-3 space-y-0.5 text-sm text-ink">
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
        <BookLink item={item} primary />
      </div>
    </div>
  )
}

function AltRow({ option, item }: { option: StorageOption; item: StorageListing }) {
  return (
    <div className="flex items-center gap-4 px-5 py-4">
      <span className="hidden text-subtle sm:block">
        <KindIcon option={option} />
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline justify-between gap-3">
          <span className="text-lg font-semibold">{item.name}</span>
          {option.total != null ? (
            <span className="shrink-0 text-xl font-bold">{gbp(option.total)}</span>
          ) : (
            <span className="shrink-0 text-sm font-semibold text-subtle">{option.breakdown.startsWith('Only covers') ? 'Not available' : 'Get a quote'}</span>
          )}
        </div>
        <div className="text-sm text-muted">
          {option.total != null
            ? [`storage £${option.storageGBP!.toFixed(2)}${option.rate ? ` (${option.rate})` : ''}`, ...option.feeLines.map((f) => `${f.label.toLowerCase()} £${f.amountGBP.toFixed(2)}`)].join(' + ')
            : option.breakdown.startsWith('Only covers') ? `${option.breakdown} (summer only)` : (item.priceText ?? option.breakdown)}
        </div>
      </div>
      <BookLink item={item} />
    </div>
  )
}
