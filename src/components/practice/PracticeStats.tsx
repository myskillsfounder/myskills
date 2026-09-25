import { useEffect, useState } from 'react'
import { TrendingUp } from 'lucide-react'
import { skillTracks } from '@/lib/skillTracks'
import type { PracticeSummary } from '@/lib/practiceResults'
import { STRONG_MIN, levelLabel } from './practiceStatus'

/** Progress read-out, as two separate numbers so neither hides the other:
 *  the SCORE (how well you do — the average of your best result on each track
 *  you've practised) and COMPLETE (how much of the programme you've covered —
 *  tracks practised out of 8). One good track gives a high score but a low
 *  completion, and the card says both. Uses the same dark "feature surface"
 *  treatment as the dashboard's NextStep card. */
export function PracticeStats({ practice }: { practice: PracticeSummary }) {
  const rows = skillTracks.map((t) => {
    const r = practice[t.slug]
    return { slug: t.slug, name: t.name, percent: r?.percent ?? 0, started: Boolean(r), attempts: r?.attempts ?? 0 }
  })
  const started = rows.filter((r) => r.started)
  const avg = started.length
    ? Math.round(started.reduce((s, r) => s + r.percent, 0) / started.length)
    : 0
  const attempts = rows.reduce((s, r) => s + r.attempts, 0)
  const best = started.length ? Math.max(...started.map((r) => r.percent)) : 0
  const strong = started.filter((r) => r.percent >= STRONG_MIN).length
  const complete = Math.round((started.length / skillTracks.length) * 100)

  // animate the ring + bar from 0 on mount
  const [shown, setShown] = useState(0)
  useEffect(() => {
    const id = window.setTimeout(() => setShown(avg), 120)
    return () => window.clearTimeout(id)
  }, [avg])

  const R = 34
  const C = 2 * Math.PI * R
  const offset = C * (1 - shown / 100)

  return (
    <section className="surface-wood-dark rise-in relative overflow-hidden rounded-2xl p-5 shadow-e2 sm:p-6">
      <span aria-hidden className="pointer-events-none absolute -right-10 -top-10 opacity-[0.16]">
        <svg width="200" height="200" viewBox="0 0 200 200" fill="none" stroke="#f6e3c8" strokeWidth="2">
          <circle cx="130" cy="70" r="76" />
          <circle cx="130" cy="70" r="56" />
          <circle cx="130" cy="70" r="36" />
          <circle cx="130" cy="70" r="16" />
        </svg>
      </span>

      <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center">
        {/* ring */}
        <div className="relative h-[92px] w-[92px] shrink-0">
          <svg viewBox="0 0 80 80" className="h-full w-full -rotate-90">
            <circle cx="40" cy="40" r={R} fill="none" stroke="currentColor" strokeWidth="8" className="text-white/15" />
            <circle
              cx="40" cy="40" r={R} fill="none" stroke="currentColor" strokeWidth="8" strokeLinecap="round"
              className="text-brand-400"
              strokeDasharray={C}
              strokeDashoffset={offset}
              style={{ transition: 'stroke-dashoffset 1.1s cubic-bezier(0.2,0.8,0.2,1)' }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="font-display text-xl font-semibold leading-none text-white">{avg}%</span>
            <span className="mt-1 text-[9px] font-medium leading-none text-white/60">Skill score</span>
          </div>
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="flex h-2 w-2 rounded-full bg-brand-400" />
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/60">
              Digital Marketing Skill Score
            </p>
          </div>
          <p className="mt-1.5 font-display text-2xl font-semibold leading-tight text-white">
            {levelLabel(avg, started.length)}
          </p>
          <p className="mt-1 text-xs leading-relaxed text-white/70">
            {started.length === 0
              ? 'Practice a track to start building your score.'
              : `Average of your best result on the ${started.length === 1 ? 'track' : `${started.length} tracks`} you’ve practised.`}
          </p>
        </div>

        {/* completion: one segment per track */}
        <div className="min-w-0 sm:w-56">
          <div className="flex items-baseline justify-between gap-2">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/60">Complete</p>
            <span className="font-display text-lg font-semibold text-white">{complete}%</span>
          </div>
          <div className="mt-1.5 flex items-center gap-[3px] rounded-full bg-white/10 p-1.5">
            {rows.map((r, i) => (
              <span
                key={r.slug}
                title={r.started ? `${r.name} — ${r.percent}%` : `${r.name} — not practised yet`}
                className={`h-2.5 flex-1 rounded-full transition-colors duration-500 ${
                  r.started ? 'bg-brand-400' : 'bg-white/15'
                }`}
                style={{ transitionDelay: `${i * 45}ms` }}
              />
            ))}
          </div>
          <p className="mt-1.5 text-[11px] text-white/60">
            {started.length} of {skillTracks.length} tracks practised
          </p>
        </div>
      </div>

      {/* stat strip */}
      <div className="relative mt-5 grid grid-cols-3 divide-x divide-white/10 border-t border-white/10 pt-4 text-center">
        <div>
          {/* Not "tracks practised" — the completion bar above already says that. */}
          <p className="text-[11px] font-medium text-white/60">Strong tracks</p>
          <p className="mt-0.5 font-display text-lg font-semibold text-white">
            {strong}
            <span className="text-sm font-normal text-white/50">/{skillTracks.length}</span>
          </p>
        </div>
        <div>
          <p className="text-[11px] font-medium text-white/60">Total attempts</p>
          <p className="mt-0.5 font-display text-lg font-semibold text-white">{attempts}</p>
        </div>
        <div>
          <p className="text-[11px] font-medium text-white/60">Best track</p>
          <p className="mt-0.5 inline-flex items-center gap-1 font-display text-lg font-semibold text-white">
            {best}%
            {best > 0 && <TrendingUp size={14} className="text-emerald-400" />}
          </p>
        </div>
      </div>
    </section>
  )
}
