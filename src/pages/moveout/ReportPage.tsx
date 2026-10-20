import { useEffect } from 'react'
import { Download } from 'lucide-react'
import { Button, Fine, Page, Stat, cx } from '../../components/ui'
import { setTask, useAppState } from '../../lib/store'
import { compareInspections, sortRows, summarize } from '../../lib/inspection'
import { CHECKLIST, CONDITION_LABEL, ROOMS } from '../../data/checklist'
import { Photo } from '../inspection/ItemCard'
import { fmtDate } from '../inspection/helpers'
import type { ComparisonRow, Flag, ItemRecord } from '../../lib/types'

const FLAG_BADGE: Record<Flag, { label: string; cls: string }> = {
  newIssue: { label: 'NEW ISSUE', cls: 'bg-highlight-strong text-ink' },
  preExisting: { label: 'Pre-existing · documented at move-in', cls: 'bg-brand-soft text-brand' },
  unchanged: { label: 'Unchanged', cls: 'bg-canvas-strong text-muted' },
  unmatched: { label: 'Unmatched · photo missing', cls: 'border border-line-strong text-muted' },
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

  useEffect(() => setTask('comparison', 'done'), [])

  return (
    <Page
      title="Property condition report"
      subtitle={`${property.label} · Move-in ${fmtDate(property.moveInDate)} → Move-out ${fmtDate(property.moveOutDate)}`}
      back="/move-out/compare"
      actions={
        <Button onClick={() => window.print()}>
          <Download size={20} /> Download PDF
        </Button>
      }
    >
      <style>{PRINT_CSS}</style>

      <div className="report-stats grid grid-cols-2 gap-4 md:grid-cols-4">
        <Stat label="New issues" value={String(counts.newIssue)} highlight />
        <Stat label="Pre-existing" value={String(counts.preExisting)} sub="Documented" />
        <Stat label="Unchanged" value={String(counts.unchanged)} />
        <Stat label="Unmatched" value={String(counts.unmatched)} sub={counts.notApplicable ? `${counts.notApplicable} N/A` : undefined} />
      </div>

      <div className="mt-8 space-y-4">
        {rows.map((row) => (
          <ReportRow key={row.item.id} row={row} moveInDate={property.moveInDate} moveOutDate={property.moveOutDate} />
        ))}
      </div>

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
  const title = `${roomLabel(row.item.room)} · ${row.item.label}`
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
          {label} · {fmtDate(record?.recordedAt ?? fallbackDate)}
        </span>
        <span className="block font-semibold text-ink">{record?.condition ? CONDITION_LABEL[record.condition] : 'Not recorded'}</span>
        {record?.note && <span className="block text-muted">{record.note}</span>}
      </figcaption>
    </figure>
  )
}
