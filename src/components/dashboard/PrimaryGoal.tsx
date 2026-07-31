import { Link } from '@tanstack/react-router'
import { ArrowRight, Check, Target } from 'lucide-react'
import { goalsStep } from '@/lib/onboardingContent'

const goalLabel = (id: string) => goalsStep.options.find((o) => o.id === id)?.label ?? id

/**
 * The goals picked during onboarding.
 *
 * Rendered as a checklist rather than chips: the labels are full sentences
 * ("Build job-ready digital marketing skills"), so as pills they each wrapped
 * onto their own line and read like a broken tag cloud. A list is what they
 * actually are.
 */
export function PrimaryGoal({ goals }: { goals: string[] }) {
  return (
    <section className="rounded-2xl border border-ink-100 bg-white p-5">
      <div className="flex items-center gap-2">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
          <Target size={16} />
        </span>
        <h2 className="flex-1 text-sm font-semibold text-ink-900">Primary goals</h2>
        {goals.length > 0 && (
          <span className="rounded-full bg-ink-50 px-2 py-0.5 text-[11px] font-medium text-ink-500">
            {goals.length}
          </span>
        )}
      </div>

      {goals.length ? (
        <>
          <ul className="mt-3 space-y-2.5">
            {goals.map((id) => (
              <li key={id} className="flex gap-2.5">
                <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-brand-100 text-brand-700">
                  <Check size={11} strokeWidth={3} />
                </span>
                <span className="text-sm leading-snug text-ink-700">{goalLabel(id)}</span>
              </li>
            ))}
          </ul>

          <Link
            to="/practice"
            className="mt-4 inline-flex items-center gap-1.5 border-t border-ink-100 pt-3 text-xs font-semibold text-brand-600 transition-colors hover:text-brand-700"
          >
            Practice toward these <ArrowRight size={13} />
          </Link>
        </>
      ) : (
        <p className="mt-3 text-sm leading-relaxed text-ink-500">
          You didn’t pick any focus areas during onboarding.
        </p>
      )}
    </section>
  )
}
