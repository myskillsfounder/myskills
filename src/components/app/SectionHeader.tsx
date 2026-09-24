import type { ReactNode } from 'react'

/**
 * The header that opens a block of cards within a page: a small uppercase
 * label over a display-font title, with an optional description and
 * right-hand controls. It's the dashboard's "Skills in the age of AI" header
 * pulled out, so Practice and Feedback section headings read like the
 * dashboard's instead of a bare heading. PageHeader is the page-level
 * (h1) sibling; this one is h2.
 */
export function SectionHeader({
  eyebrow,
  title,
  description,
  actions,
  className = 'mb-4',
}: {
  eyebrow: string
  title: ReactNode
  description?: ReactNode
  actions?: ReactNode
  className?: string
}) {
  return (
    <div className={`flex flex-wrap items-end justify-between gap-x-4 gap-y-3 ${className}`}>
      <div className="min-w-0">
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-brand-700">{eyebrow}</p>
        <h2 className="mt-1 font-display text-2xl font-semibold tracking-tight text-ink-900">{title}</h2>
        {description && (
          <p className="mt-1 max-w-2xl text-sm leading-relaxed text-ink-600">{description}</p>
        )}
      </div>
      {actions}
    </div>
  )
}
