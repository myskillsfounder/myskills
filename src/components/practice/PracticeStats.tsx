import { skillTracks } from '@/lib/skillTracks'
import type { PracticeSummary } from '@/lib/practiceResults'
import { levelLabel } from './practiceStatus'

/**
 * Compact progress read-out for the top of the practice page: a score ring,
 * the level it maps to, and three headline numbers.
 *
 * Deliberately shorter than the old overview card — the strengths/focus chip
 * lists it used to carry duplicated the track list directly below it, so they
 * were removed rather than repeated.
 */
export function PracticeStats({ practice }: { practice: PracticeSummary }) {
  const rows = skillTracks.map((t) => {
    const r = practice[t.slug]
    return { percent: r?.percent ?? 0, started: Boolean(r), attempts: r?.attempts ?? 0 }
  })
  const started = rows.filter((r) => r.started)
  const avg = started.length
    ? Math.round(started.reduce((s, r) => s + r.percent, 0) / started.length)
    : 0
  const attempts = rows.reduce((s, r) => s + r.attempts, 0)
  const best = started.length ? Math.max(...started.map((r) => r.percent)) : 0

  const R = 34
  const C = 2 * Math.PI * R
  const offset = C * (1 - avg / 100)

  return (
    <section className="rounded-2xl border border-brand-100 bg-gradient-to-br from-brand-50 to-white p-4 sm:p-5">
      <div className="flex items-center gap-4 sm:gap-5">
        <div className="relative h-[64px] w-[64px] shrink-0 sm:h-[76px] sm:w-[76px]">
          <svg viewBox="0 0 80 80" className="h-full w-full -rotate-90">
            <circle cx="40" cy="40" r={R} fill="none" stroke="currentColor" strokeWidth="7" className="text-brand-100" />
            <circle
              cx="40" cy="40" r={R} fill="none" stroke="currentColor" strokeWidth="7" strokeLinecap="round"
              className="text-brand-600 transition-all"
              strokeDasharray={C} strokeDashoffset={offset}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-lg font-semibold leading-none tracking-tight text-ink-900">{avg}%</span>
            <span className="mt-0.5 text-[9px] font-medium leading-none text-ink-400">avg best</span>
          </div>
        </div>

        <div className="min-w-0">
          <p className="text-xs font-medium text-brand-700">Overall skill level</p>
          <p className="text-xl font-semibold tracking-tight text-ink-900 sm:text-2xl">
            {levelLabel(avg, started.length)}
          </p>
          <p className="mt-0.5 text-xs text-ink-500">
            {started.length === 0
              ? 'Practice a track to start building your score.'
              : 'Average across your best score in each track.'}
          </p>
        </div>
      </div>

      <div className="mt-4 flex items-stretch overflow-hidden rounded-xl border border-brand-100 bg-white/70">
        {[
          { label: 'Tracks practiced', value: `${started.length}`, suffix: `/${skillTracks.length}` },
          { label: 'Total attempts', value: `${attempts}`, suffix: '' },
          { label: 'Best track', value: started.length ? `${best}` : '—', suffix: started.length ? '%' : '' },
        ].map((m, i) => (
          <div key={m.label} className={`flex-1 px-3 py-2.5 sm:px-4 ${i > 0 ? 'border-l border-brand-100' : ''}`}>
            <p className="truncate text-[11px] font-medium text-ink-500">{m.label}</p>
            <p className="mt-0.5 text-lg font-semibold tracking-tight text-ink-900">
              {m.value}
              <span className="text-sm font-normal text-ink-400">{m.suffix}</span>
            </p>
          </div>
        ))}
      </div>
    </section>
  )
}
