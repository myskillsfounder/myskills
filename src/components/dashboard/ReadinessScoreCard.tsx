import { useEffect, useRef, useState } from 'react'
import { Link } from '@tanstack/react-router'
import { ArrowRight, Award, Briefcase, CheckCircle2, Users } from 'lucide-react'
import type { Readiness, ReadinessComponent } from '@/lib/readinessScore'
import { rememberProgramme } from '@/lib/practiceProgramme'

const EASE = 'cubic-bezier(0.22, 1, 0.36, 1)'

/** True from the first frame after mount — so bars and the ring grow in from
 *  zero instead of appearing already full. */
function useEntered() {
  const [entered, setEntered] = useState(false)
  useEffect(() => {
    const id = requestAnimationFrame(() => setEntered(true))
    return () => cancelAnimationFrame(id)
  }, [])
  return entered
}

/** Counts up to `target` alongside the ring, easing out like it does. */
function useCountUp(target: number, run: boolean, ms = 1200) {
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
 *  (Digital Marketing) and green (Career Readiness) as the course tiles. */
const PART_TONE = {
  personal: { dot: 'bg-emerald-500', bar: 'from-emerald-400 to-teal-600', glow: 'shadow-[0_0_10px_-2px_rgba(16,185,129,0.6)]' },
  professional: { dot: 'bg-brand-600', bar: 'from-brand-400 to-brand-700', glow: 'shadow-[0_0_10px_-2px_rgba(111,99,226,0.6)]' },
  internship: { dot: 'bg-amber-500', bar: 'from-amber-300 to-amber-500', glow: 'shadow-[0_0_10px_-2px_rgba(245,158,11,0.6)]' },
} as const

/** One part of the score: its name, points and a bar — nothing else. */
function Part({
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

/**
 * Each slide uses the app's dark feature-card surface (the same wood-dark
 * panel, rings and white pill button as the aptitude and programme cards), so
 * the slider reads as part of the product. Only a small accent — the icon
 * tile and the eyebrow — tells the three apart.
 */
const TONE: Record<Tone, { icon: string; eyebrow: string }> = {
  gold: { icon: 'bg-amber-400/15 text-amber-300 ring-amber-300/30', eyebrow: 'text-amber-200' },
  brand: { icon: 'bg-brand-400/20 text-brand-200 ring-brand-300/30', eyebrow: 'text-brand-200' },
  green: { icon: 'bg-emerald-400/15 text-emerald-300 ring-emerald-300/30', eyebrow: 'text-emerald-200' },
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
  const n = slides.length
  // `pos` runs 0..n, where n is a copy of the first slide: the track always
  // moves forward, and on reaching the copy it jumps (unanimated) back to the
  // real first slide — so 3 → 1 doesn't rewind across the whole track.
  const [pos, setPos] = useState(0)
  const [animate, setAnimate] = useState(true)
  const [paused, setPaused] = useState(false)
  const [hidden, setHidden] = useState(() => document.visibilityState === 'hidden')
  // Bumped on every move so the dot's timer restarts from empty.
  const [tick, setTick] = useState(0)
  const touchX = useRef<number | null>(null)
  const active = pos % n

  useEffect(() => {
    const onVis = () => setHidden(document.visibilityState === 'hidden')
    document.addEventListener('visibilitychange', onVis)
    return () => document.removeEventListener('visibilitychange', onVis)
  }, [])

  const moveTo = (next: number) => {
    setAnimate(true)
    setPos(next)
    setTick((t) => t + 1)
  }

  const step = (dir: 1 | -1) => {
    if (dir === 1) {
      // Already on the copy (its transition didn't finish): settle first.
      if (pos >= n) {
        setAnimate(false)
        setPos(0)
        requestAnimationFrame(() => requestAnimationFrame(() => moveTo(1)))
      } else moveTo(pos + 1)
    } else if (pos === 0) {
      // Going back from the first slide: stand on the copy, then slide back.
      setAnimate(false)
      setPos(n)
      requestAnimationFrame(() => requestAnimationFrame(() => moveTo(n - 1)))
    } else moveTo(pos - 1)
  }

  const settle = () => {
    if (pos >= n) {
      setAnimate(false)
      setPos(0)
    }
  }

  // With reduced motion the slider doesn't move on its own — the dots and a
  // swipe still work.
  const [still] = useState(() => window.matchMedia('(prefers-reduced-motion: reduce)').matches)
  const running = !paused && !hidden && !still && n > 1

  return (
    <div
      className="mt-auto pt-6"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
    >
      {/* `contain: inline-size` stops the track (every slide side by side)
          from counting toward the card's width — without it, a grid with no
          set columns (the dashboard on phones) grows to fit all the slides
          and the whole page renders wider than the screen. */}
      <div
        className="overflow-hidden rounded-2xl [contain:inline-size]"
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
          if (Math.abs(dx) > 40) step(dx < 0 ? 1 : -1)
        }}
      >
        <div
          className="flex"
          onTransitionEnd={(e) => e.target === e.currentTarget && settle()}
          style={{
            transform: `translate3d(-${pos * 100}%, 0, 0)`,
            transition: animate ? `transform 800ms ${EASE}` : 'none',
          }}
        >
          {[...slides, slides[0]].map((s, i) => {
            const Icon = s.icon
            const t = TONE[s.tone]
            const isCopy = i === n
            const shown = i === pos
            return (
              <div
                key={isCopy ? `${s.key}-copy` : s.key}
                className="w-full shrink-0"
                aria-roledescription={isCopy ? undefined : 'slide'}
                aria-label={isCopy ? undefined : `${i + 1} of ${n}`}
                aria-hidden={isCopy || i !== active}
                style={{
                  opacity: shown ? 1 : 0.35,
                  transform: shown ? 'none' : 'scale(0.96)',
                  transition: animate ? `opacity 800ms ${EASE}, transform 800ms ${EASE}` : 'none',
                }}
              >
                <div className="surface-wood-dark relative flex h-full flex-col gap-4 overflow-hidden rounded-2xl p-5 shadow-e2 sm:flex-row sm:items-center">
                  <span aria-hidden className="pointer-events-none absolute -right-10 -top-10 opacity-[0.16]">
                    <svg width="180" height="180" viewBox="0 0 200 200" fill="none" stroke="#f6e3c8" strokeWidth="2">
                      <circle cx="130" cy="70" r="76" />
                      <circle cx="130" cy="70" r="56" />
                      <circle cx="130" cy="70" r="36" />
                      <circle cx="130" cy="70" r="16" />
                    </svg>
                  </span>
                  <div className="relative flex min-w-0 flex-1 items-center gap-3.5">
                    <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ring-1 ${t.icon}`}>
                      <Icon size={19} />
                    </span>
                    <div className="min-w-0">
                      <p className={`text-[11px] font-semibold uppercase tracking-[0.18em] ${t.eyebrow}`}>{s.eyebrow}</p>
                      <p className="mt-1 font-display text-lg font-semibold leading-snug text-white">{s.title}</p>
                      {s.note && <p className="mt-0.5 text-xs text-white/60">{s.note}</p>}
                    </div>
                  </div>
                  <Link
                    to={s.to}
                    onClick={() => s.programme && rememberProgramme(s.programme)}
                    tabIndex={!isCopy && i === active ? 0 : -1}
                    className="press relative inline-flex shrink-0 items-center justify-center gap-2 self-start whitespace-nowrap rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-ink-900 shadow-e2 transition-colors hover:bg-brand-50 sm:self-auto"
                  >
                    {s.cta}
                    <ArrowRight size={16} />
                  </Link>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* The active dot is the timer: it fills over ADVANCE_MS and, when full,
          moves the slider on — so the dot and the slide can't drift apart,
          and hovering pauses both at once. */}
      <div className="mt-3 flex items-center justify-center gap-1.5">
        {slides.map((s, i) => (
          <button
            key={s.key}
            type="button"
            onClick={() => i !== active && moveTo(i)}
            aria-label={`Show ${i + 1} of ${n}`}
            aria-current={i === active}
            className={`relative h-1.5 overflow-hidden rounded-full transition-[width,background-color] duration-500 ${
              i === active ? `w-7 ${still ? 'bg-brand-600' : 'bg-brand-100'}` : 'w-1.5 bg-ink-300 hover:bg-ink-400'
            }`}
          >
            {i === active && !still && (
              <span
                key={tick}
                aria-hidden
                className="fill-x absolute inset-0 rounded-full bg-brand-600"
                style={{ animationDuration: `${ADVANCE_MS}ms`, animationPlayState: running ? 'running' : 'paused' }}
                onAnimationEnd={() => step(1)}
              />
            )}
          </button>
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
  const entered = useEntered()
  const shownScore = useCountUp(score, entered)

  return (
    <section className="card flex h-full flex-col p-6 sm:p-7">
      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-brand-700">Career Readiness Score</p>

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
            aria-label={`Career Readiness Score ${score} out of 100`}
          >
            <span className="font-display text-5xl font-semibold leading-none tabular-nums text-ink-900">{shownScore}</span>
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
        <Part label="Personal Development" c={personal} tone="personal" entered={entered} delay={150} />
        <Part label="Professional Development" c={professional} tone="professional" entered={entered} delay={300} />
        <Part label="Internship" c={internship} tone="internship" entered={entered} delay={450} />
      </div>

      <ActionSlider highlights={highlights} />
    </section>
  )
}
