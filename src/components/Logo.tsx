import { useId } from 'react'
import type { ReactNode } from 'react'

/** Silver fill used by the lobby art: bright at the top, cooler at the bottom, like brushed metal. */
function Silver({ id }: { id: string }) {
  return (
    <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stopColor="#F6FCFC" />
      <stop offset="0.55" stopColor="#D3E2E3" />
      <stop offset="1" stopColor="#A7C1C2" />
    </linearGradient>
  )
}

/** RentReady mark: a house with a chimney, and a tick sweeping out through the roof. `silver` swaps currentColor for the metal fill. */
export function LogoMark({ size = 32, silver, className }: { size?: number; silver?: boolean; className?: string }) {
  const id = useId()
  const paint = silver ? `url(#${id})` : 'currentColor'
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none" stroke={paint} strokeWidth={4.6} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className={className}>
      {silver && (
        <defs>
          <Silver id={id} />
          <radialGradient id={`${id}-shine`}>
            <stop offset="0" stopColor="#FFFFFF" stopOpacity="0.9" />
            <stop offset="1" stopColor="#FFFFFF" stopOpacity="0" />
          </radialGradient>
        </defs>
      )}
      <path d="M6.8 31 30 9l9.8 9.6V11.8h5.8v9.7" />
      <path d="M45.6 33 51.4 27.3 59.2 35" />
      <path d="M51.4 27.3v18.3a4 4 0 0 1-4 4H18.6a4 4 0 0 1-4-4V31" />
      <path d="M21.3 34 31 43.8" />
      <path d="M29 41.9 56.6 15.5 57.8 16.5 33 45.7Z" fill={paint} strokeWidth={1.2} />
      {silver && <ellipse cx="33" cy="49.6" rx="13" ry="2.6" fill={`url(#${id}-shine)`} stroke="none" />}
    </svg>
  )
}

/** Line icons for the Home buttons, drawn in the same silver as the mark. */
function SilverLine({ size, children }: { size: number; children: ReactNode }) {
  const id = useId()
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none" stroke={`url(#${id})`} strokeWidth={3.4} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <defs><Silver id={id} /></defs>
      {children}
    </svg>
  )
}

/** Key, head top right (Moving in). */
export function KeyGlyph({ size = 46 }: { size?: number }) {
  return (
    <SilverLine size={size}>
      <circle cx="42" cy="22" r="11" />
      <circle cx="45" cy="19" r="2.5" />
      <path d="M34 30 12 52M18 46l5 5M24 40l4 4" />
    </SilverLine>
  )
}

/** Box with an arrow leaving it (Moving out). */
export function BoxOutGlyph({ size = 46 }: { size?: number }) {
  return (
    <SilverLine size={size}>
      <path d="M12 32 32 40l20-8M12 32v18l20 8 20-8V32M32 40v18" />
      <path d="M12 32 20 25M52 32l-8-7" />
      <path d="M32 31V6M24 14l8-8 8 8" />
    </SilverLine>
  )
}
