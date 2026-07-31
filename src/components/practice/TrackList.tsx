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
      <div className="mb-3 flex items-baseline justify-between gap-3">
        <h2 className="text-base font-semibold text-ink-900">Skill tracks</h2>
        <span className="hidden text-xs text-ink-400 sm:block">Best score per track is what counts</span>
      </div>

      <div className="mb-3 flex gap-2 overflow-x-auto pb-1">
        {FILTERS.map((f) => {
          const n = f.id === 'needs-work' ? counts['needs-work'] + counts['in-progress'] : counts[f.id]
          const active = filter === f.id
          return (
            <button
              key={f.id}
              type="button"
              onClick={() => setFilter(f.id)}
              aria-pressed={active}
              className={`inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full border px-3.5 text-xs font-medium transition-colors ${
                active
                  ? 'border-ink-900 bg-ink-900 text-white'
                  : 'border-ink-200 bg-white text-ink-600 active:bg-ink-50'
              }`}
            >
              {f.label}
              <span className={active ? 'text-white/60' : 'text-ink-400'}>{n}</span>
            </button>
          )
        })}
      </div>

      {visible.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-ink-200 bg-white p-8 text-center">
          <p className="text-sm font-medium text-ink-700">Nothing here</p>
          <p className="mt-1 text-sm text-ink-500">No tracks match this filter.</p>
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
                  className="flex w-full items-center gap-3 rounded-2xl border border-ink-100 bg-white p-3.5 text-left transition-colors active:bg-ink-50 sm:gap-4 sm:p-4 sm:hover:border-brand-200"
                >
                  {/* score puck — the number people actually compare */}
                  <span
                    className={`flex h-12 w-12 shrink-0 flex-col items-center justify-center rounded-xl text-sm font-semibold sm:h-14 sm:w-14 ${
                      t.started ? 'bg-ink-50 text-ink-900' : 'bg-ink-50 text-ink-300'
                    }`}
                  >
                    {t.started ? (
                      <>
                        {t.percent}
                        <span className="text-[9px] font-medium text-ink-400">%</span>
                      </>
                    ) : (
                      <span className="text-lg leading-none">–</span>
                    )}
                  </span>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                      <h3 className="text-sm font-semibold text-ink-900">{t.name}</h3>
                      <span
                        className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-medium ${meta.pill}`}
                      >
                        {meta.label}
                      </span>
                    </div>

                    <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-ink-100">
                      <div
                        className={`h-full rounded-full transition-all ${meta.bar}`}
                        style={{ width: t.started ? `${Math.max(t.percent, 4)}%` : '0%' }}
                      />
                    </div>

                    <p className="mt-1.5 flex items-center gap-1.5 truncate text-[11px] text-ink-400">
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

                  <ChevronRight size={18} className="shrink-0 text-ink-300" />
                </button>
              </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}
