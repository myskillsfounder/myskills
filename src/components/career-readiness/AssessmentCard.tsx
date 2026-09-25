import { Link } from '@tanstack/react-router'
import { ArrowRight } from 'lucide-react'
import { suggestedStart, useMyAssessmentResult } from '@/lib/careerReadinessAssessment'

const Rings = () => (
  <span aria-hidden className="pointer-events-none absolute -right-10 -top-10 opacity-[0.16]">
    <svg width="200" height="200" viewBox="0 0 200 200" fill="none" stroke="#f6e3c8" strokeWidth="2">
      <circle cx="130" cy="70" r="76" />
      <circle cx="130" cy="70" r="56" />
      <circle cx="130" cy="70" r="36" />
      <circle cx="130" cy="70" r="16" />
    </svg>
  </span>
)

const cta =
  'press inline-flex shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-ink-900 shadow-e2 transition-colors hover:bg-brand-50'

/**
 * Practice's entry to the Career Readiness assessment, in the same dark
 * feature-card treatment as the Career Readiness cards around it: an
 * invitation until it's taken, then one line — the headline result and a way
 * back to the rest, which lives on the result page. Renders nothing while loading so the page doesn't flash the
 * wrong state.
 */
export function AssessmentCard() {
  const { result, loading } = useMyAssessmentResult()
  if (loading) return null

  if (!result) {
    return (
      <section className="surface-wood-dark rise-in relative flex flex-col gap-4 overflow-hidden rounded-2xl p-5 shadow-e2 sm:flex-row sm:items-center sm:justify-between">
        <Rings />
        <div className="relative min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/60">Start here</p>
          <h3 className="mt-1.5 font-display text-2xl font-semibold leading-tight text-white">
            Personal aptitude assessment
          </h3>
          <p className="mt-1.5 text-sm text-white/70">20 statements, about 5 minutes. Not a test.</p>
        </div>
        <Link to="/career-readiness-assessment" className={`relative ${cta}`}>
          Take the assessment
          <ArrowRight size={16} />
        </Link>
      </section>
    )
  }

  const start = suggestedStart(result.scores)

  return (
    <section className="surface-wood-dark rise-in relative flex flex-col gap-4 overflow-hidden rounded-2xl p-5 shadow-e2 sm:flex-row sm:items-center sm:justify-between">
      <Rings />
      <div className="relative min-w-0">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/60">Your personal aptitude</p>
        <h3 className="mt-1.5 font-display text-2xl font-semibold leading-tight text-white">
          Start with {start.module}
        </h3>
      </div>
      <Link to="/career-readiness-assessment" className={`relative ${cta}`}>
        View your results
        <ArrowRight size={16} />
      </Link>
    </section>
  )
}
