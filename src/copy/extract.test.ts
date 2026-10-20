// Frozen tests for the copy extractor and rule engine, so the slop checks read the right text.
import { describe, expect, it } from 'vitest'
import { extractHtml, extractTsx, proseFromMarkdown, specEntries, withoutSourcesSection } from './extract'
import { proseDocs, uiSnippets } from './corpus'
import { RULES, scoreAll } from './rules'

const texts = (src: string) => extractTsx('x.tsx', src).map((s) => s.text)

describe('extractTsx', () => {
  it('reads JSX text and replaces expressions with a placeholder', () => {
    expect(texts('<p className="text-lg font-bold">You save {fmt(x)} a year</p>')).toEqual(['You save X a year'])
  })

  it('reads copy props and ignores className, type and imports', () => {
    const out = texts(`import { Mail } from 'lucide-react'\n<Field label="Package price" placeholder="e.g. 400" type="button" className="bg-brand text-white" />`)
    expect(out).toEqual(['Package price', 'e.g. 400'])
  })

  it('reads copy-like object values and expression props', () => {
    const out = texts(`const S = [{ title: 'Moving in', caption: "Know your costs.", to: '/move-in' }]\n<Btn aria-label={'Close the menu'} />`)
    expect(out).toEqual(expect.arrayContaining(['Moving in', 'Know your costs.', 'Close the menu']))
    expect(out).not.toContain('/move-in')
  })

  it('keeps string literals from JSX ternaries and drops code between tags', () => {
    const out = texts(`<button>{open ? 'Hide options' : 'Show all options'}</button>\n{a > b && <span>Hi there</span>}`)
    expect(out).toEqual(expect.arrayContaining(['Hide options', 'Show all options', 'Hi there']))
    expect(out.some((t) => t.includes('&&'))).toBe(false)
  })

  it('ignores comments and decodes entities and curly quotes', () => {
    const out = texts(`{/* delve into this */}\n// leverage\n<p>Don&apos;t lose your deposit ’now’</p>`)
    expect(out).toEqual(["Don't lose your deposit 'now'"])
  })
})

describe('extractHtml and markdown prose', () => {
  it('reads the page title and meta description', () => {
    const out = extractHtml('index.html', '<head><title>RentReady</title><meta name="description" content="Bills for Durham students" /></head><body><div id="root"></div></body>')
    expect(out.map((s) => s.text)).toEqual(['RentReady', 'Bills for Durham students'])
  })

  it('strips code, quotes, block quotes and URLs from markdown before checking', () => {
    const d = proseFromMarkdown('a.md', '# Title\n\nWe never `leverage` floats.\n\n```ts\nconst robust = 1\n```\n\n> delve here\n\nAvoid "game changer" copy. See https://x.io/delve.\n')
    expect(d.prose).not.toMatch(/leverage|robust|delve|game changer/)
    expect(d.headings).toEqual(['# Title'])
    expect(d.paragraphs[0]).toBe('Title')
  })

  it('drops a Sources section and picks only 2026-10-20 SPEC §9 entries', () => {
    expect(withoutSourcesSection('## 4. Docs\nkeep\n## 5. Sources\n- delve.com\n## 6. Next\nkeep too\n')).toBe('## 4. Docs\nkeep\n## 6. Next\nkeep too\n')
    const spec = '## 9. Decision log\n| 1 | Old | old row |\n| 30 | Palatinate (2026-10-20) | new row |\n## 10. Git\n| 31 | 2026-10-20 | outside §9 |'
    expect(specEntries(spec)).toBe('| 30 | Palatinate (2026-10-20) | new row |')
  })
})

describe('rule engine', () => {
  it('flags each category on a known-bad sample and passes clean copy', () => {
    const bad = [{ file: 'bad.tsx', text: "Here's the thing: we leverage a robust, cutting-edge flow — it's just not because of price, it's trust." }]
    const clean = [{ file: 'ok.tsx', text: 'You save £342 a year by paying the bills yourself.' }]
    const ids = scoreAll(bad, []).failed.map((f) => f.id)
    expect(ids).toEqual(expect.arrayContaining(['dash-ui', 'banned-leverage', 'banned-robust', 'banned-cutting-edge', 'adverb-just']))
    expect(ids.some((id) => id.startsWith('contrast-Not-because'))).toBe(true)
    expect(ids.some((id) => id.startsWith('throat-here'))).toBe(true)
    expect(scoreAll(clean, []).failed).toEqual([])
  })

  it('has unique rule ids and counts the docs em-dash budget per 1000 words', () => {
    expect(new Set(RULES.map((r) => r.id)).size).toBe(RULES.length)
    const long = proseFromMarkdown('long.md', `${'word '.repeat(1000)}a — b — c`)
    const longer = proseFromMarkdown('l2.md', `${'word '.repeat(1000)}a — b — c — d`)
    const rule = RULES.find((r) => r.id === 'dash-docs')!
    expect(rule.check([], [long])).toEqual([])
    expect(rule.check([], [longer])).toHaveLength(1)
  })

  it('reads a real corpus: UI copy from every page and at least README in docs', () => {
    const ui = uiSnippets()
    const files = new Set(ui.map((s) => s.file))
    expect(ui.length).toBeGreaterThan(100)
    for (const f of ['src/pages/Home.tsx', 'src/pages/bills/Results.tsx', 'src/pages/cleaning/CleaningPage.tsx', 'src/pages/storage/StoragePage.tsx']) {
      expect(files.has(f), f).toBe(true)
    }
    expect(proseDocs().map((d) => d.file)).toContain('README.md')
  })
})
