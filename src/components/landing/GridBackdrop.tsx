/**
 * The faint grid that says "this is a system, not a brochure" — used across
 * every AI-forward page's dark sections. One component instead of a
 * repeated inline style block per section, so the texture stays consistent
 * as more pages pick it up.
 */
export function GridBackdrop({
  mask = 'ellipse 75% 65% at 30% 20%',
  tone = 'dark',
  className = '',
}: {
  /** A CSS radial-gradient shape/position — where the grid fades in from. */
  mask?: string
  /** 'dark' for a dark surface (faint white lines), 'light' for a light one. */
  tone?: 'dark' | 'light'
  className?: string
}) {
  const line = tone === 'dark' ? 'rgba(255,255,255,0.06)' : 'rgba(27,24,21,0.04)'
  return (
    <span
      aria-hidden
      className={`pointer-events-none absolute inset-0 ${className}`}
      style={{
        backgroundImage: `linear-gradient(${line} 1px, transparent 1px), linear-gradient(90deg, ${line} 1px, transparent 1px)`,
        backgroundSize: '44px 44px',
        maskImage: `radial-gradient(${mask}, black 0%, transparent 75%)`,
        WebkitMaskImage: `radial-gradient(${mask}, black 0%, transparent 75%)`,
      }}
    />
  )
}

/** A soft, out-of-focus colour blob — the "depth" behind a dark section,
 *  never sharp enough to distract from the content in front of it. */
export function GlowOrb({
  className = '',
  color = 'rgba(143,133,238,0.24)',
}: {
  className?: string
  color?: string
}) {
  return (
    <span
      aria-hidden
      className={`pointer-events-none absolute rounded-full blur-3xl ${className}`}
      style={{ background: color }}
    />
  )
}
