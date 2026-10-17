import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { Box, Camera, ChevronRight, Images, Mail, PoundSterling, Sparkles } from 'lucide-react'
import { StatusBadge, Fine } from '../components/ui'
import { resetState, useAppState } from '../lib/store'
import type { TaskId } from '../lib/types'

interface Task {
  id: TaskId
  to: string
  title: string
  icon: ReactNode
}

const STAGES: { title: string; caption: string; tasks: Task[] }[] = [
  {
    title: 'Moving in',
    caption: 'Know your costs. Record the house.',
    tasks: [
      { id: 'bills', to: '/move-in/bills', title: 'Compare bills', icon: <PoundSterling size={22} /> },
      { id: 'inspection', to: '/move-in/inspection', title: 'Photo inspection', icon: <Camera size={22} /> },
      { id: 'email', to: '/move-in/email', title: 'Email landlord', icon: <Mail size={22} /> },
    ],
  },
  {
    title: 'Moving out',
    caption: 'Prove the condition. Leave cleanly.',
    tasks: [
      { id: 'comparison', to: '/move-out/compare', title: 'Before / after report', icon: <Images size={22} /> },
      { id: 'storage', to: '/move-out/storage', title: 'Find storage', icon: <Box size={22} /> },
      { id: 'cleaning', to: '/move-out/cleaning', title: 'Cleaning', icon: <Sparkles size={22} /> },
    ],
  },
]

export default function Home() {
  const { tasks } = useAppState()
  return (
    <div className="mx-auto w-full max-w-4xl px-6 py-12">
      <h1 className="text-5xl font-extrabold leading-tight tracking-tight">
        Settle into your student house.
      </h1>
      <p className="mt-3 text-xl text-slate-500">Bills, evidence and moving help, in one place.</p>

      <div className="mt-10 grid gap-6 md:grid-cols-2">
        {STAGES.map((stage) => (
          <section key={stage.title} className="rounded-3xl border border-line p-6">
            <h2 className="text-2xl font-bold">{stage.title}</h2>
            <p className="mt-1 text-slate-500">{stage.caption}</p>
            <ul className="mt-5 space-y-3">
              {stage.tasks.map((t) => (
                <li key={t.id}>
                  <Link
                    to={t.to}
                    className="group flex items-center gap-4 rounded-2xl border border-line p-4 transition hover:border-brand hover:bg-brand-soft"
                  >
                    <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-soft text-brand">{t.icon}</span>
                    <span className="flex-1 text-lg font-semibold">{t.title}</span>
                    <StatusBadge status={tasks[t.id]} />
                    <ChevronRight className="text-slate-300 group-hover:text-brand" size={20} />
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>

      <div className="mt-10 flex flex-wrap items-center justify-between gap-4">
        <Fine>Free to use. Some recommended providers may pay us a commission in future; it never changes the numbers.</Fine>
        <button
          onClick={() => confirm('Clear all demo data on this device?') && resetState()}
          className="text-sm font-medium text-slate-400 underline-offset-4 hover:text-slate-900 hover:underline"
        >
          Reset demo data
        </button>
      </div>
    </div>
  )
}
