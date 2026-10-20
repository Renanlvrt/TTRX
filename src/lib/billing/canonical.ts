import { InvariantError } from './errors'

/** Deterministic JSON: sorted keys, bigint as "123n", and a hard stop on values JSON would drop or corrupt. */
export function canonicalJson(v: unknown): string {
  if (v === null) return 'null'
  switch (typeof v) {
    case 'boolean':
      return v ? 'true' : 'false'
    case 'number':
      if (!Number.isFinite(v)) throw new InvariantError('canonicalJson: non-finite number')
      return JSON.stringify(v)
    case 'string':
      return JSON.stringify(v)
    case 'bigint':
      return JSON.stringify(`${v}n`)
    case 'object': {
      if (Array.isArray(v)) return `[${v.map(canonicalJson).join(',')}]`
      const o = v as Record<string, unknown>
      return `{${Object.keys(o).sort().map((k) => `${JSON.stringify(k)}:${canonicalJson(o[k])}`).join(',')}}`
    }
    default:
      throw new InvariantError(`canonicalJson: cannot encode ${typeof v}`)
  }
}
