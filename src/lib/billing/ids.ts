export interface IdGenerator { next<P extends string>(prefix: P): string }

/** Deterministic ids for tests: "sig_000001", counted per prefix. */
export function sequentialIds(): IdGenerator {
  const counters = new Map<string, number>()
  return {
    next(prefix) {
      const n = (counters.get(prefix) ?? 0) + 1
      counters.set(prefix, n)
      return `${prefix}_${String(n).padStart(6, '0')}`
    },
  }
}

export function uuidIds(): IdGenerator {
  return { next: (prefix) => `${prefix}_${globalThis.crypto.randomUUID()}` }
}
