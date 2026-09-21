import { Link } from '@tanstack/react-router'
import { ArrowRight, Sparkles } from 'lucide-react'
import { CAREER_READINESS } from '@/lib/programmes'

/**
 * Dashboard doorway to the Career Readiness Programme landing page. Dark, like the
 * NextStep hero, so it reads as a flagship programme rather than one more
 * feature tile — but compact, since it sits above the student's own
 * progress and shouldn't compete with it.
 */
export function ProgrammePromoCard() {
  return (
    <Link
      to={CAREER_READINESS.path}
      className="surface-wood-dark lift group relative flex flex-col gap-4 overflow-hidden rounded-2xl p-5 shadow-e2 sm:flex-row sm:items-center sm:gap-6 sm:p-6"
    >
      <span aria-hidden className="pointer-events-none absolute -right-10 -top-12 opacity-[0.14]">
        <svg width="180" height="180" viewBox="0 0 200 200" fill="none" stroke="#f6e3c8" strokeWidth="2">
          <circle cx="120" cy="80" r="76" />
          <circle cx="120" cy="80" r="52" />
          <circle cx="120" cy="80" r="28" />
        </svg>
      </span>

      <span className="relative flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white/10 text-white">
        <Sparkles size={26} />
      </span>

      <div className="relative min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-full bg-white/10 px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-white/80">
            New programme
          </span>
          <span className="text-[11px] font-medium uppercase tracking-[0.14em] text-white/50">
            {CAREER_READINESS.subtitle}
          </span>
        </div>
        <h2 className="mt-1.5 font-display text-xl font-semibold text-white sm:text-2xl">
          {CAREER_READINESS.name}
        </h2>
        <p className="mt-1 text-sm leading-relaxed text-white/70">
          Learn to use AI the way employers now expect — and leave with a portfolio that proves it.
        </p>
      </div>

      <span className="press relative inline-flex h-11 shrink-0 items-center gap-2 self-start rounded-full bg-white px-5 text-sm font-semibold text-ink-900 transition-transform duration-300 group-hover:translate-x-1 sm:self-auto">
        See the programme
        <ArrowRight size={16} />
      </span>
    </Link>
  )
}
