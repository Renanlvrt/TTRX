// Demo house for the pitch. Photos live in public/demo/<itemId>-in.svg / -out.svg.
// To use real photos: drop files with the same names, or change EXT below.
import type { Condition, Inspection, ItemRecord } from '../lib/types'

const EXT = 'svg'

type Seed = [itemId: string, condition: Condition, note: string, time: string]

const MOVE_IN: Seed[] = [
  ['kitchen-oven', 'good', 'Clean hob, oven racks spotless', '2025-07-01T10:02:00'],
  ['kitchen-fridge', 'good', 'Shelves intact, seals clean', '2025-07-01T10:05:00'],
  ['bathroom-shower', 'damaged', 'Dark marks along sealant', '2025-07-01T10:11:00'],
  ['bathroom-sink', 'good', 'No chips, taps working', '2025-07-01T10:14:00'],
  ['living-walls', 'good', 'Paint fine, carpet clean', '2025-07-01T10:20:00'],
  ['living-furniture', 'damaged', 'Sofa arm fabric worn', '2025-07-01T10:23:00'],
  ['bedroom-walls', 'good', 'Freshly painted, no marks', '2025-07-01T10:31:00'],
  ['bedroom-floor', 'good', 'Carpet clean, no stains', '2025-07-01T10:33:00'],
  ['bedroom-window', 'damaged', 'Black spots on window seal', '2025-07-01T10:36:00'],
  ['bedroom-furniture', 'good', 'Doors and handles fine', '2025-07-01T10:39:00'],
]

// kitchen-oven and bedroom-walls are left empty for the 2 live uploads in the demo.
const MOVE_OUT: Seed[] = [
  ['kitchen-fridge', 'good', 'Defrosted and wiped', '2026-06-18T09:40:00'],
  ['bathroom-shower', 'damaged', 'Same sealant marks as move-in', '2026-06-18T09:46:00'],
  ['bathroom-sink', 'good', 'Cleaned, no chips', '2026-06-18T09:49:00'],
  ['living-walls', 'good', 'Hoovered, walls fine', '2026-06-18T09:55:00'],
  ['living-furniture', 'damaged', 'Sofa arm wear unchanged', '2026-06-18T09:58:00'],
  ['bedroom-floor', 'good', 'Carpet hoovered', '2026-06-18T10:06:00'],
  ['bedroom-window', 'damaged', 'Seal spots as at move-in', '2026-06-18T10:09:00'],
  ['bedroom-furniture', 'good', 'Emptied and wiped', '2026-06-18T10:12:00'],
]

function build(kind: Inspection['kind'], seeds: Seed[], suffix: 'in' | 'out'): Inspection {
  const records: Record<string, ItemRecord> = {}
  for (const [itemId, condition, note, time] of seeds) {
    records[itemId] = {
      itemId,
      condition,
      note,
      photoId: `url:/demo/${itemId}-${suffix}.${EXT}`,
      recordedAt: new Date(time).toISOString(),
    }
  }
  return { kind, records }
}

export const demoMoveIn = () => build('moveIn', MOVE_IN, 'in')
export const demoMoveOut = () => build('moveOut', MOVE_OUT, 'out')
