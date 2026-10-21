// Text box with up to four suggestions under it, picked by tap, arrow keys or Enter.
import { useId, useState } from 'react'
import { cx } from './ui'

export function SuggestInput({ label, value, onChange, onPick, suggestions, placeholder, autoFocus }: {
  label: string
  value: string
  onChange: (v: string) => void
  onPick: (v: string) => void
  suggestions: string[]
  placeholder?: string
  autoFocus?: boolean
}) {
  const id = useId()
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState(0)
  // Hide the list once the box already holds a suggestion exactly.
  const list = suggestions.some((s) => s.toLowerCase() === value.trim().toLowerCase()) ? [] : suggestions
  const shown = open && list.length > 0

  function pick(v: string) {
    onPick(v)
    setOpen(false)
  }

  return (
    <div className="relative">
      <label htmlFor={id} className="mb-2 block text-sm font-semibold text-muted">{label}</label>
      <input
        id={id}
        data-nav
        autoFocus={autoFocus}
        role="combobox"
        aria-expanded={shown}
        aria-controls={`${id}-list`}
        aria-autocomplete="list"
        aria-activedescendant={shown ? `${id}-${active}` : undefined}
        autoComplete="off"
        value={value}
        placeholder={placeholder}
        onChange={(e) => {
          onChange(e.target.value)
          setActive(0)
          setOpen(true)
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        onKeyDown={(e) => {
          if (!shown) return
          if (e.key === 'ArrowDown') { e.preventDefault(); setActive((a) => (a + 1) % list.length) }
          if (e.key === 'ArrowUp') { e.preventDefault(); setActive((a) => (a - 1 + list.length) % list.length) }
          if (e.key === 'Enter') { e.preventDefault(); pick(list[active]) }
          if (e.key === 'Escape') setOpen(false)
        }}
        className="h-14 w-full rounded-md border-2 border-field-border bg-card px-5 text-lg font-semibold text-ink outline-none placeholder:font-normal placeholder:text-subtle focus:border-brand focus:ring-2 focus:ring-brand focus:ring-offset-1"
      />
      {shown && (
        <ul id={`${id}-list`} role="listbox" className="suggest-list absolute inset-x-0 top-full z-20 mt-1 overflow-hidden rounded-md">
          {list.map((s, i) => (
            <li
              key={s}
              id={`${id}-${i}`}
              role="option"
              aria-selected={i === active}
              // mousedown keeps focus in the box so the blur does not close the list first
              onMouseDown={(e) => { e.preventDefault(); pick(s) }}
              className={cx('flex min-h-12 cursor-pointer items-center px-5 text-lg', i === active && 'bg-white/10')}
            >
              {s}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
