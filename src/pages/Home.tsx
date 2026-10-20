import type { ReactNode } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Box, Camera, Images, KeyRound, Mail, PackageOpen, PoundSterling, Sparkles } from 'lucide-react'
import { ButtonLink, Fine, ListGroup, ListRow, Notice, Page, ProgressBar, Section } from '../components/ui'
import { resetState, useAppState } from '../lib/store'
import { AREAS } from '../lib/types'
import type { AppState, TaskId } from '../lib/types'

interface Task {
  id: TaskId
  to: string
  title: string
  caption: string
  icon: ReactNode
}

interface Stage {
  slug: 'move-in' | 'move-out'
  title: string
  caption: string
  icon: ReactNode
  tasks: Task[]
}

const ICON = { size: 20, strokeWidth: 1.75 } as const

const STAGES: Stage[] = [
  {
    slug: 'move-in',
    title: 'Moving in',
    caption: 'Know your costs and record the house.',
    icon: <KeyRound size={22} strokeWidth={1.75} />,
    tasks: [
      { id: 'bills', to: '/move-in/bills', title: 'Compare bills', caption: 'Bills package or pay each bill yourself', icon: <PoundSterling {...ICON} /> },
      { id: 'inspection', to: '/move-in/inspection', title: 'Photo inspection', caption: 'Photograph each room before you move your things in', icon: <Camera {...ICON} /> },
      { id: 'email', to: '/move-in/email', title: 'Email landlord', caption: 'Send your photos with a dated record', icon: <Mail {...ICON} /> },
    ],
  },
  {
    slug: 'move-out',
    title: 'Moving out',
    caption: 'Prove the condition and leave cleanly.',
    icon: <PackageOpen size={22} strokeWidth={1.75} />,
    tasks: [
      { id: 'comparison', to: '/move-out/compare', title: 'Before and after report', caption: 'Spot new damage before the landlord does', icon: <Images {...ICON} /> },
      { id: 'cleaning', to: '/move-out/cleaning', title: 'Cleaning', caption: 'Cleaner cost against your deposit', icon: <Sparkles {...ICON} /> },
      { id: 'storage', to: '/move-out/storage', title: 'Find storage', caption: 'Cheapest place for your boxes', icon: <Box {...ICON} /> },
    ],
  },
]

function doneCount(stage: Stage, tasks: AppState['tasks']) {
  return stage.tasks.filter((t) => tasks[t.id] === 'done').length
}

/** Move-out becomes the current stage once any move-out task has started or every move-in task is done. */
function currentStage(tasks: AppState['tasks']): Stage {
  const [moveIn, moveOut] = STAGES
  const outStarted = moveOut.tasks.some((t) => tasks[t.id] !== 'notStarted')
  return outStarted || doneCount(moveIn, tasks) === moveIn.tasks.length ? moveOut : moveIn
}

function daysUntil(isoDate: string) {
  const ms = new Date(isoDate + 'T00:00:00').getTime() - new Date(new Date().toDateString()).getTime()
  return Math.round(ms / 86_400_000)
}

export default function Home() {
  const { tasks, demoMode, property } = useAppState()
  const stage = currentStage(tasks)
  const area = AREAS.find((a) => a.id === property.area)?.label ?? 'Durham'
  const next = stage.tasks.filter((t) => tasks[t.id] !== 'done')
  const allDone = STAGES.every((s) => doneCount(s, tasks) === s.tasks.length)

  return (
    <Page
      title={stage.slug === 'move-in' ? `Moving into ${area}?` : `Moving out of ${area}?`}
      subtitle={allDone ? 'You have finished both lists.' : `Your next step: ${next[0].title.toLowerCase()}.`}
      back={null}
    >
      {next.length > 0 && (
        <ButtonLink to={next[0].to} block className="mb-6">
          {tasks[next[0].id] === 'inProgress' ? 'Continue' : 'Start'}: {next[0].title.toLowerCase()}
        </ButtonLink>
      )}
      <ListGroup>
        {STAGES.map((s) => (
          <ListRow
            key={s.slug}
            to={`/${s.slug}`}
            large
            icon={s.icon}
            tone={s === stage ? 'brand' : undefined}
            label={s.title}
            caption={s.caption}
            value={`${doneCount(s, tasks)} of ${s.tasks.length} done`}
            valueTone="muted"
          />
        ))}
      </ListGroup>

      {next.length > 1 && (
        <Section title="After that" className="mt-8">
          <ListGroup>
            {next.slice(1, 3).map((t) => (
              <ListRow key={t.id} to={t.to} icon={t.icon} label={t.title} caption={t.caption} status={tasks[t.id]} />
            ))}
          </ListGroup>
        </Section>
      )}

      <div className="mt-10 space-y-3">
        <Fine>Free to use. Some recommended providers may pay us a commission in future; it never changes the numbers.</Fine>
        <div className="no-print -ml-2 flex flex-wrap items-center gap-x-2">
          <Link to="/partners/billing" className="inline-flex min-h-11 items-center rounded-lg px-2 text-sm font-medium text-brand hover:text-brand-hover">
            Partner billing (simulation)
          </Link>
          {!demoMode && (
            <button
              type="button"
              onClick={() => confirm('Clear all demo data on this device?') && resetState()}
              className="inline-flex min-h-11 items-center rounded-lg px-2 text-sm font-medium text-muted hover:text-ink"
            >
              Reset demo data
            </button>
          )}
        </div>
      </div>
    </Page>
  )
}

/** One stage's tasks (/move-in, /move-out), in the order a student needs them. */
export function StagePage() {
  const slug = useLocation().pathname.split('/')[1]
  const stage = STAGES.find((s) => s.slug === slug) ?? STAGES[0]
  const { tasks, property } = useAppState()
  const done = doneCount(stage, tasks)
  const days = daysUntil(stage.slug === 'move-in' ? property.moveInDate : property.moveOutDate)
  const soon = days >= 0 && days <= 7

  return (
    <Page title={stage.title} subtitle={stage.caption} back="/" backLabel="Home">
      {soon && (
        <Notice tone="warning" title={days === 0 ? `${stage.title} is today` : `${stage.title} in ${days} ${days === 1 ? 'day' : 'days'}`} className="mb-6">
          {stage.slug === 'move-in' ? 'Photograph each room before you move your things in.' : 'Book cleaning and storage first.'}
        </Notice>
      )}
      <div className="mb-3 flex items-center gap-3">
        <ProgressBar value={done} max={stage.tasks.length} label={`${stage.title} progress`} />
        <span className="shrink-0 text-sm font-medium text-muted tabular-nums">{done} of {stage.tasks.length} done</span>
      </div>
      <ListGroup>
        {stage.tasks.map((t) => (
          <ListRow key={t.id} to={t.to} icon={t.icon} label={t.title} caption={t.caption} status={tasks[t.id]} />
        ))}
      </ListGroup>
      <p className="mt-4 text-[13px] leading-[18px] text-subtle">
        {stage.slug === 'move-in' ? 'Do these in the first week. Your photos protect your deposit at the end of the year.' : 'Start two weeks before you hand back the keys.'}
      </p>
    </Page>
  )
}
