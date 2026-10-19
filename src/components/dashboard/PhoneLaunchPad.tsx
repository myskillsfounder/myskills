import type { ReactNode } from 'react'
import { Link } from '@tanstack/react-router'
import { ArrowDownRight, ArrowUpRight, ChevronRight, Flame, Minus, Target } from 'lucide-react'
import type { Readiness } from '@/lib/readinessScore'
import { goalLabel } from '@/lib/onboardingContent'
import { rememberProgramme } from '@/lib/practiceProgramme'
import { FirstRunPath } from '@/components/dashboard/FirstRunPath'
import { Part, slidesFor, useCountUp, useEntered, type Highlights } from '@/components/dashboard/ReadinessScoreCard'
import { Skeleton } from '@/components/ui'
import { SkillBalanceCard } from '@/components/dashboard/SkillBalanceCard'
import { GrowthCards, NextStepCards } from '@/components/dashboard/GrowthCards'
import type { Balance } from '@/lib/skillBalance'
import type { ScoreTrend } from '@/lib/scoreTrend'
import type { ModuleProgress } from '@/lib/careerReadinessProgramme'

const EASE = 'cubic-bezier(0.22, 1, 0.36, 1)'

/** The score, sized for a phone: the ring beside its reading rather than above
 *  it, so the number and what it is made of fit on one screen. */
function Score({ readiness, trend }: { readiness: Readiness; trend: ScoreTrend | null }) {
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
            aria-label={`Global Readiness Score ${score} out of 100`}
          >
            <span className="font-display text-3xl font-semibold leading-none tabular-nums text-ink-900">{shownScore}</span>
            <span className="mt-0.5 text-[10px] font-medium text-ink-500">of 100</span>
          </div>
        </div>
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-brand-700">Global Readiness Score</p>
          <p className="mt-1 font-display text-xl font-semibold leading-tight text-ink-900">{band.label}</p>
          {trend ? (
            <p
              className={`mt-1 inline-flex items-center gap-1 text-xs font-semibold ${
                trend.change > 0 ? 'text-emerald-700' : trend.change < 0 ? 'text-red-600' : 'text-ink-500'
              }`}
            >
              {trend.change > 0 ? <ArrowUpRight size={13} /> : trend.change < 0 ? <ArrowDownRight size={13} /> : <Minus size={13} />}
              {trend.change === 0
                ? `No change ${trend.since}`
                : `${trend.change > 0 ? 'Up' : 'Down'} ${Math.abs(trend.change)} ${Math.abs(trend.change) === 1 ? 'point' : 'points'} ${trend.since}`}
            </p>
          ) : (
            <p className="mt-1 text-xs leading-relaxed text-ink-600">What employers see, built from what you do here.</p>
          )}
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
  findMentor,
  trend,
  balance,
  tracks,
  modules,
}: {
  greeting: string
  loading: boolean
  firstRun: boolean
  name: string
  goals: string[]
  streak: number
  readiness: Readiness
  highlights: Highlights
  trend: ScoreTrend | null
  balance: { aptitude: Balance; progress: Balance }
  /** Practised tracks with their best score. */
  tracks: { name: string; percent: number }[]
  modules: ModuleProgress[]
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
          <Score readiness={readiness} trend={trend} />
          <NextStepCards
            readiness={readiness}
            trend={trend}
            bestTrack={tracks.length ? [...tracks].sort((a, b) => b.percent - a.percent)[0] : null}
            modulesDone={modules.filter((m) => m.done >= m.total).length}
          />
          <SkillBalanceCard aptitude={balance.aptitude} progress={balance.progress} />
          <GrowthCards readiness={readiness} tracks={tracks} modules={modules} />
          {findMentor}
          <Toward highlights={highlights} />
        </>
      )}
    </div>
  )
}
