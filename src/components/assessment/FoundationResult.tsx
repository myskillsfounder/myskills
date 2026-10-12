import { Link } from '@tanstack/react-router'
import { ArrowRight, Award } from 'lucide-react'
import type { AssessmentResult } from '@/lib/assessmentResults'
import { assessmentCategories } from '@/lib/initialAssessment'
import { Eyebrow } from '@/components/landing/Eyebrow'

/**
 * A finished Foundation assessment, on the dark theme: the score, how each
 * category went, and the certificate it earned. The answer review isn't here:
 * it's only ever shown right after grading, when the answers are revealed.
 */
export function FoundationResult({ assessment }: { assessment: AssessmentResult }) {
  const { overall, categories } = assessment
  const ordered = assessmentCategories
    .map((c) => categories.find((x) => x.category === c))
    .filter((x): x is NonNullable<typeof x> => Boolean(x))
    .map((c) => ({
      ...c,
      percent: Number.isFinite(c.percent) ? c.percent : c.total ? Math.round((c.correct / c.total) * 100) : 0,
    }))

  return (
    <div className="space-y-6">
      <div className="grid gap-5 lg:grid-cols-5">
        <section className="card-glass-dark glow-edge rounded-xl p-6 sm:p-8 lg:col-span-2">
          <Eyebrow dark>Your score</Eyebrow>
          <p className="mt-4 font-display text-7xl font-semibold leading-none tabular-nums text-white">
            {overall.percent}
            <span className="text-3xl text-white/50">%</span>
          </p>
          <p className="mt-3 text-sm text-white/70">
            {overall.correct} of {overall.total} answered correctly, on{' '}
            {new Date(overall.completedAt).toLocaleDateString()}.
          </p>
        </section>

        <section className="surface-wood-dark relative flex flex-col justify-between overflow-hidden rounded-xl border border-white/10 p-6 shadow-e2 sm:p-8 lg:col-span-3">
          <span aria-hidden className="pointer-events-none absolute -right-10 -top-10 opacity-[0.16]">
            <svg width="200" height="200" viewBox="0 0 200 200" fill="none" stroke="#f6e3c8" strokeWidth="2">
              <circle cx="130" cy="70" r="76" />
              <circle cx="130" cy="70" r="56" />
              <circle cx="130" cy="70" r="36" />
              <circle cx="130" cy="70" r="16" />
            </svg>
          </span>
          <div className="relative">
            <div className="flex items-center gap-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/10 text-brand-200">
                <Award size={20} />
              </span>
              <Eyebrow dark>Certificate</Eyebrow>
            </div>
            <p className="mt-4 font-display text-2xl font-semibold leading-tight text-white sm:text-3xl">
              Foundational Progress in Digital Marketing
            </p>
            <p className="mt-2 max-w-md text-sm leading-relaxed text-white/70">
              Awarded for completing the Foundation assessment. You’ll find it, with its ID and a download, in
              your profile.
            </p>
          </div>
          <Link
            to="/profile"
            className="press relative mt-6 inline-flex w-fit items-center justify-center gap-2 whitespace-nowrap rounded-full bg-white px-6 py-3 text-sm font-semibold text-ink-900 shadow-e2 transition-colors hover:bg-brand-50"
          >
            See it in your profile
            <ArrowRight size={16} />
          </Link>
        </section>
      </div>

      <section>
        <Eyebrow dark>By category</Eyebrow>
        <h2 className="mt-2 font-display text-2xl font-semibold tracking-tight text-white sm:text-3xl">
          How each area went
        </h2>
        <ul className="mt-6 space-y-3">
          {ordered.map((c) => (
            <li key={c.category} className="card-glass-dark p-5">
              <div className="flex items-center justify-between gap-3">
                <h3 className="font-display text-base font-semibold text-white">{c.category}</h3>
                <p className="font-display text-xl font-semibold tabular-nums text-white">
                  {c.percent}
                  <span className="text-sm font-medium text-white/40">%</span>
                </p>
              </div>
              <div className="mt-2.5 h-1.5 overflow-hidden rounded-full bg-white/10">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-brand-400 to-brand-200"
                  style={{ width: `${Math.max(3, c.percent)}%` }}
                />
              </div>
              <p className="mt-2 font-mono text-[11px] font-bold text-white/40">
                {c.correct} / {c.total} correct
              </p>
            </li>
          ))}
        </ul>
      </section>

      <p className="text-xs leading-relaxed text-white/50">
        You get one attempt at the Foundation assessment. Your best next step is practice: work through the skill
        tracks in Practice.
      </p>
    </div>
  )
}
