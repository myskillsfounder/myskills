import { ClipboardCheck, Lock, Trophy } from 'lucide-react'
import type { AssessmentResult } from '@/lib/assessmentResults'
import { assessmentCategories } from '@/lib/initialAssessment'

export function AssessmentsHome({ assessment }: { assessment: AssessmentResult }) {
  const { overall, categories } = assessment
  // keep the canonical category order
  const ordered = assessmentCategories
    .map((c) => categories.find((x) => x.category === c))
    .filter((x): x is NonNullable<typeof x> => Boolean(x))
    // Defensive: older rows saved before percent was computed on write
    // (or any future bad data) won't have a valid percent — derive it.
    .map((c) => ({
      ...c,
      percent: Number.isFinite(c.percent) ? c.percent : (c.total ? Math.round((c.correct / c.total) * 100) : 0),
    }))

  return (
    <div className="space-y-5">
      {/* Overall progress */}
      <div className="overflow-hidden rounded-2xl border border-brand-200 bg-gradient-to-br from-brand-50 to-white p-6">
        <div className="flex items-center gap-4">
          <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-600 text-white">
            <Trophy size={26} />
          </span>
          <div className="flex-1">
            <p className="text-sm font-medium text-brand-700">Overall progress</p>
            <p className="font-display text-3xl font-semibold tracking-tight text-ink-900">
              {overall.percent}%
              <span className="ml-2 text-sm font-normal text-ink-600">
                {overall.correct}/{overall.total} correct
              </span>
            </p>
          </div>
        </div>
        <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-white/70">
          <div
            className="h-full rounded-full bg-brand-600 transition-all"
            style={{ width: `${overall.percent}%` }}
          />
        </div>
      </div>

      {/* Per-category assessments */}
      <div>
        <h2 className="font-display text-lg font-semibold text-ink-900">Assessments by category</h2>
        <p className="mt-0.5 text-sm text-ink-600">
          Your one-time results. Each category is scored from your initial assessment
          and locked in — it can't be retaken.
        </p>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          {ordered.map((c) => (
            <div
              key={c.category}
              className="card flex flex-col p-5"
            >
              <div className="flex items-start justify-between gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
                  <ClipboardCheck size={20} />
                </span>
                <span className="text-lg font-semibold tracking-tight text-ink-900">
                  {c.percent}%
                </span>
              </div>
              <h3 className="mt-3 text-sm font-semibold text-ink-900">{c.category}</h3>
              <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-ink-200">
                <div
                  className="h-full rounded-full bg-brand-500"
                  style={{ width: `${c.percent}%` }}
                />
              </div>
              <div className="mt-3 flex items-center justify-between">
                <span className="text-xs text-ink-500">
                  {c.correct}/{c.total} correct
                </span>
                <span className="inline-flex items-center gap-1.5 text-xs font-medium text-ink-500">
                  <Lock size={12} />
                  Final
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
