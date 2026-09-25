import { Link } from '@tanstack/react-router'
import { ArrowRight } from 'lucide-react'
import {
  LEVEL_TONE_DARK,
  orderedSkills,
  suggestedStart,
  useMyAssessmentResult,
} from '@/lib/careerReadinessAssessment'

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
 * invitation until it's taken, then a compact read-out with a way back to
 * the result. Renders nothing while loading so the page doesn't flash the
 * wrong state.
 */
export function AssessmentCard() {
  const { result, loading } = useMyAssessmentResult()
  if (loading) return null

  if (!result) {
    return (
      <section className="surface-wood-dark rise-in relative flex flex-col gap-5 overflow-hidden rounded-2xl p-5 shadow-e2 sm:flex-row sm:items-center sm:justify-between sm:p-6">
        <Rings />
        <div className="relative min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/60">Start here</p>
          <h3 className="mt-1.5 font-display text-2xl font-semibold leading-tight text-white">
            Career Readiness initial assessment
          </h3>
          <p className="mt-1.5 max-w-xl text-xs leading-relaxed text-white/70 sm:text-sm">
            20 quick statements, about 5 minutes. A starting point for the five skills — not a test, and open
            now while the programme is on its way.
          </p>
        </div>
        <Link to="/career-readiness-assessment" className={`relative ${cta}`}>
          Take the assessment
          <ArrowRight size={16} />
        </Link>
      </section>
    )
  }

  const skills = orderedSkills(result.scores)
  const start = suggestedStart(result.scores)

  return (
    <section className="surface-wood-dark rise-in relative overflow-hidden rounded-2xl p-5 shadow-e2 sm:p-6">
      <Rings />
      <div className="relative flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/60">Your starting point</p>
          <h3 className="mt-1.5 font-display text-2xl font-semibold leading-tight text-white">
            Start with {start.module}
          </h3>
        </div>
        <Link to="/career-readiness-assessment" className={cta}>
          View your results
          <ArrowRight size={16} />
        </Link>
      </div>
      <ul className="relative mt-4 flex flex-wrap gap-2">
        {skills.map((s) => (
          <li key={s.key} className={`rounded-full px-3 py-1 text-xs font-semibold ${LEVEL_TONE_DARK[s.level]}`}>
            {s.name} · {s.level}
          </li>
        ))}
      </ul>
    </section>
  )
}
