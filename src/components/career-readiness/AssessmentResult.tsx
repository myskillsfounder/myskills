import { Link } from '@tanstack/react-router'
import { ArrowRight, Quote } from 'lucide-react'
import {
  LEVEL_TONE,
  READOUT,
  SKILL_MAX,
  orderedSkills,
  suggestedStart,
  type AssessmentResult as Result,
} from '@/lib/careerReadinessAssessment'
import { SectionHeader } from '@/components/app/SectionHeader'

/**
 * A learner's Career Readiness starting point: a level per skill with a plain
 * read-out of what it means, and the module to begin with. Framed as a
 * baseline — it's deliberately not a score and doesn't touch the Career
 * Readiness Score.
 */
export function AssessmentResult({ result }: { result: Result }) {
  const skills = orderedSkills(result.scores)
  const start = suggestedStart(result.scores)

  return (
    <div className="space-y-6">
      <section>
        <SectionHeader
          eyebrow="Your baseline"
          title="Where you are today"
          description="Five skills, each read from how often you do the things that build it. This is a starting point, not a grade — and it doesn't change your Career Readiness Score."
        />
        <ul className="space-y-3">
          {skills.map((s) => (
            <li key={s.key} className="card p-5 sm:p-6">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-wrap items-center gap-2.5">
                  <h3 className="font-display text-lg font-semibold leading-snug text-ink-900">{s.name}</h3>
                  <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${LEVEL_TONE[s.level]}`}>
                    {s.level}
                  </span>
                </div>
                <p className="font-display text-2xl font-semibold leading-none tabular-nums text-ink-900">
                  {s.score}
                  <span className="text-sm font-medium text-ink-500"> / {SKILL_MAX}</span>
                </p>
              </div>
              <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-ink-100">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-brand-500 to-brand-700"
                  style={{ width: `${Math.round((s.score / SKILL_MAX) * 100)}%` }}
                />
              </div>
              <p className="mt-3 text-sm leading-relaxed text-ink-600">{READOUT[s.key][s.level]}</p>
            </li>
          ))}
        </ul>
      </section>

      <section className="surface-wood-dark relative overflow-hidden rounded-2xl p-6 shadow-e2 sm:p-7">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/60">Where to start</p>
        <p className="mt-1.5 font-display text-2xl font-semibold leading-tight text-white">{start.module}</p>
        <p className="mt-2 max-w-xl text-sm leading-relaxed text-white/70">
          It’s your lowest starting point, so it’s where the programme will move the needle most. The
          Career Readiness Programme opens soon — you’re first in line for it.
        </p>
        <Link
          to="/career-readiness"
          className="press mt-5 inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-ink-900 shadow-e2 transition-colors hover:bg-brand-50"
        >
          See the programme
          <ArrowRight size={16} />
        </Link>
      </section>

      {result.reflection && (
        <section className="card p-5 sm:p-6">
          <p className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-600">
            <Quote size={14} className="text-brand-600" /> The skill you want to improve
          </p>
          <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-ink-800">{result.reflection}</p>
        </section>
      )}

      <p className="text-xs leading-relaxed text-ink-500">
        Mentors see this summary when they review your Career Readiness progress. You get one attempt at
        this assessment.
      </p>
    </div>
  )
}
