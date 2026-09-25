import { Link } from '@tanstack/react-router'
import { ArrowRight } from 'lucide-react'
import { strongestAptitude, type AptitudeResult } from '@/lib/dmAptitude'

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
 * Practice's entry to the Digital Marketing aptitude assessment, in the dark
 * feature-card treatment. Three states:
 *  - `gate`: Practice is locked until it's taken, so it's the whole page.
 *  - not taken, not a gate: a learner who finished the Foundation assessment
 *    before the aptitude test existed keeps Practice, and is invited to take it.
 *  - taken: one line — the headline result and a way back to the rest. The
 *    full read-out lives on the result page, not here.
 */
export function AptitudeCard({ result, gate = false }: { result: AptitudeResult | null; gate?: boolean }) {
  if (!result) {
    return (
      <section className="surface-wood-dark rise-in relative flex flex-col gap-4 overflow-hidden rounded-2xl p-5 shadow-e2 sm:flex-row sm:items-center sm:justify-between sm:p-6">
        <Rings />
        <div className="relative min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/60">
            {gate ? 'Step 1 · Start here' : 'Recommended'}
          </p>
          <h2 className="mt-1.5 font-display text-2xl font-semibold leading-tight text-white">
            {gate ? 'Start with the aptitude assessment' : 'Take the aptitude assessment'}
          </h2>
          <p className="mt-1.5 text-sm text-white/70">
            {gate ? '20 statements, about 5 minutes. Unlocks Practice.' : '20 statements, about 5 minutes.'}
          </p>
        </div>
        <Link to="/aptitude-assessment" className={`relative ${cta}`}>
          {gate ? 'Start the assessment' : 'Take the assessment'}
          <ArrowRight size={16} />
        </Link>
      </section>
    )
  }

  const top = strongestAptitude(result.scores)
  return (
    <section className="surface-wood-dark rise-in relative flex flex-col gap-4 overflow-hidden rounded-2xl p-5 shadow-e2 sm:flex-row sm:items-center sm:justify-between">
      <Rings />
      <div className="relative min-w-0">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/60">Your marketing aptitude</p>
        <h3 className="mt-1.5 font-display text-2xl font-semibold leading-tight text-white">
          Strongest pull: {top.name}
        </h3>
      </div>
      <Link to="/aptitude-assessment" className={`relative ${cta}`}>
        View your results
        <ArrowRight size={16} />
      </Link>
    </section>
  )
}
