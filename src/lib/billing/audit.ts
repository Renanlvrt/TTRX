// Hash-chained audit trail: each event commits to the previous one, so edits, gaps and reordering show up.
import type { Instant } from './brand'
import { canonicalJson } from './canonical'
import { containsPii, sha256Hex } from './pii'
import type { Result } from './result'
import { fail, ok } from './result'
import { deepFreeze } from './validate'

export type AuditType =
  | 'SIGNUP_RECEIVED' | 'SIGNUP_ATTRIBUTED' | 'SIGNUP_UNATTRIBUTED' | 'FEE_CALCULATED' | 'LEDGER_POSTED' | 'LEDGER_REVERSED'

export interface AuditEvent {
  readonly seq: number
  readonly at: Instant
  readonly type: AuditType
  readonly subjectId: string
  readonly data: Readonly<Record<string, string>>
  readonly prevHash: string
  readonly hash: string
}

export const GENESIS_HASH = '0'.repeat(64)

const hashOf = (e: Omit<AuditEvent, 'hash'>) =>
  sha256Hex(canonicalJson({ seq: e.seq, at: e.at, type: e.type, subjectId: e.subjectId, data: e.data, prevHash: e.prevHash }))

export async function appendAuditEvent(
  prev: AuditEvent | null, d: { at: Instant; type: AuditType; subjectId: string; data: Record<string, string> },
): Promise<Result<AuditEvent>> {
  if (containsPii(d.subjectId) || Object.values(d.data).some(containsPii)) {
    return fail('PII_REJECTED', 'audit events must not contain personal data')
  }
  const body = { seq: prev ? prev.seq + 1 : 1, at: d.at, type: d.type, subjectId: d.subjectId, data: { ...d.data }, prevHash: prev ? prev.hash : GENESIS_HASH }
  return ok(deepFreeze({ ...body, hash: await hashOf(body) }))
}

/** Recomputes every link. On failure, details.atSeq names the first event that does not fit. */
export async function verifyAuditChain(events: readonly AuditEvent[]): Promise<Result<true>> {
  let prevHash = GENESIS_HASH
  for (let i = 0; i < events.length; i++) {
    const e = events[i]
    const broken = () => fail('AUDIT_CHAIN_BROKEN', `audit chain breaks at seq ${e.seq}`, { atSeq: String(e.seq) })
    if (e.seq !== i + 1 || e.prevHash !== prevHash) return broken()
    if ((await hashOf(e)) !== e.hash) return broken()
    prevHash = e.hash
  }
  return ok(true as const)
}
