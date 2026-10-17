import { useEffect } from 'react'
import { FileText, Wand2 } from 'lucide-react'
import { Button, ButtonLink, Fine, Page, cx } from '../../components/ui'
import { setState, setTask, useAppState } from '../../lib/store'
import { hasAnyRecord, inspectionProgress } from '../../lib/inspection'
import { CHECKLIST, CONDITION_LABEL, ROOMS } from '../../data/checklist'
import { demoMoveIn, demoMoveOut } from '../../data/demoSeed'
import { ItemCard, Photo, ProgressPill } from '../inspection/ItemCard'
import { CONDITION_TONE, fmtDate, replaceInspection } from '../inspection/helpers'
import type { ItemRecord } from '../../lib/types'

const roomLabel = (id: string) => ROOMS.find((r) => r.id === id)?.label ?? ''

export default function ComparePage() {
  const { moveIn, moveOut, tasks } = useAppState()
  const progress = inspectionProgress(moveOut, CHECKLIST)
  const missingIds = new Set(progress.missing.map((m) => m.id))

  useEffect(() => {
    if (tasks.comparison === 'notStarted' && hasAnyRecord(moveOut)) setTask('comparison', 'inProgress')
  }, [moveOut, tasks.comparison])

  function loadDemo() {
    if (hasAnyRecord(moveOut) && !confirm('Replace your move-out records with the demo (8 items done)?')) return
    if (!hasAnyRecord(moveIn)) {
      setState((s) => ({ ...s, moveIn: demoMoveIn() }))
      setTask('inspection', 'done')
    }
    replaceInspection('moveOut', demoMoveOut(), moveOut)
    setTask('comparison', 'inProgress')
  }

  return (
    <Page
      title="Move-out photos"
      subtitle="Retake each photo from the same angle. We pair it with move-in."
      actions={
        <>
          <ProgressPill done={progress.done} total={progress.total} />
          <Button variant="secondary" size="md" onClick={loadDemo}>
            <Wand2 size={18} /> Load demo move-out (8 done)
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        {CHECKLIST.map((item) => {
          const missing = missingIds.has(item.id)
          return (
            <div key={item.id} className="grid items-start gap-4 md:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
              <MoveInSide record={moveIn.records[item.id] ?? null} label={`${roomLabel(item.room)} · ${item.label}`} missing={missing} />
              <ItemCard kind="moveOut" item={item} record={moveOut.records[item.id] ?? null} attention={missing && hasAnyRecord(moveOut)} />
            </div>
          )
        })}
      </div>

      <div className="no-print mt-10 flex flex-wrap items-center justify-between gap-4">
        <Fine>{progress.missing.length === 0 ? 'All items paired.' : `${progress.missing.length} still to photograph: ${progress.missing.map((m) => m.label).join(', ')}.`}</Fine>
        <ButtonLink to="/move-out/report">
          <FileText size={20} /> Build report
        </ButtonLink>
      </div>
    </Page>
  )
}

function MoveInSide({ record, label, missing }: { record: ItemRecord | null; label: string; missing: boolean }) {
  return (
    <div className="p-1 pt-4">
      <div className="mb-2 flex items-center justify-between gap-2">
        <span className="text-sm font-bold uppercase tracking-wide text-slate-500">{label}</span>
        {missing && <span className="rounded-full bg-highlight px-2.5 py-0.5 text-xs font-bold text-slate-900">To do</span>}
      </div>
      <Photo photoId={record?.photoId ?? null} alt={`${label} at move-in`} />
      <div className="mt-2 flex flex-wrap items-center gap-2 text-sm">
        <span className="font-semibold text-slate-500">Move-in{record?.recordedAt ? ` · ${fmtDate(record.recordedAt)}` : ''}</span>
        {record?.condition ? (
          <span className={cx('rounded-full border px-2.5 py-0.5 text-xs font-semibold', CONDITION_TONE[record.condition])}>{CONDITION_LABEL[record.condition]}</span>
        ) : (
          <span className="text-slate-400">Not recorded</span>
        )}
      </div>
      {record?.note && <p className="mt-1 text-sm text-slate-600">{record.note}</p>}
    </div>
  )
}
