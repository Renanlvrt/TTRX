// Loads the two corpora the anti-slop checks read: UI copy and prose docs.
// import.meta.glob keeps this free of node APIs; Vitest resolves it at transform time.
import { extractHtml, extractTsx, proseFromMarkdown, specEntries, withoutSourcesSection } from './extract'
import type { ProseDoc, Snippet } from './extract'

const tsx = import.meta.glob(['/src/pages/**/*.tsx', '/src/components/**/*.tsx', '/src/App.tsx'], {
  query: '?raw', import: 'default', eager: true,
}) as Record<string, string>
const html = import.meta.glob('/index.html', { query: '?raw', import: 'default', eager: true }) as Record<string, string>
const docs = import.meta.glob(['/README.md', '/docs/**/*.md'], { query: '?raw', import: 'default', eager: true }) as Record<string, string>
const spec = import.meta.glob('/SPEC.md', { query: '?raw', import: 'default', eager: true }) as Record<string, string>

const rel = (p: string) => p.replace(/^\//, '')

export function uiSnippets(): Snippet[] {
  const out: Snippet[] = []
  for (const [p, src] of Object.entries(tsx).sort(([a], [b]) => a.localeCompare(b))) {
    if (/\.test\.tsx$/.test(p)) continue
    out.push(...extractTsx(rel(p), src))
  }
  for (const [p, src] of Object.entries(html)) out.push(...extractHtml(rel(p), src))
  return out
}

export function proseDocs(): ProseDoc[] {
  const out: ProseDoc[] = []
  for (const [p, src] of Object.entries(docs).sort(([a], [b]) => a.localeCompare(b))) {
    const md = /docs\/billing\/DESIGN\.md$/.test(p) ? withoutSourcesSection(src) : src
    out.push(proseFromMarkdown(rel(p), md))
  }
  for (const src of Object.values(spec)) {
    const entries = specEntries(src)
    if (entries) out.push(proseFromMarkdown('SPEC.md §9 (2026-10-20)', entries))
  }
  return out
}
