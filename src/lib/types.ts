// Shared data contract. Logic (src/lib) and UI (src/pages, src/components) both depend on this file.
// Keep it UI-free so the Stitch-designed screens can be wired to the same types later.

export type AreaId = 'gilesgate' | 'viaduct' | 'cityCentre' | 'langleyMoor'

export interface Area {
  id: AreaId
  label: string
  postcodes: string[]
}

export const AREAS: Area[] = [
  { id: 'gilesgate', label: 'Gilesgate', postcodes: ['DH1 1', 'DH1 2'] },
  { id: 'viaduct', label: 'Viaduct', postcodes: ['DH1 4'] },
  { id: 'cityCentre', label: 'City Centre / Claypath', postcodes: ['DH1 1'] },
  { id: 'langleyMoor', label: 'Langley Moor', postcodes: ['DH7 8'] },
]

// ---------- Bills ----------

export type WaterUse = 'low' | 'normal' | 'high'
export type HeatingPattern = 'allDay' | 'nights' | 'coldMonths'
export type BillId = 'electricity' | 'gas' | 'water' | 'broadband' | 'tv'

export interface BillsSurvey {
  /** Bills package price in £ per person per week; null = no package offered. */
  packagePppw: number | null
  area: AreaId
  people: number
  water: WaterUse
  heating: HeatingPattern
  hasGas: boolean
  wifi: boolean
  tvLicence: boolean
  /** Tenancy length in weeks (Durham default 51). */
  tenancyWeeks: number
}

export interface BillLine {
  id: BillId
  label: string
  /** Whole-household cost per year in £; null when the price could not be verified. */
  householdAnnualGBP: number | null
  /** One-line plain-English explanation of how this was estimated. */
  assumption: string
  source?: string
}

export interface Money {
  perWeek: number
  perMonth: number
  /** Over the whole tenancy (tenancyWeeks). */
  tenancy: number
}

export type BillsVerdict = 'package' | 'separate' | 'similar' | 'noPackage'

export interface BillsResult {
  lines: BillLine[]
  /** Per person, arranging bills separately. */
  separate: Money
  /** Per person, the package; null when no package. */
  package: Money | null
  /** package.tenancy - separate.tenancy (positive = separate is cheaper); null when no package. */
  differenceTenancy: number | null
  verdict: BillsVerdict
  verdictText: string
  assumptions: string[]
}

export interface Provider {
  id: string
  name: string
  website: string
  category: BillId | 'storage' | 'cleaning'
  areas: AreaId[]
  /** Verified price wording only, e.g. "From £5/box/month". null = unavailable. */
  priceText: string | null
  tags: string[]
  source?: string
  checkedDate?: string
}

// ---------- Inspection ----------

export type RoomId = 'kitchen' | 'bathroom' | 'living' | 'bedroom'
export type Condition = 'good' | 'damaged' | 'na'
export type InspectionKind = 'moveIn' | 'moveOut'

export interface ChecklistItem {
  id: string
  room: RoomId
  label: string
  /** Short tip on what to photograph. */
  hint: string
}

export interface ItemRecord {
  itemId: string
  condition: Condition | null
  note: string
  /** Photo reference: an IndexedDB id, or "url:/demo/x.jpg" for bundled demo photos. */
  photoId: string | null
  /** ISO timestamp recorded by the app when the photo/condition was set. */
  recordedAt: string | null
}

export interface Inspection {
  kind: InspectionKind
  records: Record<string, ItemRecord>
}

export type Flag = 'newIssue' | 'preExisting' | 'unchanged' | 'unmatched' | 'notApplicable'

export interface ComparisonRow {
  item: ChecklistItem
  moveIn: ItemRecord | null
  moveOut: ItemRecord | null
  flag: Flag
}

// ---------- App state ----------

export type TaskId = 'bills' | 'inspection' | 'email' | 'comparison' | 'storage' | 'cleaning'
export type TaskStatus = 'notStarted' | 'inProgress' | 'done'

export interface Property {
  label: string
  area: AreaId
  moveInDate: string
  moveOutDate: string
  tenantName: string
  landlordName: string
}

export interface AppState {
  property: Property
  bills: { survey: BillsSurvey | null }
  moveIn: Inspection
  moveOut: Inspection
  emailDraft: string | null
  /** Presenter mode (Alt+D): real demo house loaded, demo shortcuts hidden. Alt+R clears it. */
  demoMode: boolean
  storageArea: AreaId | null
  /** Storage recommender answers: box counts by size + weeks. */
  storageNeeds: { boxes: Record<'small' | 'medium' | 'large', number>; weeks: number }
  cleaningDone: string[]
  tasks: Record<TaskId, TaskStatus>
}
