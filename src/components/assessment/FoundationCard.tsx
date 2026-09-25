import { Link } from '@tanstack/react-router'
import { ArrowRight, Lock } from 'lucide-react'
import type { AssessmentResult } from '@/lib/assessmentResults'
import type { FoundationUnlock } from '@/lib/foundation'

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
  'press relative inline-flex shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-ink-900 shadow-e2 transition-colors hover:bg-brand-50'

const shell =
  'surface-wood-dark rise-in relative flex flex-col gap-4 overflow-hidden rounded-2xl p-5 shadow-e2 sm:flex-row sm:items-center sm:justify-between sm:p-6'

/**
 * Practice's entry to the Foundation assessment, in the dark feature-card
 * treatment. Three states: done (the score and the certificate it earned),
 * ready (vocabulary is far enough along), and locked (how far to go, and a
 * way to the vocabulary). `unlock` is passed in rather than read here because
 * Practice knows the live vocabulary numbers as the learner works.
 */
export function FoundationCard({
  assessment,
  unlock,
  onOpenVocabulary,
}: {
  assessment: AssessmentResult | null
  unlock: FoundationUnlock
  onOpenVocabulary: () => void
}) {
  if (assessment) {
    return (
      <section className={shell}>
        <Rings />
        <div className="relative min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/60">Foundation assessment</p>
          <h3 className="mt-1.5 font-display text-2xl font-semibold leading-tight text-white">
            {assessment.overall.percent}% · Foundational progress earned
          </h3>
          <p className="mt-1.5 max-w-xl text-xs leading-relaxed text-white/70 sm:text-sm">
            {assessment.overall.correct} of {assessment.overall.total} correct. Your certificate is in your profile.
          </p>
        </div>
        <Link to="/foundation-assessment" className={cta}>
          View your results
          <ArrowRight size={16} />
        </Link>
      </section>
    )
  }

  if (unlock.unlocked) {
    return (
      <section className={shell}>
        <Rings />
        <div className="relative min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/60">
            Foundation assessment · Ready
          </p>
          <h3 className="mt-1.5 font-display text-2xl font-semibold leading-tight text-white">Test what you know</h3>
          <p className="mt-1.5 max-w-xl text-xs leading-relaxed text-white/70 sm:text-sm">
            One attempt across all the skill areas, and a certificate for your foundational progress in digital
            marketing.
          </p>
        </div>
        <Link to="/foundation-assessment" className={cta}>
          Take the assessment
          <ArrowRight size={16} />
        </Link>
      </section>
    )
  }

  return (
    <section className={shell}>
      <Rings />
      <div className="relative min-w-0">
        <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-white/60">
          <Lock size={12} /> Foundation assessment · Locked
        </p>
        <h3 className="mt-1.5 font-display text-2xl font-semibold leading-tight text-white">
          Learn {unlock.required}% of the Beginner words to unlock it
        </h3>
        <div className="mt-3 flex items-center gap-3">
          <div className="h-1.5 w-40 overflow-hidden rounded-full bg-white/10 sm:w-56">
            <div
              className="h-full rounded-full bg-gradient-to-r from-brand-400 to-brand-200"
              style={{ width: `${Math.min(100, Math.round((unlock.percent / unlock.required) * 100))}%` }}
            />
          </div>
          <span className="font-mono text-[11px] font-bold tabular-nums text-white/60">
            {unlock.percent}% / {unlock.required}%
          </span>
        </div>
      </div>
      <button type="button" onClick={onOpenVocabulary} className={cta}>
        Open the vocabulary builder
        <ArrowRight size={16} />
      </button>
    </section>
  )
}
