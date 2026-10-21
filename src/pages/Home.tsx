import { Link, useLocation } from 'react-router-dom'
import { LogoMark } from '../components/Logo'
import { useAppState } from '../lib/store'
import type { TaskId } from '../lib/types'

interface Task {
  id: TaskId
  to: string
  title: string
}

interface Stage {
  slug: 'move-in' | 'move-out'
  title: string
  tasks: Task[]
}

const STAGES: Stage[] = [
  {
    slug: 'move-in',
    title: 'Moving in',
    tasks: [
      { id: 'bills', to: '/move-in/bills', title: 'Compare bills' },
      { id: 'inspection', to: '/move-in/inspection', title: 'Photo inspection' },
      { id: 'email', to: '/move-in/email', title: 'Email landlord' },
    ],
  },
  {
    slug: 'move-out',
    title: 'Moving out',
    tasks: [
      { id: 'comparison', to: '/move-out/compare', title: 'Before / after report' },
      { id: 'storage', to: '/move-out/storage', title: 'Find storage' },
      { id: 'cleaning', to: '/move-out/cleaning', title: 'Cleaning' },
    ],
  },
]

export default function Home() {
  return (
    <div className="flex min-h-[calc(100dvh-4.5rem-env(safe-area-inset-top))] flex-col text-white">
      <div className="flex flex-1 flex-col items-center justify-center px-6 pt-6 pb-24">
        <LogoMark size={136} silver className="logo-glow" />
        <h1 className="silver-text mt-1 text-[3.6rem] font-semibold leading-none tracking-tight">RentReady</h1>
      </div>
      <nav aria-label="Choose your stage" className="glass mx-5 mb-[max(3rem,env(safe-area-inset-bottom))] grid grid-cols-2 rounded-[1.4rem] sm:mx-auto sm:w-full sm:max-w-md">
        {STAGES.map((stage, i) => (
          <Link
            key={stage.slug}
            to={`/${stage.slug}`}
            className={`relative flex h-24 items-center justify-center rounded-[1.4rem] transition-colors hover:bg-white/10 active:bg-white/15 ${i ? 'glass-divider' : ''}`}
          >
            <span className="text-2xl font-medium tracking-tight text-[#E8F0F0]">{stage.title}</span>
          </Link>
        ))}
      </nav>
    </div>
  )
}

/** One stage's three tasks (/move-in, /move-out) as a numbered timeline on a glass panel. */
export function StagePage() {
  const { tasks } = useAppState()
  const slug = useLocation().pathname.split('/')[1]
  const stage = STAGES.find((s) => s.slug === slug) ?? STAGES[0]
  const done = stage.tasks.filter((t) => tasks[t.id] === 'done').length
  const total = stage.tasks.length
  // The next step to do gets the glow; once all are done, none does.
  const current = stage.tasks.findIndex((t) => tasks[t.id] !== 'done')

  return (
    <div className="mx-auto w-full max-w-xl px-4 pt-6 pb-12">
      <Link to="/" className="inline-flex min-h-11 items-center gap-2 px-2 text-xl text-muted hover:text-ink">
        <span aria-hidden className="text-3xl leading-none">‹</span> Back
      </Link>
      <h1 className="silver-text mt-4 pb-2 text-center text-[3.5rem] font-semibold leading-[1.15] tracking-tight">{stage.title}</h1>

      <div className="mt-8 flex items-center justify-between px-2">
        <span className="rounded-md border border-white/15 bg-white/10 px-2.5 py-1 text-base text-ink">{total} steps</span>
        <span className="text-base text-muted">{done} of {total} completed</span>
      </div>
      <div className="mx-2 mt-3 h-2 overflow-hidden rounded-full bg-white/12" role="progressbar" aria-valuemin={0} aria-valuemax={total} aria-valuenow={done} aria-label="Steps completed">
        <div className="h-full rounded-full bg-brand transition-all" style={{ width: `${(done / total) * 100}%` }} />
      </div>

      <ol className="glass step-panel relative -mx-2 mt-14 flex flex-col gap-8 rounded-[1.75rem] p-4">
        <span aria-hidden className="step-line absolute top-[60px] bottom-[60px] left-[31px] w-0.5" />
        {stage.tasks.map((t, i) => {
          const active = i === current
          const finished = tasks[t.id] === 'done'
          return (
            <li key={t.id} className="relative flex items-center">
              <span aria-hidden className={`step-num relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-[8px] text-sm font-semibold ${active ? 'is-active' : ''} ${finished ? 'is-done' : ''}`}>
                {i + 1}
              </span>
              <span aria-hidden className={`step-tie h-0.5 w-3 shrink-0 ${active ? 'is-active' : ''}`} />
              <Link
                to={t.to}
                aria-label={`Step ${i + 1}: ${t.title}${finished ? ', done' : ''}`}
                className={`step-row flex h-[5.5rem] min-w-0 flex-1 items-center justify-between gap-3 rounded-2xl px-5 ${active ? 'is-active' : ''}`}
              >
                <span className="silver-text truncate text-[1.6rem] font-bold tracking-tight">{t.title}</span>
                <span aria-hidden className="text-3xl leading-none text-muted">›</span>
              </Link>
            </li>
          )
        })}
      </ol>
    </div>
  )
}
