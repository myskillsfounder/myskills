import { useMemo } from 'react'
import { Link } from '@tanstack/react-router'
import { ArrowRight, Clock, Flame, Target } from 'lucide-react'
import { goalsStep } from '@/lib/onboardingContent'
import { timeSeries } from '@/lib/timeTracker'

const goalLabel = (id: string) => goalsStep.options.find((o) => o.id === id)?.label ?? id

/**
 * The two measures that sit beside the score: what the student is aiming at,
 * and how much time they're putting in. Neither feeds the score (hours are
 * device-local), but both are what give the number meaning.
 */
export function KeyMeasures({ goals, streak }: { goals: string[]; streak: number }) {
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
            <Link
              to="/practice"
              className="mt-4 inline-flex items-center gap-1.5 text-xs font-semibold text-brand-600 transition-colors hover:text-brand-700"
            >
              Practice toward it <ArrowRight size={13} />
            </Link>
          </>
        ) : (
          <p className="mt-3 text-sm leading-relaxed text-ink-600">
            You didn’t pick an objective during onboarding.
          </p>
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
