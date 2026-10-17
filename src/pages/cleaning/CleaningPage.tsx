import { AlertTriangle, ArrowUpRight, Check } from 'lucide-react'
import { Card, Fine, Page, cx } from '../../components/ui'
import { setState, setTask, useAppState } from '../../lib/store'
import { CLEANERS, CLEANING_CHECKLIST, CLEANING_CHECKLIST_SOURCE, DEPOSIT_LINKS } from '../../data/services'

const total = CLEANING_CHECKLIST.length
const key = (i: number) => `clean-${i}`

export default function CleaningPage() {
  const { cleaningDone } = useAppState()
  const done = new Set(cleaningDone)
  const count = CLEANING_CHECKLIST.filter((_, i) => done.has(key(i))).length

  const toggle = (id: string) => {
    const next = done.has(id) ? cleaningDone.filter((x) => x !== id) : [...cleaningDone, id]
    setState((s) => ({ ...s, cleaningDone: next }))
    const n = CLEANING_CHECKLIST.filter((_, i) => next.includes(key(i))).length
    setTask('cleaning', n === total ? 'done' : n > 0 ? 'inProgress' : 'notStarted')
  }

  return (
    <Page title="Move-out cleaning">
      <div className="mb-6 flex items-start gap-3 rounded-2xl border border-highlight-strong bg-highlight p-4">
        <AlertTriangle size={22} className="mt-0.5 shrink-0" />
        <p className="text-base font-medium">Cleaning won't fix mould, damp or leaks — report those to your landlord.</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[3fr_2fr]">
        <section>
          <div className="mb-3 flex items-baseline justify-between">
            <h2 className="text-2xl font-bold">Checklist</h2>
            <span className="text-2xl font-extrabold tabular-nums">
              {count} <span className="text-slate-400">/ {total}</span>
            </span>
          </div>
          <div className="mb-4 h-2 overflow-hidden rounded-full bg-slate-100">
            <div className="h-full rounded-full bg-brand transition-all" style={{ width: `${(count / total) * 100}%` }} />
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
                    className={cx(
                      'flex w-full items-start gap-4 rounded-2xl border-2 p-4 text-left transition',
                      on ? 'border-brand bg-brand-soft' : 'border-line bg-white hover:border-slate-300',
                    )}
                  >
                    <span className={cx('mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border-2', on ? 'border-brand bg-brand text-white' : 'border-slate-300')}>
                      {on && <Check size={16} strokeWidth={3} />}
                    </span>
                    <span className={cx('text-base leading-snug', on && 'text-slate-500 line-through')}>
                      {hasHead ? (
                        <>
                          <strong className="font-semibold">{head}:</strong> {rest.join(': ')}
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
          <Fine className="mt-3">
            Checklist source:{' '}
            <a href={CLEANING_CHECKLIST_SOURCE.url} target="_blank" rel="noopener noreferrer" className="underline">
              {CLEANING_CHECKLIST_SOURCE.label}
            </a>
          </Fine>
        </section>

        <aside>
          <h2 className="mb-3 text-2xl font-bold">Rather pay a pro?</h2>
          <div className="space-y-3">
            {CLEANERS.map((c) => (
              <Card key={c.id} className="p-5!">
                <h3 className="text-xl font-bold">{c.name}</h3>
                <p className="text-sm text-slate-500">{c.coverage}</p>
                <p className={cx('mt-3 text-lg font-bold leading-snug', !c.priceText && 'text-slate-500')}>{c.priceText ?? 'Price on quote'}</p>
                {c.services && <p className="mt-1 text-sm text-slate-600">{c.services.join(' · ')}</p>}
                <a
                  href={c.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-4 inline-flex h-11 w-full items-center justify-center gap-2 rounded-2xl bg-brand px-5 text-base font-semibold text-white hover:bg-brand-hover"
                >
                  Visit site <ArrowUpRight size={18} />
                </a>
              </Card>
            ))}
          </div>
          <Fine className="mt-4">
            A professional clean doesn't guarantee your deposit back.{' '}
            <a href={DEPOSIT_LINKS[0].url} target="_blank" rel="noopener noreferrer" className="underline">
              Deposit rules on GOV.UK
            </a>
          </Fine>
        </aside>
      </div>
    </Page>
  )
}
