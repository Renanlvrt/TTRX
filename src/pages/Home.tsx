import type { ReactNode } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { ArrowLeft, Box, Camera, ChevronRight, Images, Mail, PoundSterling, SprayCan } from 'lucide-react'
import { BoxOutGlyph, KeyGlyph, LogoMark } from '../components/Logo'
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
  tasks: Task[]
}

const STAGES: Stage[] = [
  {
    slug: 'move-in',
    title: 'Moving in',
    icon: <KeyGlyph />,
    tasks: [
      { id: 'bills', to: '/move-in/bills', title: 'Compare bills', icon: <PoundSterling size={22} /> },
      { id: 'inspection', to: '/move-in/inspection', title: 'Photo inspection', icon: <Camera size={22} /> },
      { id: 'email', to: '/move-in/email', title: 'Email landlord', icon: <Mail size={22} /> },
    ],
  },
  {
    slug: 'move-out',
    title: 'Moving out',
    icon: <BoxOutGlyph />,
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
            className="group flex items-center gap-4 border-b border-line bg-card px-4 py-4 transition-colors hover:bg-brand-soft"
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
            className={`relative flex h-36 flex-col items-center justify-center gap-2 rounded-[1.4rem] transition-colors hover:bg-white/10 active:bg-white/15 ${i ? 'glass-divider' : ''}`}
          >
            {stage.icon}
            <span className="text-xl font-medium text-[#E8F0F0]">{stage.title}</span>
          </Link>
        ))}
      </nav>
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
