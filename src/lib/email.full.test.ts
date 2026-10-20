// Frozen QA suite for the move-in landlord email (SPEC §3 "Email landlord", §8: editable + copyable; never claims sent).
import { describe, expect, it } from 'vitest'
import { buildMoveInEmail, formatDate, mailtoLink } from './email'
import type { Inspection, ItemRecord, Property } from './types'
import { CHECKLIST } from '../data/checklist'
import { demoHouseMoveIn } from '../data/demoHouse'

const PROPERTY: Property = {
  label: '12 Example Street, Gilesgate',
  area: 'gilesgate',
  moveInDate: '2025-07-01',
  moveOutDate: '2026-06-18',
  tenantName: 'Alex',
  landlordName: 'Mr Smith',
}
const rec = (itemId: string, condition: ItemRecord['condition'], note = ''): ItemRecord => ({ itemId, condition, note, photoId: 'p', recordedAt: null })
const moveIn = (records: ItemRecord[]): Inspection => ({ kind: 'moveIn', records: Object.fromEntries(records.map((r) => [r.itemId, r])) })

describe('formatDate', () => {
  it('formats ISO dates as "1 July 2025"', () => expect(formatDate('2025-07-01')).toBe('1 July 2025'))
  it('drops leading zeros from the day', () => expect(formatDate('2026-06-08')).toBe('8 June 2026'))
  it('handles every month name', () => {
    const names = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
    names.forEach((n, i) => expect(formatDate(`2026-${String(i + 1).padStart(2, '0')}-15`)).toBe(`15 ${n} 2026`))
  })
  it('accepts a full ISO timestamp', () => expect(formatDate('2025-12-31T23:59:00.000Z')).toBe('31 December 2025'))
  it('returns the raw string for an invalid month', () => expect(formatDate('2025-13-01')).toBe('2025-13-01'))
  it('returns the raw string for non-ISO input', () => {
    expect(formatDate('01/07/2025')).toBe('01/07/2025')
    expect(formatDate('')).toBe('')
  })
})

describe('buildMoveInEmail', () => {
  it('subject names the property', () =>
    expect(buildMoveInEmail(PROPERTY, moveIn([]), CHECKLIST).subject).toBe('Property condition record following move-in inspection – 12 Example Street, Gilesgate'))
  it('greets the landlord by name', () => expect(buildMoveInEmail(PROPERTY, moveIn([]), CHECKLIST).body.startsWith('Dear Mr Smith,')).toBe(true))
  it('falls back to "Landlord" for a blank name', () =>
    expect(buildMoveInEmail({ ...PROPERTY, landlordName: '   ' }, moveIn([]), CHECKLIST).body.startsWith('Dear Landlord,')).toBe(true))
  it('signs off with the tenant name, or a placeholder when blank', () => {
    expect(buildMoveInEmail(PROPERTY, moveIn([]), CHECKLIST).body.endsWith('Kind regards,\nAlex')).toBe(true)
    expect(buildMoveInEmail({ ...PROPERTY, tenantName: '' }, moveIn([]), CHECKLIST).body.endsWith('Kind regards,\n[Your name]')).toBe(true)
  })
  it('quotes the move-in date in words', () => expect(buildMoveInEmail(PROPERTY, moveIn([]), CHECKLIST).body).toContain('inspection on 1 July 2025'))
  it('no damage → "no existing issues" and issueCount 0', () => {
    const e = buildMoveInEmail(PROPERTY, moveIn([rec('kitchen-oven', 'good')]), CHECKLIST)
    expect(e.issueCount).toBe(0)
    expect(e.body).toContain('I found no existing issues')
  })
  it('lists each damaged item as "- Room – Item: note"', () => {
    const e = buildMoveInEmail(PROPERTY, moveIn([rec('bathroom-shower', 'damaged', '  Mould on sealant  ')]), CHECKLIST)
    expect(e.body).toContain('- Bathroom – Shower & Sealant: Mould on sealant')
    expect(e.issueCount).toBe(1)
  })
  it('omits the colon when the note is empty', () => {
    const e = buildMoveInEmail(PROPERTY, moveIn([rec('living-walls', 'damaged')]), CHECKLIST)
    expect(e.body).toContain('- Living room – Walls & Floor\n')
  })
  it('ignores good and N/A items', () => {
    const e = buildMoveInEmail(PROPERTY, moveIn([rec('kitchen-oven', 'good'), rec('kitchen-fridge', 'na'), rec('bedroom-window', 'damaged')]), CHECKLIST)
    expect(e.issueCount).toBe(1)
    expect(e.body).not.toContain('Oven')
    expect(e.body).not.toContain('Fridge')
  })
  it('lists issues in checklist order, not record order', () => {
    const e = buildMoveInEmail(PROPERTY, moveIn([rec('bedroom-window', 'damaged'), rec('kitchen-oven', 'damaged')]), CHECKLIST)
    expect(e.body.indexOf('Oven & Hob')).toBeLessThan(e.body.indexOf('Window'))
  })
  it('the demo house move-in yields 2 issues (bedroom walls, bedroom floor)', () => {
    const e = buildMoveInEmail(PROPERTY, demoHouseMoveIn(), CHECKLIST)
    expect(e.issueCount).toBe(2)
    expect(e.body).toContain('- Bedroom – Walls & Corners: Marks on the wall by the corner')
    expect(e.body).toContain('- Bedroom – Floor / Carpet: Stain on the carpet near the bed')
  })
  it('never claims the email was sent', () => {
    for (const ins of [moveIn([]), demoHouseMoveIn()]) {
      const e = buildMoveInEmail(PROPERTY, ins, CHECKLIST)
      expect(`${e.subject}\n${e.body}`).not.toMatch(/\b(sent|have emailed|delivered)\b/i)
    }
  })
  it('paragraphs are separated by blank lines (copy-paste friendly)', () =>
    expect(buildMoveInEmail(PROPERTY, demoHouseMoveIn(), CHECKLIST).body.split('\n\n').length).toBeGreaterThanOrEqual(5))
})

describe('mailtoLink', () => {
  it('builds a mailto URL with encoded subject and body', () =>
    expect(mailtoLink('Hi & bye', 'Line 1\nLine 2')).toBe('mailto:?subject=Hi%20%26%20bye&body=Line%201%0ALine%202'))
  it('encodes the recipient', () => expect(mailtoLink('s', 'b', 'a+b@x.com')).toBe('mailto:a%2Bb%40x.com?subject=s&body=b'))
  it('round-trips the generated email through decodeURIComponent', () => {
    const e = buildMoveInEmail(PROPERTY, demoHouseMoveIn(), CHECKLIST)
    const url = new URL(mailtoLink(e.subject, e.body))
    expect(decodeURIComponent(url.search.split('&body=')[1])).toBe(e.body)
  })
  it('contains no raw newlines or spaces (safe as an href)', () => {
    const e = buildMoveInEmail(PROPERTY, demoHouseMoveIn(), CHECKLIST)
    expect(mailtoLink(e.subject, e.body)).not.toMatch(/[\s]/)
  })
})
