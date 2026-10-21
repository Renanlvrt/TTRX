import { useEffect, useState } from 'react'
import { Button, ButtonLink, Card, Page } from '../../components/ui'
import { setTask, useAppState } from '../../lib/store'
import { hasAnyRecord, inspectionProgress } from '../../lib/inspection'
import { CHECKLIST, ROOMS } from '../../data/checklist'
import { demoMoveIn } from '../../data/demoSeed'
import { ItemCard, ProgressPill } from './ItemCard'
import { replaceInspection } from './helpers'

export default function InspectionPage() {
  const { moveIn, tasks, demoMode } = useAppState()
  const progress = inspectionProgress(moveIn, CHECKLIST)
  const [triedFinish, setTriedFinish] = useState(false)
  const complete = progress.done === progress.total
  const missingIds = new Set(progress.missing.map((m) => m.id))

  useEffect(() => {
    if (tasks.inspection === 'notStarted' && hasAnyRecord(moveIn)) setTask('inspection', 'inProgress')
    if (tasks.inspection === 'done' && !complete) setTask('inspection', 'inProgress')
  }, [moveIn, tasks.inspection, complete])

  function loadDemo() {
    if (hasAnyRecord(moveIn) && !confirm('Replace your move-in records with the demo house?')) return
    replaceInspection('moveIn', demoMoveIn(), moveIn)
    setTask('inspection', 'inProgress')
    setTriedFinish(false)
  }

  function finish() {
    setTriedFinish(true)
    if (complete) setTask('inspection', 'done')
  }

  return (
    <Page
      title="Photo inspection"
      actions={
        <>
          <ProgressPill done={progress.done} total={progress.total} />
          {!demoMode && <Button variant="secondary" size="md" onClick={loadDemo}>
            Load demo house
          </Button>}
        </>
      }
    >
      <div className="space-y-8">
        {ROOMS.map((room) => (
          <section key={room.id}>
            <h2 className="mb-3 text-xl font-semibold">{room.label}</h2>
            <div className="grid gap-4 md:grid-cols-2">
              {CHECKLIST.filter((i) => i.room === room.id).map((item) => (
                <ItemCard key={item.id} kind="moveIn" item={item} record={moveIn.records[item.id] ?? null} attention={triedFinish && missingIds.has(item.id)} />
              ))}
            </div>
          </section>
        ))}
      </div>

      <div className="mt-10 space-y-4">
        {triedFinish && !complete && (
          <Card highlight>
            <p className="text-lg font-bold">{progress.missing.length} left to record</p>
            <p className="mt-1 text-ink">
              {progress.missing.map((m, i) => (
                <span key={m.id}>
                  {i > 0 && ', '}
                  <a href={`#item-${m.id}`} className="font-medium underline underline-offset-4">{m.label}</a>
                </span>
              ))}
            </p>
          </Card>
        )}
        {triedFinish && complete && (
          <Card className="border-brand bg-brand-soft">
            <p className="text-lg font-bold">All {progress.total} items recorded.</p>
          </Card>
        )}
        <div className="no-print flex flex-wrap items-center justify-between gap-3">
          <ButtonLink to="/move-in/email" variant="secondary">
            Email landlord
          </ButtonLink>
          <Button onClick={finish}>
            Finish
          </Button>
        </div>
      </div>
    </Page>
  )
}
