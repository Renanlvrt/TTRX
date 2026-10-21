import { useEffect, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { Button, OptionTile } from '../../components/ui'
import { AREAS } from '../../lib/types'
import type { AreaId, BillsSurvey, HeatingPattern, WaterUse } from '../../lib/types'
import { DEFAULT_TENANCY_WEEKS, areasForPostcode } from '../../lib/bills'

interface Draft {
  hasPackage: boolean | null
  pppw: string
  area: AreaId | null
  postcode: string
  people: number
  water: WaterUse | null
  heating: HeatingPattern | null
  hasGas: boolean | null
  wifi: boolean
  tvLicence: boolean
  tenancyWeeks: number
}

function toDraft(s: BillsSurvey | null): Draft {
  if (!s)
    return { hasPackage: null, pppw: '', area: null, postcode: '', people: 4, water: null, heating: null, hasGas: null, wifi: true, tvLicence: false, tenancyWeeks: DEFAULT_TENANCY_WEEKS }
  return {
    hasPackage: s.packagePppw != null,
    pppw: s.packagePppw != null ? String(s.packagePppw) : '',
    area: s.area,
    postcode: '',
    people: s.people,
    water: s.water,
    heating: s.heating,
    hasGas: s.hasGas,
    wifi: s.wifi,
    tvLicence: s.tvLicence,
    tenancyWeeks: s.tenancyWeeks,
  }
}

const TOTAL = 7

export default function Survey({ initial, onStart, onFinish }: { initial: BillsSurvey | null; onStart: () => void; onFinish: (s: BillsSurvey) => void }) {
  const [d, setD] = useState<Draft>(() => toDraft(initial))
  const [step, setStep] = useState(0)
  const set = (patch: Partial<Draft>) => setD((prev) => ({ ...prev, ...patch }))

  const pppw = Number(d.pppw)
  const answered = [
    d.hasPackage === false || (d.hasPackage === true && d.pppw.trim() !== '' && Number.isFinite(pppw) && pppw > 0),
    d.area != null,
    d.people >= 1,
    d.water != null,
    d.heating != null,
    d.hasGas != null,
    true,
  ][step]

  function next() {
    if (!answered) return
    if (step === 0) onStart()
    if (step < TOTAL - 1) return setStep(step + 1)
    onFinish({
      packagePppw: d.hasPackage ? Math.round(pppw * 100) / 100 : null,
      area: d.area!,
      people: d.people,
      water: d.water!,
      heating: d.heating!,
      hasGas: d.hasGas!,
      wifi: d.wifi,
      tvLicence: d.tvLicence,
      tenancyWeeks: d.tenancyWeeks,
    })
  }

  // Enter = Next everywhere except links and the nav buttons themselves (they handle Enter natively).
  const nextRef = useRef(next)
  useEffect(() => {
    nextRef.current = next
  })
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Enter' || (e.target as HTMLElement | null)?.closest?.('a,[data-nav]')) return
      e.preventDefault()
      nextRef.current()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  function onPostcode(value: string) {
    const matches = areasForPostcode(value)
    const area = matches.length === 0 || (d.area && matches.includes(d.area)) ? d.area : matches[0]
    set({ postcode: value, area })
  }

  const steps: { title: string; body: ReactNode }[] = [
    {
      title: 'Does the house offer a bills package?',
      body: (
        <div className="space-y-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <OptionTile selected={d.hasPackage === true} onClick={() => set({ hasPackage: true })} title="Yes" />
            <OptionTile selected={d.hasPackage === false} onClick={() => set({ hasPackage: false })} title="No package" />
          </div>
          {d.hasPackage && (
            <label className="flex items-center gap-3 rounded-md border-2 border-brand bg-card px-5 py-4 focus-within:ring-2 focus-within:ring-brand focus-within:ring-offset-2">
              <span className="text-4xl font-display font-semibold text-subtle">£</span>
              <input
                autoFocus
                inputMode="decimal"
                value={d.pppw}
                onChange={(e) => set({ pppw: e.target.value.replace(/[^0-9.]/g, '') })}
                placeholder="25"
                aria-label="Package price in pounds per person per week"
                className="w-full bg-transparent text-4xl font-display font-semibold outline-none placeholder:text-subtle"
              />
              <span className="shrink-0 text-lg font-medium text-muted">/ week each</span>
            </label>
          )}
        </div>
      ),
    },
    {
      title: 'Where is the house?',
      body: (
        <div className="space-y-3">
          <input
            value={d.postcode}
            onChange={(e) => onPostcode(e.target.value)}
            placeholder="Postcode, e.g. DH1 4"
            aria-label="Postcode"
            className="h-14 w-full rounded-md border-2 border-field-border px-5 text-lg font-semibold uppercase outline-none placeholder:font-normal placeholder:normal-case placeholder:text-subtle focus:border-brand focus:ring-2 focus:ring-brand focus:ring-offset-1"
          />
          <div className="grid gap-3 sm:grid-cols-2">
            {AREAS.map((a) => (
              <OptionTile key={a.id} selected={d.area === a.id} onClick={() => set({ area: a.id })} title={a.label} />
            ))}
          </div>
        </div>
      ),
    },
    {
      title: 'How many people live there?',
      body: (
        <div className="flex items-center justify-center gap-8 py-6">
          <StepperButton label="Fewer people" disabled={d.people <= 1} onClick={() => set({ people: d.people - 1 })}>
            <span aria-hidden className="text-4xl leading-none">−</span>
          </StepperButton>
          <span className="w-24 text-center text-7xl font-display font-semibold tabular-nums" aria-live="polite">
            {d.people}
          </span>
          <StepperButton label="More people" disabled={d.people >= 10} onClick={() => set({ people: d.people + 1 })}>
            <span aria-hidden className="text-4xl leading-none">+</span>
          </StepperButton>
        </div>
      ),
    },
    {
      title: 'How much water does the house use?',
      body: (
        <div className="space-y-3">
          <OptionTile selected={d.water === 'low'} onClick={() => set({ water: 'low' })} title="Low" caption="4-minute showers" />
          <OptionTile selected={d.water === 'normal'} onClick={() => set({ water: 'normal' })} title="Normal" caption="8-minute showers" />
          <OptionTile selected={d.water === 'high'} onClick={() => set({ water: 'high' })} title="High" caption="20-minute showers" />
        </div>
      ),
    },
    {
      title: 'How warm do you keep the house?',
      body: (
        <div className="space-y-3">
          <OptionTile selected={d.heating === 'allDay'} onClick={() => set({ heating: 'allDay' })} title="Warm and cozy" />
          <OptionTile selected={d.heating === 'nights'} onClick={() => set({ heating: 'nights' })} title="Only when I'm cold" />
          <OptionTile selected={d.heating === 'coldMonths'} onClick={() => set({ heating: 'coldMonths' })} title="I could live in an igloo" />
        </div>
      ),
    },
    {
      title: 'Does the house have gas?',
      body: (
        <div className="grid gap-3 sm:grid-cols-2">
          <OptionTile selected={d.hasGas === true} onClick={() => set({ hasGas: true })} title="Yes" />
          <OptionTile selected={d.hasGas === false} onClick={() => set({ hasGas: false })} title="No" />
        </div>
      ),
    },
    {
      title: 'Anything else?',
      body: (
        <div className="grid gap-3 sm:grid-cols-2">
          <OptionTile selected={d.wifi} onClick={() => set({ wifi: !d.wifi })} title="Wi-Fi" />
          <OptionTile selected={d.tvLicence} onClick={() => set({ tvLicence: !d.tvLicence })} title="TV licence" />
        </div>
      ),
    },
  ]
  const current = steps[step]

  return (
    <div className="mx-auto w-full max-w-2xl px-6 py-10">
      <div className="mb-10 flex items-center gap-4">
        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-canvas-strong" role="progressbar" aria-valuemin={1} aria-valuemax={TOTAL} aria-valuenow={step + 1}>
          <div className="h-full rounded-full bg-brand transition-all duration-300" style={{ width: `${((step + 1) / TOTAL) * 100}%` }} />
        </div>
      </div>

      <h1 className="text-4xl font-display font-semibold">{current.title}</h1>

      <div className="mt-8 min-h-64">{current.body}</div>

      <div className="mt-10 flex items-center justify-between gap-4">
        {step === 0 ? (
          <Link to="/" className="inline-flex h-14 items-center gap-2 rounded-md px-4 text-lg font-semibold text-muted hover:bg-canvas-strong hover:text-ink">
            Home
          </Link>
        ) : (
          <Button data-nav variant="ghost" onClick={() => setStep(step - 1)}>
            Back
          </Button>
        )}
        <Button data-nav onClick={next} disabled={!answered}>
          {step === TOTAL - 1 ? 'See my estimate' : 'Next'}
        </Button>
      </div>
    </div>
  )
}

function StepperButton({ label, disabled, onClick, children }: { label: string; disabled: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      className="flex h-16 w-16 items-center justify-center rounded-full border-2 border-line text-ink transition hover:border-brand hover:bg-brand-soft disabled:cursor-not-allowed disabled:opacity-30"
    >
      {children}
    </button>
  )
}
