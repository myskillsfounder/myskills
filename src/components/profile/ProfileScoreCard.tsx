import { Link } from '@tanstack/react-router'
import { ArrowRight, CheckCircle2 } from 'lucide-react'
import type { Readiness, ReadinessComponent } from '@/lib/readinessScore'

function Bar({ label, c }: { label: string; c: ReadinessComponent }) {
  const pct = c.max ? (c.points / c.max) * 100 : 0
  return (
    <div>
      <div className="flex items-baseline justify-between gap-3 text-xs">
        <span className="font-medium text-ink-700">{label}</span>
        <span className="tabular-nums text-ink-500">
          {Math.round(c.points)}/{c.max}
        </span>
      </div>
      <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-ink-100">
        <div
          className="h-full rounded-full bg-brand-600"
          style={{ width: c.points > 0 ? `${Math.max(pct, 3)}%` : '0%' }}
        />
      </div>
    </div>
  )
}

/**
 * A compact readout of the Career Readiness Score for the profile page —
 * the one place a student's whole standing should be visible at a glance,
 * not just on the LaunchPad. Links out to the LaunchPad for the full
 * breakdown and next step rather than duplicating that here.
 */
export function ProfileScoreCard({ readiness }: { readiness: Readiness | null }) {
  if (!readiness) {
    return (
      <section className="card p-5 sm:p-6">
        <div className="h-24 animate-pulse rounded-xl bg-ink-100" />
      </section>
    )
  }

  const { score, band, personal, professional, internship, verifiedPoints, selfReportedPoints } = readiness
  const counted = Math.round(verifiedPoints + selfReportedPoints)
  const R = 30
  const C = 2 * Math.PI * R

  return (
    <section className="card p-5 sm:p-6">
      <div className="flex items-center justify-between gap-2">
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-brand-700">
          Career Readiness Score
        </p>
        <Link
          to="/dashboard"
          className="inline-flex items-center gap-1 text-xs font-semibold text-brand-700 hover:text-brand-800"
        >
          Full breakdown <ArrowRight size={12} />
        </Link>
      </div>

      <div className="mt-3 flex items-center gap-4">
        <div className="relative h-20 w-20 shrink-0">
          <svg viewBox="0 0 72 72" className="h-full w-full -rotate-90" aria-hidden>
            <circle cx="36" cy="36" r={R} fill="none" strokeWidth="7" className="stroke-brand-100" />
            {score > 0 && (
              <circle
                cx="36"
                cy="36"
                r={R}
                fill="none"
                strokeWidth="7"
                strokeLinecap="round"
                className="stroke-brand-600"
                strokeDasharray={C}
                strokeDashoffset={C * (1 - score / 100)}
              />
            )}
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="font-display text-2xl font-semibold leading-none text-ink-900">{score}</span>
            <span className="text-[9px] font-medium text-ink-500">/ 100</span>
          </div>
        </div>
        <div className="min-w-0">
          <p className="font-display text-base font-semibold text-ink-900">{band.label}</p>
          {counted > 0 && (
            <p className="mt-1 inline-flex items-center gap-1 text-xs text-ink-600">
              <CheckCircle2 size={13} className={verifiedPoints > 0 ? 'text-emerald-600' : 'text-ink-300'} />
              {Math.round(verifiedPoints)} of {counted} points checked
            </p>
          )}
        </div>
      </div>

      <div className="mt-4 space-y-3">
        <Bar label="Personal Development" c={personal} />
        <Bar label="Professional Development" c={professional} />
        <Bar label="Internship" c={internship} />
      </div>
    </section>
  )
}
