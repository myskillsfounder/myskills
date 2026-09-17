import { ChevronRight, GraduationCap, Lock, Sparkles } from 'lucide-react'
import type { VocabLevel } from '@/lib/vocabulary'

interface LevelRow {
  level: VocabLevel
  label: string
  description: string
  learned: number
  total: number
  /** Set once, on the Advanced row, once Beginner clears the unlock
   *  threshold — see ADVANCED_UNLOCK_PERCENT below. */
  locked?: boolean
  lockedHint?: string
}

/**
 * Sits between the mode card and the actual quiz — pick Beginner or
 * Advanced, see that level's own progress, then practice. Mirrors
 * TrackList's row style (score puck, bar, chevron) so the two "pick
 * something, then practice it" flows in this page feel like one pattern.
 *
 * Advanced is genuinely locked, not just visually de-emphasized — the two
 * levels used to sit as equal, independent cards with nothing steering
 * anyone through the basics first, so it was entirely possible (and, in
 * testing, easy) to end up further into Advanced than Beginner despite
 * Beginner being the intended starting point.
 */
export function VocabLevelPicker({
  rows,
  onSelect,
}: {
  rows: LevelRow[]
  onSelect: (level: VocabLevel) => void
}) {
  return (
    <ul className="space-y-2">
      {rows.map((r, i) => {
        const pct = r.total ? Math.round((r.learned / r.total) * 100) : 0
        const Icon = r.level === 'beginner' ? Sparkles : GraduationCap
        const locked = Boolean(r.locked)

        return (
          <li key={r.level}>
            <button
              type="button"
              disabled={locked}
              onClick={() => onSelect(r.level)}
              className={`group flex w-full items-center gap-3.5 rounded-2xl border p-3.5 text-left shadow-e1 transition-all duration-300 sm:gap-4 sm:p-4 ${
                locked
                  ? 'cursor-not-allowed border-ink-200 bg-ink-50'
                  : 'border-ink-200 bg-white hover:-translate-y-0.5 hover:border-brand-300 hover:shadow-e2'
              }`}
            >
              <span
                className={`relative flex h-13 w-13 shrink-0 items-center justify-center rounded-2xl text-white shadow-md sm:h-15 sm:w-15 ${
                  locked ? 'bg-ink-300' : 'bg-gradient-to-br from-sky-500 to-brand-600'
                }`}
              >
                {locked ? <Lock size={20} /> : <Icon size={22} />}
                <span
                  className={`absolute -left-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full text-[11px] font-semibold shadow-e1 ${
                    locked ? 'bg-white text-ink-400' : 'bg-white text-brand-700'
                  }`}
                >
                  {i + 1}
                </span>
              </span>

              <div className="min-w-0 flex-1">
                <h3 className={`text-[15px] font-semibold ${locked ? 'text-ink-500' : 'text-ink-900'}`}>
                  {r.label}
                </h3>
                <p className="text-xs text-ink-500">{r.description}</p>

                {locked ? (
                  <p className="mt-2 inline-flex items-center gap-1.5 text-[11px] font-medium text-ink-500">
                    <Lock size={11} />
                    {r.lockedHint}
                  </p>
                ) : (
                  <>
                    <div className="mt-2 flex items-center justify-between text-[11px] text-ink-500">
                      <span>
                        {r.learned} / {r.total} words learned
                      </span>
                      <span className="font-semibold text-sky-800">{pct}%</span>
                    </div>
                    <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-ink-200/60">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-sky-500 to-brand-600 transition-all"
                        style={{ width: r.learned > 0 ? `${Math.max(pct, 4)}%` : '0%' }}
                      />
                    </div>
                  </>
                )}
              </div>

              {!locked && (
                <ChevronRight
                  size={18}
                  className="shrink-0 text-ink-400 transition-transform duration-300 group-hover:translate-x-1 group-hover:text-brand-600"
                />
              )}
            </button>
          </li>
        )
      })}
    </ul>
  )
}
