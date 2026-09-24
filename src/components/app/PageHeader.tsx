import type { ReactNode } from 'react'

/**
 * The header every signed-in page opens with: a small uppercase label, then a
 * large display-font title, then an optional description. It's the dashboard's
 * header pulled out so LaunchPad, Practice, Feedback and the rest read as one
 * product instead of each page choosing its own heading size and style.
 *
 * Cards below it carry on the same voice — the small uppercase label
 * (`text-[11px] font-semibold uppercase tracking-[0.16em] text-brand-700`)
 * over a display-font value.
 */
export function PageHeader({
  eyebrow,
  title,
  description,
  leading,
  badge,
  actions,
  className = 'mb-6',
}: {
  /** Small uppercase label above the title — the section the page belongs to. */
  eyebrow: string
  title: ReactNode
  description?: ReactNode
  /** An icon or avatar sitting to the left of the whole header. */
  leading?: ReactNode
  /** A pill next to the title, e.g. "Unlocked". */
  badge?: ReactNode
  /** Controls aligned to the right of the header (buttons, filters). */
  actions?: ReactNode
  className?: string
}) {
  return (
    <header className={`rise-in flex flex-wrap items-end justify-between gap-x-4 gap-y-3 ${className}`}>
      <div className="flex min-w-0 items-start gap-3.5">
        {leading}
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-brand-700">{eyebrow}</p>
          <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1">
            <h1 className="font-display text-3xl font-semibold leading-tight tracking-tight text-ink-900 sm:text-4xl">
              {title}
            </h1>
            {badge}
          </div>
          {description && (
            <div className="mt-2 max-w-2xl text-sm leading-relaxed text-ink-600">{description}</div>
          )}
        </div>
      </div>
      {actions}
    </header>
  )
}
