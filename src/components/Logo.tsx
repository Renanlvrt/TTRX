import { useId } from 'react'

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

/** Silver key, head top right (Moving in). */
export function KeyGlyph({ size = 54 }: { size?: number }) {
  const id = useId()
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden="true">
      <defs><Silver id={id} /></defs>
      <g transform="rotate(-45 32 32)" fill={`url(#${id})`}>
        <path fillRule="evenodd" d="M44 18a14 14 0 1 1 0 28 14 14 0 0 1 0-28Zm4 9.5a4.5 4.5 0 1 0 0 9 4.5 4.5 0 0 0 0-9Z" />
        <rect x="4" y="28" width="28" height="8" rx="2" />
        <rect x="7" y="34" width="6" height="9" rx="1.5" />
        <rect x="16" y="34" width="5" height="7" rx="1.5" />
      </g>
    </svg>
  )
}

/** Silver open box with an arrow leaving it (Moving out). */
export function BoxOutGlyph({ size = 54 }: { size?: number }) {
  const id = useId()
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden="true">
      <defs><Silver id={id} /></defs>
      <g fill={`url(#${id})`}>
        <path d="M12 30 32 22l20 8-20 8Z" opacity="0.45" />
        <path d="M12 30 32 38v22L12 52Z" />
        <path d="M52 30 32 38v22l20-8Z" opacity="0.78" />
        <path d="M12 30 32 38l-7 7-20-8Z" opacity="0.92" />
        <path d="M52 30 32 38l7 7 20-8Z" opacity="0.7" />
      </g>
      <path d="M31 27c0-9 5-15 14-15" fill="none" stroke={`url(#${id})`} strokeWidth="4.5" strokeLinecap="round" />
      <path d="m43 5 9 7-9 7Z" fill={`url(#${id})`} />
    </svg>
  )
}
