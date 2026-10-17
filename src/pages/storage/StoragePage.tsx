import { useEffect } from 'react'
import { ArrowUpRight, Box, Warehouse } from 'lucide-react'
import { Card, Fine, Page, cx } from '../../components/ui'
import { setState, setTask, useAppState } from '../../lib/store'
import { AREAS } from '../../lib/types'
import { STORAGE } from '../../data/services'

export default function StoragePage() {
  const { property, storageArea, tasks } = useAppState()
  useEffect(() => {
    if (tasks.storage === 'notStarted') setTask('storage', 'inProgress')
  }, [tasks.storage])
  const area = storageArea ?? property.area
  const providers = STORAGE.filter((p) => p.areas.includes(area)).sort((a, b) => Number(!!b.collection) - Number(!!a.collection))

  return (
    <Page title="Find storage" subtitle="Over summer or between houses.">
      <div role="radiogroup" aria-label="Area" className="mb-8 grid grid-cols-2 gap-3 md:grid-cols-4">
        {AREAS.map((a) => {
          const on = a.id === area
          return (
            <button
              key={a.id}
              type="button"
              role="radio"
              aria-checked={on}
              onClick={() => setState((s) => ({ ...s, storageArea: a.id }))}
              className={cx(
                'rounded-2xl border-2 px-4 py-3 text-left transition',
                on ? 'border-brand bg-brand-soft' : 'border-line bg-white hover:border-slate-300',
              )}
            >
              <span className="block text-base font-semibold">{a.label}</span>
              <span className="block text-sm text-slate-500">{a.postcodes.join(' · ')}</span>
            </button>
          )
        })}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {providers.map((p) => (
          <Card key={p.id} className="flex flex-col gap-4">
            <div className="flex items-start gap-3">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-soft text-brand">
                {p.collection ? <Box size={22} /> : <Warehouse size={22} />}
              </span>
              <div>
                <h2 className="text-2xl font-bold leading-tight">{p.name}</h2>
                <p className="text-base text-slate-500">{p.kind}</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {p.tags.map((t) => (
                <span key={t} className={cx('rounded-full px-3 py-1 text-sm font-medium', t === 'Student discount' ? 'bg-highlight' : 'bg-slate-100 text-slate-700')}>
                  {t}
                </span>
              ))}
            </div>
            <p className={cx('flex-1 text-xl font-bold leading-snug', !p.priceText && 'text-slate-500')}>{p.priceText ?? 'Price on quote'}</p>
            <a
              href={p.website}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => setTask('storage', 'done')}
              className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-brand px-6 text-lg font-semibold text-white hover:bg-brand-hover"
            >
              Visit site <ArrowUpRight size={20} />
            </a>
          </Card>
        ))}
      </div>

      <Fine className="mt-8">Indicative prices, checked 17 Oct 2026. Confirm the final quote with the provider. No booking happens here.</Fine>
    </Page>
  )
}
