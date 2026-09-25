import { Link } from '@tanstack/react-router'
import { ArrowRight, ClipboardCheck } from 'lucide-react'
import {
  LEVEL_TONE,
  orderedSkills,
  suggestedStart,
  useMyAssessmentResult,
} from '@/lib/careerReadinessAssessment'

/**
 * Practice's entry to the Career Readiness assessment: an invitation until
 * it's taken, then a compact read-out of the result with a way back to it.
 * Renders nothing while loading so the page doesn't flash the wrong state.
 */
export function AssessmentCard() {
  const { result, loading } = useMyAssessmentResult()
  if (loading) return null

  if (!result) {
    return (
      <section className="card flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
            <ClipboardCheck size={19} />
          </span>
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-600">Start here</p>
            <h3 className="mt-1 font-display text-lg font-semibold leading-snug text-ink-900">
              Career Readiness initial assessment
            </h3>
            <p className="mt-1 text-sm leading-relaxed text-ink-600">
              25 quick statements, about 8 minutes. A starting point for the five skills — not a test,
              and open now while the programme is on its way.
            </p>
          </div>
        </div>
        <Link
          to="/career-readiness-assessment"
          className="press inline-flex shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-full bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-700"
        >
          Take the assessment
          <ArrowRight size={16} />
        </Link>
      </section>
    )
  }

  const skills = orderedSkills(result.scores)
  const start = suggestedStart(result.scores)

  return (
    <section className="card p-5 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
            <ClipboardCheck size={19} />
          </span>
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-600">Your starting point</p>
            <h3 className="mt-1 font-display text-lg font-semibold leading-snug text-ink-900">
              Start with {start.module}
            </h3>
          </div>
        </div>
        <Link
          to="/career-readiness-assessment"
          className="group inline-flex items-center gap-1.5 text-sm font-semibold text-brand-700 hover:text-brand-800"
        >
          View your results
          <ArrowRight size={15} className="transition-transform group-hover:translate-x-0.5" />
        </Link>
      </div>
      <ul className="mt-4 flex flex-wrap gap-2">
        {skills.map((s) => (
          <li key={s.key} className={`rounded-full px-3 py-1 text-xs font-semibold ${LEVEL_TONE[s.level]}`}>
            {s.name} · {s.level}
          </li>
        ))}
      </ul>
    </section>
  )
}
