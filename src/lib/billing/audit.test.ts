import { describe, expect, it } from 'vitest'
import type { AuditEvent } from './audit'
import { GENESIS_HASH, appendAuditEvent, verifyAuditChain } from './audit'
import { canonicalJson } from './canonical'
import { sha256Hex } from './pii'
import { T, at, expectErr, must } from './test-fixtures'

async function chain(n: number): Promise<AuditEvent[]> {
  const out: AuditEvent[] = []
  for (let i = 0; i < n; i++) {
    const prev = out.length ? out[out.length - 1] : null
    out.push(must(await appendAuditEvent(prev, { at: at(i * 1000), type: 'SIGNUP_RECEIVED', subjectId: `sig_${i + 1}`, data: { n: String(i + 1) } })))
  }
  return out
}

function brokenAt(r: Awaited<ReturnType<typeof verifyAuditChain>>): string | undefined {
  if (r.ok) return undefined
  expect(r.error.code).toBe('AUDIT_CHAIN_BROKEN')
  return r.error.details?.atSeq
}

describe('audit hash chain', () => {
  it('the first event links to the genesis hash and hashes its canonical form', async () => {
    const [e] = await chain(1)
    expect(e.seq).toBe(1)
    expect(e.prevHash).toBe(GENESIS_HASH)
    expect(GENESIS_HASH).toBe('0'.repeat(64))
    const { seq, at: when, type, subjectId, data, prevHash } = e
    expect(e.hash).toBe(await sha256Hex(canonicalJson({ seq, at: when, type, subjectId, data, prevHash })))
    expect(when).toBe(T)
  })

  it('an intact chain verifies', async () => {
    expect(must(await verifyAuditChain(await chain(3)))).toBe(true)
  })

  it('edited data is detected at its sequence number', async () => {
    const es = await chain(3)
    es[1] = { ...es[1], data: { n: 'tampered' } }
    expect(brokenAt(await verifyAuditChain(es))).toBe('2')
  })

  it('a removed event is detected', async () => {
    const es = await chain(3)
    expect(brokenAt(await verifyAuditChain([es[0], es[2]]))).toBe('3')
  })

  it('reordered events are detected', async () => {
    const es = await chain(3)
    expect(brokenAt(await verifyAuditChain([es[0], es[2], es[1]]))).toBeDefined()
  })

  it('refuses PII in event data', async () => {
    expect(expectErr(await appendAuditEvent(null, { at: at(0), type: 'SIGNUP_RECEIVED', subjectId: 'sig_1', data: { note: 'alice@student.example' } }))).toBe('PII_REJECTED')
  })

  it('events are frozen', async () => {
    const [e] = await chain(1)
    expect(Object.isFrozen(e)).toBe(true)
    expect(Reflect.set(e, 'hash', 'x')).toBe(false)
  })
})
