// Pulls reader-facing text out of source files so the anti-slop checks can read it.
// Pure string functions: corpus.ts feeds them the raw files.

export interface Snippet {
  file: string
  text: string
}

/** Props and object keys whose string values the user reads on screen. */
export const COPY_KEYS = [
  'aria-label', 'placeholder', 'title', 'alt', 'label', 'caption', 'subtitle', 'sub', 'help', 'hint',
  'description', 'back', 'body', 'text', 'message', 'cta', 'heading', 'question', 'answer', 'tip', 'note',
  'good', 'damaged',
] as const

const ENTITIES: Record<string, string> = {
  '&apos;': "'", '&quot;': '"', '&amp;': '&', '&nbsp;': ' ', '&rsquo;': "'", '&lsquo;': "'",
  '&ldquo;': '"', '&rdquo;': '"', '&mdash;': '—', '&ndash;': '–', '&pound;': '£', '&lt;': '<', '&gt;': '>',
}

export function normalise(s: string): string {
  return s
    .replace(/&[a-z]+;/g, (m) => ENTITIES[m] ?? m)
    .replace(/[‘’]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/\s+/g, ' ')
    .trim()
}

function stripComments(src: string): string {
  return src
    .replace(/\{\s*\/\*[\s\S]*?\*\/\s*\}/g, '')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/(^|[^:'"`\\])\/\/[^\n]*/g, '$1')
}

const CODE_SIGNS = /\bif\s*\(|\]\)|=>|&&|\|\||;|===|!==|\breturn\b|\bconst\b|\bimport\b|\bfunction\b|\binterface\b|\btype\s+\w+\s*=|\w\s=\s|\)\s*\{|\}\s*\)/

function hasWords(s: string): boolean {
  return /[A-Za-z£]{2,}/.test(s)
}

/** Replaces each balanced {...} with a placeholder and returns the string literals found inside. */
function splitBraces(s: string): { outside: string; literals: string[] } {
  let depth = 0
  let outside = ''
  let inner = ''
  const literals: string[] = []
  for (const ch of s) {
    if (ch === '{') {
      depth++
      if (depth === 1) { inner = ''; continue }
    }
    if (ch === '}' && depth > 0) {
      depth--
      if (depth === 0) {
        for (const m of inner.matchAll(/(['"`])((?:\\.|(?!\1)[^\\])*)\1/g)) {
          const lit = m[2].replace(/\$\{[^}]*\}/g, 'X')
          if (/[A-Za-z]{2,}/.test(lit) && /\s/.test(lit.trim()) || /^[A-Z][a-z]+[.!?]?$/.test(lit)) literals.push(lit)
        }
        outside += ' X '
        continue
      }
    }
    if (depth > 0) inner += ch
    else outside += ch
  }
  return { outside, literals }
}

/** Reader-facing text from a .tsx file: JSX text, copy props and copy-like object values. */
export function extractTsx(file: string, src: string): Snippet[] {
  const code = stripComments(src)
  const out: Snippet[] = []
  const push = (t: string, loose = false) => {
    const text = normalise(t)
    if (text && (loose ? /[A-Za-z0-9]/.test(text) : hasWords(text))) out.push({ file, text })
  }

  const keys = COPY_KEYS.join('|')
  // label="..." / title='...'
  for (const m of code.matchAll(new RegExp(`(?<![\\w-])(?:${keys})=(["'])((?:(?!\\1).)*)\\1`, 'g'))) push(m[2], true)
  // label={'...'} / title={`...`}
  for (const m of code.matchAll(new RegExp(`(?<![\\w-])(?:${keys})=\\{\\s*(["'\`])((?:\\\\.|(?!\\1)[^\\\\])*)\\1\\s*\\}`, 'g'))) {
    push(m[2].replace(/\$\{[^}]*\}/g, 'X'), true)
  }
  // { title: '...', caption: "..." }
  for (const m of code.matchAll(new RegExp(`(?<![\\w-])(?:${keys}|'aria-label')\\s*:\\s*(["'\`])((?:\\\\.|(?!\\1)[^\\\\])*)\\1`, 'g'))) {
    push(m[2].replace(/\$\{[^}]*\}/g, 'X'))
  }
  // JSX text between tags
  for (const m of code.matchAll(/>([^<>]+)</g)) {
    const raw = m[1].replace(/&[a-z]+;/g, (e) => ENTITIES[e] ?? e)
    if (!hasWords(raw)) continue
    const { outside, literals } = splitBraces(raw)
    const words = outside.replace(/\bX\b/g, ' ').trim()
    if (words && hasWords(words) && !CODE_SIGNS.test(outside) && !/[{}]/.test(outside)) push(outside.replace(/\s+X\s+/g, ' X ').replace(/^X\s+|\s+X$/g, ''))
    if (!CODE_SIGNS.test(raw.replace(/\{[^{}]*\}/g, ''))) literals.forEach((l) => push(l))
  }
  return out
}

/** Title and meta descriptions from index.html. */
export function extractHtml(file: string, src: string): Snippet[] {
  const out: Snippet[] = []
  const title = /<title>([\s\S]*?)<\/title>/i.exec(src)
  if (title) out.push({ file, text: normalise(title[1]) })
  for (const m of src.matchAll(/<meta\s+(?:name|property)="(?:description|og:title|og:description|twitter:title|twitter:description)"\s+content="([^"]*)"/gi)) {
    out.push({ file, text: normalise(m[1]) })
  }
  const body = /<body[^>]*>([\s\S]*?)<\/body>/i.exec(src)
  if (body) {
    const text = normalise(body[1].replace(/<script[\s\S]*?<\/script>/gi, '').replace(/<[^>]+>/g, ' '))
    if (hasWords(text)) out.push({ file, text })
  }
  return out.filter((s) => s.text)
}

export interface ProseDoc {
  file: string
  /** Prose with code, URLs, quotations and block quotes removed. */
  prose: string
  /** Prose split on blank lines. */
  paragraphs: string[]
  /** Raw markdown heading lines. */
  headings: string[]
  words: number
}

/** Markdown prose, minus anything quoted as an example (code, quotes, block quotes, URLs). */
export function proseFromMarkdown(file: string, md: string): ProseDoc {
  const headings = md.split(/\r?\n/).filter((l) => /^#{1,6}\s/.test(l))
  const cleaned = md
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/^(`{3,}|~{3,})[\s\S]*?^\1[^\S\r\n]*$/gm, '')
    .replace(/`[^`\n]*`/g, ' ')
    .replace(/^\s*>.*$/gm, '')
    .replace(/!?\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/https?:\/\/\S+/g, ' ')
    .replace(/"[^"\n]*"|“[^”\n]*”/g, ' ')
  const paragraphs = cleaned
    .split(/\r?\n\s*\r?\n/)
    .map((p) => normalise(p.replace(/^#{1,6}\s+/gm, '').replace(/^\s*(?:[-*+]|\d+\.)\s+/gm, '').replace(/[*_|]/g, ' ')))
    .filter((p) => p && hasWords(p))
  const prose = paragraphs.join('\n\n')
  const words = prose.split(/\s+/).filter((w) => /[A-Za-z]/.test(w)).length
  return { file, prose, paragraphs, headings, words }
}

/** Drops a "## N. Sources" style section (reference list, often quoting phrases verbatim). */
export function withoutSourcesSection(md: string): string {
  return md.replace(/^(#{1,6})\s+(?:\d+\.\s*)?Sources\b[^\n]*\n[\s\S]*?(?=^#{1,6}\s|(?![\s\S]))/gim, '')
}

/** SPEC.md §9 rows or blocks dated 2026-10-20. */
export function specEntries(spec: string, date = '2026-10-20'): string {
  const lines = spec.split(/\r?\n/)
  const start = lines.findIndex((l) => /^##\s+9\b/.test(l))
  if (start < 0) return ''
  const picked: string[] = []
  let inDated = false
  for (let i = start + 1; i < lines.length; i++) {
    const l = lines[i]
    if (/^##\s/.test(l)) break
    if (/^#{3,6}\s/.test(l)) { inDated = l.includes(date); if (inDated) picked.push(l); continue }
    if (inDated || l.includes(date)) picked.push(l)
  }
  return picked.join('\n')
}
