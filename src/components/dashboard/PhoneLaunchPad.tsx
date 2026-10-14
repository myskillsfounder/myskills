import type { ReactNode } from 'react'
import { Link } from '@tanstack/react-router'
import { ArrowRight, BookOpen, ChevronRight, Flame, Target } from 'lucide-react'
import type { Readiness } from '@/lib/readinessScore'
import type { CourseProgress } from '@/lib/programmes'
import { goalLabel } from '@/lib/onboardingContent'
import { rememberProgramme } from '@/lib/practiceProgramme'
import { COURSE_LOOK } from '@/components/dashboard/KeyMeasures'
import { FirstRunPath } from '@/components/dashboard/FirstRunPath'
import { Part, slidesFor, useCountUp, useEntered, type Highlights } from '@/components/dashboard/ReadinessScoreCard'
import { Skeleton } from '@/components/ui'

const EASE = 'cubic-bezier(0.22, 1, 0.36, 1)'

/** The score, sized for a phone: the ring beside its reading rather than above
 *  it, so the number and what it is made of fit on one screen. */
function Score({ readiness }: { readiness: Readiness }) {
  const { score, band, personal, professional, internship } = readiness
  const R = 54
  const C = 2 * Math.PI * R
  const entered = useEntered()
  const shownScore = useCountUp(score, entered)
  return (
    <section className="card p-5">
      <div className="flex items-center gap-4">
        <div className="relative h-24 w-24 shrink-0">
          <svg viewBox="0 0 128 128" className="h-full w-full -rotate-90 overflow-visible" aria-hidden>
            <defs>
              <linearGradient id="readiness-ring-phone" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="var(--color-brand-400)" />
                <stop offset="100%" stopColor="var(--color-brand-700)" />
              </linearGradient>
            </defs>
            <circle cx="64" cy="64" r={R} fill="none" strokeWidth="11" className="stroke-brand-100" />
            {score > 0 && (
              <circle
                cx="64"
                cy="64"
                r={R}
                fill="none"
                strokeWidth="11"
                strokeLinecap="round"
                stroke="url(#readiness-ring-phone)"
                strokeDasharray={C}
                strokeDashoffset={entered ? C * (1 - score / 100) : C}
                opacity={entered ? 1 : 0}
                style={{ transition: `stroke-dashoffset 1.2s ${EASE}, opacity 0.2s ease` }}
              />
            )}
          </svg>
          <div
            className="absolute inset-0 flex flex-col items-center justify-center"
            role="img"
            aria-label={`Career Readiness Score ${score} out of 100`}
          >
            <span className="font-display text-3xl font-semibold leading-none tabular-nums text-ink-900">{shownScore}</span>
            <span className="mt-0.5 text-[10px] font-medium text-ink-500">of 100</span>
          </div>
        </div>
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-brand-700">Career Readiness Score</p>
          <p className="mt-1 font-display text-xl font-semibold leading-tight text-ink-900">{band.label}</p>
          <p className="mt-1 text-xs leading-relaxed text-ink-600">What employers see, built from what you do here.</p>
        </div>
      </div>

      <div className="mt-5 space-y-3.5">
        <Part label="Personal Development" c={personal} tone="personal" entered={entered} delay={150} />
        <Part label="Professional Development" c={professional} tone="professional" entered={entered} delay={300} />
        <Part label="Internship" c={internship} tone="internship" entered={entered} delay={450} />
      </div>
    </section>
  )
}

/** The programmes under way, each one a tap from where it was left. */
function Continue({ courses }: { courses: CourseProgress[] }) {
  return (
    <section>
      <h2 className="text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-600">Continue</h2>
      <ul className="mt-2.5 space-y-2.5">
        {courses.map((c) => {
          const look = c.programme ? COURSE_LOOK[c.programme] : null
          const Icon = look?.icon ?? BookOpen
          return (
            <li key={c.name}>
              <Link
                to="/practice"
                onClick={() => c.programme && rememberProgramme(c.programme)}
                className="card press flex items-center gap-3.5 p-4"
              >
                <span
                  className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br text-white ring-1 ring-white/40 ${
                    look?.tile ?? 'from-brand-500 to-brand-700'
                  }`}
                >
                  <Icon size={19} strokeWidth={2.2} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block font-display text-base font-semibold leading-tight text-ink-900">
                    {c.name.replace(/ Programme$/, '')}
                  </span>
                  <span className="mt-0.5 block text-xs leading-snug text-ink-500">{c.detail}</span>
                  <span className="mt-2 block h-1.5 overflow-hidden rounded-full bg-ink-100">
                    <span
                      className={`block h-full rounded-full bg-gradient-to-r ${look?.bar ?? 'from-brand-500 to-brand-700'}`}
                      style={{ width: `${Math.max(c.percent, 3)}%` }}
                    />
                  </span>
                </span>
                <ChevronRight size={18} className="shrink-0 text-ink-400" />
              </Link>
            </li>
          )
        })}
        {courses.length === 0 && (
          <li>
            <Link to="/practice" className="card press flex items-center justify-between gap-3 p-4">
              <span className="text-sm font-semibold text-ink-900">Open Practice</span>
              <ArrowRight size={16} className="shrink-0 text-ink-400" />
            </Link>
          </li>
        )}
      </ul>
    </section>
  )
}

const TOWARD_TONE = {
  gold: 'bg-amber-50 text-amber-600',
  brand: 'bg-brand-50 text-brand-600',
  green: 'bg-emerald-50 text-emerald-600',
} as const

/** The certificate, the mentor-graded project and the internship: the same three
 *  as the computer's slider, here as a list, since a phone is for tapping a
 *  row and not for waiting on a slide. */
function Toward({ highlights }: { highlights: Highlights }) {
  return (
    <section>
      <h2 className="text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-600">Worth working toward</h2>
      <ul className="card mt-2.5 divide-y divide-ink-900/[0.06]">
        {slidesFor(highlights).map((s) => {
          const Icon = s.icon
          return (
            <li key={s.key}>
              <Link
                to={s.to}
                onClick={() => s.programme && rememberProgramme(s.programme)}
                className="flex items-center gap-3.5 p-4 active:bg-ink-900/[0.03]"
              >
                <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${TOWARD_TONE[s.tone]}`}>
                  <Icon size={18} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-semibold leading-snug text-ink-900">{s.eyebrow}</span>
                  <span className="mt-0.5 block text-xs leading-snug text-ink-500">{s.note ?? s.title}</span>
                </span>
                <span className="inline-flex shrink-0 items-center gap-0.5 text-xs font-semibold text-brand-700">
                  {s.cta}
                  <ChevronRight size={14} />
                </span>
              </Link>
            </li>
          )
        })}
      </ul>
    </section>
  )
}

/**
 * The LaunchPad on a phone: where you stand, then the way back into what you
 * were doing, then what is worth working toward. One column, nothing to read
 * through: the hours chart and the skills showcase are for a computer, and
 * each row here leads somewhere a phone can open.
 */
export function PhoneLaunchPad({
  greeting,
  loading,
  firstRun,
  name,
  goals,
  streak,
  readiness,
  highlights,
  courses,
  findMentor,
}: {
  greeting: string
  loading: boolean
  firstRun: boolean
  name: string
  goals: string[]
  streak: number
  readiness: Readiness
  highlights: Highlights
  courses: CourseProgress[]
  /** The way to a mentor, when the student is still without one. */
  findMentor?: ReactNode
}) {
  const goal = goals[0]
  return (
    <div className="space-y-5">
      <header className="rise-in">
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-brand-700">LaunchPad</p>
        <h1 className="mt-1 font-display text-[26px] font-semibold leading-tight tracking-tight text-ink-900">{greeting}</h1>
        {!firstRun && (goal || streak > 1) && (
          <div className="mt-3 flex flex-wrap gap-2">
            {goal && (
              <span className="inline-flex max-w-full items-center gap-1.5 rounded-full border border-ink-900/[0.08] bg-white px-3 py-1.5 text-xs text-ink-600">
                <Target size={13} className="shrink-0 text-brand-600" />
                <span className="truncate">
                  Working to <span className="font-semibold text-ink-900">{goalLabel(goal).toLowerCase()}</span>
                </span>
              </span>
            )}
            {streak > 1 && (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-ink-900/[0.08] bg-white px-3 py-1.5 text-xs font-semibold text-ink-900">
                <Flame size={13} className="text-orange-500" />
                {streak}-day streak
              </span>
            )}
          </div>
        )}
      </header>

      {loading ? (
        <>
          <Skeleton className="h-64" />
          <Skeleton className="h-24" />
        </>
      ) : firstRun ? (
        <FirstRunPath name={name} goal={goal} />
      ) : (
        <>
          <Score readiness={readiness} />
          <Continue courses={courses} />
          {findMentor}
          <Toward highlights={highlights} />
        </>
      )}
    </div>
  )
}
