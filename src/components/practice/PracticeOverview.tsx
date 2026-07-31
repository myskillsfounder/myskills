/**
 * RETIRED 2026-07-31 — superseded by the practice page redesign.
 *   PracticeOverview -> PracticeStats.tsx  (compact stats, no duplicated chips)
 *   TrackPicker      -> TrackList.tsx      (filterable rows, not an 8-card grid)
 *
 * Nothing imports this any more. Left on disk rather than deleted because the
 * repo isn't under version control — safe to remove once it is.
 */
import { ArrowRight } from 'lucide-react'
import { skillTracks } from '@/lib/skillTracks'
import type { PracticeSummary } from '@/lib/practiceResults'

function levelLabel(avg: number, practiced: number) {
  if (practiced === 0) return 'Just getting started'
  if (avg >= 80) return 'Advanced'
  if (avg >= 60) return 'Proficient'
  if (avg >= 40) return 'Developing'
  return 'Beginner'
}

/**
 * A single at-a-glance read on the user's practice: an average-score ring,
 * a couple of headline numbers, and where they're strong vs. should focus.
 * Deliberately holds NO per-track list — the track cards below are the one
 * and only place tracks are listed, so nothing is shown twice.
 *
 * Mobile shape differs from desktop on purpose. Track names like
 * "Marketing Fundamentals · 86%" are too wide to sit two-per-row on a phone,
 * so as chips they wrapped one per line and read like an accident. Below `sm`
 * they render as full-width rows with the score right-aligned (and 44px tap
 * targets for the tappable "focus next" ones); from `sm` up they're chips.
 */
export function PracticeOverview({
  practice,
  onSelect,
}: {
  practice: PracticeSummary
  onSelect: (slug: string) => void
}) {
  const rows = skillTracks.map((t) => {
    const r = practice[t.slug]
    return { slug: t.slug, name: t.name, percent: r?.percent ?? 0, started: Boolean(r), attempts: r?.attempts ?? 0 }
  })
  const started = rows.filter((r) => r.started)
  const avg = started.length
    ? Math.round(started.reduce((s, r) => s + r.percent, 0) / started.length)
    : 0
  const attempts = rows.reduce((s, r) => s + r.attempts, 0)

  const strengths = [...started].sort((a, b) => b.percent - a.percent).filter((r) => r.percent >= 55).slice(0, 3)
  const focus = [...rows].sort((a, b) => a.percent - b.percent).filter((r) => r.percent < 55).slice(0, 3)

  // Progress ring geometry
  const R = 34
  const C = 2 * Math.PI * R
  const offset = C * (1 - avg / 100)

  return (
    <section className="rounded-2xl border border-brand-100 bg-gradient-to-br from-brand-50 to-white p-4 sm:p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-6">
        <div className="flex items-center gap-4 sm:gap-5">
          <div className="relative h-[64px] w-[64px] shrink-0 sm:h-[86px] sm:w-[86px]">
            <svg viewBox="0 0 80 80" className="h-full w-full -rotate-90">
              <circle cx="40" cy="40" r={R} fill="none" stroke="currentColor" strokeWidth="7" className="text-brand-100" />
              <circle
                cx="40" cy="40" r={R} fill="none" stroke="currentColor" strokeWidth="7" strokeLinecap="round"
                className="text-brand-600 transition-all"
                strokeDasharray={C} strokeDashoffset={offset}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-lg font-semibold leading-none tracking-tight text-ink-900 sm:text-xl">
                {avg}%
              </span>
              <span className="mt-0.5 text-[9px] font-medium leading-none text-ink-400 sm:text-[10px]">
                avg best
              </span>
            </div>
          </div>
          <div className="min-w-0">
            <p className="text-xs font-medium text-brand-700">Overall skill level</p>
            <p className="text-xl font-semibold tracking-tight text-ink-900 sm:text-2xl">
              {levelLabel(avg, started.length)}
            </p>
            <p className="mt-0.5 text-xs text-ink-500 sm:text-sm">
              {started.length === 0
                ? 'Pick a track below to begin.'
                : 'Average across your best track scores.'}
            </p>
          </div>
        </div>

        {/* One divided card on mobile — two separate boxes wasted vertical space */}
        <div className="flex items-stretch overflow-hidden rounded-xl border border-brand-100 bg-white/70 sm:ml-auto sm:shrink-0">
          <div className="flex-1 px-3 py-2.5 sm:min-w-[104px] sm:p-4">
            <p className="text-[11px] font-medium text-ink-500 sm:text-xs">Tracks practiced</p>
            <p className="mt-0.5 text-lg font-semibold tracking-tight text-ink-900 sm:mt-1 sm:text-xl">
              {started.length}
              <span className="text-sm font-normal text-ink-400">/{skillTracks.length}</span>
            </p>
          </div>
          <div className="w-px shrink-0 bg-brand-100" />
          <div className="flex-1 px-3 py-2.5 sm:min-w-[104px] sm:p-4">
            <p className="text-[11px] font-medium text-ink-500 sm:text-xs">Total attempts</p>
            <p className="mt-0.5 text-lg font-semibold tracking-tight text-ink-900 sm:mt-1 sm:text-xl">
              {attempts}
            </p>
          </div>
        </div>
      </div>

      {started.length > 0 && (
        <div className="mt-4 grid gap-4 border-t border-brand-100 pt-4 sm:grid-cols-2 sm:pt-5">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-ink-400">Strengths</p>
            <div className="mt-2 flex flex-col gap-1.5 sm:flex-row sm:flex-wrap">
              {strengths.length ? (
                strengths.map((r) => (
                  <span
                    key={r.slug}
                    className="flex items-center justify-between gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-medium text-emerald-700 sm:rounded-full sm:px-2.5 sm:py-1"
                  >
                    <span className="truncate">{r.name}</span>
                    <span className="shrink-0 tabular-nums">{r.percent}%</span>
                  </span>
                ))
              ) : (
                <span className="text-xs text-ink-400">Keep practicing to build strengths.</span>
              )}
            </div>
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-ink-400">Focus next</p>
            <div className="mt-2 flex flex-col gap-1.5 sm:flex-row sm:flex-wrap">
              {focus.length ? (
                focus.map((r) => (
                  <button
                    key={r.slug}
                    type="button"
                    onClick={() => onSelect(r.slug)}
                    className="flex min-h-[44px] items-center justify-between gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-medium text-amber-700 transition-colors active:bg-amber-100 sm:min-h-0 sm:rounded-full sm:px-2.5 sm:py-1 sm:hover:bg-amber-100"
                  >
                    <span className="truncate">{r.name}</span>
                    <span className="flex shrink-0 items-center gap-1.5">
                      {r.started && <span className="tabular-nums">{r.percent}%</span>}
                      <ArrowRight size={13} className="sm:hidden" />
                    </span>
                  </button>
                ))
              ) : (
                <span className="text-xs text-ink-400">No weak spots — nice work.</span>
              )}
            </div>
          </div>
        </div>
      )}
    </section>
  )
}
