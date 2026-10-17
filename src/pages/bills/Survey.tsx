import { useEffect, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, ArrowRight, Ban, Droplet, Droplets, Flame, Minus, Moon, Plus, ShowerHead, Snowflake, Sun, Tv, Wifi, Zap } from 'lucide-react'
import { Button, OptionTile, cx } from '../../components/ui'
import { AREAS } from '../../lib/types'
import type { AreaId, BillsSurvey, HeatingPattern, WaterUse } from '../../lib/types'
import { DEFAULT_TENANCY_WEEKS, areasForPostcode } from '../../lib/bills'
import { useAppState } from '../../lib/store'

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
const ICON = 26

export default function Survey({ initial, onStart, onFinish, onDemo }: { initial: BillsSurvey | null; onStart: () => void; onFinish: (s: BillsSurvey) => void; onDemo: () => void }) {
  const { demoMode } = useAppState()
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

  const steps: { title: string; help?: string; body: ReactNode }[] = [
    {
      title: 'Does the house offer a bills package?',
      help: 'Rent that includes energy, water and Wi-Fi.',
      body: (
        <div className="space-y-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <OptionTile selected={d.hasPackage === true} onClick={() => set({ hasPackage: true })} title="Yes" icon={<Zap size={ICON} />} />
            <OptionTile selected={d.hasPackage === false} onClick={() => set({ hasPackage: false })} title="No package" icon={<Ban size={ICON} />} />
          </div>
          {d.hasPackage && (
            <label className="flex items-center gap-3 rounded-2xl border-2 border-brand bg-white px-5 py-4 focus-within:ring-4 focus-within:ring-brand-soft">
              <span className="text-4xl font-extrabold text-slate-400">£</span>
              <input
                autoFocus
                inputMode="decimal"
                value={d.pppw}
                onChange={(e) => set({ pppw: e.target.value.replace(/[^0-9.]/g, '') })}
                placeholder="25"
                aria-label="Package price in pounds per person per week"
                className="w-full bg-transparent text-4xl font-extrabold tracking-tight outline-none placeholder:text-slate-300"
              />
              <span className="shrink-0 text-lg font-medium text-slate-500">per person / week</span>
            </label>
          )}
        </div>
      ),
    },
    {
      title: 'Where is the house?',
      help: 'Pick an area or type your postcode.',
      body: (
        <div className="space-y-3">
          <input
            value={d.postcode}
            onChange={(e) => onPostcode(e.target.value)}
            placeholder="Postcode, e.g. DH1 4"
            aria-label="Postcode"
            className="h-14 w-full rounded-2xl border-2 border-line px-5 text-lg font-semibold uppercase outline-none placeholder:font-normal placeholder:normal-case placeholder:text-slate-400 focus:border-brand"
          />
          <div className="grid gap-3 sm:grid-cols-2">
            {AREAS.map((a) => (
              <OptionTile key={a.id} selected={d.area === a.id} onClick={() => set({ area: a.id })} title={a.label} caption={a.postcodes.join(' · ')} />
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
            <Minus size={28} />
          </StepperButton>
          <span className="w-24 text-center text-7xl font-extrabold tabular-nums tracking-tight" aria-live="polite">
            {d.people}
          </span>
          <StepperButton label="More people" disabled={d.people >= 10} onClick={() => set({ people: d.people + 1 })}>
            <Plus size={28} />
          </StepperButton>
        </div>
      ),
    },
    {
      title: 'How much water does the house use?',
      help: 'Think about a typical housemate.',
      body: (
        <div className="space-y-3">
          <OptionTile selected={d.water === 'low'} onClick={() => set({ water: 'low' })} title="Low" caption="Quick 4-minute showers" icon={<Droplet size={ICON} />} />
          <OptionTile selected={d.water === 'normal'} onClick={() => set({ water: 'normal' })} title="Normal" caption="A daily 8-minute shower" icon={<Droplets size={ICON} />} />
          <OptionTile selected={d.water === 'high'} onClick={() => set({ water: 'high' })} title="High" caption="5 days a week, 20-minute showers" icon={<ShowerHead size={ICON} />} />
        </div>
      ),
    },
    {
      title: 'How warm do you keep the house?',
      body: (
        <div className="space-y-3">
          <OptionTile selected={d.heating === 'allDay'} onClick={() => set({ heating: 'allDay' })} title="Warm and cozy" caption="T-shirt indoors in January · heating on most of the day" icon={<Sun size={ICON} />} />
          <OptionTile selected={d.heating === 'nights'} onClick={() => set({ heating: 'nights' })} title="Only when I'm really cold" caption="Hoodie first, heating in the evenings" icon={<Moon size={ICON} />} />
          <OptionTile selected={d.heating === 'coldMonths'} onClick={() => set({ heating: 'coldMonths' })} title="I could live in an igloo" caption="Three duvets · heating only in the coldest weeks" icon={<Snowflake size={ICON} />} />
        </div>
      ),
    },
    {
      title: 'Does the house have gas?',
      help: 'A gas boiler or hob. Not sure? Ask the landlord.',
      body: (
        <div className="grid gap-3 sm:grid-cols-2">
          <OptionTile selected={d.hasGas === true} onClick={() => set({ hasGas: true })} title="Yes" caption="Gas heating" icon={<Flame size={ICON} />} />
          <OptionTile selected={d.hasGas === false} onClick={() => set({ hasGas: false })} title="No" caption="Electric heating" icon={<Zap size={ICON} />} />
        </div>
      ),
    },
    {
      title: 'Anything else?',
      help: 'Tap all that apply.',
      body: (
        <div className="grid gap-3 sm:grid-cols-2">
          <OptionTile selected={d.wifi} onClick={() => set({ wifi: !d.wifi })} title="Wi-Fi" icon={<Wifi size={ICON} />} />
          <OptionTile selected={d.tvLicence} onClick={() => set({ tvLicence: !d.tvLicence })} title="TV licence" caption="Live TV or iPlayer" icon={<Tv size={ICON} />} />
        </div>
      ),
    },
  ]
  const current = steps[step]

  return (
    <div className="mx-auto w-full max-w-2xl px-6 py-10">
      <div className="mb-10 flex items-center gap-4">
        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-100" role="progressbar" aria-valuemin={1} aria-valuemax={TOTAL} aria-valuenow={step + 1}>
          <div className="h-full rounded-full bg-brand transition-all duration-300" style={{ width: `${((step + 1) / TOTAL) * 100}%` }} />
        </div>
        <span className="shrink-0 text-sm font-semibold text-slate-500 tabular-nums">
          {step + 1} of {TOTAL}
        </span>
      </div>

      <h1 className="text-4xl font-extrabold tracking-tight">{current.title}</h1>
      <p className={cx('mt-2 text-lg text-slate-500', !current.help && 'invisible')}>{current.help ?? '·'}</p>

      <div className="mt-8 min-h-64">{current.body}</div>

      <div className="mt-10 flex items-center justify-between gap-4">
        {step === 0 ? (
          <Link to="/" className="inline-flex h-14 items-center gap-2 rounded-2xl px-4 text-lg font-semibold text-slate-600 hover:bg-slate-100 hover:text-slate-900">
            <ArrowLeft size={20} /> Home
          </Link>
        ) : (
          <Button data-nav variant="ghost" onClick={() => setStep(step - 1)}>
            <ArrowLeft size={20} /> Back
          </Button>
        )}
        <Button data-nav onClick={next} disabled={!answered}>
          {step === TOTAL - 1 ? 'See my estimate' : 'Next'} <ArrowRight size={20} />
        </Button>
      </div>

      {step === 0 && !demoMode && (
        <div className="mt-8 text-center">
          <button data-nav type="button" onClick={onDemo} className="text-sm font-medium text-slate-400 underline-offset-4 hover:text-slate-900 hover:underline">
            Use demo answers
          </button>
        </div>
      )}
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
      className="flex h-16 w-16 items-center justify-center rounded-full border-2 border-line text-slate-900 transition hover:border-brand hover:bg-brand-soft disabled:cursor-not-allowed disabled:opacity-30"
    >
      {children}
    </button>
  )
}
