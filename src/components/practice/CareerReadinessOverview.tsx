import { useEffect, useState } from 'react'
import { Link } from '@tanstack/react-router'
import { ArrowRight, CheckCircle2 } from 'lucide-react'
import { useAuthUser } from '@/lib/useAuth'
import {
  CAREER_READINESS,
  fetchMyProgrammeInterest,
  PERSONAL_DEVELOPMENT_MODULES,
} from '@/lib/programmes'
import { PERSONAL_MAX } from '@/lib/readinessScore'

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

/**
 * The Career Readiness half of /practice, built to mirror the Digital
 * Marketing half (PracticeStats + NextUpCard) card for card, so the two
 * programmes read as one system. Nothing is earned here until the programme
 * opens — the card says so plainly instead of showing a 0% that reads like
 * failure.
 */
export function CareerReadinessOverview() {
  const { user } = useAuthUser()
  const [joined, setJoined] = useState<boolean | null>(null)

  useEffect(() => {
    if (!user) return
    let active = true
    fetchMyProgrammeInterest(CAREER_READINESS.slug).then((r) => active && setJoined(Boolean(r)))
    return () => {
      active = false
    }
  }, [user])

  const total = PERSONAL_DEVELOPMENT_MODULES.length
  const first = PERSONAL_DEVELOPMENT_MODULES[0]

  return (
    <div className="grid gap-5 lg:grid-cols-3">
      {/* Score card */}
      <section className="surface-wood-dark rise-in relative overflow-hidden rounded-2xl p-5 shadow-e2 sm:p-6 lg:col-span-2">
        <Rings />
        <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center">
          <div className="relative h-[92px] w-[92px] shrink-0">
            <svg viewBox="0 0 80 80" className="h-full w-full -rotate-90" aria-hidden>
              <circle cx="40" cy="40" r="34" fill="none" stroke="currentColor" strokeWidth="8" strokeDasharray="4 6" className="text-white/20" />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="font-display text-xl font-semibold leading-none text-white/80">—</span>
              <span className="mt-1 text-[9px] font-medium leading-none text-white/60">Not started</span>
            </div>
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="flex h-2 w-2 rounded-full bg-white/40" />
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/60">
                Personal Development Score
              </p>
            </div>
            <p className="mt-1.5 font-display text-2xl font-semibold leading-tight text-white">
              {joined ? 'You’re on the waitlist' : 'Opens with the programme'}
            </p>
            <p className="mt-1 text-xs leading-relaxed text-white/70">
              Built across all {total} modules — and worth up to {PERSONAL_MAX} points of your Career
              Readiness Score.
            </p>
          </div>

          <div className="min-w-0 sm:w-56">
            <div className="flex items-center gap-2">
              <div className="flex flex-1 items-center gap-[3px] rounded-full bg-white/10 p-1.5">
                {PERSONAL_DEVELOPMENT_MODULES.map((m) => (
                  <span key={m.title} className="h-2.5 flex-1 rounded-full bg-white/15" title={m.title} />
                ))}
              </div>
              <span className="font-display text-lg font-semibold text-white">0/{total}</span>
            </div>
            <p className="mt-1.5 text-[11px] text-white/60">One bead per module.</p>
          </div>
        </div>

        <div className="relative mt-5 grid grid-cols-3 divide-x divide-white/10 border-t border-white/10 pt-4 text-center">
          <div>
            <p className="text-[11px] font-medium text-white/60">Modules completed</p>
            <p className="mt-0.5 font-display text-lg font-semibold text-white">
              0<span className="text-sm font-normal text-white/50">/{total}</span>
            </p>
          </div>
          <div>
            <p className="text-[11px] font-medium text-white/60">Status</p>
            <p className="mt-0.5 font-display text-lg font-semibold text-white">
              {joined ? 'Waitlisted' : 'Not joined'}
            </p>
          </div>
          <div>
            <p className="text-[11px] font-medium text-white/60">Readiness points</p>
            <p className="mt-0.5 font-display text-lg font-semibold text-white">
              0<span className="text-sm font-normal text-white/50">/{PERSONAL_MAX}</span>
            </p>
          </div>
        </div>
      </section>

      {/* Start here */}
      <Link
        to={CAREER_READINESS.path}
        className="surface-wood-dark lift rise-in group relative flex h-full w-full flex-col justify-between overflow-hidden rounded-2xl p-5 text-left shadow-md sm:p-6"
      >
        <Rings />
        <div className="relative">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/60">Start here</p>
          <p className="mt-1.5 font-display text-2xl font-semibold leading-tight text-white">{first.title}</p>
          <p className="mt-1.5 text-xs text-white/70">Module 1 of {total} · with AI</p>
          {joined && (
            <p className="mt-3 inline-flex items-center gap-1.5 text-xs font-medium text-emerald-300">
              <CheckCircle2 size={13} /> We’ll email you when it opens
            </p>
          )}
        </div>
        <span className="relative mt-6 flex items-center justify-between gap-3">
          <span className="text-xs font-semibold text-white/80">{joined ? 'See the programme' : 'Join the programme'}</span>
          <span className="flex h-11 w-11 items-center justify-center rounded-full bg-white text-ink-800 shadow-lg transition-transform duration-300 group-hover:translate-x-1 group-hover:scale-110">
            <ArrowRight size={20} />
          </span>
        </span>
      </Link>
    </div>
  )
}
