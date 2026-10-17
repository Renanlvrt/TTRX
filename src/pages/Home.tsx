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
    <ul className="space-y-3">
      {stage.tasks.map((t) => (
        <li key={t.id}>
          <Link
            to={t.to}
            className="group flex items-center gap-4 rounded-2xl border border-line p-4 transition hover:border-brand hover:bg-brand-soft"
          >
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-soft text-brand">{t.icon}</span>
            <span className="flex-1 text-lg font-semibold">{t.title}</span>
            <StatusBadge status={tasks[t.id]} />
            <ChevronRight className="shrink-0 text-slate-300 group-hover:text-brand" size={20} />
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
      <h1 className="text-4xl font-extrabold leading-tight tracking-tight md:text-5xl">
        Settle into your student house.
      </h1>
      <p className="mt-3 text-lg text-slate-500 md:text-xl">Bills, evidence and moving help, in one place.</p>

      {/* Phone: two big stage buttons; each opens its own page of tasks. */}
      <div className="mt-10 grid gap-4 md:hidden">
        {STAGES.map((stage) => (
          <Link
            key={stage.slug}
            to={`/${stage.slug}`}
            className="flex items-center gap-4 rounded-3xl bg-brand p-6 text-white transition active:scale-[0.99]"
          >
            <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white/15">{stage.icon}</span>
            <span className="flex-1">
              <span className="block text-2xl font-bold">{stage.title}</span>
              <span className="mt-0.5 block text-sm text-white/80">{stage.caption}</span>
            </span>
            <ChevronRight size={24} />
          </Link>
        ))}
      </div>

      {/* Desktop: both stages side by side. */}
      <div className="mt-10 hidden gap-6 md:grid md:grid-cols-2">
        {STAGES.map((stage) => (
          <section key={stage.slug} className="rounded-3xl border border-line p-6">
            <h2 className="text-2xl font-bold">{stage.title}</h2>
            <p className="mt-1 text-slate-500">{stage.caption}</p>
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
          className="text-sm font-medium text-slate-400 underline-offset-4 hover:text-slate-900 hover:underline"
        >
          Reset demo data
        </button>}
      </div>
    </div>
  )
}

/** One stage's three tasks (/move-in, /move-out). Used by the phone layout. */
export function StagePage() {
  const slug = useLocation().pathname.split('/')[1]
  const stage = STAGES.find((s) => s.slug === slug) ?? STAGES[0]
  return (
    <div className="mx-auto w-full max-w-4xl px-6 py-10">
      <Link to="/" className="mb-6 inline-flex items-center gap-2 text-base font-medium text-slate-500 hover:text-slate-900">
        <ArrowLeft size={18} /> Back
      </Link>
      <h1 className="text-4xl font-extrabold tracking-tight">{stage.title}</h1>
      <p className="mt-2 text-lg text-slate-500">{stage.caption}</p>
      <div className="mt-8">
        <TaskList stage={stage} />
      </div>
    </div>
  )
}
