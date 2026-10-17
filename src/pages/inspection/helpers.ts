// Non-component helpers shared by inspection/move-out screens.
import { deletePhoto, setState } from '../../lib/store'
import type { Condition, Inspection, InspectionKind, ItemRecord } from '../../lib/types'

export function fmtDate(iso: string | null | undefined) {
  if (!iso) return ''
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

export function fmtDateTime(iso: string) {
  const d = new Date(iso)
  return `${fmtDate(iso)}, ${d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}`
}

const emptyRecord = (itemId: string): ItemRecord => ({ itemId, condition: null, note: '', photoId: null, recordedAt: null })

export function updateRecord(kind: InspectionKind, itemId: string, patch: Partial<ItemRecord>) {
  setState((s) => {
    const insp = s[kind]
    const prev = insp.records[itemId] ?? emptyRecord(itemId)
    return { ...s, [kind]: { ...insp, records: { ...insp.records, [itemId]: { ...prev, ...patch } } } }
  })
}

/** Replace a whole inspection (demo loader); best-effort cleanup of stored photos it replaces. */
export function replaceInspection(kind: InspectionKind, next: Inspection, prev: Inspection) {
  Object.values(prev.records).forEach((r) => r.photoId && deletePhoto(r.photoId).catch(() => {}))
  setState((s) => ({ ...s, [kind]: next }))
}

export const CONDITION_TONE: Record<Condition, string> = {
  good: 'border-brand bg-brand-soft text-brand',
  damaged: 'border-highlight-strong bg-highlight text-slate-900',
  na: 'border-slate-400 bg-slate-100 text-slate-700',
}
