import type { ReactNode } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { ArrowLeft, Box, Camera, ChevronRight, Images, KeyRound, Mail, PackageOpen, PoundSterling, SprayCan } from 'lucide-react'
import { LogoMark } from '../components/Logo'
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
  icon: ReactNode
  tile: string
  tasks: Task[]
}

const STAGES: Stage[] = [
  {
    slug: 'move-in',
    title: 'Moving in',
    icon: <KeyRound size={32} strokeWidth={1.75} />,
    tile: 'bg-cyan hover:bg-cyan-hover',
    tasks: [
      { id: 'bills', to: '/move-in/bills', title: 'Compare bills', icon: <PoundSterling size={22} /> },
      { id: 'inspection', to: '/move-in/inspection', title: 'Photo inspection', icon: <Camera size={22} /> },
      { id: 'email', to: '/move-in/email', title: 'Email landlord', icon: <Mail size={22} /> },
    ],
  },
  {
    slug: 'move-out',
    title: 'Moving out',
    icon: <PackageOpen size={32} strokeWidth={1.75} />,
    tile: 'bg-brand-deep hover:bg-brand-hover',
    tasks: [
      { id: 'comparison', to: '/move-out/compare', title: 'Before / after report', icon: <Images size={22} /> },
      { id: 'storage', to: '/move-out/storage', title: 'Find storage', icon: <Box size={22} /> },
      { id: 'cleaning', to: '/move-out/cleaning', title: 'Cleaning', icon: <SprayCan size={22} /> },
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
            <span className="shrink-0 text-brand">{t.icon}</span>
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
    <div className="on-brand flex min-h-[calc(100dvh-3.5rem-env(safe-area-inset-top))] flex-col bg-brand text-white">
      <div className="flex flex-1 flex-col items-center justify-center px-6 py-12">
        <LogoMark size={112} />
        <h1 className="mt-5 text-5xl font-semibold tracking-tight">RentReady</h1>
      </div>
      <div className="mx-auto grid w-full max-w-xl grid-cols-2 gap-3 px-4 pb-[max(1.5rem,env(safe-area-inset-bottom))]">
        {STAGES.map((stage) => (
          <Link
            key={stage.slug}
            to={`/${stage.slug}`}
            className={`flex h-32 flex-col items-center justify-center gap-3 rounded-2xl border border-white/15 text-white transition-colors ${stage.tile}`}
          >
            {stage.icon}
            <span className="text-lg font-semibold">{stage.title}</span>
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
