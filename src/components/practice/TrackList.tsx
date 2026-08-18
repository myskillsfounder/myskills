import { useMemo, useState } from 'react'
import { ChevronRight, RotateCcw } from 'lucide-react'
import { skillTracks } from '@/lib/skillTracks'
import { questionsForTrack } from '@/lib/decisionLabs'
import type { PracticeSummary } from '@/lib/practiceResults'
import { STATE_META, trackState, type TrackState } from './practiceStatus'

/**
 * All eight tracks as one scannable list rather than a grid of large cards.
 *
 * Rows beat cards here: with eight tracks the grid meant heavy scrolling and
 * made scores impossible to compare at a glance. Each row is entirely
 * tappable (one big target instead of a small button), and the filter chips
 * make "what still needs work?" a one-tap question.
 */

type Filter = 'all' | TrackState

const FILTERS: { id: Filter; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'not-started', label: 'Not started' },
  { id: 'needs-work', label: 'Needs work' },
  { id: 'strong', label: 'Strong' },
]

export function TrackList({
  practice,
  onSelect,
}: {
  practice: PracticeSummary
  onSelect: (track: string) => void
}) {
  const [filter, setFilter] = useState<Filter>('all')

  const rows = useMemo(
    () =>
      skillTracks.map((t) => {
        const r = practice[t.slug]
        const started = Boolean(r)
        const percent = r?.percent ?? 0
        return {
          ...t,
          started,
          percent,
          attempts: r?.attempts ?? 0,
          scenarios: questionsForTrack(t.slug).length,
          state: trackState(started, percent),
        }
      }),
    [practice],
  )

  const counts = useMemo(() => {
    const c: Record<Filter, number> = { all: rows.length, 'not-started': 0, 'needs-work': 0, 'in-progress': 0, strong: 0 }
    for (const r of rows) c[r.state] += 1
    return c
  }, [rows])

  // "Needs work" is the actionable bucket, so it also sweeps up in-progress.
  const visible = rows.filter((r) => {
    if (filter === 'all') return true
    if (filter === 'needs-work') return r.state === 'needs-work' || r.state === 'in-progress'
    return r.state === filter
  })

  return (
    <section>
      <div className="mb-4 flex items-end justify-between gap-3">
        <div>
          <h2 className="font-display text-xl font-semibold tracking-tight text-ink-900">Skill tracks</h2>
          <p className="mt-0.5 text-sm text-ink-600">Your best score in each track is what counts.</p>
        </div>
      </div>

      <div role="group" aria-label="Filter tracks" className="mb-4 flex gap-2 overflow-x-auto pb-1">
        {FILTERS.map((f) => {
          const n = f.id === 'needs-work' ? counts['needs-work'] + counts['in-progress'] : counts[f.id]
          const active = filter === f.id
          return (
            <button
              key={f.id}
              type="button"
              onClick={() => setFilter(f.id)}
              aria-pressed={active}
              className={`press inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full border px-3.5 text-xs font-medium transition-colors ${
                active
                  ? 'border-ink-900 bg-ink-900 text-white shadow-e1'
                  : 'border-ink-300 bg-white text-ink-600 hover:bg-ink-100'
              }`}
            >
              {f.label}
              <span className={active ? 'text-white/60' : 'text-ink-500'}>{n}</span>
            </button>
          )
        })}
      </div>

      {visible.length === 0 ? (
        <div className="card border-dashed px-6 py-10 text-center">
          <p className="font-display text-lg font-semibold text-ink-900">Nothing here</p>
          <p className="mt-1 text-sm text-ink-600">No tracks match this filter.</p>
        </div>
      ) : (
        <ul className="space-y-2">
          {visible.map((t) => {
            const meta = STATE_META[t.state]
            return (
              <li key={t.slug}>
                <button
                  type="button"
                  onClick={() => onSelect(t.slug)}
                  className="group flex w-full items-center gap-3.5 rounded-2xl border border-ink-200 bg-white p-3.5 text-left shadow-e1 transition-all duration-300 hover:-translate-y-0.5 hover:border-brand-300 hover:shadow-e2 sm:gap-4 sm:p-4"
                >
                  {/* score puck — the number people actually compare */}
                  <span
                    className={`flex h-13 w-13 shrink-0 flex-col items-center justify-center rounded-2xl font-display text-base font-semibold transition-transform duration-300 group-hover:scale-105 sm:h-15 sm:w-15 ${
                      t.started ? 'bg-ink-200 text-ink-900' : 'bg-ink-100 text-ink-400'
                    }`}
                  >
                    {t.started ? (
                      <>
                        {t.percent}
                        <span className="text-[9px] font-medium text-ink-500">%</span>
                      </>
                    ) : (
                      <span className="text-lg leading-none">–</span>
                    )}
                  </span>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                      <h3 className="text-[15px] font-semibold text-ink-900">{t.name}</h3>
                      <span
                        className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-medium ${meta.pill}`}
                      >
                        {meta.label}
                      </span>
                    </div>

                    <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-ink-200/60">
                      <div
                        className={`h-full rounded-full transition-all ${meta.bar}`}
                        style={{ width: t.started ? `${Math.max(t.percent, 4)}%` : '0%' }}
                      />
                    </div>

                    <p className="mt-1.5 flex items-center gap-1.5 truncate text-[11px] text-ink-500">
                      <span>{t.scenarios} scenarios</span>
                      {t.started && (
                        <>
                          <span aria-hidden>·</span>
                          <span className="inline-flex items-center gap-1">
                            <RotateCcw size={10} />
                            {t.attempts} attempt{t.attempts === 1 ? '' : 's'}
                          </span>
                        </>
                      )}
                    </p>
                  </div>

                  <ChevronRight
                    size={18}
                    className="shrink-0 text-ink-400 transition-transform duration-300 group-hover:translate-x-1 group-hover:text-brand-600"
                  />
                </button>
              </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}
