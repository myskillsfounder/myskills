import { Target } from 'lucide-react'
import { goalsStep } from '@/lib/onboardingContent'

const goalLabel = (id: string) => goalsStep.options.find((o) => o.id === id)?.label ?? id

export function PrimaryGoal({ goals }: { goals: string[] }) {
  return (
    <section className="rounded-2xl border border-ink-100 bg-white p-5">
      <div className="flex items-center gap-2">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
          <Target size={16} />
        </span>
        <h2 className="text-sm font-semibold text-ink-900">Primary goals</h2>
      </div>
      {goals.length ? (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {goals.map((id) => (
            <span
              key={id}
              className="rounded-full border border-brand-200 bg-brand-50 px-2.5 py-1 text-xs font-medium text-brand-700"
            >
              {goalLabel(id)}
            </span>
          ))}
        </div>
      ) : (
        <p className="mt-3 text-sm text-ink-500">No focus areas set from onboarding.</p>
      )}
    </section>
  )
}
