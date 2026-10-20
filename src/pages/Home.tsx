import type { ReactNode } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { ArrowLeft, Box, Camera, ChevronRight, Images, KeyRound, Mail, PackageOpen, PoundSterling, Sparkles } from 'lucide-react'
import { StatusBadge, Fine } from '../components/ui'
import { resetState, useAppState } from '../lib/store'
import type { TaskId } from '../lib/types'

interface Task {
  id: TaskId
  to: string
  title: string
  icon: ReactNode
}

interface Stage {
  slug: 'move-in' | 'move-out'
  title: string
  caption: string
  icon: ReactNode
  tasks: Task[]
}

const STAGES: Stage[] = [
  {
    slug: 'move-in',
    title: 'Moving in',
    caption: 'Know your costs. Record the house.',
    icon: <KeyRound size={28} />,
    tasks: [
      { id: 'bills', to: '/move-in/bills', title: 'Compare bills', icon: <PoundSterling size={22} /> },
      { id: 'inspection', to: '/move-in/inspection', title: 'Photo inspection', icon: <Camera size={22} /> },
      { id: 'email', to: '/move-in/email', title: 'Email landlord', icon: <Mail size={22} /> },
    ],
  },
  {
    slug: 'move-out',
    title: 'Moving out',
    caption: 'Prove the condition. Leave cleanly.',
    icon: <PackageOpen size={28} />,
    tasks: [
      { id: 'comparison', to: '/move-out/compare', title: 'Before / after report', icon: <Images size={22} /> },
      { id: 'storage', to: '/move-out/storage', title: 'Find storage', icon: <Box size={22} /> },
      { id: 'cleaning', to: '/move-out/cleaning', title: 'Cleaning', icon: <Sparkles size={22} /> },
    ],
  },
]

function TaskList({ stage }: { stage: Stage }) {
  const { tasks } = useAppState()
  return (
    <ul className="overflow-hidden rounded-md border border-line border-b-0">
      {stage.tasks.map((t) => (
        <li key={t.id}>
          <Link
            to={t.to}
            className="group flex items-center gap-4 border-b border-line bg-white px-4 py-4 transition-colors hover:bg-brand-soft"
          >
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-sm border border-brand-tint bg-brand-soft text-brand">{t.icon}</span>
            <span className="flex min-w-0 flex-1 flex-col items-start gap-1.5 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
              <span className="text-lg font-semibold leading-snug">{t.title}</span>
              <StatusBadge status={tasks[t.id]} />
            </span>
            <ChevronRight className="shrink-0 text-line-strong group-hover:text-brand" size={20} />
          </Link>
        </li>
      ))}
    </ul>
  )
}

export default function Home() {
  const { demoMode } = useAppState()
  return (
    <div className="mx-auto w-full max-w-4xl px-6 py-12">
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-brand">Durham student housing</p>
      <h1 className="mt-3 font-display text-4xl font-semibold leading-tight md:text-5xl">
        Settle into your student house.
      </h1>
      <div aria-hidden className="mt-4 h-0.5 w-12 bg-brand" />
      <p className="mt-4 text-lg text-muted md:text-xl">Bills, evidence and moving help, in one place.</p>

      {/* Phone: two big stage buttons; each opens its own page of tasks. */}
      <div className="mt-10 grid gap-4 md:hidden">
        {STAGES.map((stage) => (
          <Link
            key={stage.slug}
            to={`/${stage.slug}`}
            className="flex items-center gap-4 rounded-md bg-brand p-6 text-white transition-colors hover:bg-brand-hover active:bg-brand-deep"
          >
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-sm border border-white/35">{stage.icon}</span>
            <span className="flex-1">
              <span className="block font-display text-2xl font-semibold">{stage.title}</span>
              <span className="mt-0.5 block text-sm text-white/80">{stage.caption}</span>
            </span>
            <ChevronRight size={24} />
          </Link>
        ))}
      </div>

      {/* Desktop: both stages side by side. */}
      <div className="mt-10 hidden gap-6 md:grid md:grid-cols-2">
        {STAGES.map((stage) => (
          <section key={stage.slug} className="rounded-md border border-line border-t-4 border-t-brand bg-white p-6">
            <h2 className="text-2xl font-semibold">{stage.title}</h2>
            <p className="mt-1 text-muted">{stage.caption}</p>
            <div className="mt-5">
              <TaskList stage={stage} />
            </div>
          </section>
        ))}
      </div>

      <div className="mt-10 flex flex-wrap items-center justify-between gap-4">
        <Fine>Free to use. Some recommended providers may pay us a commission in future; it never changes the numbers.</Fine>
        {!demoMode && <button
          onClick={() => confirm('Clear all demo data on this device?') && resetState()}
          className="text-sm font-medium text-subtle underline-offset-4 hover:text-ink hover:underline"
        >
          Reset demo data
        </button>}
      </div>
      <Link to="/partners/billing" className="no-print mt-6 inline-block text-sm font-medium text-subtle underline-offset-4 hover:text-ink hover:underline">
        Partner billing (simulation)
      </Link>
    </div>
  )
}

/** One stage's three tasks (/move-in, /move-out). Used by the phone layout. */
export function StagePage() {
  const slug = useLocation().pathname.split('/')[1]
  const stage = STAGES.find((s) => s.slug === slug) ?? STAGES[0]
  return (
    <div className="mx-auto w-full max-w-4xl px-6 py-10">
      <Link to="/" className="mb-6 inline-flex items-center gap-2 text-base font-medium text-muted hover:text-ink">
        <ArrowLeft size={18} /> Back
      </Link>
      <h1 className="font-display text-4xl font-semibold">{stage.title}</h1>
      <div aria-hidden className="mt-3 h-0.5 w-12 bg-brand" />
      <p className="mt-3 text-lg text-muted">{stage.caption}</p>
      <div className="mt-8">
        <TaskList stage={stage} />
      </div>
    </div>
  )
}
