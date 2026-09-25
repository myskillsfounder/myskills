import { Link } from '@tanstack/react-router'
import { ArrowRight } from 'lucide-react'
import type { ProgrammeProgress } from '@/lib/careerReadinessProgramme'
import { CR_SIGNOFF_POINTS, PERSONAL_MAX, POINTS_PER_MODULE, personalPoints } from '@/lib/readinessScore'

const Rings = () => (
  <span aria-hidden className="pointer-events-none absolute -right-10 -top-10 opacity-[0.16]">
    <svg width="200" height="200" viewBox="0 0 200 200" fill="none" stroke="#f6e3c8" strokeWidth="2">
      <circle cx="130" cy="70" r="76" />
      <circle cx="130" cy="70" r="56" />
      <circle cx="130" cy="70" r="36" />
      <circle cx="130" cy="70" r="16" />
    </svg>
  </span>
)

const R = 34
const CIRC = 2 * Math.PI * R

/**
 * The Career Readiness half of /practice, built to mirror the Digital
 * Marketing half (PracticeStats + NextUpCard) card for card, so the two
 * programmes read as one system: a score card with the learner's progress, and
 * a "start here" card that takes them to the next module.
 */
export function CareerReadinessOverview({
  progress,
  mentorApproved,
}: {
  progress: ProgrammeProgress
  mentorApproved: boolean
}) {
  const { modules, modulesDone, modulesTotal, itemsDone, itemsTotal, next, started } = progress
  const percent = itemsTotal ? Math.round((itemsDone / itemsTotal) * 100) : 0
  const points = personalPoints({ modulesDone, crSignedOff: mentorApproved })
  const target = next ?? modules[0]
  const targetIndex = modules.findIndex((m) => m.slug === target.slug)

  return (
    <div className="grid gap-5 lg:grid-cols-3">
      {/* Score card */}
      <section className="surface-wood-dark rise-in relative overflow-hidden rounded-2xl p-5 shadow-e2 sm:p-6 lg:col-span-2">
        <Rings />
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
                strokeDasharray={CIRC}
                strokeDashoffset={CIRC * (1 - percent / 100)}
                className="text-brand-200 transition-[stroke-dashoffset] duration-700"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="font-display text-xl font-semibold leading-none text-white">{percent}%</span>
              <span className="mt-1 text-[9px] font-medium leading-none text-white/60">
                {started ? 'Complete' : 'Not started'}
              </span>
            </div>
          </div>

          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/60">
              Personal Development Score
            </p>
            <p className="mt-1.5 font-display text-2xl font-semibold leading-tight text-white">
              {points}
              <span className="text-base font-normal text-white/50"> / {PERSONAL_MAX} points</span>
            </p>
            <p className="mt-1 text-xs leading-relaxed text-white/70">
              {POINTS_PER_MODULE} points for every module you finish, and {CR_SIGNOFF_POINTS} more when a mentor
              signs off your practice.
            </p>
          </div>

          <div className="min-w-0 sm:w-56">
            <div className="flex items-center gap-2">
              <div className="flex flex-1 items-center gap-[3px] rounded-full bg-white/10 p-1.5">
                {modules.map((m) => (
                  <span
                    key={m.slug}
                    title={`${m.title} — ${m.done} of ${m.total}`}
                    className={`h-2.5 flex-1 rounded-full ${
                      m.complete ? 'bg-brand-200' : m.started ? 'bg-brand-200/45' : 'bg-white/15'
                    }`}
                  />
                ))}
              </div>
              <span className="font-display text-lg font-semibold text-white">
                {modulesDone}/{modulesTotal}
              </span>
            </div>
            <p className="mt-1.5 text-[11px] text-white/60">One bead per module.</p>
          </div>
        </div>

        <div className="relative mt-5 grid grid-cols-3 divide-x divide-white/10 border-t border-white/10 pt-4 text-center">
          <div>
            <p className="text-[11px] font-medium text-white/60">Modules completed</p>
            <p className="mt-0.5 font-display text-lg font-semibold text-white">
              {modulesDone}
              <span className="text-sm font-normal text-white/50">/{modulesTotal}</span>
            </p>
          </div>
          <div>
            <p className="text-[11px] font-medium text-white/60">Tasks written</p>
            <p className="mt-0.5 font-display text-lg font-semibold text-white">
              {itemsDone}
              <span className="text-sm font-normal text-white/50">/{itemsTotal}</span>
            </p>
          </div>
          <div>
            <p className="text-[11px] font-medium text-white/60">Readiness points</p>
            <p className="mt-0.5 font-display text-lg font-semibold text-white">
              {points}
              <span className="text-sm font-normal text-white/50">/{PERSONAL_MAX}</span>
            </p>
          </div>
        </div>
      </section>

      {/* Next up */}
      <Link
        to="/career-module/$slug"
        params={{ slug: target.slug }}
        className="surface-wood-dark lift rise-in group relative flex h-full w-full flex-col justify-between overflow-hidden rounded-2xl p-5 text-left shadow-md sm:p-6"
      >
        <Rings />
        <div className="relative">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/60">
            {next ? (started ? 'Next up' : 'Start here') : 'All modules done'}
          </p>
          <p className="mt-1.5 font-display text-2xl font-semibold leading-tight text-white">{target.title}</p>
          <p className="mt-1.5 text-xs text-white/70">
            Module {targetIndex + 1} of {modulesTotal}
            {next ? ` · ${target.done} of ${target.total} written` : ' · review your answers'}
          </p>
        </div>
        <span className="relative mt-6 flex items-center justify-between gap-3">
          <span className="text-xs font-semibold text-white/80">
            {!next ? 'Open module' : target.started ? 'Continue' : 'Begin the module'}
          </span>
          <span className="flex h-11 w-11 items-center justify-center rounded-full bg-white text-ink-800 shadow-lg transition-transform duration-300 group-hover:translate-x-1 group-hover:scale-110">
            <ArrowRight size={20} />
          </span>
        </span>
      </Link>
    </div>
  )
}
