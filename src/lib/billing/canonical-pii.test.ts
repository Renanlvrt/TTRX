import { describe, expect, it } from 'vitest'
import { canonicalJson } from './canonical'
import { createHmacPseudonymiser, hmacSha256Hex, sha256Hex } from './pii'
import { parseEmail } from './validate'
import { InvariantError } from './errors'
import { KEY, must, pseudonymiser } from './test-fixtures'

const utf8 = (s: string) => new TextEncoder().encode(s)

describe('canonicalJson', () => {
  it('sorts object keys recursively and keeps array order', () => {
    expect(canonicalJson({ b: 1, a: { d: 2, c: 3 } })).toBe('{"a":{"c":3,"d":2},"b":1}')
    expect(canonicalJson([3, 1, 2])).toBe('[3,1,2]')
  })

  it('encodes bigint as a tagged string', () => {
    expect(canonicalJson({ x: 1234n })).toBe('{"x":"1234n"}')
  })

  it('throws on values JSON would silently drop or corrupt', () => {
    expect(() => canonicalJson({ x: undefined })).toThrow(InvariantError)
    expect(() => canonicalJson({ x: NaN })).toThrow(InvariantError)
    expect(() => canonicalJson({ x: () => 1 })).toThrow(InvariantError)
  })
})

describe('hashing', () => {
  it('sha256Hex matches the FIPS 180-2 "abc" vector', async () => {
    expect(await sha256Hex('abc')).toBe('ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad')
  })

  it('hmacSha256Hex matches RFC 4231 test case 2', async () => {
    expect(await hmacSha256Hex(utf8('Jefe'), utf8('what do ya want for nothing?'))).toBe(
      '5bdcc146bf60754e6a042426089575c75a003f089d2739839dec58b964ec3843',
    )
  })
})

describe('pseudonymiser', () => {
  it('normalises before hashing and tags the key id', async () => {
    const p = pseudonymiser()
    const a = await p.pseudonymise(must(parseEmail(' Alice@Student.example ')))
    const b = await p.pseudonymise(must(parseEmail('alice@student.example')))
    expect(a).toBe(b)
    expect(a).toMatch(/^psn_v1_k1_[0-9a-f]{64}$/)
  })

  it('depends on the key and leaks nothing readable', async () => {
    const e = must(parseEmail('alice@student.example'))
    const a = await pseudonymiser().pseudonymise(e)
    const other = await createHmacPseudonymiser({ keyId: 'k1', key: new Uint8Array(32).fill(2) }).pseudonymise(e)
    expect(other).not.toBe(a)
    expect(a).not.toContain('alice')
    expect(a).not.toContain('student')
  })

  it('refuses keys shorter than 32 bytes', () => {
    expect(KEY.length).toBe(32)
    expect(() => createHmacPseudonymiser({ keyId: 'k1', key: new Uint8Array(16) })).toThrow(InvariantError)
  })
})
