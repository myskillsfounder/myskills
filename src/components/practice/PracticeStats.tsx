import { useEffect, useState } from 'react'
import { skillTracks } from '@/lib/skillTracks'
import type { PracticeSummary } from '@/lib/practiceResults'
import { digitalMarketingProgress } from '@/lib/programmes'
import {
  ACTIVITY_HELD_CAP,
  FOUNDATION_MAX_POINTS,
  LIVE_SESSIONS_MAX_POINTS,
  POINTS_PER_LIVE_SESSION,
  PRACTICE_MAX_POINTS,
  PROFESSIONAL_MAX,
  PROJECT_MAX,
  countedActivity,
  professionalActivity,
  professionalPoints,
  type ProjectStanding,
} from '@/lib/readinessScore'

const R = 34
const C = 2 * Math.PI * R

/**
 * The Digital Marketing half of /practice, built the same way as the Career
 * Readiness card beside it (CareerReadinessOverview): the ring is how far
 * through the programme you are, the headline is the Career Readiness points
 * the programme has earned you, and one bead per track shows coverage.
 *
 * The headline is the whole Professional Development part of the Career
 * Readiness Score (out of 40): activity (tracks, the Foundation assessment,
 * live training; 20) and the project a mentor grades (20).
 *
 * No practice percentage here on purpose: an average of the tracks you
 * happen to have tried reads as "82% · Advanced" after a single track. Each
 * track's own result is on the track list below.
 *
 * Progress is the same number as the LaunchPad's course card
 * (digitalMarketingProgress): the aptitude assessment, the Foundation
 * assessment, the 8 tracks, the mentor review and the internship.
 */
export function PracticeStats({
  practice,
  foundationDone,
  aptitudeDone,
  project,
  foundationPercent,
  liveSessions,
}: {
  practice: PracticeSummary
  foundationDone: boolean
  /** The marketing aptitude assessment — a step of the programme's progress. */
  aptitudeDone: boolean
  /** Where the programme's project stands with its mentor, and its best grade. */
  project: ProjectStanding
  /** Foundation assessment percent, or null if not taken. */
  foundationPercent: number | null
  /** Digital Marketing live training sessions, confirmed by whoever ran them. */
  liveSessions: number
}) {
  const rows = skillTracks.map((t) => ({ slug: t.slug, name: t.name, result: practice[t.slug] }))
  const practised = rows.filter((r) => r.result).length
  const { percent } = digitalMarketingProgress(
    foundationDone,
    practised,
    skillTracks.length,
    project.status === 'approved',
    false,
    aptitudeDone,
  )
  const standing = {
    dmTrackPercents: rows.flatMap((r) => (r.result ? [r.result.percent] : [])),
    foundationPercent,
    dmLiveSessions: liveSessions,
    dmProject: project,
  }
  const points = Math.round(professionalPoints(standing))
  const activity = professionalActivity(standing)
  const held = Math.round(activity - countedActivity(activity, project))

  // animate the ring from 0 on mount
  const [shown, setShown] = useState(0)
  useEffect(() => {
    const id = window.setTimeout(() => setShown(percent), 120)
    return () => window.clearTimeout(id)
  }, [percent])

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
        <div className="relative h-[92px] w-[92px] shrink-0">
          <svg viewBox="0 0 80 80" className="h-full w-full -rotate-90" aria-hidden>
            <circle cx="40" cy="40" r={R} fill="none" stroke="currentColor" strokeWidth="8" className="text-white/15" />
            <circle
              cx="40"
              cy="40"
              r={R}
              fill="none"
              stroke="currentColor"
              strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={C}
              strokeDashoffset={C * (1 - shown / 100)}
              className="text-brand-200 transition-[stroke-dashoffset] duration-700"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="font-display text-xl font-semibold leading-none text-white">{percent}%</span>
            <span className="mt-1 text-[9px] font-medium leading-none text-white/60">
              {percent > 0 ? 'Complete' : 'Not started'}
            </span>
          </div>
        </div>

        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/60">
            Professional Development Score
          </p>
          <p className="mt-1.5 font-display text-2xl font-semibold leading-tight text-white">
            {points}
            <span className="text-base font-normal text-white/50"> / {PROFESSIONAL_MAX} points</span>
          </p>
          <p className="mt-1 text-xs leading-relaxed text-white/70">
            Tracks add up to {PRACTICE_MAX_POINTS} (the higher your score, the more), the Foundation assessment up to{' '}
            {FOUNDATION_MAX_POINTS}, live training up to {LIVE_SESSIONS_MAX_POINTS}, and your project, graded by a
            mentor, up to {PROJECT_MAX}.
            {held > 0 &&
              ` ${held} of your earned points are held until your project passes (only ${ACTIVITY_HELD_CAP} count before then).`}
          </p>
        </div>

        <div className="min-w-0 sm:w-56">
          <div className="flex items-center gap-2">
            <div className="flex flex-1 items-center gap-[3px] rounded-full bg-white/10 p-1.5">
              {rows.map((r) => (
                <span
                  key={r.slug}
                  title={r.result ? `${r.name} — practised` : `${r.name} — not practised yet`}
                  className={`h-2.5 flex-1 rounded-full ${r.result ? 'bg-brand-200' : 'bg-white/15'}`}
                />
              ))}
            </div>
            <span className="font-display text-lg font-semibold text-white">
              {practised}/{skillTracks.length}
            </span>
          </div>
          <p className="mt-1.5 text-[11px] text-white/60">One bead per track.</p>
        </div>
      </div>

      <div className="relative mt-5 grid grid-cols-3 divide-x divide-white/10 border-t border-white/10 pt-4 text-center">
        <div>
          <p className="text-[11px] font-medium text-white/60">Tracks practised</p>
          <p className="mt-0.5 font-display text-lg font-semibold text-white">
            {practised}
            <span className="text-sm font-normal text-white/50">/{skillTracks.length}</span>
          </p>
        </div>
        <div>
          <p className="text-[11px] font-medium text-white/60">Live training</p>
          <p className="mt-0.5 font-display text-lg font-semibold text-white">
            {liveSessions}
            <span className="text-sm font-normal text-white/50">/{LIVE_SESSIONS_MAX_POINTS / POINTS_PER_LIVE_SESSION}</span>
          </p>
        </div>
        <div>
          <p className="text-[11px] font-medium text-white/60">Readiness points</p>
          <p className="mt-0.5 font-display text-lg font-semibold text-white">
            {points}
            <span className="text-sm font-normal text-white/50">/{PROFESSIONAL_MAX}</span>
          </p>
        </div>
      </div>
    </section>
  )
}
