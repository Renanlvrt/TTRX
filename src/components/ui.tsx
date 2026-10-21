// Shared UI kit. Every page builds from these so the whole app reskins from one file.
// Style rules: teal gradient ground, frosted glass cards, white text, silver-mint actions, pale gold highlights.
import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { Link, useLocation } from 'react-router-dom'
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
        'inline-flex items-center justify-center gap-2 rounded-md font-semibold tracking-[0.01em] transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand disabled:cursor-not-allowed disabled:opacity-40',
        size === 'lg' ? 'h-13 px-7 text-base' : 'h-11 px-5 text-base',
        variant === 'primary' && 'bg-brand text-on-brand hover:bg-brand-hover',
        variant === 'secondary' && 'border border-line-strong bg-card text-ink hover:border-brand hover:text-brand',
        variant === 'ghost' && 'text-muted hover:bg-canvas hover:text-ink',
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
        'inline-flex h-13 items-center justify-center gap-2 rounded-md px-7 text-base font-semibold tracking-[0.01em] transition-colors',
        variant === 'primary' ? 'bg-brand text-on-brand hover:bg-brand-hover' : 'border border-line-strong bg-card text-ink hover:border-brand hover:text-brand',
        className,
      )}
    >
      {children}
    </Link>
  )
}

export function Card({ children, className, highlight }: { children: ReactNode; className?: string; highlight?: boolean }) {
  return (
    <div className={cx('rounded-md border p-6', highlight ? 'border-highlight-strong bg-highlight' : 'border-line bg-card', className)}>
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
        <Link to={back} className="no-print mb-6 inline-flex items-center gap-2 text-base font-medium text-muted hover:text-ink">
          Back
        </Link>
      )}
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-4xl font-semibold leading-tight text-ink md:text-[2.75rem]">{title}</h1>
          {subtitle && <p className="mt-3 text-lg text-muted">{subtitle}</p>}
        </div>
        {actions && <div className="no-print flex gap-3">{actions}</div>}
      </div>
      {children}
    </div>
  )
}

/** Large selectable tile for survey answers and pickers. */
export function OptionTile({ selected, onClick, title, caption }: { selected: boolean; onClick: () => void; title: string; caption?: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={cx(
        'flex w-full items-center gap-4 rounded-md border p-5 text-left transition-colors',
        selected ? 'border-brand bg-brand-soft ring-1 ring-brand' : 'border-line bg-card hover:border-line-strong',
      )}
    >
      <span className="flex-1">
        <span className="block text-lg font-semibold">{title}</span>
        {caption && <span className="mt-0.5 block text-sm text-muted">{caption}</span>}
      </span>
      <span className={cx('flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2', selected ? 'border-brand bg-brand text-on-brand' : 'border-line-strong')}>
        {selected && <span className="h-2.5 w-2.5 rounded-full bg-on-brand" />}
      </span>
    </button>
  )
}

/** Big number with a label. `highlight` puts it on pale gold. */
export function Stat({ label, value, sub, highlight }: { label: string; value: string; sub?: string; highlight?: boolean }) {
  return (
    <div className={cx('rounded-md border p-6', highlight ? 'border-highlight-strong bg-highlight' : 'border-line bg-card')}>
      <div className="text-sm font-semibold text-muted">{label}</div>
      <div className="mt-2 font-display text-4xl font-semibold tabular-nums">{value}</div>
      {sub && <div className="mt-1 text-base text-muted">{sub}</div>}
    </div>
  )
}

const STATUS: Record<TaskStatus, { label: string; cls: string }> = {
  notStarted: { label: 'Not started', cls: 'border-line bg-canvas text-muted' },
  inProgress: { label: 'In progress', cls: 'border-highlight-strong bg-highlight text-ink' },
  done: { label: 'Done', cls: 'border-brand-tint bg-brand-soft text-brand' },
}

export function StatusBadge({ status }: { status: TaskStatus }) {
  const s = STATUS[status]
  return <span className={cx('inline-flex shrink-0 items-center gap-1 whitespace-nowrap rounded-sm border px-2 py-0.5 text-xs font-semibold', s.cls)}>{s.label}</span>
}

/** Small print for assumptions, disclaimers and sources. */
export function Fine({ children, className }: { children: ReactNode; className?: string }) {
  return <p className={cx('text-sm leading-relaxed text-muted', className)}>{children}</p>
}

/** Formats £ with no pence above £100, pence below. */
export function gbp(n: number) {
  return '£' + (Math.abs(n) >= 100 ? Math.round(n).toLocaleString('en-GB') : n.toFixed(2))
}
