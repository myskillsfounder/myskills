import { useEffect, useState } from 'react'
import { TrendingUp } from 'lucide-react'
import { skillTracks } from '@/lib/skillTracks'
import type { PracticeSummary } from '@/lib/practiceResults'
import { levelLabel } from './practiceStatus'

/** Progress read-out: score ring, the level it maps to, and headline numbers. */
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

  // animate the ring + bar from 0 on mount
  const [shown, setShown] = useState(0)
  useEffect(() => {
    const id = window.setTimeout(() => setShown(avg), 120)
    return () => window.clearTimeout(id)
  }, [avg])

  const R = 34
  const C = 2 * Math.PI * R
  const offset = C * (1 - shown / 100)
  const beads = 14
  const filled = Math.round((shown / 100) * beads)

  return (
    <section className="surface-wood rise-in rounded-2xl border border-ink-900/[0.08] p-5 shadow-e1 sm:p-6">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
        {/* ring */}
        <div className="relative h-[92px] w-[92px] shrink-0">
          <svg viewBox="0 0 80 80" className="h-full w-full -rotate-90">
            <circle cx="40" cy="40" r={R} fill="none" stroke="currentColor" strokeWidth="8" className="text-brand-100" />
            <circle
              cx="40" cy="40" r={R} fill="none" stroke="currentColor" strokeWidth="8" strokeLinecap="round"
              className="text-brand-600"
              strokeDasharray={C}
              strokeDashoffset={offset}
              style={{ transition: 'stroke-dashoffset 1.1s cubic-bezier(0.2,0.8,0.2,1)' }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="font-display text-xl font-semibold leading-none text-ink-900">{avg}%</span>
            <span className="mt-1 text-[9px] font-medium leading-none text-ink-600">Avg. score</span>
          </div>
        </div>

        <div className="min-w-0 flex-1">
          <p className="text-xs font-medium text-ink-600">Overall skill level</p>
          <p className="font-display text-2xl font-semibold leading-tight text-ink-900">
            {levelLabel(avg, started.length)}
          </p>
          <p className="mt-1 text-xs leading-relaxed text-ink-600">
            {started.length === 0
              ? 'Practice a track to start building your score.'
              : 'Average across your best score in each track.'}
          </p>
        </div>

        {/* bead progress */}
        <div className="min-w-0 sm:w-56">
          <div className="flex items-center gap-2">
            <div className="flex flex-1 items-center gap-[3px] rounded-full bg-ink-100 p-1.5">
              {Array.from({ length: beads }).map((_, i) => (
                <span
                  key={i}
                  className={`h-2.5 flex-1 rounded-full transition-all duration-500 ${
                    i < filled ? 'bg-brand-600' : 'bg-brand-100'
                  }`}
                  style={{ transitionDelay: `${i * 45}ms` }}
                />
              ))}
            </div>
            <span className="font-display text-lg font-semibold text-ink-900">{avg}%</span>
          </div>
          <p className="mt-1.5 text-[11px] text-ink-600">
            {avg >= 70 ? 'Excellent work — keep the streak alive.' : 'Keep going! You’re making steady progress.'}
          </p>
        </div>
      </div>

      {/* stat strip */}
      <div className="mt-5 grid grid-cols-3 divide-x divide-ink-900/[0.06] border-t border-ink-900/[0.06] pt-4 text-center">
        <div>
          <p className="text-[11px] font-medium text-ink-600">Tracks practiced</p>
          <p className="mt-0.5 font-display text-lg font-semibold text-ink-900">
            {started.length}
            <span className="text-sm font-normal text-ink-500">/{skillTracks.length}</span>
          </p>
        </div>
        <div>
          <p className="text-[11px] font-medium text-ink-600">Total attempts</p>
          <p className="mt-0.5 font-display text-lg font-semibold text-ink-900">{attempts}</p>
        </div>
        <div>
          <p className="text-[11px] font-medium text-ink-600">Best track</p>
          <p className="mt-0.5 inline-flex items-center gap-1 font-display text-lg font-semibold text-ink-900">
            {best}%
            {best > 0 && <TrendingUp size={14} className="text-emerald-700" />}
          </p>
        </div>
      </div>
    </section>
  )
}
