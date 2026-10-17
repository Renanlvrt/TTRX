// Presenter demo house (Alt+D): real photos in public/demo-house/<itemId>-in|out.jpg.
// Move-out leaves only Oven & Hob empty for the live upload (images of house/gen-01-kitchen-oven-hob-after.jpg).
import type { Condition, Inspection, ItemRecord, Property } from '../lib/types'

type Seed = [itemId: string, condition: Condition, note: string]

const MOVE_IN: Seed[] = [
  ['kitchen-oven', 'good', 'Hob and oven clean, racks in place'],
  ['kitchen-fridge', 'good', 'Clean shelves, seals intact'],
  ['bathroom-shower', 'good', 'Sealant and grout clean'],
  ['bathroom-sink', 'good', 'Basin and toilet clean, no chips'],
  ['living-walls', 'good', 'Walls freshly painted, floor unmarked'],
  ['living-furniture', 'good', 'Sofa and coffee table in good condition'],
  ['bedroom-walls', 'damaged', 'Marks on the wall by the corner'],
  ['bedroom-floor', 'damaged', 'Stain on the carpet near the bed'],
  ['bedroom-window', 'good', 'Frame and sill fine, blind works'],
  ['bedroom-furniture', 'good', 'Desk and radiator fine'],
]

const MOVE_OUT: Seed[] = [
  ['kitchen-fridge', 'good', 'No change'],
  ['bathroom-shower', 'damaged', 'Black mould along the sealant and tray'],
  ['bathroom-sink', 'damaged', 'Basin and toilet stained, limescale'],
  ['living-walls', 'damaged', 'Scuffs and stains on walls, floor scratched'],
  ['living-furniture', 'damaged', 'Sofa stained, coffee table scratched'],
  ['bedroom-walls', 'damaged', 'Same marks as at move-in'],
  ['bedroom-floor', 'damaged', 'Same carpet stain as at move-in'],
  ['bedroom-window', 'good', 'No change'],
  ['bedroom-furniture', 'good', 'No change'],
]

function build(kind: Inspection['kind'], seeds: Seed[], day: string): Inspection {
  const records: Record<string, ItemRecord> = {}
  seeds.forEach(([itemId, condition, note], i) => {
    const minutes = String(2 + i * 3).padStart(2, '0')
    records[itemId] = {
      itemId,
      condition,
      note,
      photoId: `url:/demo-house/${itemId}-${kind === 'moveIn' ? 'in' : 'out'}.jpg`,
      recordedAt: `${day}T10:${minutes}:00.000Z`,
    }
  })
  return { kind, records }
}

export const demoHouseMoveIn = () => build('moveIn', MOVE_IN, '2025-07-01')
export const demoHouseMoveOut = () => build('moveOut', MOVE_OUT, '2026-06-18')

export const DEMO_PROPERTY: Property = {
  label: 'Gilesgate, Durham DH1',
  area: 'gilesgate',
  moveInDate: '2025-07-01',
  moveOutDate: '2026-06-18',
  tenantName: 'Alex',
  landlordName: 'Landlord',
}
