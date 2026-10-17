import type { ChecklistItem, RoomId } from '../lib/types'

export const ROOMS: { id: RoomId; label: string }[] = [
  { id: 'kitchen', label: 'Kitchen' },
  { id: 'bathroom', label: 'Bathroom' },
  { id: 'living', label: 'Living room' },
  { id: 'bedroom', label: 'Bedroom' },
]

// 10 items: 2 per shared room, 4 for the bedroom.
export const CHECKLIST: ChecklistItem[] = [
  { id: 'kitchen-oven', room: 'kitchen', label: 'Oven & Hob', hint: 'Hob surface, inside the oven, racks' },
  { id: 'kitchen-fridge', room: 'kitchen', label: 'Fridge / Freezer', hint: 'Shelves, seals, freezer drawers' },
  { id: 'bathroom-shower', room: 'bathroom', label: 'Shower & Sealant', hint: 'Sealant line, grout, tray' },
  { id: 'bathroom-sink', room: 'bathroom', label: 'Sink & Toilet', hint: 'Taps, basin, toilet seat' },
  { id: 'living-walls', room: 'living', label: 'Walls & Floor', hint: 'Corners, skirting, carpet' },
  { id: 'living-furniture', room: 'living', label: 'Furniture', hint: 'Sofa, table, supplied items' },
  { id: 'bedroom-walls', room: 'bedroom', label: 'Walls & Corners', hint: 'Each corner, ceiling edge' },
  { id: 'bedroom-floor', room: 'bedroom', label: 'Floor / Carpet', hint: 'Stains, burns, wear' },
  { id: 'bedroom-window', room: 'bedroom', label: 'Window', hint: 'Frame, sill, condensation marks' },
  { id: 'bedroom-furniture', room: 'bedroom', label: 'Wardrobe & Desk', hint: 'Doors, handles, surfaces' },
]

export const CONDITION_LABEL = {
  good: 'Good Condition',
  damaged: 'Existing Damage/Marks',
  na: 'N/A',
} as const
