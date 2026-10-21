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

/** One stage's three tasks (/move-in, /move-out). The next step to do is the brighter, slightly bigger button; the order is hinted by small numbers. */
export function StagePage() {
  const { tasks } = useAppState()
  const slug = useLocation().pathname.split('/')[1]
  const stage = STAGES.find((s) => s.slug === slug) ?? STAGES[0]
  const current = stage.tasks.findIndex((t) => tasks[t.id] !== 'done')

  return (
    <div className="mx-auto w-full max-w-xl px-4 pt-6 pb-12">
      <Link to="/" className="inline-flex min-h-11 items-center gap-2 px-2 text-lg text-muted hover:text-ink">
        <span aria-hidden className="text-2xl leading-none">‹</span> Back
      </Link>
      <h1 className="silver-text mt-2 px-2 pb-1 text-5xl font-semibold leading-[1.15] tracking-tight">{stage.title}</h1>

      <ol className="mt-8 flex flex-col gap-3">
        {stage.tasks.map((t, i) => {
          const next = i === current
          const finished = tasks[t.id] === 'done'
          return (
            <li key={t.id}>
              <Link
                to={t.to}
                aria-label={`Step ${i + 1}: ${t.title}${finished ? ', done' : ''}`}
                className={`flex items-center gap-4 rounded-2xl px-5 transition-colors ${next ? 'step-next h-24 text-ink' : 'step-row h-20 text-ink'}`}
              >
                <span aria-hidden className={`w-4 shrink-0 text-sm font-semibold tabular-nums ${next ? 'text-muted' : 'text-subtle'}`}>{i + 1}</span>
                <span className={`min-w-0 flex-1 truncate font-semibold tracking-tight ${next ? 'text-2xl' : 'text-xl'} ${finished ? 'text-muted' : ''}`}>{t.title}</span>
                {finished ? (
                  <span className="shrink-0 text-sm font-semibold text-muted">Done</span>
                ) : (
                  <span aria-hidden className={`shrink-0 text-3xl leading-none ${next ? 'text-ink' : 'text-subtle'}`}>›</span>
                )}
              </Link>
            </li>
          )
        })}
      </ol>
    </div>
  )
}
