import { useEffect, useState } from 'react'
import { Download } from 'lucide-react'
import { Button, Fine, Page, Stat, cx } from '../../components/ui'
import { setTask, useAppState } from '../../lib/store'
import { compareInspections, sortRows, summarize } from '../../lib/inspection'
import { CHECKLIST, CONDITION_LABEL, ROOMS } from '../../data/checklist'
import { Photo } from '../inspection/ItemCard'
import { fmtDate } from '../inspection/helpers'
import type { ComparisonRow, Flag, ItemRecord } from '../../lib/types'

const FLAG_BADGE: Record<Flag, { label: string; cls: string }> = {
  newIssue: { label: 'New issue', cls: 'bg-highlight-strong text-ink' },
  preExisting: { label: 'Pre-existing', cls: 'bg-brand-soft text-brand' },
  unchanged: { label: 'Unchanged', cls: 'bg-canvas-strong text-muted' },
  unmatched: { label: 'Photo missing', cls: 'border border-line-strong text-muted' },
  notApplicable: { label: 'N/A', cls: 'bg-canvas text-subtle' },
}

const PRINT_CSS = `
@media print {
  @page { margin: 14mm; }
  * { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  .report-row { break-inside: avoid; page-break-inside: avoid; }
  .report-row img { max-height: 62mm; }
  .report-stats > * { padding: 12px 16px; }
}
`

const roomLabel = (id: string) => ROOMS.find((r) => r.id === id)?.label ?? ''

export default function ReportPage() {
  const { property, moveIn, moveOut } = useAppState()
  const rows = sortRows(compareInspections(CHECKLIST, moveIn, moveOut))
  const counts = summarize(rows)
  const [showAll, setShowAll] = useState(false)
  const quiet = (r: ComparisonRow) => r.flag === 'unchanged' || r.flag === 'notApplicable'
  const quietCount = rows.filter(quiet).length

  useEffect(() => setTask('comparison', 'done'), [])

  return (
    <Page
      title="Condition report"
      subtitle={property.label}
      back="/move-out/compare"
      actions={
        <Button onClick={() => window.print()}>
          <Download size={20} /> Download PDF
        </Button>
      }
    >
      <style>{PRINT_CSS}</style>

      <div className="report-stats">
        <Stat label="New issues" value={String(counts.newIssue)} highlight />
        <p className="mt-2 text-sm text-muted">
          {counts.preExisting} pre-existing, {counts.unchanged} unchanged{counts.unmatched ? `, ${counts.unmatched} photo missing` : ''}
        </p>
      </div>

      <div className="mt-8 space-y-4">
        {rows.map((row) => (
          <div key={row.item.id} className={cx(quiet(row) && !showAll && 'hidden print:block')}>
            <ReportRow row={row} moveInDate={property.moveInDate} moveOutDate={property.moveOutDate} />
          </div>
        ))}
      </div>
      {quietCount > 0 && (
        <button type="button" onClick={() => setShowAll((v) => !v)} className="no-print mt-4 min-h-11 text-sm font-semibold text-muted underline-offset-4 hover:text-ink hover:underline">
          {showAll ? 'Hide unchanged items' : `Show ${quietCount} unchanged items`}
        </button>
      )}

      <div className="mt-10 border-t border-line pt-6">
        <Fine>
          User-created record. Supporting evidence only, not a professional inspection or legal determination. Flags reflect the conditions you selected, not automated image analysis.{' '}
          Deposit disputes:{' '}
          <a href="https://www.gov.uk/tenancy-deposit-protection" target="_blank" rel="noreferrer" className="font-medium text-brand underline underline-offset-4">
            gov.uk/tenancy-deposit-protection
          </a>
          .
        </Fine>
      </div>
    </Page>
  )
}

function ReportRow({ row, moveInDate, moveOutDate }: { row: ComparisonRow; moveInDate: string; moveOutDate: string }) {
  const badge = FLAG_BADGE[row.flag]
  const title = `${roomLabel(row.item.room)}: ${row.item.label}`
  return (
    <section className={cx('report-row rounded-lg border p-5', row.flag === 'newIssue' ? 'border-highlight-strong bg-highlight/40' : 'border-line')}>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-xl font-bold">{title}</h2>
        <span className={cx('rounded-full px-3 py-1 text-sm font-bold', badge.cls)}>{badge.label}</span>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <Side label="Move-in" record={row.moveIn} fallbackDate={moveInDate} alt={`${title} at move-in`} />
        <Side label="Move-out" record={row.moveOut} fallbackDate={moveOutDate} alt={`${title} at move-out`} />
      </div>
    </section>
  )
}

function Side({ label, record, fallbackDate, alt }: { label: string; record: ItemRecord | null; fallbackDate: string; alt: string }) {
  return (
    <figure>
      <Photo photoId={record?.photoId ?? null} alt={alt} />
      <figcaption className="mt-2 text-sm">
        <span className="font-semibold text-muted">
          {label}, {fmtDate(record?.recordedAt ?? fallbackDate)}
        </span>
        <span className="block font-semibold text-ink">{record?.condition ? CONDITION_LABEL[record.condition] : 'Not recorded'}</span>
        {record?.note && <span className="block text-muted">{record.note}</span>}
      </figcaption>
    </figure>
  )
}
