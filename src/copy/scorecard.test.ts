// The user's bar: at least 95% of the anti-slop checks pass. Individual failures still show in slop.test.ts.
import { describe, expect, it } from 'vitest'
import { proseDocs, uiSnippets } from './corpus'
import { RULES, scoreAll } from './rules'

describe('anti-slop scorecard', () => {
  it('covers at least 100 mechanical checks from stop-slop and no-ai-slop', () => {
    expect(RULES.length).toBeGreaterThanOrEqual(100)
  })

  it('passes at least 95% of the checks', () => {
    const score = scoreAll(uiSnippets(), proseDocs())
    const report = score.failed.map((f) => `${f.id} (${f.hits.length}): ${f.hits[0]}`).join('\n  ')
    expect(score.passRate, `${score.passed}/${score.total} passed\n  ${report}`).toBeGreaterThanOrEqual(0.95)
  })
})
