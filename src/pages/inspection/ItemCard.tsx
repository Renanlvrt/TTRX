// Shared inspection UI: editable item card, read-only photo, store helpers.
import { useRef, useState, type DragEvent, type ReactNode } from 'react'
import { Camera, Loader2, RotateCcw, Trash2, ImageOff } from 'lucide-react'
import { cx } from '../../components/ui'
import { deletePhoto, savePhoto, usePhotoUrl } from '../../lib/store'
import { CONDITION_TONE, fmtDateTime, updateRecord } from './helpers'
import { CONDITION_LABEL } from '../../data/checklist'
import type { ChecklistItem, Condition, InspectionKind, ItemRecord } from '../../lib/types'

/** Read-only photo tile. */
export function Photo({ photoId, alt, className }: { photoId: string | null; alt: string; className?: string }) {
  const url = usePhotoUrl(photoId)
  return (
    <div className={cx('aspect-[16/10] overflow-hidden rounded-2xl bg-slate-100', className)}>
      {url ? (
        <img src={url} alt={alt} className="h-full w-full object-cover" />
      ) : (
        <div className="flex h-full w-full flex-col items-center justify-center gap-1 text-sm text-slate-400">
          <ImageOff size={22} />
          No photo
        </div>
      )}
    </div>
  )
}

export function ItemCard({ kind, item, record, attention }: { kind: InspectionKind; item: ChecklistItem; record: ItemRecord | null; attention?: boolean }) {
  const input = useRef<HTMLInputElement>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [dragging, setDragging] = useState(false)
  const url = usePhotoUrl(record?.photoId ?? null)
  const now = () => new Date().toISOString()

  async function addPhoto(file: File | undefined) {
    if (!file) return
    if (!file.type.startsWith('image/')) return setError('That file is not an image.')
    setError(null)
    setSaving(true)
    try {
      const id = await savePhoto(file)
      const old = record?.photoId
      updateRecord(kind, item.id, { photoId: id, recordedAt: now() })
      if (old) deletePhoto(old).catch(() => {})
    } catch {
      setError('Could not save the photo. Try again or use a smaller image.')
    } finally {
      setSaving(false)
      if (input.current) input.current.value = ''
    }
  }

  function removePhoto() {
    if (record?.photoId) deletePhoto(record.photoId).catch(() => {})
    updateRecord(kind, item.id, { photoId: null })
  }

  function onDrop(e: DragEvent) {
    e.preventDefault()
    setDragging(false)
    addPhoto(e.dataTransfer.files[0])
  }

  return (
    <div id={`item-${item.id}`} className={cx('scroll-mt-6 rounded-3xl border bg-white p-4 transition', attention ? 'border-highlight-strong ring-4 ring-highlight' : 'border-line')}>
      <input ref={input} type="file" accept="image/*" className="hidden" onChange={(e) => addPhoto(e.target.files?.[0])} />

      {url ? (
        <div className="group relative aspect-[16/10] overflow-hidden rounded-2xl bg-slate-100">
          <img src={url} alt={item.label} className="h-full w-full object-cover" />
          <div className="absolute right-2 top-2 flex gap-2">
            <IconBtn label="Retake photo" onClick={() => input.current?.click()}><RotateCcw size={16} /></IconBtn>
            <IconBtn label="Remove photo" onClick={removePhoto}><Trash2 size={16} /></IconBtn>
          </div>
          {saving && <Saving />}
        </div>
      ) : (
        <button
          type="button"
          onClick={() => input.current?.click()}
          onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
          onDragLeave={() => setDragging(false)}
          onDrop={onDrop}
          disabled={saving}
          className={cx(
            'relative flex aspect-[16/10] w-full flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed text-slate-500 transition hover:border-brand hover:bg-brand-soft hover:text-brand',
            dragging ? 'border-brand bg-brand-soft text-brand' : 'border-slate-300',
          )}
        >
          <Camera size={28} />
          <span className="text-base font-semibold">Add photo</span>
          {saving && <Saving />}
        </button>
      )}

      <div className="mt-3 flex items-baseline justify-between gap-2">
        <h3 className="text-lg font-bold">{item.label}</h3>
        {record?.recordedAt && <span className="shrink-0 text-xs text-slate-400">{fmtDateTime(record.recordedAt)}</span>}
      </div>
      <p className="text-sm text-slate-500">{item.hint}</p>

      <div role="radiogroup" aria-label={`${item.label} condition`} className="mt-3 grid grid-cols-[1fr_1.35fr_auto] gap-1.5">
        {(Object.keys(CONDITION_LABEL) as Condition[]).map((c) => {
          const on = record?.condition === c
          return (
            <button
              key={c}
              type="button"
              role="radio"
              aria-checked={on}
              onClick={() => updateRecord(kind, item.id, { condition: c, recordedAt: record?.recordedAt ?? now() })}
              className={cx('h-10 rounded-xl border px-2 text-sm font-semibold transition', on ? CONDITION_TONE[c] : 'border-line text-slate-600 hover:border-slate-300 hover:bg-slate-50')}
            >
              {CONDITION_LABEL[c]}
            </button>
          )
        })}
      </div>

      <input
        value={record?.note ?? ''}
        onChange={(e) => updateRecord(kind, item.id, { note: e.target.value })}
        placeholder="Add notes…"
        aria-label={`${item.label} notes`}
        className="mt-2 h-10 w-full rounded-xl border border-line px-3 text-sm placeholder:text-slate-400 focus:border-brand focus:outline-none"
      />

      {error && <p role="alert" className="mt-2 text-sm font-medium text-red-700">{error}</p>}
    </div>
  )
}

function IconBtn({ label, onClick, children }: { label: string; onClick: () => void; children: ReactNode }) {
  return (
    <button type="button" aria-label={label} title={label} onClick={onClick} className="flex h-9 w-9 items-center justify-center rounded-full bg-white/90 text-slate-700 shadow-sm hover:bg-white hover:text-slate-900">
      {children}
    </button>
  )
}

function Saving() {
  return (
    <span className="absolute inset-0 flex items-center justify-center gap-2 rounded-2xl bg-white/80 text-sm font-semibold text-slate-700">
      <Loader2 size={18} className="animate-spin" /> Saving…
    </span>
  )
}

export function ProgressPill({ done, total }: { done: number; total: number }) {
  const complete = done === total
  return (
    <span className={cx('inline-flex h-11 items-center rounded-2xl px-4 text-base font-bold tabular-nums', complete ? 'bg-brand-soft text-brand' : 'bg-slate-100 text-slate-700')}>
      {done} / {total}
    </span>
  )
}
