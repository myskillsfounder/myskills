import { useEffect, useState } from 'react'
import type { ComponentType } from 'react'
import { createFileRoute, Link } from '@tanstack/react-router'
import {
  ArrowRight,
  Bot,
  Briefcase,
  CheckCircle2,
  Compass,
  FileText,
  HeartHandshake,
  Mic,
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
  fetchMyProgrammeInterest,
  registerProgrammeInterest,
} from '@/lib/programmes'
import { Navbar } from '@/components/landing/Navbar'
import { Footer } from '@/components/landing/Footer'

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
    body: 'A resume line that says “familiar with AI tools” means little. A portfolio of real briefs you worked through with AI — and can explain — means a lot.',
  },
]

const MODULES: { icon: IconType; title: string; body: string; ai: string }[] = [
  {
    icon: Sparkles,
    title: 'AI-powered skill sprints',
    body: 'Work through MySkills’ eight tracks — SEO, Google Ads, Meta Ads, analytics, content and more — with AI as your practice partner.',
    ai: 'Use AI to generate practice variations, then check your reasoning against Decision Lab scoring.',
  },
  {
    icon: Rocket,
    title: 'Build a portfolio with AI',
    body: 'Turn real-style campaign briefs into finished work you can show in an interview.',
    ai: 'Draft with AI, then edit, critique and defend every decision in your own words.',
  },
  {
    icon: FileText,
    title: 'Resume & LinkedIn, rebuilt',
    body: 'Present your skills the way recruiters scan for them, not the way a college template lays them out.',
    ai: 'Use AI to tailor your profile to specific roles — without it sounding like everyone else’s.',
  },
  {
    icon: Mic,
    title: 'Interview practice',
    body: 'Rehearse the questions marketing interviewers actually ask, including the case-style ones.',
    ai: 'Run mock interviews with AI as often as you like, then take the hard ones to a real mentor.',
  },
  {
    icon: Compass,
    title: 'Your career plan',
    body: 'Leave with a clear next step: which roles to target, which gaps to close, and in what order.',
    ai: 'Map your skill scores against roles with AI, then pressure-test the plan with a career mentor.',
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
  'A portfolio of AI-assisted work you can explain line by line',
  'Practical fluency with AI across real marketing tasks',
  'A resume and LinkedIn profile built for the roles you want',
  'Mentor feedback on your work, not just automated scores',
  'A clear, written plan for your next career step',
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
    ? 'bg-white text-ink-900 hover:bg-brand-50'
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

/** The "you + AI" loop, drawn rather than described: AI does the draft, the
 *  student does the judging, a human signs off. It's the programme's whole
 *  thesis in one card. */
function WorkflowCard() {
  const steps = [
    { icon: FileText, label: 'Real campaign brief', who: 'You receive' },
    { icon: Bot, label: 'AI drafts options', who: 'AI' },
    { icon: Target, label: 'You judge, edit and decide', who: 'You' },
    { icon: Users, label: 'Mentor reviews it', who: 'Human' },
    { icon: Rocket, label: 'Portfolio piece', who: 'Yours to keep' },
  ]
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.06] p-5 backdrop-blur sm:p-6">
      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-white/50">
        How every module works
      </p>
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
              className={`shrink-0 text-[11px] font-semibold uppercase tracking-wide ${
                s.who === 'You' ? 'text-brand-700' : 'text-white/45'
              }`}
            >
              {i + 1} · {s.who}
            </span>
          </li>
        ))}
      </ol>
      <p className="mt-4 text-xs leading-relaxed text-white/55">
        The AI does the heavy lifting. The judgment — the part employers pay for — stays yours.
      </p>
    </div>
  )
}

function CareerReadinessPage() {
  const { state, error, register } = useInterest()

  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      <main>
        {/* Hero */}
        <section className="surface-wood-dark relative overflow-hidden">
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
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-white/85">
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
                A programme built around one idea: AI won’t take the job of someone who knows how to
                direct it. Practise real marketing work with AI at your side, build a portfolio that
                proves it, and get a human’s honest feedback before an interviewer gives you theirs.
              </p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
                <InterestCta state={state} error={error} onRegister={register} dark />
                <a
                  href="#inside"
                  className="inline-flex items-center justify-center rounded-full border border-white/20 px-6 py-3 text-sm font-semibold text-white transition-colors hover:border-white/40"
                >
                  See what’s inside
                </a>
              </div>
            </div>

            <WorkflowCard />
          </div>
        </section>

        {/* Why */}
        <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
          <div className="max-w-2xl">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-brand-700">
              Why AI, why now
            </p>
            <h2 className="mt-2 font-display text-3xl font-semibold tracking-tight text-ink-900 sm:text-4xl">
              Being “job-ready” doesn’t mean what it did five years ago.
            </h2>
          </div>
          <div className="mt-10 grid gap-4 md:grid-cols-3">
            {WHY.map((w) => (
              <div key={w.title} className="card p-6">
                <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-brand-50 text-brand-700">
                  <w.icon size={20} />
                </span>
                <h3 className="mt-4 text-lg font-semibold text-ink-900">{w.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-ink-600">{w.body}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Modules */}
        <section id="inside" className="border-t border-ink-100 bg-ink-50/60">
          <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
            <div className="max-w-2xl">
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-brand-700">
                What’s inside
              </p>
              <h2 className="mt-2 font-display text-3xl font-semibold tracking-tight text-ink-900 sm:text-4xl">
                Five modules. AI in every one of them.
              </h2>
              <p className="mt-3 text-base leading-relaxed text-ink-600">
                Each module pairs a real career skill with a specific way of using AI to do it better —
                never as a shortcut around learning it.
              </p>
            </div>

            <ol className="mt-10 space-y-3">
              {MODULES.map((m, i) => (
                <li key={m.title} className="card flex flex-col gap-4 p-5 sm:flex-row sm:items-start sm:p-6">
                  <div className="flex items-center gap-4 sm:w-64 sm:shrink-0">
                    <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-500 to-brand-700 text-white shadow-e1">
                      <m.icon size={21} />
                    </span>
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-wide text-brand-600">
                        Module {i + 1}
                      </p>
                      <h3 className="text-base font-semibold leading-snug text-ink-900">{m.title}</h3>
                    </div>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm leading-relaxed text-ink-700">{m.body}</p>
                    <p className="mt-3 flex items-start gap-2 rounded-xl bg-brand-50 px-3.5 py-2.5 text-sm leading-relaxed text-brand-900">
                      <Bot size={16} className="mt-0.5 shrink-0 text-brand-600" />
                      <span>
                        <span className="font-semibold">With AI: </span>
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
        <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
          <div className="grid items-center gap-10 lg:grid-cols-2">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-brand-700">
                AI-first, never AI-only
              </p>
              <h2 className="mt-2 font-display text-3xl font-semibold tracking-tight text-ink-900 sm:text-4xl">
                The practice is powered by AI. The feedback comes from people.
              </h2>
              <p className="mt-3 max-w-md text-base leading-relaxed text-ink-600">
                AI is tireless and instant, which makes it perfect for repetition. It’s also confidently
                wrong sometimes, which is why every important piece of work gets a human’s eyes too.
              </p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              {HUMANS.map((h) => (
                <div key={h.title} className="card p-6">
                  <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-500 to-brand-700 text-white shadow-e1">
                    <h.icon size={20} />
                  </span>
                  <h3 className="mt-4 text-lg font-semibold text-ink-900">{h.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-ink-600">{h.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Outcomes */}
        <section className="border-t border-ink-100">
          <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
            <div className="grid gap-10 lg:grid-cols-2">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-brand-700">
                  What you leave with
                </p>
                <h2 className="mt-2 font-display text-3xl font-semibold tracking-tight text-ink-900 sm:text-4xl">
                  Not a certificate of attendance. Evidence.
                </h2>
              </div>
              <ul className="space-y-3.5">
                {OUTCOMES.map((o) => (
                  <li key={o} className="flex items-start gap-3 text-[15px] text-ink-700">
                    <CheckCircle2 size={20} className="mt-0.5 shrink-0 text-brand-600" />
                    {o}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="mx-auto max-w-6xl px-4 pb-16 sm:px-6 sm:pb-20 lg:px-8">
          <div className="surface-wood-dark flex flex-col items-start justify-between gap-6 rounded-2xl px-6 py-10 sm:flex-row sm:items-center sm:px-10">
            <div>
              <h2 className="font-display text-2xl font-semibold tracking-tight text-white sm:text-3xl">
                Be first in when it opens.
              </h2>
              <p className="mt-2 max-w-md text-sm text-white/70 sm:text-base">
                Register your interest and we’ll email you the moment the {CAREER_READINESS.name} is
                ready — no commitment.
              </p>
            </div>
            <InterestCta state={state} error={error} onRegister={register} dark />
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}
