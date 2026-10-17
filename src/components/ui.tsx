// Shared UI kit. Every page builds from these so the whole app reskins from one file.
// Style rules: white surfaces, green actions, pale-yellow highlights, big type, few elements.
import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { ArrowLeft, Check } from 'lucide-react'
import type { TaskStatus } from '../lib/types'

export function cx(...c: (string | false | null | undefined)[]) {
  return c.filter(Boolean).join(' ')
}

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary' | 'ghost'
  size?: 'md' | 'lg'
}

export function Button({ variant = 'primary', size = 'lg', className, ...rest }: ButtonProps) {
  return (
    <button
      {...rest}
      className={cx(
        'inline-flex items-center justify-center gap-2 rounded-2xl font-semibold transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand disabled:cursor-not-allowed disabled:opacity-40',
        size === 'lg' ? 'h-14 px-7 text-lg' : 'h-11 px-5 text-base',
        variant === 'primary' && 'bg-brand text-white hover:bg-brand-hover',
        variant === 'secondary' && 'border border-line bg-white text-slate-900 hover:border-slate-300 hover:bg-slate-50',
        variant === 'ghost' && 'text-slate-600 hover:bg-slate-100 hover:text-slate-900',
        className,
      )}
    />
  )
}

/** Same look as Button, for navigation. */
export function ButtonLink({ to, children, variant = 'primary', className }: { to: string; children: ReactNode; variant?: 'primary' | 'secondary'; className?: string }) {
  return (
    <Link
      to={to}
      className={cx(
        'inline-flex h-14 items-center justify-center gap-2 rounded-2xl px-7 text-lg font-semibold transition',
        variant === 'primary' ? 'bg-brand text-white hover:bg-brand-hover' : 'border border-line bg-white hover:bg-slate-50',
        className,
      )}
    >
      {children}
    </Link>
  )
}

export function Card({ children, className, highlight }: { children: ReactNode; className?: string; highlight?: boolean }) {
  return (
    <div className={cx('rounded-3xl border p-6', highlight ? 'border-highlight-strong bg-highlight' : 'border-line bg-white', className)}>
      {children}
    </div>
  )
}

/** Page frame: back link, big title, one-line subtitle, content. */
export function Page({ title, subtitle, back, actions, children }: { title: string; subtitle?: string; back?: string | null; actions?: ReactNode; children: ReactNode }) {
  // Default Back goes to the task's stage page (/move-in or /move-out).
  const stage = useLocation().pathname.split('/')[1]
  if (back === undefined) back = stage === 'move-in' || stage === 'move-out' ? `/${stage}` : '/'
  return (
    <div className="mx-auto w-full max-w-4xl px-6 py-10">
      {back && (
        <Link to={back} className="no-print mb-6 inline-flex items-center gap-2 text-base font-medium text-slate-500 hover:text-slate-900">
          <ArrowLeft size={18} /> Back
        </Link>
      )}
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight">{title}</h1>
          {subtitle && <p className="mt-2 text-lg text-slate-500">{subtitle}</p>}
        </div>
        {actions && <div className="no-print flex gap-3">{actions}</div>}
      </div>
      {children}
    </div>
  )
}

/** Large selectable tile for survey answers and pickers. */
export function OptionTile({ selected, onClick, title, caption, icon }: { selected: boolean; onClick: () => void; title: string; caption?: string; icon?: ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={cx(
        'flex w-full items-center gap-4 rounded-2xl border-2 p-5 text-left transition',
        selected ? 'border-brand bg-brand-soft' : 'border-line bg-white hover:border-slate-300',
      )}
    >
      {icon && <span className={cx('shrink-0', selected ? 'text-brand' : 'text-slate-400')}>{icon}</span>}
      <span className="flex-1">
        <span className="block text-lg font-semibold">{title}</span>
        {caption && <span className="mt-0.5 block text-sm text-slate-500">{caption}</span>}
      </span>
      <span className={cx('flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2', selected ? 'border-brand bg-brand text-white' : 'border-slate-300')}>
        {selected && <Check size={14} strokeWidth={3} />}
      </span>
    </button>
  )
}

/** Big number with a label. `highlight` puts it on pale yellow. */
export function Stat({ label, value, sub, highlight }: { label: string; value: string; sub?: string; highlight?: boolean }) {
  return (
    <div className={cx('rounded-3xl border p-6', highlight ? 'border-highlight-strong bg-highlight' : 'border-line bg-white')}>
      <div className="text-sm font-medium uppercase tracking-wide text-slate-500">{label}</div>
      <div className="mt-2 text-4xl font-extrabold tracking-tight">{value}</div>
      {sub && <div className="mt-1 text-base text-slate-500">{sub}</div>}
    </div>
  )
}

const STATUS: Record<TaskStatus, { label: string; cls: string }> = {
  notStarted: { label: 'Not started', cls: 'bg-slate-100 text-slate-600' },
  inProgress: { label: 'In progress', cls: 'bg-highlight text-slate-900' },
  done: { label: 'Done', cls: 'bg-brand-soft text-brand' },
}

export function StatusBadge({ status }: { status: TaskStatus }) {
  const s = STATUS[status]
  return <span className={cx('inline-flex items-center gap-1 rounded-full px-3 py-1 text-sm font-semibold', s.cls)}>{status === 'done' && <Check size={14} strokeWidth={3} />}{s.label}</span>
}

/** Small print for assumptions, disclaimers and sources. */
export function Fine({ children, className }: { children: ReactNode; className?: string }) {
  return <p className={cx('text-sm leading-relaxed text-slate-500', className)}>{children}</p>
}

/** Formats £ with no pence above £100, pence below. */
export function gbp(n: number) {
  return '£' + (Math.abs(n) >= 100 ? Math.round(n).toLocaleString('en-GB') : n.toFixed(2))
}
