import { useState } from 'react'
import { ChevronDown, Lock } from 'lucide-react'
import type { AssessmentResult } from '@/lib/assessmentResults'
import { assessmentCategories } from '@/lib/initialAssessment'

/**
 * The initial assessment condensed into ONE secondary, collapsible card.
 * It's a locked one-time baseline, so it sits quietly under the practice
 * experience — expand to see the per-category breakdown.
 */
export function AssessmentSummaryCard({ assessment }: { assessment: AssessmentResult }) {
  const [open, setOpen] = useState(false)
  const { overall, categories } = assessment

  const ordered = assessmentCategories
    .map((c) => categories.find((x) => x.category === c))
    .filter((x): x is NonNullable<typeof x> => Boolean(x))
    .map((c) => ({
      ...c,
      percent: Number.isFinite(c.percent)
        ? c.percent
        : c.total
          ? Math.round((c.correct / c.total) * 100)
          : 0,
    }))

  return (
    <section className="rounded-2xl border border-ink-200 bg-ink-100 p-5">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center gap-4 text-left"
      >
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-semibold text-ink-800">Initial assessment</h2>
            <span className="inline-flex items-center gap-1 rounded-full border border-ink-300 bg-white px-2 py-0.5 text-[10px] font-medium text-ink-500">
              <Lock size={9} /> One-time
            </span>
          </div>
          <p className="mt-0.5 text-xs text-ink-500">
            Your baseline across {ordered.length} categories · locked
          </p>
        </div>
        <div className="text-right">
          <p className="text-lg font-semibold tracking-tight text-ink-800">{overall.percent}%</p>
          <p className="text-[11px] text-ink-500">
            {overall.correct}/{overall.total}
          </p>
        </div>
        <ChevronDown
          size={18}
          className={`shrink-0 text-ink-500 transition-transform ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {/* Overall bar stays visible; categories reveal on expand. */}
      <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-white">
        <div
          className="h-full rounded-full bg-ink-400 transition-all"
          style={{ width: `${overall.percent}%` }}
        />
      </div>

      {open && (
        <div className="mt-4 grid gap-x-6 gap-y-3 sm:grid-cols-2">
          {ordered.map((c) => (
            <div key={c.category}>
              <div className="flex items-center justify-between text-xs">
                <span className="text-ink-600">{c.category}</span>
                <span className="font-semibold text-ink-800">{c.percent}%</span>
              </div>
              <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-white">
                <div
                  className="h-full rounded-full bg-brand-400"
                  style={{ width: `${c.percent}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  )
}
