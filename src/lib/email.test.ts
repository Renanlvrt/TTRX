import { describe, expect, it } from 'vitest'
import { buildMoveInEmail, formatDate, mailtoLink } from './email'
import { CHECKLIST } from '../data/checklist'
import type { Inspection, ItemRecord, Property } from './types'

const property: Property = {
  label: '12 Example Street, Gilesgate',
  area: 'gilesgate',
  moveInDate: '2025-07-01',
  moveOutDate: '2026-06-20',
  tenantName: 'Alex',
  landlordName: 'Mr Smith',
}

const rec = (itemId: string, condition: ItemRecord['condition'], note = ''): ItemRecord => ({
  itemId,
  condition,
  note,
  photoId: null,
  recordedAt: null,
})

describe('formatDate', () => {
  it('formats ISO dates in UK style', () => {
    expect(formatDate('2025-07-01')).toBe('1 July 2025')
    expect(formatDate('2026-12-25')).toBe('25 December 2026')
  })
  it('returns the input when unparseable', () => {
    expect(formatDate('soon')).toBe('soon')
  })
})

describe('buildMoveInEmail', () => {
  it('lists every damaged item with room, label and note', () => {
    const moveIn: Inspection = {
      kind: 'moveIn',
      records: {
        'kitchen-oven': rec('kitchen-oven', 'damaged', 'Burn mark on hob'),
        'bedroom-walls': rec('bedroom-walls', 'damaged', 'Mould in corner'),
        'bathroom-sink': rec('bathroom-sink', 'good'),
        'living-furniture': rec('living-furniture', 'na'),
      },
    }
    const email = buildMoveInEmail(property, moveIn, CHECKLIST)
    expect(email.issueCount).toBe(2)
    expect(email.body).toContain('- Kitchen – Oven & Hob: Burn mark on hob')
    expect(email.body).toContain('- Bedroom – Walls & Corners: Mould in corner')
    expect(email.body).not.toContain('Sink & Toilet')
    expect(email.body).toContain('Dear Mr Smith,')
    expect(email.body).toContain('12 Example Street, Gilesgate')
    expect(email.body).toContain('1 July 2025')
    expect(email.body).toContain('Please confirm receipt')
    expect(email.body).toContain('photographs')
    expect(email.body.trim().endsWith('Alex')).toBe(true)
    expect(email.subject).toContain('move-in inspection')
  })

  it('omits the colon when a damaged item has no note', () => {
    const moveIn: Inspection = { kind: 'moveIn', records: { 'kitchen-fridge': rec('kitchen-fridge', 'damaged') } }
    const email = buildMoveInEmail(property, moveIn, CHECKLIST)
    expect(email.body).toContain('- Kitchen – Fridge / Freezer\n')
  })

  it('says no issues were found and still asks to confirm', () => {
    const moveIn: Inspection = { kind: 'moveIn', records: { 'kitchen-oven': rec('kitchen-oven', 'good') } }
    const email = buildMoveInEmail(property, moveIn, CHECKLIST)
    expect(email.issueCount).toBe(0)
    expect(email.body).toContain('no existing issues')
    expect(email.body).toContain('Please confirm receipt')
  })

  it('never claims the email was sent', () => {
    const email = buildMoveInEmail(property, { kind: 'moveIn', records: {} }, CHECKLIST)
    expect(email.body.toLowerCase()).not.toContain('has been sent')
  })
})

describe('mailtoLink', () => {
  it('encodes subject and body', () => {
    const link = mailtoLink('Hi & bye', 'Line 1\nLine 2')
    expect(link).toBe('mailto:?subject=Hi%20%26%20bye&body=Line%201%0ALine%202')
  })
})
