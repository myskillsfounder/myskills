import { useEffect, useState } from 'react'
import type { ComponentType } from 'react'
import { createFileRoute, Link } from '@tanstack/react-router'
import {
  ArrowRight,
  BadgeCheck,
  Bot,
  Briefcase,
  CalendarCheck,
  CheckCircle2,
  ClipboardCheck,
  FileText,
  HeartHandshake,
  Rocket,
  Sparkles,
  Target,
  Users,
} from 'lucide-react'
import { errorMessage } from '@/lib/errors'
import { useAuthUser } from '@/lib/useAuth'
import { useProfile } from '@/lib/useProfile'
import {
  CAREER_READINESS,
  PERSONAL_DEVELOPMENT_MODULES,
  fetchMyProgrammeInterest,
  registerProgrammeInterest,
} from '@/lib/programmes'
import { Navbar } from '@/components/landing/Navbar'
import { Footer } from '@/components/landing/Footer'
import { Eyebrow } from '@/components/landing/Eyebrow'
import { GridBackdrop, GlowOrb } from '@/components/landing/GridBackdrop'

type IconType = ComponentType<{ size?: number; className?: string }>

// Public, but deliberately absent from PAGE_SEO (src/lib/seo.ts), so it's
// served noindex until the programme's details are final. Add it there, to
// SITEMAP_ROUTES and to scripts/generate-seo.mjs when it's ready to rank.
export const Route = createFileRoute('/career-readiness')({
  component: CareerReadinessPage,
})

/* -- content --------------------------------------------------------------
 * Kept as data so the programme's specifics can be edited in one place. None
 * of this names a price, a start date, or an outcome guarantee — those don't
 * exist yet, and a landing page is the worst place to invent them.
 * ------------------------------------------------------------------------ */

const WHY: { icon: IconType; title: string; body: string }[] = [
  {
    icon: Briefcase,
    title: 'Entry-level work is changing',
    body: 'The first tasks a junior marketer used to do by hand — drafting copy, pulling reports, researching keywords — are now done with AI. The job is shifting to directing that work and judging the result.',
  },
  {
    icon: Target,
    title: 'AI multiplies judgment — it doesn’t replace it',
    body: 'Anyone can ask a chatbot for ad copy. Knowing whether it’s any good, why, and what to change is the skill. That’s what this programme trains.',
  },
  {
    icon: FileText,
    title: 'Proof beats promises',
    body: 'A resume line that says “good communicator” or “team player” means little. Goals you set and hit, a project you led and feedback you acted on — that means a lot.',
  },
]

const HUMANS: { icon: IconType; title: string; body: string }[] = [
  {
    icon: Users,
    title: 'Real mentors',
    body: 'Working marketers review your work and tell you what an AI can’t: whether it would survive a real client.',
  },
  {
    icon: HeartHandshake,
    title: 'Counsellors, when it gets heavy',
    body: 'Job-hunting is stressful. Confidential support is part of the programme, not an afterthought.',
  },
]

const OUTCOMES = [
  'Clear, measurable career goals — and a plan to reach them',
  'Confident communication in writing, presentations and interviews',
  'Leadership experience you can point to, not just describe',
  'Hands-on fluency with agile ways of working',
  'A growth mindset backed by habits, not slogans',
  'Mentor feedback on your progress, not just automated scores',
]

/* -- interest CTA --------------------------------------------------------- */

type CtaState = 'loading' | 'signed-out' | 'ready' | 'saving' | 'registered'

function useInterest() {
  const { user } = useAuthUser()
  const { profile } = useProfile()
  const [state, setState] = useState<CtaState>('loading')
  const [error, setError] = useState<string>()

  useEffect(() => {
    if (!user) {
      setState('signed-out')
      return
    }
    let active = true
    fetchMyProgrammeInterest(CAREER_READINESS.slug).then((row) => {
      if (active) setState(row ? 'registered' : 'ready')
    })
    return () => {
      active = false
    }
  }, [user])

  async function register() {
    if (!user) return
    setState('saving')
    setError(undefined)
    try {
      await registerProgrammeInterest(CAREER_READINESS.slug, {
        full_name: profile?.full_name ?? '',
        email: user.email ?? '',
      })
      setState('registered')
    } catch (e) {
      setError(errorMessage(e))
      setState('ready')
    }
  }

  return { state, error, register }
}

function InterestCta({
  state,
  error,
  onRegister,
  dark = false,
}: {
  state: CtaState
  error?: string
  onRegister: () => void
  dark?: boolean
}) {
  const primary =
    'press inline-flex items-center justify-center gap-2 rounded-full px-6 py-3 text-sm font-semibold transition-colors disabled:opacity-60'
  const tone = dark
    ? 'bg-white text-ink-900 shadow-e2 hover:bg-brand-50'
    : 'bg-brand-600 text-white hover:bg-brand-700'

  if (state === 'registered') {
    return (
      <p
        className={`inline-flex items-center gap-2 rounded-full px-5 py-3 text-sm font-semibold ${
          dark ? 'bg-white/10 text-white' : 'bg-emerald-50 text-emerald-800'
        }`}
      >
        <CheckCircle2 size={17} />
        You’re on the list — we’ll email you as soon as it opens.
      </p>
    )
  }

  if (state === 'signed-out') {
    return (
      <Link to="/signup" className={`${primary} ${tone}`}>
        Create a free account to join
        <ArrowRight size={16} />
      </Link>
    )
  }

  return (
    <div>
      <button
        type="button"
        onClick={onRegister}
        disabled={state === 'loading' || state === 'saving'}
        className={`${primary} ${tone}`}
      >
        {state === 'saving' ? 'Saving…' : 'Register your interest'}
        <ArrowRight size={16} />
      </button>
      {error && (
        <p className={`mt-2 text-sm ${dark ? 'text-red-200' : 'text-red-700'}`}>{error}</p>
      )}
    </div>
  )
}

/* -- page ----------------------------------------------------------------- */

/** The "you + AI" loop, drawn rather than described: AI coaches, the student
 *  reflects and acts, a human gives feedback. It's the programme's whole
 *  thesis in one card. */
function WorkflowCard() {
  const steps = [
    { icon: FileText, label: 'A real situation to handle', who: 'You receive' },
    { icon: Bot, label: 'AI coaches you through it', who: 'AI' },
    { icon: Target, label: 'You reflect, decide and act', who: 'You' },
    { icon: Users, label: 'A mentor gives feedback', who: 'Human' },
    { icon: Rocket, label: 'Proof of your growth', who: 'Yours to keep' },
  ]
  return (
    <div className="glow-edge rounded-xl bg-white/[0.06] p-5 backdrop-blur sm:p-6">
      <Eyebrow dark>How every module works</Eyebrow>
      <ol className="mt-4 space-y-2.5">
        {steps.map((s, i) => (
          <li
            key={s.label}
            className={`flex items-center gap-3 rounded-xl px-3 py-2.5 ${
              s.who === 'You' ? 'bg-white text-ink-900' : 'bg-white/[0.06] text-white'
            }`}
          >
            <span
              className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
                s.who === 'You' ? 'bg-brand-600 text-white' : 'bg-white/10 text-white'
              }`}
            >
              <s.icon size={16} />
            </span>
            <span className="min-w-0 flex-1 text-sm font-medium">{s.label}</span>
            <span
              className={`font-mono shrink-0 text-[11px] font-bold uppercase tracking-wide ${
                s.who === 'You' ? 'text-brand-700' : 'text-white/45'
              }`}
            >
              {String(i + 1).padStart(2, '0')} · {s.who}
            </span>
          </li>
        ))}
      </ol>
      <p className="mt-4 text-xs leading-relaxed text-white/55">
        AI does the coaching. The growth — the part employers notice — stays yours.
      </p>
    </div>
  )
}

function CareerReadinessPage() {
  const { state, error, register } = useInterest()
  const { user } = useAuthUser()

  return (
    <div className="min-h-screen bg-ink-900">
      <Navbar />

      <main>
        {/* Hero */}
        <section className="surface-wood-dark relative overflow-hidden">
          <GridBackdrop mask="ellipse 75% 65% at 30% 20%" />
          <span aria-hidden className="pointer-events-none absolute -right-24 -top-24 opacity-[0.12]">
            <svg width="420" height="420" viewBox="0 0 200 200" fill="none" stroke="#f6e3c8" strokeWidth="1.2">
              <circle cx="100" cy="100" r="96" />
              <circle cx="100" cy="100" r="74" />
              <circle cx="100" cy="100" r="52" />
              <circle cx="100" cy="100" r="30" />
            </svg>
          </span>

          <div className="relative mx-auto grid max-w-6xl items-center gap-12 px-4 py-14 sm:px-6 sm:py-20 lg:grid-cols-2 lg:px-8">
            <div className="rise-in">
              <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 font-mono text-xs font-medium text-white/85">
                <span className="live-ping relative flex h-1.5 w-1.5 rounded-full bg-emerald-400 text-emerald-400" />
                <Sparkles size={13} />
                {CAREER_READINESS.subtitle}
              </span>
              <h1 className="mt-5 font-display text-4xl font-semibold leading-[1.1] tracking-tight text-white sm:text-5xl lg:text-6xl">
                {CAREER_READINESS.name}
              </h1>
              <p className="mt-3 font-display text-2xl leading-snug text-brand-200 sm:text-3xl">
                Use AI the way employers now expect you to.
              </p>
              <p className="mt-5 max-w-lg text-base leading-relaxed text-white/70 sm:text-lg">
                Skills get you shortlisted; how you set goals, communicate, lead, adapt and keep
                growing gets you hired. Practise all five with AI as your coach — and get a
                human’s honest feedback before an interviewer gives you theirs.
              </p>

              {/* One CTA. Joining the waitlist stays in the closing
                  section; "Book a career consultation" moved to
                  /wellness, reachable from the trust row below. */}
              <div className="mt-8">
                <Link
                  to={user ? '/practice' : '/signup'}
                  className="press inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full bg-white px-6 py-3 text-sm font-semibold text-ink-900 shadow-e2 transition-colors hover:bg-brand-50"
                >
                  <ClipboardCheck size={16} />
                  Take the initial assessment
                  <ArrowRight size={16} />
                </Link>
              </div>

              {/* A returning registered visitor gets confirmation right away,
                  instead of only discovering it by scrolling to the closing
                  CTA. Two lightweight text links, not buttons, keep the
                  hero to a single real CTA: a quick way to the module list,
                  and where "Book a career consultation" moved to once it
                  stopped being the hero's second button. */}
              <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2">
                {state === 'registered' && (
                  <p className="inline-flex items-center gap-1.5 text-sm font-medium text-emerald-200">
                    <CheckCircle2 size={15} />
                    You’re on the waitlist
                  </p>
                )}
                <a
                  href="#inside"
                  className="group inline-flex items-center gap-1.5 text-sm font-medium text-white/60 transition-colors hover:text-white"
                >
                  See what’s inside
                  <ArrowRight size={14} className="transition-transform group-hover:translate-x-0.5" />
                </a>
                <Link
                  to="/wellness"
                  hash="career-guidance"
                  className="group inline-flex items-center gap-1.5 text-sm font-medium text-white/60 transition-colors hover:text-white"
                >
                  <CalendarCheck size={13} />
                  Book a career consultation
                </Link>
              </div>

              <ul className="mt-6 flex flex-wrap gap-x-6 gap-y-2 text-sm text-white/65">
                {['Free to join the waitlist', 'AI-guided practice', 'Mentor feedback, not just scores'].map((t) => (
                  <li key={t} className="inline-flex items-center gap-1.5">
                    <BadgeCheck size={15} className="text-brand-200" />
                    {t}
                  </li>
                ))}
              </ul>
            </div>

            <WorkflowCard />
          </div>
        </section>

        {/* Why */}
        <section className="surface-wood-dark relative overflow-hidden border-t border-white/[0.06]">
          <GridBackdrop mask="ellipse 55% 50% at 90% 10%" />
          <div className="relative mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
            <div className="max-w-2xl">
              <Eyebrow dark>Why AI, why now</Eyebrow>
              <h2 className="mt-2 font-display text-3xl font-semibold tracking-tight text-white sm:text-4xl">
                Being “job-ready” doesn’t mean what it did five years ago.
              </h2>
            </div>
            <div className="mt-10 grid gap-4 md:grid-cols-3">
              {WHY.map((w, i) => (
                <div key={w.title} className="card-glass-dark p-6">
                  <div className="flex items-start justify-between gap-2">
                    <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-white/10 text-brand-200">
                      <w.icon size={20} />
                    </span>
                    <span className="font-mono text-[11px] font-bold text-white/35">{String(i + 1).padStart(2, '0')}</span>
                  </div>
                  <h3 className="mt-4 text-lg font-semibold text-white">{w.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-white/65">{w.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Modules */}
        <section id="inside" className="surface-wood-dark relative overflow-hidden border-t border-white/[0.06]">
          <GridBackdrop mask="ellipse 55% 45% at 10% 0%" />
          <GlowOrb className="-left-16 top-0 h-72 w-72" color="rgba(143,133,238,0.16)" />
          <GlowOrb className="-right-16 bottom-0 h-72 w-72" color="rgba(211,164,65,0.10)" />
          <div className="relative mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
            <div className="max-w-2xl">
              <Eyebrow dark>What’s inside</Eyebrow>
              <h2 className="mt-2 font-display text-3xl font-semibold tracking-tight text-white sm:text-4xl">
                Five modules. AI in every one of them.
              </h2>
              <p className="mt-3 text-base leading-relaxed text-white/70">
                Each module pairs a real career skill with a specific way of using AI to do it better —
                never as a shortcut around learning it.
              </p>
            </div>

            <ol className="mt-10 space-y-3">
              {PERSONAL_DEVELOPMENT_MODULES.map((m, i) => (
                <li key={m.title} className="card-glass-dark flex flex-col gap-4 p-5 sm:flex-row sm:items-start sm:p-6">
                  <div className="flex items-center gap-4 sm:w-64 sm:shrink-0">
                    <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-brand-500 to-brand-700 text-white shadow-e1">
                      <m.icon size={21} />
                    </span>
                    <div>
                      <p className="font-mono text-[11px] font-bold uppercase tracking-wide text-brand-200">
                        Module_{String(i + 1).padStart(2, '0')}
                      </p>
                      <h3 className="text-base font-semibold leading-snug text-white">{m.title}</h3>
                    </div>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm leading-relaxed text-white/75">{m.body}</p>
                    <p className="mt-3 flex items-start gap-2 rounded-lg bg-white/[0.07] px-3.5 py-2.5 text-sm leading-relaxed text-white/85">
                      <Bot size={16} className="mt-0.5 shrink-0 text-brand-200" />
                      <span>
                        <span className="font-mono text-xs font-bold tracking-wide text-brand-200">AI_ASSIST — </span>
                        {m.ai}
                      </span>
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* Human + AI */}
        <section className="surface-wood-dark relative overflow-hidden border-t border-white/[0.06]">
          <GridBackdrop mask="ellipse 50% 60% at 100% 50%" />
          <div className="relative mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
            <div className="grid items-center gap-10 lg:grid-cols-2">
              <div>
                <Eyebrow dark>AI-first, never AI-only</Eyebrow>
                <h2 className="mt-2 font-display text-3xl font-semibold tracking-tight text-white sm:text-4xl">
                  The practice is powered by AI. The feedback comes from people.
                </h2>
                <p className="mt-3 max-w-md text-base leading-relaxed text-white/70">
                  AI is tireless and instant, which makes it perfect for repetition. It’s also confidently
                  wrong sometimes, which is why every important piece of work gets a human’s eyes too.
                </p>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                {HUMANS.map((h) => (
                  <div key={h.title} className="card-glass-dark p-6">
                    <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-gradient-to-br from-brand-500 to-brand-700 text-white shadow-e1">
                      <h.icon size={20} />
                    </span>
                    <h3 className="mt-4 text-lg font-semibold text-white">{h.title}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-white/70">{h.body}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Outcomes */}
        <section className="surface-wood-dark relative overflow-hidden border-t border-white/[0.06]">
          <GridBackdrop mask="ellipse 60% 50% at 15% 100%" />
          <div className="relative mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
            <div className="grid gap-10 lg:grid-cols-2">
              <div>
                <Eyebrow dark>What you leave with</Eyebrow>
                <h2 className="mt-2 font-display text-3xl font-semibold tracking-tight text-white sm:text-4xl">
                  Not a certificate of attendance. Evidence.
                </h2>
              </div>
              <ul className="space-y-3.5">
                {OUTCOMES.map((o) => (
                  <li key={o} className="flex items-start gap-3 text-[15px] text-white/80">
                    <CheckCircle2 size={20} className="mt-0.5 shrink-0 text-brand-200" />
                    {o}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="relative overflow-hidden border-t border-white/[0.06] px-4 pt-16 pb-16 sm:px-6 sm:pb-20 lg:px-8">
          <div className="surface-wood-dark glow-edge relative mx-auto flex max-w-6xl flex-col items-start justify-between gap-6 overflow-hidden rounded-xl px-6 py-10 sm:flex-row sm:items-center sm:px-10">
            <GridBackdrop mask="ellipse 70% 90% at 90% 50%" />
            <div className="relative">
              <h2 className="font-display text-2xl font-semibold tracking-tight text-white sm:text-3xl">
                Be first in when it opens.
              </h2>
              <p className="mt-2 max-w-md text-sm text-white/70 sm:text-base">
                Register your interest and we’ll email you the moment the {CAREER_READINESS.name} is
                ready — no commitment.
              </p>
            </div>
            <div className="relative">
              <InterestCta state={state} error={error} onRegister={register} dark />
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}
