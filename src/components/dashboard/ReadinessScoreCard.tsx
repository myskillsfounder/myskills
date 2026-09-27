import { useEffect, useRef, useState } from 'react'
import { Link } from '@tanstack/react-router'
import { ArrowRight, Award, Briefcase, CheckCircle2, Users } from 'lucide-react'
import type { Readiness, ReadinessComponent } from '@/lib/readinessScore'
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

/**
 * Each slide is a "liquid glass" panel: two soft blobs of the slide's colour
 * glowing behind a frosted, translucent layer with a bright top edge and a
 * sheen across the upper half — so it reads as glass over colour rather than
 * a flat tinted box.
 */
const TONE: Record<Tone, { wash: string; blobA: string; blobB: string; icon: string; eyebrow: string; cta: string }> = {
  gold: {
    wash: 'from-amber-100 via-orange-50 to-yellow-100',
    blobA: 'bg-amber-400/80',
    blobB: 'bg-orange-400/60',
    icon: 'from-amber-400 to-orange-500 shadow-[0_6px_16px_-4px_rgba(245,158,11,0.6)]',
    eyebrow: 'text-amber-700',
    cta: 'from-amber-500 to-orange-500 shadow-[0_8px_20px_-6px_rgba(245,158,11,0.7)]',
  },
  brand: {
    wash: 'from-brand-100 via-violet-50 to-indigo-100',
    blobA: 'bg-brand-400/70',
    blobB: 'bg-fuchsia-400/50',
    icon: 'from-brand-500 to-violet-600 shadow-[0_6px_16px_-4px_rgba(111,99,226,0.6)]',
    eyebrow: 'text-brand-700',
    cta: 'from-brand-500 to-violet-600 shadow-[0_8px_20px_-6px_rgba(111,99,226,0.7)]',
  },
  green: {
    wash: 'from-emerald-100 via-teal-50 to-cyan-100',
    blobA: 'bg-emerald-400/70',
    blobB: 'bg-teal-400/60',
    icon: 'from-emerald-500 to-teal-600 shadow-[0_6px_16px_-4px_rgba(16,185,129,0.6)]',
    eyebrow: 'text-emerald-700',
    cta: 'from-emerald-500 to-teal-600 shadow-[0_8px_20px_-6px_rgba(16,185,129,0.7)]',
  },
}

const ADVANCE_MS = 3000

/** Three things worth working toward: the certificate, a mentor, an internship. */
function slidesFor(h: Highlights): Slide[] {
  const cert: Slide =
    h.certificate === 'earned'
      ? { key: 'cert', eyebrow: 'Your certificate', title: 'Certificate in Foundational Progress in Digital Marketing', cta: 'Download', to: '/certificate', icon: Award, tone: 'gold' }
      : h.certificate === 'ready'
        ? { key: 'cert', eyebrow: 'Earn a certificate', title: 'Certificate in Foundational Progress in Digital Marketing', note: 'Take the Foundation assessment to earn it.', cta: 'Start', to: '/foundation-assessment', icon: Award, tone: 'gold' }
        : { key: 'cert', eyebrow: 'Earn a certificate', title: 'Certificate in Foundational Progress in Digital Marketing', note: 'Learn the Beginner vocabulary in Practice to unlock it.', cta: 'Unlock', to: '/practice', programme: 1, icon: Award, tone: 'gold' }
  const mentor: Slide = {
    key: 'mentor',
    eyebrow: 'Live mentor sessions',
    title: 'Live sessions with a mentor can raise your score by up to 20 points',
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
 * A slider at the foot of the card: the certificate, live mentor sessions and
 * the internship, each with the one action that moves it on. Moves every few
 * seconds (stopping while the pointer or focus is on it); the dots or a swipe
 * move it by hand.
 */
function ActionSlider({ highlights }: { highlights: Highlights }) {
  const slides = slidesFor(highlights)
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
        <div className="flex transition-transform duration-500 ease-out" style={{ transform: `translateX(-${index * 100}%)` }}>
          {slides.map((s, i) => {
            const Icon = s.icon
            const t = TONE[s.tone]
            return (
              <div
                key={s.key}
                className="w-full shrink-0"
                aria-roledescription="slide"
                aria-label={`${i + 1} of ${slides.length}`}
                aria-hidden={i !== index}
              >
                <div className={`relative isolate overflow-hidden rounded-3xl bg-gradient-to-br p-[1px] ${t.wash}`}>
                  {/* colour glowing behind the glass */}
                  <span aria-hidden className={`absolute -left-8 -top-12 h-40 w-40 rounded-full blur-xl ${t.blobA}`} />
                  <span aria-hidden className={`absolute -bottom-14 right-6 h-44 w-44 rounded-full blur-2xl ${t.blobB}`} />
                  {/* the glass */}
                  <div className="relative flex flex-col gap-3 rounded-[23px] border border-white/70 bg-white/30 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.9),0_10px_30px_-12px_rgba(28,25,23,0.25)] backdrop-blur-md sm:flex-row sm:items-center sm:p-5">
                    <span
                      aria-hidden
                      className="pointer-events-none absolute inset-x-0 top-0 h-1/2 rounded-t-[23px] bg-gradient-to-b from-white/70 to-transparent"
                    />
                    <div className="relative flex min-w-0 flex-1 items-center gap-3.5">
                      <span
                        className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br text-white ring-1 ring-white/60 ${t.icon}`}
                      >
                        <Icon size={19} />
                      </span>
                      <div className="min-w-0">
                        <p className={`text-[11px] font-semibold uppercase tracking-[0.14em] ${t.eyebrow}`}>{s.eyebrow}</p>
                        <p className="mt-0.5 font-display text-[15px] font-semibold leading-snug text-ink-900">{s.title}</p>
                        {s.note && <p className="mt-0.5 text-xs text-ink-600">{s.note}</p>}
                      </div>
                    </div>
                    <Link
                      to={s.to}
                      onClick={() => s.programme && rememberProgramme(s.programme)}
                      tabIndex={i === index ? 0 : -1}
                      className={`press relative inline-flex shrink-0 items-center justify-center gap-1.5 self-start overflow-hidden rounded-full bg-gradient-to-br px-5 py-2.5 text-sm font-semibold text-white ring-1 ring-white/40 transition-transform hover:-translate-y-0.5 sm:self-auto ${t.cta}`}
                    >
                      <span aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/35 to-transparent" />
                      <span className="relative">{s.cta}</span>
                      <ArrowRight size={15} className="relative" />
                    </Link>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

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
    </div>
  )
}

/**
 * The LaunchPad's centrepiece: where am I (the ring), what is it made of
 * (three parts), and what's worth working toward (the certificate, a mentor,
 * an internship).
 */
export function ReadinessScoreCard({ readiness, highlights }: { readiness: Readiness; highlights: Highlights }) {
  const { score, band, personal, professional, internship, verifiedPoints, selfReportedPoints } = readiness
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

      <ActionSlider highlights={highlights} />
    </section>
  )
}
