// Landlord email template (move-in). Pure: no React, no UI imports.
import type { ChecklistItem, Inspection, Property, RoomId } from './types'

const ROOM_LABEL: Record<RoomId, string> = {
  kitchen: 'Kitchen',
  bathroom: 'Bathroom',
  living: 'Living room',
  bedroom: 'Bedroom',
}

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']

/** "2025-07-01" -> "1 July 2025". Falls back to the raw string if unparseable. */
export function formatDate(iso: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso)
  if (!m) return iso
  const month = MONTHS[Number(m[2]) - 1]
  if (!month) return iso
  return `${Number(m[3])} ${month} ${m[1]}`
}

export interface MoveInEmail {
  subject: string
  body: string
  issueCount: number
}

export function buildMoveInEmail(property: Property, moveIn: Inspection, checklist: ChecklistItem[]): MoveInEmail {
  const issues = checklist
    .filter((item) => moveIn.records[item.id]?.condition === 'damaged')
    .map((item) => {
      const note = moveIn.records[item.id]?.note.trim()
      return `- ${ROOM_LABEL[item.room]} – ${item.label}${note ? `: ${note}` : ''}`
    })

  const date = formatDate(property.moveInDate)
  const subject = `Property condition record following move-in inspection – ${property.label}`
  const greeting = `Dear ${property.landlordName.trim() || 'Landlord'},`
  const intro = `I am writing to document the condition of the property at ${property.label} following my move-in inspection on ${date}.`

  const middle = issues.length
    ? [`During the inspection, I recorded the following existing issues:`, issues.join('\n'), `I have attached the relevant photographs for your records. Please confirm receipt and let me know whether any action is required.`]
    : [`During the inspection, I found no existing issues. I have attached photographs of each room for your records.`, `Please confirm receipt so we both have a record of the property's condition at the start of the tenancy.`]

  const body = [greeting, intro, ...middle, `Kind regards,\n${property.tenantName.trim() || '[Your name]'}`].join('\n\n')
  return { subject, body, issueCount: issues.length }
}

/** mailto: link that opens the user's mail client with the draft. Never sends. */
export function mailtoLink(subject: string, body: string, to = ''): string {
  return `mailto:${encodeURIComponent(to)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
}
