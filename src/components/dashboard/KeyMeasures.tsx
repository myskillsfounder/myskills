import { useMemo } from 'react'
import { Link } from '@tanstack/react-router'
import {
  ArrowRight,
  BookOpen,
  Briefcase,
  Clock,
  Compass,
  Flame,
  Laptop,
  Megaphone,
  Rocket,
  Sparkles,
  Target,
  TrendingUp,
  Users,
} from 'lucide-react'
import type { CourseProgress } from '@/lib/programmes'
import { goalLabel, resolveGoal, type PrimaryGoal } from '@/lib/onboardingContent'
import { timeSeries } from '@/lib/timeTracker'
import { rememberProgramme } from '@/lib/practiceProgramme'

/** Each programme gets its own mark, so the two courses read apart at a
 *  glance: a megaphone for marketing, a compass for finding your direction. */
const COURSE_LOOK: Record<1 | 2, { icon: typeof BookOpen; tile: string; bar: string; text: string }> = {
  1: {
    icon: Megaphone,
    tile: 'from-brand-400 to-brand-700 shadow-[0_6px_14px_-6px_rgba(111,99,226,0.7)]',
    bar: 'from-brand-500 to-brand-700',
    text: 'text-brand-700',
  },
  2: {
    icon: Compass,
    tile: 'from-emerald-400 to-teal-600 shadow-[0_6px_14px_-6px_rgba(16,185,129,0.7)]',
    bar: 'from-emerald-500 to-teal-600',
    text: 'text-emerald-700',
  },
}

const GOAL_ICON: Record<PrimaryGoal['icon'], typeof Target> = {
  briefcase: Briefcase,
  rocket: Rocket,
  sparkles: Sparkles,
  'trending-up': TrendingUp,
  laptop: Laptop,
  users: Users,
}

/** The goal the LaunchPad is built around: it leads the objective card, large,
 *  with its mark and what it means, since everything else answers to it. */
function GoalHero({ goal }: { goal: string }) {
  const resolved = resolveGoal(goal)
  const Icon = resolved ? GOAL_ICON[resolved.icon] : Target
  return (
    <div className="surface-wood-dark relative mt-3.5 overflow-hidden rounded-2xl p-4 shadow-e2">
      <div
        aria-hidden
        className="pointer-events-none absolute -right-8 -top-10 h-32 w-32 rounded-full bg-brand-400/30 blur-2xl"
      />
      <div className="relative flex items-center gap-3.5">
        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-brand-300 to-brand-600 text-white shadow-[0_8px_18px_-6px_rgba(111,99,226,0.8)] ring-1 ring-white/30">
          <Icon size={22} strokeWidth={2.1} />
        </span>
        <div className="min-w-0">
          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-white/60">I’m working to</p>
          <p className="font-display text-xl font-semibold leading-tight text-white">
            {resolved?.label ?? goalLabel(goal)}
          </p>
        </div>
      </div>
      {resolved && <p className="relative mt-2.5 text-xs leading-relaxed text-white/70">{resolved.description}</p>}
    </div>
  )
}

/** A new student's first step: the two aptitude assessments, one per programme
 *  (either one opens Practice). It fills the space under "Courses in progress",
 *  which is otherwise nearly empty before anything has been started. */
function StartHere() {
  const options = [
    { to: '/aptitude-assessment', label: 'Marketing aptitude', sub: 'Digital Marketing Programme', look: COURSE_LOOK[1] },
    { to: '/career-readiness-assessment', label: 'Personal aptitude', sub: 'Career Readiness Programme', look: COURSE_LOOK[2] },
  ] as const
  return (
    <div className="mt-4 border-t border-ink-900/[0.06] pt-4">
      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-500">Start here</p>
      <p className="mt-1.5 font-display text-base font-semibold leading-snug text-ink-900">
        Take an aptitude assessment
      </p>
      <p className="mt-1 text-xs leading-relaxed text-ink-500">
        20 statements, about 5 minutes, no right answers. Pick one — either opens Practice.
      </p>
      <ul className="mt-3 space-y-2">
        {options.map((o) => (
          <li key={o.to}>
            <Link
              to={o.to}
              className="press group flex items-center gap-3 rounded-xl border border-ink-900/[0.08] p-2.5 transition-colors hover:border-brand-300"
            >
              <span
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br text-white ring-1 ring-white/40 ${o.look.tile}`}
              >
                <o.look.icon size={18} strokeWidth={2.2} />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-semibold text-ink-900">{o.label}</span>
                <span className="block text-[11px] leading-snug text-ink-500">{o.sub}</span>
              </span>
              <ArrowRight
                size={15}
                className="shrink-0 text-ink-400 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:text-brand-600"
              />
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )
}

/**
 * The two measures that sit beside the score: what the student is aiming at,
 * and how much time they're putting in. Neither feeds the score (hours are
 * device-local), but both are what give the number meaning.
 */
export function KeyMeasures({
  goals,
  streak,
  courses,
  startHere = false,
  showHours = true,
}: {
  goals: string[]
  streak: number
  /** The programmes working toward the objective, e.g. Digital Marketing. */
  courses: CourseProgress[]
  /** The student hasn't taken any aptitude assessment yet. */
  startHere?: boolean
  /** The hours card says nothing before they've begun, so a new student's
   *  LaunchPad leaves it out. */
  showHours?: boolean
}) {
  const hours = useMemo(() => timeSeries('month').totalHours, [])
  const [primary, ...rest] = goals

  return (
    <div className="flex h-full flex-col gap-5">
      <section className="card flex-1 p-5">
        <div className="flex items-center gap-2">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
            <Target size={16} />
          </span>
          <h2 className="text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-600">
            Your objective
          </h2>
        </div>

        {primary ? (
          <>
            <GoalHero goal={primary} />
            {rest.length > 0 && (
              <p className="mt-2.5 text-xs leading-relaxed text-ink-500">
                Also: {rest.map(goalLabel).join(' · ')}
              </p>
            )}
          </>
        ) : (
          <p className="mt-3 text-sm leading-relaxed text-ink-600">
            You didn’t pick an objective during onboarding.
          </p>
        )}

        {courses.length > 0 && (
          <div className="mt-4 border-t border-ink-900/[0.06] pt-4">
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-500">
              Courses in progress
            </p>
            <ul className="mt-2.5 space-y-2.5">
              {courses.map((c) => (
                <li key={c.name}>
                  <Link
                    to={c.path}
                    onClick={() => c.programme && rememberProgramme(c.programme)}
                    className="group block rounded-xl border border-ink-900/[0.08] p-3 transition-colors hover:border-brand-300"
                  >
                    <div className="flex items-center gap-3">
                      {(() => {
                        const look = c.programme ? COURSE_LOOK[c.programme] : null
                        const Icon = look?.icon ?? BookOpen
                        return (
                          <span
                            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br text-white ring-1 ring-white/40 ${
                              look?.tile ?? 'from-brand-500 to-brand-700'
                            }`}
                          >
                            <Icon size={18} strokeWidth={2.2} />
                          </span>
                        )
                      })()}
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-ink-900">{c.name}</p>
                        <p className="text-[11px] leading-snug text-ink-500">{c.detail}</p>
                      </div>
                      <ArrowRight
                        size={15}
                        className="shrink-0 text-ink-400 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:text-brand-600"
                      />
                    </div>
                    <div className="mt-2.5 flex items-center gap-2">
                      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-ink-100">
                        <div
                          className={`h-full rounded-full bg-gradient-to-r ${
                            (c.programme && COURSE_LOOK[c.programme].bar) || 'from-brand-500 to-brand-700'
                          }`}
                          style={{ width: c.percent > 0 ? `${Math.max(c.percent, 4)}%` : '0%' }}
                        />
                      </div>
                      <span
                        className={`shrink-0 text-[11px] font-semibold tabular-nums ${
                          (c.programme && COURSE_LOOK[c.programme].text) || 'text-brand-700'
                        }`}
                      >
                        {c.status === 'Not started' ? c.status : `${c.percent}%`}
                      </span>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )}

        {startHere && <StartHere />}
      </section>

      {showHours && (
      <section className="card p-5">
        <div className="flex items-center gap-2">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
            <Clock size={16} />
          </span>
          <h2 className="text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-600">
            Hours spent
          </h2>
        </div>
        <p className="mt-3 flex items-baseline gap-1.5">
          <span className="font-display text-4xl font-semibold tabular-nums leading-none text-ink-900">
            {hours < 10 ? hours.toFixed(1) : Math.round(hours)}
          </span>
          <span className="text-sm font-medium text-ink-500">hrs · last 30 days</span>
        </p>
        <p className="mt-3 inline-flex items-center gap-1.5 text-xs font-medium text-ink-600">
          <Flame size={13} className="text-orange-500" />
          {streak}-day streak
        </p>
        <p className="mt-2 text-[11px] leading-relaxed text-ink-400">Tracked on this device.</p>
      </section>
      )}
    </div>
  )
}
