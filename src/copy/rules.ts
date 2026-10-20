// Mechanical checks from two anti-slop guides, applied to UI copy and prose docs:
//   stop-slop (github.com/hardikpandya/stop-slop): SKILL.md, references/phrases.md, references/structures.md
//   no-ai-slop (github.com/petergyang/no-ai-slop): skills/no-ai-slop/SKILL.md, eval.md
// Judgement checks (voice, rhythm, portability) stay manual; see the eval.md checklist in docs.
import type { ProseDoc, Snippet } from './extract'

export type Scope = 'ui' | 'docs' | 'both'

export interface Rule {
  id: string
  category: string
  title: string
  scope: Scope
  /** Offending locations as "file: …snippet…"; empty means the rule passes. */
  check(ui: readonly Snippet[], docs: readonly ProseDoc[]): string[]
}

function around(text: string, index: number, length: number): string {
  const a = Math.max(0, index - 40)
  const b = Math.min(text.length, index + length + 40)
  return `${a > 0 ? '…' : ''}${text.slice(a, b)}${b < text.length ? '…' : ''}`
}

function findAll(re: RegExp, file: string, text: string): string[] {
  const g = new RegExp(re.source, re.flags.includes('g') ? re.flags : re.flags + 'g')
  const hits: string[] = []
  for (const m of text.matchAll(g)) hits.push(`${file}: ${around(text, m.index ?? 0, m[0].length)}`)
  return hits
}

function scan(re: RegExp, scope: Scope, ui: readonly Snippet[], docs: readonly ProseDoc[]): string[] {
  const hits: string[] = []
  if (scope !== 'docs') for (const s of ui) hits.push(...findAll(re, s.file, s.text))
  if (scope !== 'ui') for (const d of docs) for (const p of d.paragraphs) hits.push(...findAll(re, d.file, p))
  return hits
}

const esc = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
/** Whole-phrase, case-insensitive; spaces match any whitespace, apostrophes are straight (corpus is normalised). */
function phrase(p: string): RegExp {
  return new RegExp(`(?<![\\w'])${esc(p).replace(/ /g, '\\s+')}(?![\\w])`, 'i')
}

function patternRule(id: string, category: string, title: string, re: RegExp, scope: Scope = 'both'): Rule {
  return { id, category, title, scope, check: (ui, docs) => scan(re, scope, ui, docs) }
}

const DASH = /—|\s–\s|\s--\s/

const rules: Rule[] = []
const add = (r: Rule) => rules.push(r)

// --- Em dashes (stop-slop: none; no-ai-slop: none in short copy, 1-2 in longer drafts)
add(patternRule('dash-ui', 'Em dashes', 'UI copy has no em dashes', DASH, 'ui'))
add({
  id: 'dash-docs', category: 'Em dashes', title: 'Docs use at most 2 em dashes per 1000 words', scope: 'docs',
  check: (_ui, docs) => docs.flatMap((d) => {
    const count = (d.prose.match(new RegExp(DASH.source, 'g')) ?? []).length
    const budget = Math.floor((2 * d.words) / 1000)
    return count > budget ? [`${d.file}: ${count} em dashes in ${d.words} words (budget ${budget})`] : []
  }),
})

// --- no-ai-slop "Words to cut": banned outright
const BANNED: [string, RegExp][] = [
  ['delve', /\bdelv(?:e|es|ed|ing)\b/i],
  ['foster', /\bfoster(?:s|ed|ing)?\b/i],
  ['leverage', /\bleverag(?:e|es|ed|ing)\b/i],
  ['utilize', /\butili[sz](?:e|es|ed|ing|ation)\b/i],
  ['facilitate', /\bfacilitat(?:e|es|ed|ing|ion)\b/i],
  ['empower', /\bempower(?:s|ed|ing|ment)?\b/i],
  ['streamline', /\bstreamlin(?:e|es|ed|ing)\b/i],
  ['robust', /\brobust(?:ly|ness)?\b/i],
  ['cutting-edge', /\bcutting[-\s]edge\b/i],
  ['paradigm shift', /\bparadigm\s+shifts?\b/i],
  ['game changer', /\bgame[-\s]?chang(?:er|ers|ing)\b/i],
  ['this is huge', phrase('this is huge')],
  ['this changes everything', phrase('this changes everything')],
  ['tapestry', /\btapestr(?:y|ies)\b/i],
  ['realm', /\brealms?\b/i],
  ['beacon', /\bbeacons?\b/i],
  ['multifaceted', /\bmulti-?faceted\b/i],
  ['meticulous', /\bmeticulous(?:ly)?\b/i],
  ['intricate', /\bintricat(?:e|ely|ies)\b/i],
  ['paramount', /\bparamount\b/i],
  ['transformative', /\btransformative\b/i],
  ['elevate', /\belevat(?:e|es|ed|ing)\b/i],
  ['embark', /\bembark(?:s|ed|ing)?\b/i],
  ['supercharge', /\bsupercharg(?:e|es|ed|ing)\b/i],
  ['harness', /\bharness(?:es|ed|ing)?\b/i],
  ['ever-evolving', /\bever[-\s]evolving\b/i],
]
for (const [w, re] of BANNED) add(patternRule(`banned-${w.replace(/\W+/g, '-')}`, 'Banned words', `No "${w}"`, re))

// --- stop-slop throat-clearing openers (+ no-ai-slop)
const THROAT: [string, RegExp][] = [
  ["here's the thing / here's what|why|this|that|how", /(?<![\w'])here(?:'s|\s+is)\s+(?:the\s+thing|what|why|this|that|how)\b/i],
  ['the uncomfortable truth is', phrase('the uncomfortable truth')],
  ['it turns out', phrase('it turns out')],
  ['the real X is', /\bthe\s+real\s+\w+\s+is\b/i],
  ['let me be clear', phrase('let me be clear')],
  ['the truth is', phrase('the truth is')],
  ["I'll say it again", phrase("I'll say it again")],
  ["I'm going to be honest / I'll be honest", /\bI(?:'m\s+going\s+to|'ll)\s+be\s+honest\b/i],
  ['can we talk about', phrase('can we talk about')],
]
for (const [t, re] of THROAT) add(patternRule(`throat-${t.split(' ').slice(0, 3).join('-').replace(/\W+/g, '-')}`, 'Throat-clearing', `No "${t}"`, re))

// --- stop-slop emphasis crutches
const EMPHASIS: [string, RegExp][] = [
  ['Full stop. / Period.', /(?:^|[.!?]\s+)(?:full\s+stop|period)\.(?=\s|$)/i],
  ['Let that sink in', phrase('let that sink in')],
  ['This matters because', phrase('this matters because')],
  ['Make no mistake', phrase('make no mistake')],
  ["Here's why that matters", /\bhere(?:'s|\s+is)\s+why\s+(?:that|this|it)\s+matters\b/i],
]
for (const [t, re] of EMPHASIS) add(patternRule(`emphasis-${t.slice(0, 18).replace(/\W+/g, '-')}`, 'Emphasis crutches', `No "${t}"`, re))

// --- stop-slop business jargon table
const JARGON: [string, RegExp][] = [
  ['navigate (challenges)', /\bnavigat(?:e|es|ed|ing)\s+(?:the\s+|these\s+|this\s+)?(?:challenges?|uncertaint(?:y|ies)|complexit(?:y|ies)|landscape|change|ambiguity)\b/i],
  ['unpack', /\bunpack(?:s|ed|ing)?\b/i],
  ['lean into', /\blean(?:s|ed|ing)?\s+into\b/i],
  ['landscape (context)', /\b(?:the|today's|current|competitive|regulatory|digital|business|market|tech|housing|rental|student|evolving)\s+landscape\b/i],
  ['double down', /\bdoubl(?:e|es|ed|ing)\s+down\b/i],
  ['deep dive', /\bdeep[-\s]dives?\b/i],
  ['take a step back', /\btak(?:e|es|ing)\s+a\s+step\s+back\b/i],
  ['moving forward', phrase('moving forward')],
  ['circle back', /\bcircl(?:e|es|ed|ing)\s+back\b/i],
  ['on the same page', phrase('on the same page')],
]
for (const [t, re] of JARGON) add(patternRule(`jargon-${t.replace(/\W+/g, '-')}`, 'Business jargon', `No "${t}"`, re))

// --- stop-slop meta-commentary + no-ai-slop interpretive metadiscourse
const META: [string, RegExp][] = [
  ['Hint:', /(?:^|[.!?]\s+)hint:/i],
  ['You already know this, but', phrase('you already know this')],
  ["But that's another post", /\bthat's\s+(?:another|a\s+different)\s+(?:post|story|essay)\b/i],
  ['X is a feature, not a bug', /\ba\s+feature,?\s+not\s+a\s+bug\b/i],
  ['Dressed up as', phrase('dressed up as')],
  ["The rest of this… / Let me walk you through / In this section, we'll / As we'll see / I want to explore",
    /\b(?:the\s+rest\s+of\s+this\s+(?:essay|post|doc|document|article|section)|let\s+me\s+walk\s+you\s+through|in\s+this\s+section,?\s+we(?:'ll|\s+will)|as\s+we(?:'ll|\s+will)\s+see|I\s+want\s+to\s+explore)\b/i],
  ['As you can see', phrase('as you can see')],
  ['The key point is / This distinction matters / matters more than it sounds',
    /\b(?:the\s+key\s+(?:point|takeaway|thing)\s+(?:is|here)|this\s+distinction\s+matters|matters\s+more\s+than\s+it\s+sounds|that\s+last\s+part\s+matters)\b/i],
]
for (const [t, re] of META) add(patternRule(`meta-${t.slice(0, 16).replace(/\W+/g, '-')}`, 'Meta-commentary', `No "${t}"`, re))

// --- often-empty phrases (both guides)
const EMPTY = [
  "it's worth noting", "it's important to note", 'at the end of the day', 'when it comes to', 'at its core',
  "in today's", 'in the age of', 'in the world of', 'the reality is', 'in terms of', 'with regard to',
  'in order to', 'going forward', 'in this article', "let's dive in",
]
for (const p of EMPTY) add(patternRule(`empty-${p.replace(/\W+/g, '-')}`, 'Empty phrases', `No "${p}"`, phrase(p)))
add(patternRule('empty-in-a-world-where', 'Empty phrases', 'No "In a world where"', phrase('in a world where')))

// --- binary contrasts (stop-slop structures.md, no-ai-slop)
const CONTRAST: [string, RegExp][] = [
  ['Not because X. Because Y.', /\bnot\s+because\b/i],
  ["X isn't A, it's B", /\b(?:isn't|is\s+not|wasn't|aren't)\s+[^.!?\n]{1,60}?[,.;]\s+(?:it's|it\s+is|they're|this\s+is|that's)\b/i],
  ['Not just X but (also) Y', /\bnot\s+(?:just|only|merely)\b[^.!?\n]{1,80}?\bbut\b/i],
  ['The question/answer/problem isn\'t X', /\bthe\s+(?:question|answer|problem|point|issue)\s+(?:isn't|is\s+not)\b/i],
  ['stops being X and starts being Y', /\bstops?\s+being\b[^.!?\n]{1,60}?\bstarts?\s+being\b/i],
]
for (const [t, re] of CONTRAST) add(patternRule(`contrast-${t.slice(0, 18).replace(/\W+/g, '-')}`, 'Binary contrasts', `No "${t}"`, re))

// --- no-ai-slop faux-insight setups
const FAUX: [string, RegExp][] = [
  ['This is the part most people skip', /\bthe\s+part\s+most\s+people\s+(?:skip|miss)\b/i],
  ['What most people get wrong', /\bmost\s+people\s+get\s+wrong\b/i],
  ["Here's what nobody tells you", /\b(?:nobody|no\s+one)\s+tells\s+you\b/i],
  ['The part everyone misses', /\b(?:the\s+part\s+)?everyone\s+(?:misses|overlooks|forgets)\b/i],
]
for (const [t, re] of FAUX) add(patternRule(`faux-${t.slice(0, 18).replace(/\W+/g, '-')}`, 'Faux-insight setups', `No "${t}"`, re))

// --- no-ai-slop importance puffery + superficial analysis
const PUFF: [string, RegExp][] = [
  ['stands as a testament', /\b(?:stands?\s+as\s+a\s+)?testament\s+to\b/i],
  ['marks a pivotal moment', /\bpivotal\s+(?:moment|step|milestone|point)\b/i],
  ['plays a vital role', /\bplays?\s+an?\s+(?:vital|crucial|key|pivotal|critical|central|important)\s+role\b/i],
  ['solidifies its position', /\bsolidif(?:y|ies|ied|ying)\s+(?:its|their|our)\s+(?:position|place|status)\b/i],
  ['underscores', /\bunderscor(?:e|es|ed|ing)\b/i],
]
for (const [t, re] of PUFF) add(patternRule(`puffery-${t.slice(0, 18).replace(/\W+/g, '-')}`, 'Importance puffery', `No "${t}"`, re))
add(patternRule('superficial-ing', 'Importance puffery', 'No trailing ", highlighting/showcasing/reflecting…" clauses',
  /,\s+(?:highlighting|showcasing|underscoring|reflecting|emphasi[sz]ing|demonstrating|signal(?:l)?ing)\s+(?:the|its|their|our|a|how)\b/i))

// --- no-ai-slop weasel attribution
const WEASEL: [string, RegExp][] = [
  ['experts agree', /\bexperts?\s+(?:agree|say|believe)\b/i],
  ['studies show', /\bstud(?:y|ies)\s+(?:show|shows|suggest|suggests|prove)\b/i],
  ['widely regarded', /\bwidely\s+(?:regarded|considered|recogni[sz]ed|accepted)\b/i],
  ['industry reports suggest', /\bindustry\s+(?:reports?|analysts?)\s+(?:suggest|say|show)\b/i],
  ['many argue', /\bmany\s+(?:argue|believe|say)\b/i],
]
for (const [t, re] of WEASEL) add(patternRule(`weasel-${t.replace(/\W+/g, '-')}`, 'Weasel attribution', `No "${t}"`, re))

// --- no-ai-slop summary-recap endings (paragraph openers)
add({
  id: 'recap-in-conclusion', category: 'Summary-recap endings', title: 'No paragraph opens with "In conclusion" / "In summary" / "To sum up"', scope: 'both',
  check: (ui, docs) => [
    ...ui.filter((s) => /^(?:in\s+conclusion|in\s+summary|to\s+sum\s+up)\b/i.test(s.text)).map((s) => `${s.file}: ${s.text}`),
    ...docs.flatMap((d) => d.paragraphs.filter((p) => /^(?:in\s+conclusion|in\s+summary|to\s+sum\s+up)\b/i.test(p)).map((p) => `${d.file}: ${p.slice(0, 80)}`)),
  ],
})
add({
  id: 'recap-ultimately', category: 'Summary-recap endings', title: 'No paragraph opens with "Ultimately," / "Overall,"', scope: 'both',
  check: (ui, docs) => [
    ...ui.filter((s) => /^(?:ultimately|overall),/i.test(s.text)).map((s) => `${s.file}: ${s.text}`),
    ...docs.flatMap((d) => d.paragraphs.filter((p) => /^(?:ultimately|overall),/i.test(p)).map((p) => `${d.file}: ${p.slice(0, 80)}`)),
  ],
})

// --- no-ai-slop formatting slop: emoji in headings
add({
  id: 'emoji-headings', category: 'Formatting slop', title: 'No emoji in markdown headings', scope: 'docs',
  check: (_ui, docs) => docs.flatMap((d) => d.headings.filter((h) => /\p{Extended_Pictographic}/u.test(h)).map((h) => `${d.file}: ${h}`)),
})

// --- rhetorical setups (both guides)
const RHETORIC: [string, RegExp][] = [
  ['What if I told you', phrase('what if I told you')],
  ['Think about it', /\bthink\s+about\s+it\b[:.!]?/i],
  ['Plot twist: / Spoiler:', /\b(?:plot\s+twist|spoiler(?:\s+alert)?)\s*:/i],
  ["And that's okay", /\band\s+that's\s+(?:okay|ok|fine)\b/i],
]
for (const [t, re] of RHETORIC) add(patternRule(`rhetoric-${t.slice(0, 16).replace(/\W+/g, '-')}`, 'Rhetorical setups', `No "${t}"`, re))

// --- stop-slop vague declaratives
const VAGUE = [
  'the reasons are structural', 'the implications are significant', 'this is the deepest problem',
  'the stakes are high', 'the consequences are real',
]
for (const p of VAGUE) add(patternRule(`vague-${p.replace(/\W+/g, '-')}`, 'Vague declaratives', `No "${p}"`, phrase(p)))

// --- stop-slop adverb list, UI copy only (short copy: every word has to earn its place)
const ADVERBS = [
  'just', 'really', 'literally', 'genuinely', 'honestly', 'simply', 'actually', 'deeply', 'truly',
  'fundamentally', 'inherently', 'inevitably', 'interestingly', 'importantly', 'crucially',
]
for (const a of ADVERBS) add(patternRule(`adverb-${a}`, 'Adverbs (UI copy)', `UI copy has no "${a}"`, new RegExp(`\\b${a}\\b`, 'i'), 'ui'))

export const RULES: readonly Rule[] = Object.freeze(rules)

export interface Score {
  total: number
  passed: number
  failed: { id: string; title: string; hits: string[] }[]
  passRate: number
}

export function scoreAll(ui: readonly Snippet[], docs: readonly ProseDoc[]): Score {
  const failed = RULES.map((r) => ({ id: r.id, title: r.title, hits: r.check(ui, docs) })).filter((f) => f.hits.length > 0)
  const total = RULES.length
  return { total, passed: total - failed.length, failed, passRate: (total - failed.length) / total }
}
