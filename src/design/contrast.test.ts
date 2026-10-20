// Frozen WCAG 2.x contrast suite for the Durham theme tokens in src/index.css.
import { describe, expect, it } from 'vitest'

// Vitest stubs CSS imports (even ?raw) to '', so read the stylesheet from disk. Node ≥ 22.3 exposes builtins without @types/node.
declare const process: { getBuiltinModule(id: 'node:fs'): { readFileSync(path: string, enc: 'utf8'): string } }
const css = process.getBuiltinModule('node:fs').readFileSync('src/index.css', 'utf8')

const TOKENS = ['brand', 'brand-hover', 'brand-soft', 'ink', 'surface', 'muted', 'line'] as const
const HEX6 = /^#[0-9a-fA-F]{6}$/
const HEX3 = /^#[0-9a-fA-F]{3}$/

function token(name: string): string {
  const m = new RegExp(`--color-${name}\\s*:\\s*([^;]+);`).exec(css)
  return m ? m[1].trim() : ''
}
function luminance(hex: string): number {
  let h = hex.replace('#', '')
  if (h.length === 3) h = h.split('').map((c) => c + c).join('')
  const [r, g, b] = [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16) / 255).map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4))
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}
function contrast(a: string, b: string): number {
  const [x, y] = [luminance(a), luminance(b)].sort((p, q) => q - p)
  return (x + 0.05) / (y + 0.05)
}

describe('WCAG helper', () => {
  it('black on white = 21:1', () => expect(contrast('#000000', '#ffffff')).toBeCloseTo(21, 6))
  it('white on white = 1:1', () => expect(contrast('#ffffff', '#ffffff')).toBeCloseTo(1, 6))
  it('is symmetric', () => expect(contrast('#7E317B', '#ffffff')).toBeCloseTo(contrast('#ffffff', '#7E317B'), 12))
  it('#767676 on white is the classic AA threshold (≈4.54)', () => expect(contrast('#767676', '#ffffff')).toBeCloseTo(4.54, 2))
  it('expands 3-digit hex', () => expect(contrast('#fff', '#000')).toBeCloseTo(21, 6))
})

describe('Durham theme tokens (src/index.css)', () => {
  it('defines every token as a valid hex colour', () => {
    for (const t of TOKENS) expect(`${t}=${token(t)}`).toMatch(new RegExp(`^${t}=(${HEX6.source.slice(1, -1)}|${HEX3.source.slice(1, -1)})$`))
  })
  it('--color-brand is Durham Palatinate #7E317B', () => expect(token('brand').toUpperCase()).toBe('#7E317B'))
  it('body text (ink) on surface ≥ 7:1 (AAA)', () => expect(contrast(token('ink'), token('surface'))).toBeGreaterThanOrEqual(7))
  it('secondary text (muted) on surface ≥ 4.5:1 (AA)', () => expect(contrast(token('muted'), token('surface'))).toBeGreaterThanOrEqual(4.5))
  it('brand text/links on surface ≥ 4.5:1', () => expect(contrast(token('brand'), token('surface'))).toBeGreaterThanOrEqual(4.5))
  it('white button label on brand ≥ 4.5:1', () => expect(contrast('#ffffff', token('brand'))).toBeGreaterThanOrEqual(4.5))
  it('white button label on brand-hover ≥ 4.5:1', () => expect(contrast('#ffffff', token('brand-hover'))).toBeGreaterThanOrEqual(4.5))
  it('ink on brand-soft panels ≥ 4.5:1', () => expect(contrast(token('ink'), token('brand-soft'))).toBeGreaterThanOrEqual(4.5))
  it('brand-hover is darker than brand', () => expect(luminance(token('brand-hover'))).toBeLessThan(luminance(token('brand'))))
})
