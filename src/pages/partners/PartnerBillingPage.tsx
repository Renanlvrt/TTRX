import { useEffect, useRef, useState } from 'react'
import type { FormEvent } from 'react'
import { FlaskConical, RotateCcw } from 'lucide-react'
import { Button, Fine, Page, Stat, cx } from '../../components/ui'
import { DEMO_PARTNERS, SEED_SIGNUPS, createBillingDemo } from '../../lib/billingDemo'
import type { BillingDemo, SignupResult, Snapshot } from '../../lib/billingDemo'

const input = 'h-12 w-full rounded-md border border-field-border bg-card px-4 text-base text-ink placeholder:text-subtle focus:border-brand focus:outline-2 focus:outline-brand'

export default function PartnerBillingPage() {
  const demo = useRef<BillingDemo | null>(null)
  const [snap, setSnap] = useState<Snapshot | null>(null)
  const [result, setResult] = useState<SignupResult | null>(null)
  const [email, setEmail] = useState('')
  const [refCode, setRefCode] = useState('')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    let live = true
    const d = createBillingDemo()
    demo.current = d
    ;(async () => {
      for (const s of SEED_SIGNUPS) await d.signup(s)
      if (live) setSnap(await d.snapshot())
    })()
    return () => {
      live = false
    }
  }, [])

  async function run(fn: (d: BillingDemo) => Promise<SignupResult | null>) {
    const d = demo.current
    if (!d || busy) return
    setBusy(true)
    try {
      const r = await fn(d)
      if (r) setResult(r)
      setSnap(await d.snapshot())
    } finally {
      setBusy(false)
    }
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault()
    if (!email.trim()) return
    run((d) => d.signup({ email, referralCode: refCode }))
  }

  return (
    <Page title="Partner billing" subtitle="How RentReady would bill letting partners for student signups." back="/">
      <div role="status" className="mb-8 flex items-start gap-3 rounded-md border border-highlight-strong border-l-4 bg-highlight p-4 text-ink">
        <FlaskConical size={20} className="mt-0.5 shrink-0 text-brand" aria-hidden />
        <p className="text-base font-semibold">Simulation. No real money moves and no partner is billed.</p>
      </div>

      <section aria-labelledby="partners-h" className="mb-10">
        <h2 id="partners-h" className="mb-3 font-display text-2xl font-semibold text-ink">Fictional partners</h2>
        <ul className="divide-y divide-line rounded-md border border-line bg-card md:hidden">
          {DEMO_PARTNERS.map((p) => (
            <li key={p.id} className="px-4 py-3">
              <div className="flex items-baseline justify-between gap-3">
                <span className="font-medium text-ink">{p.name}</span>
                <span className="font-mono text-sm text-ink">{p.code}</span>
              </div>
              <div className="mt-1 text-sm text-muted">{p.fee} · {p.contract}</div>
            </li>
          ))}
        </ul>
        <div className="hidden rounded-md border border-line bg-card md:block">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-line-strong bg-canvas text-xs uppercase tracking-[0.1em] text-muted">
              <tr>
                <th scope="col" className="px-4 py-3 font-semibold">Partner</th>
                <th scope="col" className="px-4 py-3 font-semibold">Code</th>
                <th scope="col" className="px-4 py-3 font-semibold">Fee</th>
                <th scope="col" className="px-4 py-3 font-semibold">Contract</th>
              </tr>
            </thead>
            <tbody>
              {DEMO_PARTNERS.map((p) => (
                <tr key={p.id} className="border-b border-line last:border-0">
                  <td className="px-4 py-3 font-medium text-ink">{p.name}</td>
                  <td className="px-4 py-3 font-mono text-ink">{p.code}</td>
                  <td className="px-4 py-3 tabular-nums text-ink">{p.fee}</td>
                  <td className="px-4 py-3 text-muted">{p.contract}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section aria-labelledby="add-h" className="mb-10 rounded-md border border-line bg-card p-6">
        <h2 id="add-h" className="font-display text-2xl font-semibold text-ink">Add a simulated signup</h2>
        <Fine className="mt-1">Use any address on a .example domain. A code counts as a partner link the student opened an hour earlier.</Fine>
        <form onSubmit={onSubmit} className="mt-5 grid gap-4 md:grid-cols-[2fr_1fr_auto] md:items-end">
          <label className="block">
            <span className="mb-1.5 block text-sm font-semibold text-ink">Student email</span>
            <input className={input} type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="sam@student.example" autoComplete="off" />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-sm font-semibold text-ink">Referral code (optional)</span>
            <input className={cx(input, 'font-mono uppercase')} value={refCode} onChange={(e) => setRefCode(e.target.value)} placeholder="BETA" autoComplete="off" />
          </label>
          <Button type="submit" size="md" disabled={busy || !snap}>Add signup</Button>
        </form>
        <div className="mt-4">
          <Button type="button" variant="secondary" size="md" disabled={busy || !snap} onClick={() => run((d) => d.replayLast())}>
            <RotateCcw size={16} aria-hidden /> Send the last request again
          </Button>
        </div>
        {result && (
          <div aria-live="polite" className={cx('mt-5 border-l-4 p-4', result.ok ? 'border-brand bg-brand-soft' : 'border-highlight-strong bg-highlight')}>
            <p className="text-sm text-muted">
              {result.email} · request key <span className="font-mono">{result.key}</span>
            </p>
            <p className="mt-1 text-base font-semibold text-ink">{result.headline}</p>
            {result.notes.map((n) => (
              <p key={n} className="mt-1 text-sm text-ink">{n}</p>
            ))}
          </div>
        )}
      </section>

      {snap ? <Ledger snap={snap} /> : <Fine>Running the opening signups…</Fine>}

      <Fine className="mt-10">
        A real version runs on a server, because anyone can edit a page in their browser. Fee options for later (tiers, VAT, invoices, refunds) are written up in docs/billing/deferred.
      </Fine>
    </Page>
  )
}

function Ledger({ snap }: { snap: Snapshot }) {
  return (
    <>
      <div className="mb-10 grid gap-4 sm:grid-cols-3">
        <Stat label="Signups recorded" value={String(snap.signups)} />
        <Stat label="Ledger balanced" value={snap.balanced ? 'Yes' : 'No'} sub={`${snap.discrepancies} discrepancies`} />
        <Stat label="Audit chain" value={snap.auditVerified ? 'Verified' : 'Broken'} sub={`${snap.auditEvents} events`} />
      </div>

      <section aria-labelledby="owed-h" className="mb-10">
        <h2 id="owed-h" className="mb-3 font-display text-2xl font-semibold text-ink">Owed by each partner</h2>
        {snap.receivables.length === 0 ? (
          <Fine>No partner owes anything yet.</Fine>
        ) : (
          <dl className="divide-y divide-line rounded-md border border-line bg-card">
            {snap.receivables.map((r) => (
              <div key={r.partner} className="flex items-baseline justify-between gap-4 px-4 py-3">
                <dt className="text-base text-ink">{r.partner}</dt>
                <dd className="whitespace-nowrap font-display text-xl font-semibold tabular-nums text-ink">{r.amount}</dd>
              </div>
            ))}
          </dl>
        )}
      </section>

      <section aria-labelledby="ledger-h">
        <h2 id="ledger-h" className="mb-1 font-display text-2xl font-semibold text-ink">Ledger</h2>
        <Fine className="mb-3">Double entry: each fee is a debit to the partner and a credit to RentReady. Rows are never edited.</Fine>
        <ul className="divide-y divide-line rounded-md border border-line bg-card md:hidden">
          {snap.rows.length === 0 && <li className="px-4 py-4 text-muted">No postings yet.</li>}
          {snap.rows.map((r) => (
            <li key={r.id} className="px-4 py-3">
              <div className="flex items-baseline justify-between gap-3">
                <span className="font-medium text-ink">{r.partner}</span>
                <span className="whitespace-nowrap tabular-nums text-ink">{r.debit ? `Debit ${r.debit}` : `Credit ${r.credit}`}</span>
              </div>
              <div className="mt-1 text-sm text-muted">{r.at} · {r.memo}</div>
            </li>
          ))}
        </ul>
        <div className="hidden rounded-md border border-line bg-card md:block">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-line-strong bg-canvas text-xs uppercase tracking-[0.1em] text-muted">
              <tr>
                <th scope="col" className="px-4 py-3 font-semibold">Time</th>
                <th scope="col" className="px-4 py-3 font-semibold">Account</th>
                <th scope="col" className="px-4 py-3 font-semibold">Memo</th>
                <th scope="col" className="px-4 py-3 text-right font-semibold">Debit</th>
                <th scope="col" className="px-4 py-3 text-right font-semibold">Credit</th>
              </tr>
            </thead>
            <tbody>
              {snap.rows.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-4 text-muted">No postings yet.</td>
                </tr>
              )}
              {snap.rows.map((r) => (
                <tr key={r.id} className="border-b border-line last:border-0">
                  <td className="whitespace-nowrap px-4 py-3 tabular-nums text-muted">{r.at}</td>
                  <td className="px-4 py-3 text-ink">{r.partner}</td>
                  <td className="px-4 py-3 text-muted">{r.memo}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-right tabular-nums text-ink">{r.debit}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-right tabular-nums text-ink">{r.credit}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </>
  )
}
