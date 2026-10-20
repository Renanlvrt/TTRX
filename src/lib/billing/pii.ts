import type { PseudonymousId } from './brand'
import { InvariantError } from './errors'
import type { NormalisedEmail } from './validate'

const utf8 = (s: string) => new TextEncoder().encode(s)
const hex = (buf: ArrayBuffer) => Array.from(new Uint8Array(buf), (b) => b.toString(16).padStart(2, '0')).join('')

export async function sha256Hex(s: string): Promise<string> {
  return hex(await globalThis.crypto.subtle.digest('SHA-256', utf8(s)))
}

export async function hmacSha256Hex(key: Uint8Array, msg: Uint8Array): Promise<string> {
  const k = await globalThis.crypto.subtle.importKey('raw', new Uint8Array(key), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'])
  return hex(await globalThis.crypto.subtle.sign('HMAC', k, new Uint8Array(msg)))
}

/** True when a string looks like it holds an email address. Ledger memos and audit data must never carry one. */
export const containsPii = (s: string): boolean => /[^\s@]+@[^\s@]+\.[^\s@]+/.test(s)

export interface Pseudonymiser {
  readonly keyId: string
  pseudonymise(e: NormalisedEmail): Promise<PseudonymousId>
}

/** Keyed HMAC-SHA256 pseudonym. Still personal data under ICO/EDPB guidance; production keeps the key in a KMS. */
export function createHmacPseudonymiser(o: { keyId: string; key: Uint8Array }): Pseudonymiser {
  if (o.key.length < 32) throw new InvariantError('pseudonymiser key must be at least 32 bytes')
  if (!/^[A-Za-z0-9]{1,16}$/.test(o.keyId)) throw new InvariantError('pseudonymiser keyId must be 1 to 16 letters or digits')
  const key = new Uint8Array(o.key)
  return Object.freeze({
    keyId: o.keyId,
    async pseudonymise(e: NormalisedEmail) {
      const mac = await hmacSha256Hex(key, utf8(`${e.local}@${e.domain}`))
      return `psn_v1_${o.keyId}_${mac}` as PseudonymousId
    },
  })
}
