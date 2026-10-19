import { useEffect, useRef, useState } from 'react'
import { ArrowDownRight, ArrowUpRight, Award, Briefcase, CheckCircle2, Minus, Users } from 'lucide-react'
import type { Readiness, ReadinessComponent } from '@/lib/readinessScore'
import type { ScoreTrend } from '@/lib/scoreTrend'

const EASE = 'cubic-bezier(0.22, 1, 0.36, 1)'

/** True from the first frame after mount — so bars and the ring grow in from
 *  zero instead of appearing already full. */
export function useEntered() {
  const [entered, setEntered] = useState(false)
  useEffect(() => {
    const id = requestAnimationFrame(() => setEntered(true))
    return () => cancelAnimationFrame(id)
  }, [])
  return entered
}

/** Counts up to `target` alongside the ring, easing out like it does. */
export function useCountUp(target: number, run: boolean, ms = 1200) {
  const [value, setValue] = useState(0)
  const current = useRef(0)
  useEffect(() => {
    if (!run) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      current.current = target
      setValue(target)
      return
    }
    let frame = 0
    const from = current.current
    const start = performance.now()
    const tick = (now: number) => {
      const t = Math.min((now - start) / ms, 1)
      current.current = Math.round(from + (target - from) * (1 - Math.pow(1 - t, 3)))
      setValue(current.current)
      if (t < 1) frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [target, run, ms])
  return value
}

/** Each part in the colour of the programme behind it — the same violet
 *  (Digital Marketing) and green (Global Leadership) as the course tiles. */
const PART_TONE = {
  personal: { dot: 'bg-emerald-500', bar: 'from-emerald-400 to-teal-600', glow: 'shadow-[0_0_10px_-2px_rgba(16,185,129,0.6)]' },
  professional: { dot: 'bg-brand-600', bar: 'from-brand-400 to-brand-700', glow: 'shadow-[0_0_10px_-2px_rgba(111,99,226,0.6)]' },
  internship: { dot: 'bg-amber-500', bar: 'from-amber-300 to-amber-500', glow: 'shadow-[0_0_10px_-2px_rgba(245,158,11,0.6)]' },
} as const

/** One part of the score: its name, points and a bar — and, when some of what
 *  the student earned is waiting on their project, how much. */
export function Part({
  label,
  c,
  tone,
  entered,
  delay,
}: {
  label: string
  c: ReadinessComponent
  tone: keyof typeof PART_TONE
  entered: boolean
  delay: number
}) {
  const pct = c.max ? (c.points / c.max) * 100 : 0
  const t = PART_TONE[tone]
  return (
    <div>
      <div className="flex items-baseline justify-between gap-3">
        <span className="inline-flex items-center gap-2 text-sm font-semibold text-ink-900">
          <span aria-hidden className={`h-2 w-2 rounded-full ${t.dot}`} />
          {label}
        </span>
        <span className="shrink-0 text-sm tabular-nums text-ink-500">
          <span className="font-semibold text-ink-900">{Math.round(c.points)}</span> / {c.max}
        </span>
      </div>
      {c.held !== undefined && c.held > 0.5 && (
        <p className="mt-0.5 text-xs text-ink-500">
          <span className="font-semibold text-amber-700">{Math.round(c.held)} more points</span> are earned and
          waiting for your project to pass.
        </p>
      )}
      <div
        className="mt-2 h-2.5 w-full overflow-hidden rounded-full bg-ink-100 shadow-[inset_0_1px_2px_rgba(0,0,0,0.06)]"
        role="progressbar"
        aria-label={label}
        aria-valuemin={0}
        aria-valuemax={c.max}
        aria-valuenow={Math.round(c.points)}
      >
        <div
          className={`relative h-full rounded-full bg-gradient-to-r ${t.bar} ${c.points > 0 ? t.glow : ''}`}
          style={{
            width: entered && c.points > 0 ? `${Math.max(pct, 4)}%` : '0%',
            transition: `width 1.1s ${EASE} ${delay}ms`,
          }}
        >
          {/* A soft highlight along the top edge, so the bar reads as a
              filled tube rather than a flat stripe. */}
          <span aria-hidden className="absolute inset-x-1 top-px h-[3px] rounded-full bg-white/35" />
        </div>
      </div>
    </div>
  )
}

/** What the three slides need to know about the student. */
export interface Highlights {
  /** The Foundation certificate: vocabulary not far enough yet, ready to take, or earned. */
  certificate: 'locked' | 'ready' | 'earned'
  /** Has the student got a mentor on either programme? */
  hasMentor: boolean
  tracksPractised: number
  totalTracks: number
  modulesDone: number
  totalModules: number
}

type Tone = 'gold' | 'brand' | 'green'

type Slide = {
  key: string
  eyebrow: string
  title: string
  note?: string
  cta: string
  to: string
  programme?: 1 | 2
  icon: typeof Award
  tone: Tone
}

/** Three things worth working toward: the certificate, a mentor, an internship. */
export function slidesFor(h: Highlights): Slide[] {
  const cert: Slide =
    h.certificate === 'earned'
      ? { key: 'cert', eyebrow: 'Your certificate', title: 'Certificate in Foundational Progress in Digital Marketing', cta: 'Download', to: '/certificate', icon: Award, tone: 'gold' }
      : h.certificate === 'ready'
        ? { key: 'cert', eyebrow: 'Earn a certificate', title: 'Certificate in Foundational Progress in Digital Marketing', note: 'Take the Foundation assessment to earn it.', cta: 'Start', to: '/foundation-assessment', icon: Award, tone: 'gold' }
        : { key: 'cert', eyebrow: 'Earn a certificate', title: 'Certificate in Foundational Progress in Digital Marketing', note: 'Learn the Beginner vocabulary in Practice to unlock it.', cta: 'Unlock', to: '/practice', programme: 1, icon: Award, tone: 'gold' }
  const mentor: Slide = {
    key: 'mentor',
    eyebrow: 'Capstone project',
    title: 'Your project, graded by a mentor, is worth up to 20 points in Digital Marketing and 15 in Global Leadership',
    note: 'A passing grade also releases the points you’ve already earned.',
    cta: h.hasMentor ? 'See your mentor' : 'Find your mentor',
    to: '/practice',
    programme: 1,
    icon: Users,
    tone: 'brand',
  }
  const internship: Slide = {
    key: 'internship',
    eyebrow: 'Internship',
    title: 'Complete your practice to unlock an internship',
    note: `${h.tracksPractised} of ${h.totalTracks} tracks · ${h.modulesDone} of ${h.totalModules} modules done`,
    cta: 'Continue',
    to: '/practice',
    icon: Briefcase,
    tone: 'green',
  }
  return [cert, mentor, internship]
}

/**
 * The LaunchPad's centrepiece: where am I (the ring), what is it made of
 * (three parts), and what's worth working toward (the certificate, a mentor,
 * an internship).
 */
export function ReadinessScoreCard({
  readiness,
  trend,
}: {
  readiness: Readiness
  /** How the score moved since last week (or since the first day on record). */
  trend?: ScoreTrend | null
}) {
  const { score, band, personal, professional, internship, verifiedPoints, selfReportedPoints } = readiness
  const counted = Math.round(verifiedPoints + selfReportedPoints)
  const R = 54
  const C = 2 * Math.PI * R
  const entered = useEntered()
  const shownScore = useCountUp(score, entered)

  return (
    <section className="card flex h-full flex-col p-6 sm:p-7">
      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-brand-700">Global Readiness Score</p>

      <div className="mt-4 flex flex-col gap-6 sm:flex-row sm:items-center sm:gap-8">
        <div className="relative mx-auto h-36 w-36 shrink-0 sm:mx-0">
          <svg viewBox="0 0 128 128" className="h-full w-full -rotate-90 overflow-visible" aria-hidden>
            <defs>
              <linearGradient id="readiness-ring" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="var(--color-brand-400)" />
                <stop offset="100%" stopColor="var(--color-brand-700)" />
              </linearGradient>
            </defs>
            <circle cx="64" cy="64" r={R} fill="none" strokeWidth="10" className="stroke-brand-100" />
            {/* A round linecap still paints a dot at zero length — skip the
                arc entirely at 0 so an empty score looks empty. */}
            {score > 0 && (
              <circle
                cx="64"
                cy="64"
                r={R}
                fill="none"
                strokeWidth="10"
                strokeLinecap="round"
                stroke="url(#readiness-ring)"
                strokeDasharray={C}
                strokeDashoffset={entered ? C * (1 - score / 100) : C}
                // Hidden until it starts growing — the round cap would
                // otherwise paint a dot at zero length for a frame.
                opacity={entered ? 1 : 0}
                style={{
                  transition: `stroke-dashoffset 1.2s ${EASE}, opacity 0.2s ease`,
                  filter: 'drop-shadow(0 2px 4px rgba(111, 99, 226, 0.35))',
                }}
              />
            )}
          </svg>
          <div
            className="absolute inset-0 flex flex-col items-center justify-center"
            role="img"
            aria-label={`Global Readiness Score ${score} out of 100`}
          >
            <span className="font-display text-5xl font-semibold leading-none tabular-nums text-ink-900">{shownScore}</span>
            <span className="mt-1 text-xs font-medium text-ink-500">out of 100</span>
          </div>
        </div>

        <div className="min-w-0 flex-1">
          <p className="font-display text-2xl font-semibold leading-tight text-ink-900">{band.label}</p>
          {trend && (
            <p
              className={`mt-1 inline-flex items-center gap-1 text-sm font-semibold ${
                trend.change > 0 ? 'text-emerald-700' : trend.change < 0 ? 'text-red-600' : 'text-ink-500'
              }`}
            >
              {trend.change > 0 ? <ArrowUpRight size={15} /> : trend.change < 0 ? <ArrowDownRight size={15} /> : <Minus size={15} />}
              {trend.change === 0
                ? `No change ${trend.since}`
                : `${trend.change > 0 ? 'Up' : 'Down'} ${Math.abs(trend.change)} ${Math.abs(trend.change) === 1 ? 'point' : 'points'} ${trend.since}`}
            </p>
          )}
          <p className="mt-1 text-sm leading-relaxed text-ink-600">
            This is what employers see. It only counts what you do on MySkills — learning, practice, live
            sessions and the project a mentor grades.
          </p>
          {counted > 0 && (
            <p className="mt-2 inline-flex items-center gap-1.5 text-xs text-ink-600">
              <CheckCircle2 size={14} className={verifiedPoints > 0 ? 'text-emerald-600' : 'text-ink-300'} />
              {Math.round(verifiedPoints)} of your {counted} points checked by MySkills
            </p>
          )}
        </div>
      </div>

      <div className="mt-6 flex flex-1 flex-col justify-center gap-4">
        <Part label="Personal Development" c={personal} tone="personal" entered={entered} delay={150} />
        <Part label="Professional Development" c={professional} tone="professional" entered={entered} delay={300} />
        <Part label="Internship" c={internship} tone="internship" entered={entered} delay={450} />
      </div>

    </section>
  )
}
