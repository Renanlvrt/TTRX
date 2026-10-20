// Shared UI kit (docs/design/DESIGN-SYSTEM.md). Every page builds from these so the whole app reskins from one file.
//
// Component API
//   Page({ title, subtitle?, back?, backLabel?, actions?, actionBar?, wide?, children })
//       Screen frame: back chevron with the parent's name, 24px title, muted subtitle, content column (560px, `wide` = 768px).
//       `actionBar` renders a StickyActionBar and pads the content so nothing hides under it. Sets document.title.
//   Section({ title, caption?, action?, children })      18px heading block with 32px above, 12px below.
//   ListGroup({ children, className? })                    One white container, 12px radius, rows divided by `line`.
//   ListRow({ to?, href?, onClick?, icon?, label, caption?, value?, valueTone?, status?, chevron?, tone?, title? })
//       56px row. `to` = app link, `href` = external link (new tab), `onClick` = button. Value is right-aligned and tabular.
//   Figure({ label, value, caption?, tone?, countUpTo?, format? })
//       The one key number per screen, 40px tabular. `countUpTo` + `format` animate 0 to the value once (600ms),
//       skipped under prefers-reduced-motion.
//   Button({ variant: primary|secondary|ghost|tertiary, size: md|lg, block? }) and ButtonLink({ to, variant, block? })
//   StickyActionBar({ children, caption? })                Fixed above the tab bar on phones, at the bottom on desktop.
//   BottomSheet({ open, onClose, title, children })        Slides up, traps focus, Escape closes, focus returns to trigger.
//   Notice({ tone: warning|info|positive|negative, title?, children })   One per screen at most. No side stripe.
//   OptionGroup({ label, children }) + OptionTile({ selected, onClick, title, caption?, icon?, radio? })
//   Segmented({ label, options: { value, label }[], value, onChange })
//   Stepper({ value, onDecrement, onIncrement, decrementLabel, incrementLabel, min?, max?, unit? })
//   TextField({ label, prefix?, suffix?, hint?, error?, ...input props })   48px, 16px text, field-border.
//   ProgressBar({ value, max, label })                    4px Palatinate bar on canvas-strong.
//   Status / StatusBadge({ status })                     Words plus icon, no pill.
//   TabBar({ items: { to, label, icon, active }[] })     Bottom navigation, phones only.
//   Card({ highlight? }), Stat, Fine, cx, gbp, inputClass kept for pages not yet moved over.
import { useEffect, useId, useRef, useState } from 'react'
import type { ButtonHTMLAttributes, InputHTMLAttributes, KeyboardEvent, ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { Link, useLocation } from 'react-router-dom'
import { AlertTriangle, Check, CheckCircle2, ChevronLeft, ChevronRight, Circle, CircleDashed, Info, Minus, Plus, X, XCircle } from 'lucide-react'
import type { TaskStatus } from '../lib/types'

export function cx(...c: (string | false | null | undefined)[]) {
  return c.filter(Boolean).join(' ')
}

/** Formats £ with no pence above £100, pence below. */
export function gbp(n: number) {
  return '£' + (Math.abs(n) >= 100 ? Math.round(n).toLocaleString('en-GB') : n.toFixed(2))
}

/** Shared input look: 48px, 16px text (stops iOS zoom), 3.7:1 border, Palatinate focus ring. */
export const inputClass =
  'h-12 w-full rounded-[10px] border border-field-border bg-white px-3.5 text-base text-ink placeholder:text-subtle focus:outline-2 focus:outline-offset-2 focus:outline-brand'

// ---------- Buttons ----------

type Variant = 'primary' | 'secondary' | 'ghost' | 'tertiary'

function buttonClass(variant: Variant, size: 'md' | 'lg', block?: boolean) {
  return cx(
    'press inline-flex select-none items-center justify-center gap-2 rounded-[10px] text-base font-semibold disabled:cursor-not-allowed disabled:opacity-40',
    size === 'lg' ? 'min-h-12 px-5' : 'min-h-11 px-4',
    block && 'w-full',
    variant === 'primary' && 'bg-brand text-white hover:bg-brand-hover active:bg-brand-deep',
    variant === 'secondary' && 'border border-field-border bg-white text-ink hover:bg-canvas',
    variant === 'ghost' && 'text-muted hover:bg-canvas hover:text-ink',
    variant === 'tertiary' && 'px-2 text-brand hover:text-brand-hover',
  )
}

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; size?: 'md' | 'lg'; block?: boolean }

export function Button({ variant = 'primary', size = 'lg', block, className, type = 'button', ...rest }: ButtonProps) {
  return <button type={type} {...rest} className={cx(buttonClass(variant, size, block), className)} />
}

/** Same look as Button, for navigation. */
export function ButtonLink({ to, children, variant = 'primary', block, className }: { to: string; children: ReactNode; variant?: Variant; block?: boolean; className?: string }) {
  return (
    <Link to={to} className={cx(buttonClass(variant, 'lg', block), className)}>
      {children}
    </Link>
  )
}

// ---------- Screen frame ----------

const PARENT: Record<string, { to: string; label: string }> = {
  'move-in': { to: '/move-in', label: 'Moving in' },
  'move-out': { to: '/move-out', label: 'Moving out' },
}

/** Page frame: back chevron with the parent's name, title, one-line subtitle, content, optional sticky action. */
export function Page({
  title,
  subtitle,
  back,
  backLabel,
  actions,
  actionBar,
  wide,
  children,
}: {
  title: string
  subtitle?: ReactNode
  back?: string | null
  backLabel?: string
  actions?: ReactNode
  actionBar?: ReactNode
  wide?: boolean
  children: ReactNode
}) {
  const stage = useLocation().pathname.split('/')[1]
  const parent = PARENT[stage]
  if (back === undefined) back = parent ? parent.to : '/'
  const label = backLabel ?? (parent && back === parent.to ? parent.label : back === '/' ? 'Home' : 'Back')
  useEffect(() => {
    document.title = `${title} - RentReady`
    return () => {
      document.title = 'RentReady'
    }
  }, [title])
  return (
    <div className={cx('mx-auto w-full px-4 pt-4 sm:px-6 sm:pt-8', wide ? 'max-w-3xl' : 'max-w-[560px]', actionBar ? 'pb-32' : 'pb-12')}>
      {back && (
        <Link to={back} className="no-print -ml-2 mb-2 inline-flex min-h-11 items-center gap-1 rounded-lg pr-3 pl-1 text-base font-medium text-muted hover:text-ink">
          <ChevronLeft size={22} strokeWidth={1.75} aria-hidden /> {label}
        </Link>
      )}
      <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-2xl leading-[30px] font-semibold tracking-[-0.01em]">{title}</h1>
          {subtitle && <p className="mt-1 text-base text-muted">{subtitle}</p>}
        </div>
        {actions && <div className="no-print flex gap-2">{actions}</div>}
      </div>
      {children}
      {actionBar && <StickyActionBar>{actionBar}</StickyActionBar>}
    </div>
  )
}

export function Section({ title, caption, action, children, className }: { title: string; caption?: ReactNode; action?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section className={cx('mt-8 first:mt-0', className)}>
      <div className="mb-3 flex items-end justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-lg leading-6 font-semibold">{title}</h2>
          {caption && <p className="mt-0.5 text-sm text-muted">{caption}</p>}
        </div>
        {action}
      </div>
      {children}
    </section>
  )
}

// ---------- Lists ----------

export function ListGroup({ children, className }: { children: ReactNode; className?: string }) {
  return <ul className={cx('divide-y divide-line overflow-hidden rounded-xl border border-line bg-white', className)}>{children}</ul>
}

type Tone = 'ink' | 'brand' | 'positive' | 'negative' | 'warning' | 'muted'
const TONE_TEXT: Record<Tone, string> = {
  ink: 'text-ink',
  brand: 'text-brand',
  positive: 'text-positive',
  negative: 'text-negative',
  warning: 'text-warning',
  muted: 'text-muted',
}

export function ListRow({
  to,
  href,
  onClick,
  icon,
  label,
  caption,
  value,
  valueCaption,
  valueTone = 'ink',
  status,
  chevron,
  tone,
  title,
  large,
}: {
  to?: string
  href?: string
  onClick?: () => void
  icon?: ReactNode
  label: ReactNode
  caption?: ReactNode
  value?: ReactNode
  valueCaption?: ReactNode
  valueTone?: Tone
  status?: TaskStatus
  chevron?: boolean
  tone?: 'negative' | 'positive' | 'brand'
  title?: string
  large?: boolean
}) {
  const interactive = Boolean(to || href || onClick)
  const showChevron = chevron ?? interactive
  const inner = (
    <>
      {icon && (
        <span aria-hidden className={cx('flex shrink-0 items-center justify-center', large ? 'h-10 w-10 rounded-[10px] bg-canvas' : 'w-6', tone === 'brand' ? 'text-brand' : tone === 'negative' ? 'text-negative' : 'text-muted')}>
          {icon}
        </span>
      )}
      <span className="min-w-0 flex-1">
        <span className="flex items-baseline justify-between gap-2">
          <span className={cx('min-w-0 truncate', large ? 'text-lg font-semibold' : 'text-base')} title={title}>{label}</span>
          {status && <Status status={status} />}
        </span>
        {caption && <span className="mt-0.5 block text-[13px] leading-[18px] text-subtle">{caption}</span>}
      </span>
      {value !== undefined && (
        <span className="flex shrink-0 flex-col items-end text-right">
          <span className={cx('whitespace-nowrap text-sm font-medium tabular-nums', TONE_TEXT[valueTone])}>{value}</span>
          {valueCaption && <span className="mt-0.5 text-[13px] leading-[18px] text-subtle tabular-nums">{valueCaption}</span>}
        </span>
      )}
      {showChevron && <ChevronRight aria-hidden size={20} strokeWidth={1.75} className="shrink-0 text-subtle" />}
    </>
  )
  const rowClass = cx(
    'flex w-full items-center gap-3 px-4 text-left',
    large ? 'min-h-[72px] py-3' : 'min-h-14 py-2.5',
    tone === 'negative' && 'bg-negative-soft',
    tone === 'positive' && 'bg-positive-soft',
    interactive && 'transition-colors duration-150 hover:bg-canvas active:bg-canvas-strong',
  )
  return (
    <li>
      {to ? (
        <Link to={to} className={rowClass}>{inner}</Link>
      ) : href ? (
        <a href={href} target="_blank" rel="noreferrer" className={rowClass}>{inner}</a>
      ) : onClick ? (
        <button type="button" onClick={onClick} className={rowClass}>{inner}</button>
      ) : (
        <div className={rowClass}>{inner}</div>
      )}
    </li>
  )
}

// ---------- Figures ----------

function prefersReducedMotion() {
  return typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
}

/** Counts 0 to `target` once over `ms`, ease-out. Returns the target at once under reduced motion. */
function useCountUp(target: number | undefined, ms = 600) {
  const [v, setV] = useState(() => (target === undefined || prefersReducedMotion() ? target : 0))
  useEffect(() => {
    if (target === undefined) return
    if (prefersReducedMotion()) {
      setV(target)
      return
    }
    let raf = 0
    const t0 = performance.now()
    const tick = (t: number) => {
      const k = Math.min(1, (t - t0) / ms)
      setV(target * (1 - Math.pow(1 - k, 3)))
      if (k < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [target, ms])
  return v
}

export function Figure({
  label,
  value,
  caption,
  tone = 'brand',
  countUpTo,
  format,
  className,
}: {
  label: ReactNode
  value?: ReactNode
  caption?: ReactNode
  tone?: Tone
  countUpTo?: number
  format?: (n: number) => string
  className?: string
}) {
  const n = useCountUp(countUpTo)
  const shown = countUpTo !== undefined && format ? format(n ?? countUpTo) : value
  const final = countUpTo !== undefined && format ? format(countUpTo) : undefined
  return (
    <div className={className}>
      <p className="text-sm font-medium text-muted">{label}</p>
      <p className={cx('mt-1 text-[40px] leading-[44px] font-semibold tracking-[-0.02em] tabular-nums', TONE_TEXT[tone])}>
        <span aria-hidden={final !== undefined}>{shown}</span>
        {final !== undefined && <span className="sr-only">{final}</span>}
      </p>
      {caption && <p className="mt-1 text-base text-muted">{caption}</p>}
    </div>
  )
}

// ---------- Floating surfaces ----------

/** Full-width primary action in the thumb zone, above the tab bar. */
export function StickyActionBar({ children, caption }: { children: ReactNode; caption?: ReactNode }) {
  return (
    <div className="no-print float-bar bottom-tabbar fixed inset-x-0 z-30 bg-white">
      <div className="mx-auto w-full max-w-[560px] px-4 py-3 sm:px-6">
        {caption && <p className="mb-2 text-center text-[13px] leading-[18px] text-subtle">{caption}</p>}
        <div className="flex gap-2 [&>*]:flex-1">{children}</div>
      </div>
    </div>
  )
}

const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'

export function BottomSheet({ open, onClose, title, children }: { open: boolean; onClose: () => void; title: string; children: ReactNode }) {
  const [mounted, setMounted] = useState(open)
  const [shown, setShown] = useState(false)
  const panel = useRef<HTMLDivElement>(null)
  const returnTo = useRef<HTMLElement | null>(null)
  const titleId = useId()

  useEffect(() => {
    if (open) {
      returnTo.current = document.activeElement as HTMLElement | null
      setMounted(true)
      const raf = requestAnimationFrame(() => requestAnimationFrame(() => setShown(true)))
      return () => cancelAnimationFrame(raf)
    }
    setShown(false)
    const t = window.setTimeout(() => setMounted(false), 200)
    returnTo.current?.focus?.()
    return () => window.clearTimeout(t)
  }, [open])

  useEffect(() => {
    if (!shown) return
    panel.current?.focus()
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [shown])

  if (!mounted) return null
  const onKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      e.stopPropagation()
      onClose()
      return
    }
    if (e.key !== 'Tab' || !panel.current) return
    const items = Array.from(panel.current.querySelectorAll<HTMLElement>(FOCUSABLE))
    if (items.length === 0) return
    const first = items[0]
    const last = items[items.length - 1]
    if (e.shiftKey && (document.activeElement === first || document.activeElement === panel.current)) {
      e.preventDefault()
      last.focus()
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault()
      first.focus()
    }
  }
  return createPortal(
    <div className="fixed inset-0 z-50" onKeyDown={onKeyDown}>
      <div className="sheet-backdrop absolute inset-0" data-open={shown} onClick={onClose} aria-hidden />
      <div
        ref={panel}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        data-open={shown}
        className="sheet-panel absolute inset-x-0 bottom-0 mx-auto flex max-h-[85dvh] w-full max-w-[560px] flex-col rounded-t-2xl bg-white focus:outline-none"
      >
        <div aria-hidden className="mx-auto mt-2 h-1 w-9 shrink-0 rounded-full bg-canvas-strong" />
        <div className="flex shrink-0 items-center justify-between gap-3 px-4 pt-2 pb-2">
          <h2 id={titleId} className="text-lg font-semibold">{title}</h2>
          <button type="button" onClick={onClose} aria-label="Close" className="press -mr-2 flex h-11 w-11 items-center justify-center rounded-full text-muted hover:bg-canvas">
            <X size={22} strokeWidth={1.75} aria-hidden />
          </button>
        </div>
        <div className="pb-safe min-h-0 overflow-y-auto overscroll-contain px-4 pb-6">{children}</div>
      </div>
    </div>,
    document.body,
  )
}

// ---------- Messages ----------

const NOTICE: Record<'warning' | 'info' | 'positive' | 'negative', { box: string; icon: ReactNode }> = {
  warning: { box: 'bg-warning-soft text-warning', icon: <AlertTriangle size={20} strokeWidth={1.75} /> },
  info: { box: 'bg-canvas text-ink', icon: <Info size={20} strokeWidth={1.75} className="text-muted" /> },
  positive: { box: 'bg-positive-soft text-positive', icon: <CheckCircle2 size={20} strokeWidth={1.75} /> },
  negative: { box: 'bg-negative-soft text-negative', icon: <XCircle size={20} strokeWidth={1.75} /> },
}

export function Notice({ tone = 'warning', title, children, className }: { tone?: keyof typeof NOTICE; title?: ReactNode; children?: ReactNode; className?: string }) {
  const n = NOTICE[tone]
  return (
    <div role={tone === 'negative' ? 'alert' : 'status'} className={cx('flex gap-3 rounded-xl px-4 py-3', n.box, className)}>
      <span aria-hidden className="mt-0.5 shrink-0">{n.icon}</span>
      <div className="min-w-0 text-base">
        {title && <p className="font-semibold">{title}</p>}
        {children && <div className={cx(title ? 'mt-0.5' : false, tone === 'info' ? 'text-muted' : 'text-ink')}>{children}</div>}
      </div>
    </div>
  )
}

// ---------- Inputs ----------

export function OptionGroup({ label, children, className }: { label: string; children: ReactNode; className?: string }) {
  return (
    <div role="radiogroup" aria-label={label} className={cx('grid gap-2', className)}>
      {children}
    </div>
  )
}

/** Full-width answer row for surveys and pickers. `radio` gives it radio semantics inside an OptionGroup. */
export function OptionTile({ selected, onClick, title, caption, icon, radio }: { selected: boolean; onClick: () => void; title: string; caption?: string; icon?: ReactNode; radio?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      {...(radio ? { role: 'radio', 'aria-checked': selected } : { 'aria-pressed': selected })}
      className={cx(
        'press flex min-h-14 w-full items-center gap-3 rounded-[10px] px-4 py-3 text-left',
        selected ? 'border-2 border-brand-tint bg-brand-soft' : 'border border-field-border bg-white hover:bg-canvas',
      )}
    >
      {icon && <span aria-hidden className={cx('shrink-0', selected ? 'text-brand' : 'text-muted')}>{icon}</span>}
      <span className="min-w-0 flex-1">
        <span className="block text-base font-medium">{title}</span>
        {caption && <span className="mt-0.5 block text-[13px] leading-[18px] text-subtle">{caption}</span>}
      </span>
      <span aria-hidden className="flex h-6 w-6 shrink-0 items-center justify-center text-brand">
        {selected && <Check size={20} strokeWidth={2.25} />}
      </span>
    </button>
  )
}

export function Segmented<T extends string>({ label, options, value, onChange }: { label: string; options: { value: T; label: string }[]; value: T | null; onChange: (v: T) => void }) {
  return (
    <div role="radiogroup" aria-label={label} className="grid auto-cols-fr grid-flow-col gap-1 rounded-xl bg-canvas p-1">
      {options.map((o) => {
        const on = o.value === value
        return (
          <button
            key={o.value}
            type="button"
            role="radio"
            aria-checked={on}
            onClick={() => onChange(o.value)}
            className={cx('press min-h-11 rounded-[10px] px-3 text-sm font-medium', on ? 'bg-white text-brand shadow-[0_0_0_1px_var(--color-line)]' : 'text-muted hover:text-ink')}
          >
            {o.label}
          </button>
        )
      })}
    </div>
  )
}

export function Stepper({
  value,
  onDecrement,
  onIncrement,
  decrementLabel,
  incrementLabel,
  min = 0,
  max = Infinity,
  unit,
}: {
  value: number
  onDecrement: () => void
  onIncrement: () => void
  decrementLabel: string
  incrementLabel: string
  min?: number
  max?: number
  unit?: string
}) {
  const btn = 'press flex h-11 w-11 items-center justify-center rounded-[10px] border border-field-border bg-white text-ink hover:bg-canvas disabled:opacity-40'
  return (
    <div className="flex items-center gap-2">
      <button type="button" aria-label={decrementLabel} onClick={onDecrement} disabled={value <= min} className={btn}>
        <Minus size={20} strokeWidth={1.75} aria-hidden />
      </button>
      <span aria-live="polite" className="min-w-10 text-center text-lg font-semibold tabular-nums">
        {value}
        {unit && <span className="sr-only"> {unit}</span>}
      </span>
      <button type="button" aria-label={incrementLabel} onClick={onIncrement} disabled={value >= max} className={btn}>
        <Plus size={20} strokeWidth={1.75} aria-hidden />
      </button>
    </div>
  )
}

export function TextField({
  label,
  prefix,
  suffix,
  hint,
  error,
  id,
  className,
  ...rest
}: InputHTMLAttributes<HTMLInputElement> & { label: string; prefix?: string; suffix?: string; hint?: ReactNode; error?: ReactNode }) {
  const auto = useId()
  const fieldId = id ?? auto
  const hintId = `${fieldId}-hint`
  const errId = `${fieldId}-err`
  return (
    <div className={className}>
      <label htmlFor={fieldId} className="mb-1.5 block text-sm font-medium">{label}</label>
      <div className="flex items-center gap-2">
        <div className="relative min-w-0 flex-1">
          {prefix && <span aria-hidden className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-base text-muted">{prefix}</span>}
          <input
            id={fieldId}
            aria-invalid={error ? true : undefined}
            aria-describedby={cx(hint ? hintId : false, error ? errId : false) || undefined}
            {...rest}
            className={cx(inputClass, prefix ? 'pl-8' : false, error ? 'border-negative' : false)}
          />
        </div>
        {suffix && <span className="shrink-0 text-sm text-muted">{suffix}</span>}
      </div>
      {hint && <p id={hintId} className="mt-1.5 text-[13px] leading-[18px] text-subtle">{hint}</p>}
      {error && (
        <p id={errId} className="mt-1.5 flex items-center gap-1.5 text-sm text-negative">
          <XCircle size={16} strokeWidth={1.75} aria-hidden /> {error}
        </p>
      )}
    </div>
  )
}

export function ProgressBar({ value, max, label }: { value: number; max: number; label: string }) {
  const ratio = max > 0 ? Math.min(1, Math.max(0, value / max)) : 0
  return (
    <div role="progressbar" aria-label={label} aria-valuemin={0} aria-valuemax={max} aria-valuenow={value} className="h-1 w-full overflow-hidden rounded-full bg-canvas-strong">
      <div className="progress-fill h-full w-full bg-brand" style={{ transform: `scaleX(${ratio})` }} />
    </div>
  )
}

// ---------- Status ----------

const STATUS: Record<TaskStatus, { label: string; cls: string; icon: ReactNode }> = {
  notStarted: { label: 'To do', cls: 'text-subtle', icon: <Circle size={16} strokeWidth={1.75} /> },
  inProgress: { label: 'Started', cls: 'text-warning', icon: <CircleDashed size={16} strokeWidth={1.75} /> },
  done: { label: 'Done', cls: 'text-positive', icon: <CheckCircle2 size={16} strokeWidth={1.75} /> },
}

export function Status({ status }: { status: TaskStatus }) {
  const s = STATUS[status]
  return (
    <span className={cx('inline-flex shrink-0 items-center gap-1 self-center whitespace-nowrap text-sm font-medium', s.cls)}>
      <span aria-hidden>{s.icon}</span>
      {s.label}
    </span>
  )
}

/** Kept for existing call sites; renders the same words-plus-icon status. */
export function StatusBadge({ status }: { status: TaskStatus }) {
  return <Status status={status} />
}

// ---------- Navigation ----------

export function TabBar({ items }: { items: { to: string; label: string; icon: ReactNode; active: boolean }[] }) {
  return (
    <nav aria-label="Main" className="no-print float-bar pb-safe fixed inset-x-0 bottom-0 z-40 bg-white sm:hidden">
      <ul className="mx-auto grid h-14 max-w-[560px] grid-cols-3">
        {items.map((t) => (
          <li key={t.to}>
            <Link
              to={t.to}
              aria-current={t.active ? 'page' : undefined}
              className={cx('press flex h-full flex-col items-center justify-center gap-0.5 text-xs', t.active ? 'font-semibold text-brand' : 'font-medium text-subtle')}
            >
              <span aria-hidden>{t.icon}</span>
              {t.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  )
}

// ---------- Legacy pieces (pages move off these as they are redesigned) ----------

export function Card({ children, className, highlight }: { children: ReactNode; className?: string; highlight?: boolean }) {
  return <div className={cx('rounded-xl p-4 sm:p-5', highlight ? 'bg-canvas' : 'border border-line bg-white', className)}>{children}</div>
}

/** Big number with a label. `highlight` sets the value in Palatinate. */
export function Stat({ label, value, sub, highlight }: { label: string; value: string; sub?: string; highlight?: boolean }) {
  return (
    <div className="rounded-xl border border-line bg-white p-4">
      <div className="text-sm font-medium text-muted">{label}</div>
      <div className={cx('mt-1 text-[32px] leading-9 font-semibold tracking-[-0.02em] tabular-nums', highlight ? 'text-brand' : 'text-ink')}>{value}</div>
      {sub && <div className="mt-0.5 text-sm text-muted">{sub}</div>}
    </div>
  )
}

/** Small print for assumptions, disclaimers and sources. */
export function Fine({ children, className }: { children: ReactNode; className?: string }) {
  return <p className={cx('text-[13px] leading-[18px] text-subtle', className)}>{children}</p>
}
