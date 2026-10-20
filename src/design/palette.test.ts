// Frozen palette guard (Durham_testing_branch). Only Durham Palatinate purples are allowed; generic "AI purple" and glow effects are banned.
import { describe, expect, it } from 'vitest'

const DURHAM_ALLOWLIST = ['#7E317B', '#68246D', '#5A1F57', '#9A4C96', '#CBA8C9', '#E9DCE8', '#F5EEF4']

// Vitest stubs CSS imports (even ?raw) to '', so stylesheets are read from disk. Node ≥ 22.3 exposes builtins without @types/node.
declare const process: { getBuiltinModule(id: 'node:fs'): { readFileSync(path: string, enc: 'utf8'): string } }
const fs = process.getBuiltinModule('node:fs')
const raw = import.meta.glob(['/src/**/*.{ts,tsx,css}', '!/src/**/*.test.ts'], { query: '?raw', import: 'default', eager: true }) as Record<string, string>
const sources: Record<string, string> = Object.fromEntries(
  Object.entries(raw).map(([path, src]) => [path, path.endsWith('.css') ? fs.readFileSync(path.slice(1), 'utf8') : src]),
)

const TW_PURPLE = /\b(?:bg|text|border|from|to|via|ring|fill|stroke|outline|decoration|shadow|accent|caret|divide|placeholder)-(?:purple|violet|indigo|fuchsia)-\d{2,3}\b/g
const GLOW = /\b(?:bg-gradient-|bg-linear-|bg-radial-|backdrop-blur|blur-(?:sm|md|lg|xl|2xl|3xl)\b|drop-shadow-)/g
const HEX = /#([0-9a-fA-F]{8}|[0-9a-fA-F]{6}|[0-9a-fA-F]{4}|[0-9a-fA-F]{3})\b/g

/** #rgb / #rgba / #rrggbb / #rrggbbaa → [r,g,b] 0–255 (alpha ignored). */
function rgbOf(hex: string): [number, number, number] {
  let h = hex.replace('#', '')
  if (h.length <= 4) h = h.slice(0, 3).split('').map((c) => c + c).join('')
  return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16)) as [number, number, number]
}
function hsl([r, g, b]: [number, number, number]): { h: number; s: number; l: number } {
  const [R, G, B] = [r / 255, g / 255, b / 255]
  const max = Math.max(R, G, B)
  const min = Math.min(R, G, B)
  const l = (max + min) / 2
  const d = max - min
  if (d === 0) return { h: 0, s: 0, l }
  const s = d / (1 - Math.abs(2 * l - 1))
  let h = max === R ? ((G - B) / d) % 6 : max === G ? (B - R) / d + 2 : (R - G) / d + 4
  h *= 60
  if (h < 0) h += 360
  return { h, s, l }
}
const toRrggbb = (hex: string) => '#' + rgbOf(hex).map((v) => v.toString(16).padStart(2, '0')).join('').toUpperCase()
const isBannedPurple = (hex: string) => {
  const { h, s } = hsl(rgbOf(hex))
  return h >= 250 && h <= 330 && s >= 0.15 && !DURHAM_ALLOWLIST.includes(toRrggbb(hex))
}

describe('palette guard', () => {
  it('scans the app sources, including the stylesheet', () => {
    expect(Object.keys(sources).length).toBeGreaterThan(10)
    expect(sources['/src/index.css']).toContain('--color-brand')
  })
  it('the Durham allowlist contains Palatinate #7E317B', () => expect(DURHAM_ALLOWLIST).toContain('#7E317B'))
  it('the hue rule flags generic AI purples and lets Palatinate through', () => {
    expect(isBannedPurple('#7c3aed')).toBe(true) // Tailwind violet-600
    expect(isBannedPurple('#6366f1')).toBe(false) // indigo-500 hue ≈ 239 — caught by the class rule instead
    expect(isBannedPurple('#a855f7')).toBe(true) // purple-500
    expect(isBannedPurple('#7e317b')).toBe(false)
    expect(isBannedPurple('#15803d')).toBe(false)
  })
  it('no Tailwind purple/violet/indigo/fuchsia classes', () => {
    const hits = Object.entries(sources).flatMap(([path, src]) => [...src.matchAll(TW_PURPLE)].map((m) => `${path}: ${m[0]}`))
    expect(hits).toEqual([])
  })
  it('no purple hex colours outside the Durham Palatinate allowlist', () => {
    const hits = Object.entries(sources).flatMap(([path, src]) => [...src.matchAll(HEX)].filter((m) => isBannedPurple(m[0])).map((m) => `${path}: ${m[0]}`))
    expect(hits).toEqual([])
  })
  it('no generic AI glow effects (gradients, blurs, drop shadows) in components', () => {
    const hits = Object.entries(sources)
      .filter(([path]) => path.endsWith('.tsx'))
      .flatMap(([path, src]) => [...src.matchAll(GLOW)].map((m) => `${path}: ${m[0]}`))
    expect(hits).toEqual([])
  })
})
