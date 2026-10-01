import type { ReactNode } from 'react'
import { GlowOrb, GridBackdrop } from '@/components/landing/GridBackdrop'

/** The dark header the blog pages open with: the same wood-dark surface, grid
 *  and rings as the home and programme pages, so the blog reads as part of the
 *  same site. */
export function BlogHero({ children }: { children: ReactNode }) {
  return (
    <section className="surface-wood-dark relative overflow-hidden">
      <GridBackdrop mask="ellipse 75% 65% at 30% 20%" />
      <GlowOrb className="-left-20 top-10 h-64 w-64" color="rgba(143,133,238,0.16)" />
      <span aria-hidden className="pointer-events-none absolute -right-24 -top-24 opacity-[0.12]">
        <svg width="380" height="380" viewBox="0 0 200 200" fill="none" stroke="#f6e3c8" strokeWidth="1.2">
          <circle cx="100" cy="100" r="96" />
          <circle cx="100" cy="100" r="74" />
          <circle cx="100" cy="100" r="52" />
          <circle cx="100" cy="100" r="30" />
        </svg>
      </span>
      <div className="relative">{children}</div>
    </section>
  )
}
