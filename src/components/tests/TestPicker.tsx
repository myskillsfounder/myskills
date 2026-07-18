import { ArrowRight, CheckCircle2, FileText, ListChecks, RotateCcw } from 'lucide-react'
import { skillTracks } from '@/lib/skillTracks'
import { buildTest, PASS_MARK } from '@/lib/tests'
import type { TestSummary } from '@/lib/testResults'

export function TestPicker({
  tests,
  onStart,
}: {
  tests: TestSummary
  onStart: (slug: string) => void
}) {
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight text-ink-900">Tests</h1>
        <p className="mt-1 text-sm text-ink-500">
          Exam-style quizzes — one skill track at a time. Score {PASS_MARK}% or higher to
          pass. Retake as many times as you like; your best result is kept.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {skillTracks.map((track) => {
          const count = buildTest(track.slug).length
          const result = tests[track.slug]
          return (
            <div
              key={track.slug}
              className="flex flex-col rounded-2xl border border-ink-100 bg-white p-5 transition-colors hover:border-brand-200"
            >
              <div className="flex items-start justify-between gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
                  <FileText size={20} />
                </span>
                {result ? (
                  result.passed ? (
                    <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[11px] font-medium text-emerald-700">
                      <CheckCircle2 size={12} /> Passed · {result.percent}%
                    </span>
                  ) : (
                    <span className="inline-flex items-center rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-[11px] font-medium text-amber-700">
                      Best {result.percent}%
                    </span>
                  )
                ) : (
                  <span className="inline-flex items-center rounded-full bg-ink-50 px-2 py-1 text-[11px] font-medium text-ink-400">
                    Not taken
                  </span>
                )}
              </div>

              <h3 className="mt-3 text-sm font-semibold text-ink-900">{track.name}</h3>
              <p className="mt-1 flex-1 text-sm text-ink-500">{track.description}</p>

              <div className="mt-4 flex items-center justify-between">
                <span className="inline-flex items-center gap-1.5 text-xs text-ink-400">
                  <ListChecks size={13} />
                  {count} questions
                  {result ? ` · ${result.attempts} attempt${result.attempts === 1 ? '' : 's'}` : ''}
                </span>
                <button
                  type="button"
                  onClick={() => onStart(track.slug)}
                  className="inline-flex items-center gap-1.5 rounded-full bg-brand-600 px-3.5 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-brand-700"
                >
                  {result ? (
                    <>
                      <RotateCcw size={12} /> Retake
                    </>
                  ) : (
                    <>
                      Start test <ArrowRight size={12} />
                    </>
                  )}
                </button>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
