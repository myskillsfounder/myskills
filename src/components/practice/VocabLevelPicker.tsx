import { ChevronRight, GraduationCap, Sparkles } from 'lucide-react'
import type { VocabLevel } from '@/lib/vocabulary'

interface LevelRow {
  level: VocabLevel
  label: string
  description: string
  learned: number
  total: number
}

/**
 * Sits between the mode card and the actual quiz — pick Beginner or
 * Advanced, see that level's own progress, then practice. Mirrors
 * TrackList's row style (score puck, bar, chevron) so the two "pick
 * something, then practice it" flows in this page feel like one pattern.
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
      {rows.map((r) => {
        const pct = r.total ? Math.round((r.learned / r.total) * 100) : 0
        const Icon = r.level === 'beginner' ? Sparkles : GraduationCap
        return (
          <li key={r.level}>
            <button
              type="button"
              onClick={() => onSelect(r.level)}
              className="group flex w-full items-center gap-3.5 rounded-2xl border border-ink-200 bg-white p-3.5 text-left shadow-e1 transition-all duration-300 hover:-translate-y-0.5 hover:border-brand-300 hover:shadow-e2 sm:gap-4 sm:p-4"
            >
              <span className="flex h-13 w-13 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-500 to-brand-600 text-white shadow-md sm:h-15 sm:w-15">
                <Icon size={22} />
              </span>

              <div className="min-w-0 flex-1">
                <h3 className="text-[15px] font-semibold text-ink-900">{r.label}</h3>
                <p className="text-xs text-ink-500">{r.description}</p>

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
  )
}
