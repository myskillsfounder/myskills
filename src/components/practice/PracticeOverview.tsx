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
    <section className="rounded-2xl border border-brand-100 bg-gradient-to-br from-brand-50 to-white p-6">
      <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
        <div className="flex items-center gap-5">
          <div className="relative h-[86px] w-[86px] shrink-0">
            <svg viewBox="0 0 80 80" className="h-full w-full -rotate-90">
              <circle cx="40" cy="40" r={R} fill="none" stroke="currentColor" strokeWidth="7" className="text-brand-100" />
              <circle
                cx="40" cy="40" r={R} fill="none" stroke="currentColor" strokeWidth="7" strokeLinecap="round"
                className="text-brand-600 transition-all"
                strokeDasharray={C} strokeDashoffset={offset}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-xl font-semibold tracking-tight text-ink-900">{avg}%</span>
              <span className="text-[10px] font-medium text-ink-400">avg best</span>
            </div>
          </div>
          <div>
            <p className="text-xs font-medium text-brand-700">Overall skill level</p>
            <p className="text-2xl font-semibold tracking-tight text-ink-900">
              {levelLabel(avg, started.length)}
            </p>
            <p className="mt-0.5 text-sm text-ink-500">
              {started.length === 0
                ? 'Pick a track below to begin.'
                : 'Average across your best track scores.'}
            </p>
          </div>
        </div>

        <div className="flex gap-3 sm:ml-auto">
          <div className="min-w-[104px] rounded-xl border border-brand-100 bg-white/70 p-4">
            <p className="text-xs font-medium text-ink-500">Tracks practiced</p>
            <p className="mt-1 text-xl font-semibold tracking-tight text-ink-900">
              {started.length}<span className="text-sm font-normal text-ink-400">/{skillTracks.length}</span>
            </p>
          </div>
          <div className="min-w-[104px] rounded-xl border border-brand-100 bg-white/70 p-4">
            <p className="text-xs font-medium text-ink-500">Total attempts</p>
            <p className="mt-1 text-xl font-semibold tracking-tight text-ink-900">{attempts}</p>
          </div>
        </div>
      </div>

      {started.length > 0 && (
        <div className="mt-5 grid gap-4 border-t border-brand-100 pt-5 sm:grid-cols-2">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-ink-400">Strengths</p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {strengths.length ? (
                strengths.map((r) => (
                  <span key={r.slug} className="inline-flex items-center rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700">
                    {r.name} · {r.percent}%
                  </span>
                ))
              ) : (
                <span className="text-xs text-ink-400">Keep practicing to build strengths.</span>
              )}
            </div>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-ink-400">Focus next</p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {focus.length ? (
                focus.map((r) => (
                  <button
                    key={r.slug}
                    type="button"
                    onClick={() => onSelect(r.slug)}
                    className="inline-flex items-center rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-700 transition-colors hover:bg-amber-100"
                  >
                    {r.name}{r.started ? ` · ${r.percent}%` : ''}
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
