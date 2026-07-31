/**
 * RETIRED 2026-07-31 — superseded by the practice page redesign.
 *   PracticeOverview -> PracticeStats.tsx  (compact stats, no duplicated chips)
 *   TrackPicker      -> TrackList.tsx      (filterable rows, not an 8-card grid)
 *
 * Nothing imports this any more. Left on disk rather than deleted because the
 * repo isn't under version control — safe to remove once it is.
 */
import { ArrowRight, RotateCcw, Target } from 'lucide-react'
import { skillTracks } from '@/lib/skillTracks'
import { questionsForTrack } from '@/lib/decisionLabs'
import type { PracticeSummary } from '@/lib/practiceResults'

/** One status per track, driving the pill + bar colour. */
function trackStatus(started: boolean, percent: number) {
  if (!started) return { label: 'Not started', pill: 'border-ink-200 bg-ink-50 text-ink-500', bar: 'bg-ink-300' }
  if (percent >= 80) return { label: 'Strong', pill: 'border-emerald-200 bg-emerald-50 text-emerald-700', bar: 'bg-emerald-500' }
  if (percent >= 55) return { label: 'In progress', pill: 'border-brand-200 bg-brand-50 text-brand-700', bar: 'bg-brand-500' }
  return { label: 'Keep practicing', pill: 'border-amber-200 bg-amber-50 text-amber-700', bar: 'bg-amber-500' }
}

export function TrackPicker({
  practice,
  onSelect,
}: {
  practice: PracticeSummary
  onSelect: (track: string) => void
}) {
  return (
    <div>
      <div className="mb-4 flex items-baseline justify-between">
        <h2 className="text-base font-semibold text-ink-900">Skill tracks</h2>
        <span className="text-xs text-ink-400">Practice as often as you like — best score is kept</span>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {skillTracks.map((track) => {
          const questions = questionsForTrack(track.slug)
          const result = practice[track.slug]
          const started = Boolean(result)
          const percent = result?.percent ?? 0
          const status = trackStatus(started, percent)

          return (
            <div
              key={track.slug}
              className="flex flex-col rounded-2xl border border-ink-100 bg-white p-5 transition-colors hover:border-brand-200"
            >
              <div className="flex items-start justify-between gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
                  <Target size={20} />
                </span>
                <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-medium ${status.pill}`}>
                  {status.label}
                </span>
              </div>

              <h3 className="mt-3 text-sm font-semibold text-ink-900">{track.name}</h3>
              <p className="mt-1 flex-1 text-sm text-ink-500">{track.description}</p>

              {/* Progress lives inside the card, so there's no separate progress list. */}
              <div className="mt-4">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-ink-400">{started ? 'Best score' : `${questions.length} scenarios`}</span>
                  {started && <span className="font-semibold text-ink-900">{percent}%</span>}
                </div>
                <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-ink-100">
                  <div
                    className={`h-full rounded-full transition-all ${status.bar}`}
                    style={{ width: started ? `${Math.max(percent, 4)}%` : '0%' }}
                  />
                </div>
              </div>

              <div className="mt-4 flex items-center justify-between">
                <span className="text-xs text-ink-400">
                  {started
                    ? `${result!.attempts} attempt${result!.attempts === 1 ? '' : 's'} · ${questions.length} scenarios`
                    : 'Not attempted yet'}
                </span>
                <button
                  type="button"
                  onClick={() => onSelect(track.slug)}
                  className="inline-flex items-center gap-1.5 rounded-full bg-brand-600 px-3.5 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-brand-700"
                >
                  {started ? (
                    <>
                      <RotateCcw size={12} />
                      Practice again
                    </>
                  ) : (
                    <>
                      Start
                      <ArrowRight size={12} />
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
