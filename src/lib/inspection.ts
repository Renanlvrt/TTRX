// Before/after comparison logic. Pure: no React, no storage.
// Flags come from the conditions the user selected, never from image analysis.
import type { ChecklistItem, ComparisonRow, Flag, Inspection, ItemRecord } from './types'

/** Report order: most important first. */
export const FLAG_ORDER: Flag[] = ['newIssue', 'unmatched', 'preExisting', 'unchanged', 'notApplicable']

/** A side counts as "evidenced" when it has a condition and a photo. */
function hasEvidence(r: ItemRecord | null): r is ItemRecord {
  return !!r && r.condition !== null && !!r.photoId
}

/**
 * Flag precedence (first match wins):
 * 1. notApplicable — either side marked N/A.
 * 2. unmatched     — either side missing its condition or photo (nothing to compare).
 * 3. newIssue      — good at move-in, damaged at move-out.
 * 4. preExisting   — damaged at move-in (whatever move-out says): documented at move-in, protects the tenant.
 * 5. unchanged     — good at both.
 */
export function flagFor(moveIn: ItemRecord | null, moveOut: ItemRecord | null): Flag {
  if (moveIn?.condition === 'na' || moveOut?.condition === 'na') return 'notApplicable'
  if (!hasEvidence(moveIn) || !hasEvidence(moveOut)) return 'unmatched'
  if (moveIn.condition === 'good' && moveOut.condition === 'damaged') return 'newIssue'
  if (moveIn.condition === 'damaged') return 'preExisting'
  return 'unchanged'
}

export function compareInspections(checklist: ChecklistItem[], moveIn: Inspection, moveOut: Inspection): ComparisonRow[] {
  return checklist.map((item) => {
    const a = moveIn.records[item.id] ?? null
    const b = moveOut.records[item.id] ?? null
    return { item, moveIn: a, moveOut: b, flag: flagFor(a, b) }
  })
}

/** Rows sorted by FLAG_ORDER, checklist order kept within a flag. */
export function sortRows(rows: ComparisonRow[]): ComparisonRow[] {
  return [...rows].sort((x, y) => FLAG_ORDER.indexOf(x.flag) - FLAG_ORDER.indexOf(y.flag))
}

export function summarize(rows: ComparisonRow[]): Record<Flag, number> {
  const counts: Record<Flag, number> = { newIssue: 0, preExisting: 0, unchanged: 0, unmatched: 0, notApplicable: 0 }
  for (const r of rows) counts[r.flag]++
  return counts
}

/** Done = condition set AND (photo present OR condition is N/A). */
export function isItemDone(r: ItemRecord | null | undefined): boolean {
  return !!r && r.condition !== null && (!!r.photoId || r.condition === 'na')
}

export function inspectionProgress(inspection: Inspection, checklist: ChecklistItem[]): { done: number; total: number; missing: ChecklistItem[] } {
  const missing = checklist.filter((i) => !isItemDone(inspection.records[i.id]))
  return { done: checklist.length - missing.length, total: checklist.length, missing }
}

/** True once anything (photo, condition or note) has been recorded. */
export function hasAnyRecord(inspection: Inspection): boolean {
  return Object.values(inspection.records).some((r) => r.condition !== null || !!r.photoId || r.note.trim() !== '')
}
