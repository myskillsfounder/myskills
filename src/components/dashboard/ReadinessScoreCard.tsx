import { useEffect, useRef, useState } from 'react'
import { Link } from '@tanstack/react-router'
import { ArrowRight, Award, CheckCircle2, TrendingUp, UserCheck, Users } from 'lucide-react'
import type { NextAction, Readiness, ReadinessComponent } from '@/lib/readinessScore'
import { rememberProgramme } from '@/lib/practiceProgramme'

/** One part of the score: its name, points and a bar — nothing else. */
function Part({ label, c }: { label: string; c: ReadinessComponent }) {
  const pct = c.max ? (c.points / c.max) * 100 : 0
  return (
    <div>
      <div className="flex items-baseline justify-between gap-3">
        <span className="text-sm font-semibold text-ink-900">{label}</span>
        <span className="shrink-0 text-sm tabular-nums text-ink-500">
          <span className="font-semibold text-ink-900">{Math.round(c.points)}</span> / {c.max}
        </span>
      </div>
      <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-ink-100">
        <div
          className="h-full rounded-full bg-brand-600"
          style={{
            width: c.points > 0 ? `${Math.max(pct, 3)}%` : '0%',
            transition: 'width 1s cubic-bezier(0.2,0.8,0.2,1)',
          }}
        />
      </div>
    </div>
  )
}

type Slide = {
  key: string
  eyebrow: string
  title: string
  /** e.g. "+2" for a step, or the reward for an outcome. */
  badge?: string
  to: string
  programme?: 1 | 2
  icon: typeof TrendingUp
  tone: 'step' | 'outcome'
}

const MAX_STEPS = 3
const ADVANCE_MS = 3000

/** The next few steps in journey order, live mentor sessions, then what they lead to. */
function slidesFor(steps: NextAction[]): Slide[] {
  const stepSlides: Slide[] = steps.slice(0, MAX_STEPS).map((s, i) => ({
    key: `step-${s.label}`,
    eyebrow: i === 0 ? 'Your next step' : 'Then',
    title: s.label,
    badge: s.upTo > 0 ? `+${Number(s.upTo.toFixed(2))}` : undefined,
    to: s.to,
    programme: s.programme,
    icon: TrendingUp,
    tone: 'step',
  }))
  // Live mentor sessions, one per programme: each opens that programme's tab,
  // where the "Live mentor sessions" card finds a mentor.
  const mentoring: Slide[] = [
    {
      key: 'mentor-dm',
      eyebrow: 'Live mentor sessions',
      title: 'Work with a mentor on Digital Marketing',
      badge: '+2 a session',
      to: '/practice',
      programme: 1,
      icon: Users,
      tone: 'step',
    },
    {
      key: 'mentor-cr',
      eyebrow: 'Live mentor sessions',
      title: 'Work with a mentor on Career Readiness',
      badge: '+2 a session',
      to: '/practice',
      programme: 2,
      icon: Users,
      tone: 'step',
    },
  ]
  const outcomes: Slide[] = [
    {
      key: 'certificate',
      eyebrow: 'What you get',
      title: 'A certificate of foundational progress in digital marketing',
      to: '/foundation-assessment',
      icon: Award,
      tone: 'outcome',
    },
    {
      key: 'signoff',
      eyebrow: 'What you get',
      title: 'A mentor’s sign-off that vouches for your work',
      to: '/practice',
      programme: 2,
      icon: UserCheck,
      tone: 'outcome',
    },
  ]
  // A mentor step already among the next steps isn't shown twice.
  const shown = new Set(stepSlides.map((s) => s.title))
  return [...stepSlides, ...mentoring.filter((m) => !shown.has(m.title)), ...outcomes]
}

/**
 * A slider at the foot of the card: the next steps, then two slides on what
 * they earn. Moves on by itself every few seconds (stopping while the pointer
 * or focus is on it); the dots or a swipe move it by hand.
 */
function ActionSlider({ steps }: { steps: NextAction[] }) {
  const slides = slidesFor(steps)
  const [index, setIndex] = useState(0)
  const [paused, setPaused] = useState(false)
  const touchX = useRef<number | null>(null)

  useEffect(() => {
    if (paused || slides.length < 2) return
    const id = window.setInterval(() => setIndex((i) => (i + 1) % slides.length), ADVANCE_MS)
    return () => window.clearInterval(id)
  }, [paused, slides.length])

  const go = (i: number) => setIndex((i + slides.length) % slides.length)

  return (
    <div
      className="mt-6"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
    >
      {/* The track slides with a transform — one slide wide, moved by index —
          so the dots, the timer and a swipe can never disagree about which
          slide is showing. */}
      <div
        className="overflow-hidden"
        aria-roledescription="carousel"
        onTouchStart={(e) => {
          touchX.current = e.touches[0].clientX
          setPaused(true)
        }}
        onTouchEnd={(e) => {
          const start = touchX.current
          touchX.current = null
          setPaused(false)
          if (start === null) return
          const dx = e.changedTouches[0].clientX - start
          if (Math.abs(dx) > 40) go(index + (dx < 0 ? 1 : -1))
        }}
      >
        <div
          className="flex transition-transform duration-500 ease-out"
          style={{ transform: `translateX(-${index * 100}%)` }}
        >
        {slides.map((s, i) => {
          const Icon = s.icon
          const outcome = s.tone === 'outcome'
          return (
            <div
              key={s.key}
              className="w-full shrink-0"
              aria-roledescription="slide"
              aria-label={`${i + 1} of ${slides.length}`}
              aria-hidden={i !== index}
            >
              <Link
                to={s.to}
                onClick={() => s.programme && rememberProgramme(s.programme)}
                tabIndex={i === index ? 0 : -1}
                className={`group flex items-center gap-3 rounded-2xl border p-4 transition-colors ${
                  outcome
                    ? 'border-amber-200 bg-amber-50/70 hover:border-amber-300'
                    : 'border-brand-100 bg-brand-50/70 hover:border-brand-300'
                }`}
              >
                <span
                  className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-white ${
                    outcome ? 'bg-amber-500' : 'bg-brand-600'
                  }`}
                >
                  <Icon size={18} />
                </span>
                <div className="min-w-0 flex-1">
                  <p
                    className={`text-[11px] font-semibold uppercase tracking-wide ${outcome ? 'text-amber-700' : 'text-brand-700'}`}
                  >
                    {s.eyebrow}
                  </p>
                  <p className="text-sm font-semibold text-ink-900">
                    {s.title}
                    {s.badge && <span className="font-medium text-brand-700"> · {s.badge}</span>}
                  </p>
                </div>
                <ArrowRight
                  size={18}
                  className={`shrink-0 transition-transform duration-300 group-hover:translate-x-1 ${
                    outcome ? 'text-amber-600' : 'text-brand-600'
                  }`}
                />
              </Link>
            </div>
          )
        })}
        </div>
      </div>

      {slides.length > 1 && (
        <div className="mt-3 flex justify-center gap-1.5">
          {slides.map((s, i) => (
            <button
              key={s.key}
              type="button"
              onClick={() => go(i)}
              aria-label={`Show ${i + 1} of ${slides.length}`}
              aria-current={i === index}
              className={`h-1.5 rounded-full transition-all ${i === index ? 'w-5 bg-brand-600' : 'w-1.5 bg-ink-300 hover:bg-ink-400'}`}
            />
          ))}
        </div>
      )}
    </div>
  )
}

/**
 * The LaunchPad's centrepiece: where am I (the ring), what is it made of
 * (three parts), and what do I do next (a slider of steps and what they earn).
 */
export function ReadinessScoreCard({ readiness }: { readiness: Readiness }) {
  const { score, band, personal, professional, internship, nextActions, verifiedPoints, selfReportedPoints } = readiness
  const counted = Math.round(verifiedPoints + selfReportedPoints)
  const R = 54
  const C = 2 * Math.PI * R

  return (
    <section className="card flex h-full flex-col p-6 sm:p-7">
      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-brand-700">Career Readiness Score</p>

      <div className="mt-4 flex flex-col gap-6 sm:flex-row sm:items-center sm:gap-8">
        <div className="relative mx-auto h-36 w-36 shrink-0 sm:mx-0">
          <svg viewBox="0 0 128 128" className="h-full w-full -rotate-90" aria-hidden>
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
                className="stroke-brand-600"
                strokeDasharray={C}
                strokeDashoffset={C * (1 - score / 100)}
                style={{ transition: 'stroke-dashoffset 1.2s cubic-bezier(0.2,0.8,0.2,1)' }}
              />
            )}
          </svg>
          <div
            className="absolute inset-0 flex flex-col items-center justify-center"
            role="img"
            aria-label={`Career Readiness Score ${score} out of 100`}
          >
            <span className="font-display text-5xl font-semibold leading-none tabular-nums text-ink-900">{score}</span>
            <span className="mt-1 text-xs font-medium text-ink-500">out of 100</span>
          </div>
        </div>

        <div className="min-w-0 flex-1">
          <p className="font-display text-2xl font-semibold leading-tight text-ink-900">{band.label}</p>
          <p className="mt-1 text-sm leading-relaxed text-ink-600">
            This is what employers see. It only counts what you do on MySkills — learning, practice, live
            sessions and your mentors’ sign-off.
          </p>
          {counted > 0 && (
            <p className="mt-2 inline-flex items-center gap-1.5 text-xs text-ink-600">
              <CheckCircle2 size={14} className={verifiedPoints > 0 ? 'text-emerald-600' : 'text-ink-300'} />
              {Math.round(verifiedPoints)} of your {counted} points checked by MySkills
            </p>
          )}
        </div>
      </div>

      <div className="mt-6 space-y-4">
        <Part label="Personal Development" c={personal} />
        <Part label="Professional Development" c={professional} />
        <Part label="Internship" c={internship} />
      </div>

      <ActionSlider steps={nextActions ?? []} />

      {readiness.source === 'server' && readiness.computedAt && (
        <p className="mt-4 text-[11px] text-ink-400">
          Issued by MySkills on{' '}
          {new Date(readiness.computedAt).toLocaleDateString(undefined, {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
          })}
        </p>
      )}
    </section>
  )
}
