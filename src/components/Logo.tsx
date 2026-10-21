/** RentReady mark: a house outline whose right wall becomes a tick. Drawn with currentColor, so it takes the text colour. */
export function LogoMark({ size = 32, className }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none" stroke="currentColor" strokeWidth={4.5} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className={className}>
      <path d="M8 30 32 9l24 21" />
      <path d="M43 18.6V11h7v13.7" />
      <path d="M15 25v28h34V38" />
      <path d="m23 37 8 8 19-22" />
    </svg>
  )
}
