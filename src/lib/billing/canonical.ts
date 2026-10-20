import { InvariantError } from './errors'

const isPlain = (o: object) => {
  const proto = Object.getPrototypeOf(o)
  return proto === Object.prototype || proto === null
}

/**
 * Deterministic JSON: sorted keys, bigint as "123n", and a hard stop on values JSON would drop or corrupt.
 * Maps, Dates and class instances would all encode as "{}" and collide, so only plain objects and arrays pass.
 */
export function canonicalJson(v: unknown): string {
  return encode(v, new Set())
}

function encode(v: unknown, ancestors: Set<object>): string {
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
      if (ancestors.has(v)) throw new InvariantError('canonicalJson: cyclic value')
      if (!Array.isArray(v) && !isPlain(v)) throw new InvariantError('canonicalJson: only plain objects and arrays')
      ancestors.add(v)
      try {
        if (Array.isArray(v)) return `[${v.map((x) => encode(x, ancestors)).join(',')}]`
        const o = v as Record<string, unknown>
        return `{${Object.keys(o).sort().map((k) => `${JSON.stringify(k)}:${encode(o[k], ancestors)}`).join(',')}}`
      } finally {
        ancestors.delete(v)
      }
    }
    default:
      throw new InvariantError(`canonicalJson: cannot encode ${typeof v}`)
  }
}
