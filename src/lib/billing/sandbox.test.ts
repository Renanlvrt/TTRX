// Billing is a simulation: no real money, no real partners, no network. These guards keep it that way.
import { describe, expect, it } from 'vitest'
import { BILLING_MODE } from './mode'
import { createBillingService } from './signup'
import { createMemoryRepository } from './repository'
import { createFeeScheduleRegistry, flatFeePerSignup } from './fees'
import { fixedClock } from './clock'
import { sequentialIds } from './ids'
import { InvariantError } from './errors'
import { formatMoney, formatSimulated, moneyFromMinor } from './money'
import { POLICY_FIRST, T, catalog, must, partners, pseudonymiser, setup } from './test-fixtures'

const sources = import.meta.glob(['./*.ts', '!./*.test.ts'], { query: '?raw', import: 'default', eager: true }) as Record<string, string>

describe('sandbox mode', () => {
  it('the module is hard-wired to sandbox', () => {
    expect(BILLING_MODE).toBe('sandbox')
  })

  it('refuses to build a live billing service', () => {
    expect(() =>
      createBillingService({
        repo: createMemoryRepository(), clock: fixedClock(T), ids: sequentialIds(), pseudonymiser: pseudonymiser(),
        catalog: catalog(), fees: must(createFeeScheduleRegistry([flatFeePerSignup])), policy: POLICY_FIRST, mode: 'live',
      }),
    ).toThrow(InvariantError)
    expect(() =>
      createBillingService({
        repo: createMemoryRepository(), clock: fixedClock(T), ids: sequentialIds(), pseudonymiser: pseudonymiser(),
        catalog: catalog(), fees: must(createFeeScheduleRegistry([flatFeePerSignup])), policy: POLICY_FIRST, mode: 'live',
      }),
    ).toThrow('live billing disabled')
  })

  it('every outcome and every posting is flagged sandbox', async () => {
    const { service, repo } = setup()
    const billed = must(await service.recordSignup({ email: 's1@alpha-lettings.example' }, 'k-1'))
    const free = must(await service.recordSignup({ email: 'bob@student.example' }, 'k-2'))
    expect(billed.sandbox).toBe(true)
    expect(free.sandbox).toBe(true)
    const ledger = await repo.listLedger()
    expect(ledger.length).toBeGreaterThan(0)
    for (const t of ledger) expect(t.sandbox).toBe(true)
  })

  it('every posting recordSignup creates says [SIMULATED] in its memo', async () => {
    const { service, repo } = setup()
    must(await service.recordSignup({ email: 's1@alpha-lettings.example' }, 'k-1'))
    must(await service.recordSignup({ email: 's2@beta-homes.example' }, 'k-2'))
    const ledger = await repo.listLedger()
    expect(ledger).toHaveLength(2)
    for (const t of ledger) expect(t.memo.startsWith('[SIMULATED]')).toBe(true)
  })

  it('formatSimulated labels amounts; formatMoney is unchanged', () => {
    const m = must(moneyFromMinor(250n, 'GBP'))
    expect(formatSimulated(m)).toBe('SIM £2.50')
    expect(formatMoney(m)).toBe('£2.50')
  })

  it('no billing module touches the network', () => {
    const files = Object.keys(sources)
    expect(files.length).toBeGreaterThanOrEqual(10)
    for (const f of files) {
      expect(sources[f], f).not.toContain('fetch(')
      expect(sources[f], f).not.toContain('XMLHttpRequest')
    }
  })

  it('every fixture partner is labelled fictional and uses a reserved .example domain', () => {
    for (const p of partners()) {
      expect(p.name).toContain('(fictional)')
      for (const d of p.emailDomains) expect(d.endsWith('.example')).toBe(true)
    }
  })
})
