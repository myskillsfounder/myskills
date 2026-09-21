import { useMemo } from 'react'
import { Link } from '@tanstack/react-router'
import { ArrowRight, BookOpen, Clock, Flame, Target } from 'lucide-react'
import type { CourseProgress } from '@/lib/programmes'
import { goalsStep } from '@/lib/onboardingContent'
import { timeSeries } from '@/lib/timeTracker'

const goalLabel = (id: string) => goalsStep.options.find((o) => o.id === id)?.label ?? id

/**
 * The two measures that sit beside the score: what the student is aiming at,
 * and how much time they're putting in. Neither feeds the score (hours are
 * device-local), but both are what give the number meaning.
 */
export function KeyMeasures({
  goals,
  streak,
  courses,
}: {
  goals: string[]
  streak: number
  /** The programmes working toward the objective, e.g. Digital Marketing. */
  courses: CourseProgress[]
}) {
  const hours = useMemo(() => timeSeries('month').totalHours, [])
  const [primary, ...rest] = goals

  return (
    <div className="flex h-full flex-col gap-5">
      <section className="card flex-1 p-5">
        <div className="flex items-center gap-2">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
            <Target size={16} />
          </span>
          <h2 className="text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-600">
            Your objective
          </h2>
        </div>

        {primary ? (
          <>
            <p className="mt-3 font-display text-lg font-semibold leading-snug text-ink-900">
              {goalLabel(primary)}
            </p>
            {rest.length > 0 && (
              <p className="mt-1.5 text-xs leading-relaxed text-ink-500">
                Also: {rest.map(goalLabel).join(' · ')}
              </p>
            )}
          </>
        ) : (
          <p className="mt-3 text-sm leading-relaxed text-ink-600">
            You didn’t pick an objective during onboarding.
          </p>
        )}

        {courses.length > 0 && (
          <div className="mt-4 border-t border-ink-900/[0.06] pt-4">
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-500">
              Courses in progress
            </p>
            <ul className="mt-2.5 space-y-2.5">
              {courses.map((c) => (
                <li key={c.name}>
                  <Link
                    to={c.path}
                    className="group block rounded-xl border border-ink-900/[0.08] p-3 transition-colors hover:border-brand-300"
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-brand-500 to-brand-700 text-white">
                        <BookOpen size={15} />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-ink-900">{c.name}</p>
                        <p className="text-[11px] leading-snug text-ink-500">{c.detail}</p>
                      </div>
                      <ArrowRight
                        size={15}
                        className="shrink-0 text-ink-400 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:text-brand-600"
                      />
                    </div>
                    <div className="mt-2.5 flex items-center gap-2">
                      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-ink-100">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-brand-500 to-brand-700"
                          style={{ width: c.percent > 0 ? `${Math.max(c.percent, 4)}%` : '0%' }}
                        />
                      </div>
                      <span className="shrink-0 text-[11px] font-semibold tabular-nums text-brand-700">
                        {c.status === 'Not started' ? c.status : `${c.percent}%`}
                      </span>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )}
      </section>

      <section className="card p-5">
        <div className="flex items-center gap-2">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
            <Clock size={16} />
          </span>
          <h2 className="text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-600">
            Hours spent
          </h2>
        </div>
        <p className="mt-3 flex items-baseline gap-1.5">
          <span className="font-display text-4xl font-semibold tabular-nums leading-none text-ink-900">
            {hours < 10 ? hours.toFixed(1) : Math.round(hours)}
          </span>
          <span className="text-sm font-medium text-ink-500">hrs · last 30 days</span>
        </p>
        <p className="mt-3 inline-flex items-center gap-1.5 text-xs font-medium text-ink-600">
          <Flame size={13} className="text-orange-500" />
          {streak}-day streak
        </p>
        <p className="mt-2 text-[11px] leading-relaxed text-ink-400">Tracked on this device.</p>
      </section>
    </div>
  )
}
