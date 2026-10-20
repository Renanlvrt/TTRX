import type { ReactNode } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { ArrowLeft, Box, Camera, ChevronRight, Images, KeyRound, Mail, PackageOpen, PoundSterling, Sparkles } from 'lucide-react'
import { StatusBadge } from '../components/ui'
import { useAppState } from '../lib/store'
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
  return (
    <div className="mx-auto w-full max-w-xl px-6 py-12">
      <h1 className="font-display text-4xl font-semibold leading-tight">Moving in or moving out?</h1>
      <div className="mt-8 grid gap-4">
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
    </div>
  )
}

/** One stage's three tasks (/move-in, /move-out). Used by the phone layout. */
export function StagePage() {
  const slug = useLocation().pathname.split('/')[1]
  const stage = STAGES.find((s) => s.slug === slug) ?? STAGES[0]
  return (
    <div className="mx-auto w-full max-w-xl px-6 py-10">
      <Link to="/" className="mb-6 inline-flex items-center gap-2 text-base font-medium text-muted hover:text-ink">
        <ArrowLeft size={18} /> Back
      </Link>
      <h1 className="font-display text-4xl font-semibold">{stage.title}</h1>
      <div className="mt-6">
        <TaskList stage={stage} />
      </div>
    </div>
  )
}
