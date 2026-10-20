// Frozen anti-slop checks (stop-slop + no-ai-slop) over UI copy and prose docs. One `it` per rule.
import { describe, expect, it } from 'vitest'
import { proseDocs, uiSnippets } from './corpus'
import { RULES } from './rules'

const ui = uiSnippets()
const docs = proseDocs()

const categories = [...new Set(RULES.map((r) => r.category))]

for (const category of categories) {
  describe(category, () => {
    for (const rule of RULES.filter((r) => r.category === category)) {
      it(rule.title, () => {
        const hits = rule.check(ui, docs)
        expect(hits, `${rule.id}\n  ${hits.slice(0, 12).join('\n  ')}`).toEqual([])
      })
    }
  })
}
