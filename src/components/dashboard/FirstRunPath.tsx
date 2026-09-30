import { Link } from '@tanstack/react-router'
import { ArrowRight } from 'lucide-react'
import { ASSESSMENT_ROUTE, START_LABEL, goalLabel, resolveGoal, type StartKey } from '@/lib/onboardingContent'
import { GridBackdrop } from '@/components/landing/GridBackdrop'

const STEPS = [
  {
    title: 'Take an aptitude assessment',
    body: '20 statements, about five minutes, no right answers. It shows where you’re strongest and opens Practice.',
  },
  {
    title: 'Practise with an AI coach',
    body: 'Real scenarios in digital marketing, or five career modules — at your own pace.',
  },
  {
    title: 'Work with a mentor',
    body: 'Ask a mentor to work with you. They see your results and help you build proof you can show.',
  },
  {
    title: 'Grow your Career Readiness Score',
    body: 'A score out of 100 built from what you do here. It’s what employers see.',
  },
]

/**
 * What a brand-new student sees in place of the score card: their path, in
 * four steps, with the first one current. A score of 0/100, a slider of
 * certificates and an hours counter say nothing before they've begun; this
 * says what happens and what to do first. The first step's button starts the
 * assessment their goal points to; the other is one link away, and the
 * objective card beside it offers both.
 */
export function FirstRunPath({ name, goal }: { name: string; goal?: string }) {
  const suggested: StartKey = resolveGoal(goal)?.lean ?? 'personal'
  const other: StartKey = suggested === 'marketing' ? 'personal' : 'marketing'
  return (
    <section className="surface-wood-dark rise-in relative h-full overflow-hidden rounded-2xl p-6 shadow-e2 sm:p-8">
      <GridBackdrop mask="ellipse 70% 60% at 85% 10%" />
      <span aria-hidden className="pointer-events-none absolute -right-16 -top-16 opacity-[0.14]">
        <svg width="260" height="260" viewBox="0 0 200 200" fill="none" stroke="#f6e3c8" strokeWidth="1.4">
          <circle cx="100" cy="100" r="96" />
          <circle cx="100" cy="100" r="74" />
          <circle cx="100" cy="100" r="52" />
          <circle cx="100" cy="100" r="30" />
        </svg>
      </span>

      <div className="relative">
        <p className="font-mono text-[11px] font-medium uppercase tracking-[0.18em] text-brand-200">Your path</p>
        <h2 className="mt-2 font-display text-2xl font-semibold leading-tight tracking-tight text-white sm:text-3xl">
          {name}, here’s how it works
        </h2>
        {goal && (
          <p className="mt-3 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.06] px-3.5 py-1.5 text-sm">
            <span className="text-white/55">Your goal</span>
            <span className="font-semibold text-white">{goalLabel(goal)}</span>
          </p>
        )}

        <ol className="mt-6">
          {STEPS.map((s, i) => {
            const current = i === 0
            const last = i === STEPS.length - 1
            return (
              <li key={s.title} className="relative flex gap-4 pb-6 last:pb-0">
                {!last && <span aria-hidden className="absolute left-[15px] top-9 h-[calc(100%-2.25rem)] w-px bg-white/15" />}
                <span
                  aria-hidden
                  className={`relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full font-display text-sm font-semibold ${
                    current
                      ? 'bg-gradient-to-br from-brand-400 to-brand-700 text-white shadow-[0_0_18px_rgba(143,133,238,0.65)]'
                      : 'border border-white/20 bg-white/[0.06] text-white/60'
                  }`}
                >
                  {i + 1}
                </span>
                <div className={current ? '' : 'opacity-70'}>
                  <p className="text-[15px] font-semibold text-white">{s.title}</p>
                  <p className="mt-0.5 text-sm leading-relaxed text-white/65">{s.body}</p>
                  {current && (
                    <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1">
                      <Link
                        to={ASSESSMENT_ROUTE[suggested]}
                        className="press inline-flex h-11 items-center gap-2 rounded-full bg-white px-5 text-sm font-semibold text-ink-900 shadow-e2 transition-colors hover:bg-brand-50"
                      >
                        Start the {START_LABEL[suggested]}
                        <ArrowRight size={15} />
                      </Link>
                      <Link
                        to={ASSESSMENT_ROUTE[other]}
                        className="py-2 text-sm font-medium text-white/70 underline-offset-4 transition-colors hover:text-white hover:underline"
                      >
                        or take the {START_LABEL[other]}
                      </Link>
                    </div>
                  )}
                </div>
              </li>
            )
          })}
        </ol>
      </div>
    </section>
  )
}
