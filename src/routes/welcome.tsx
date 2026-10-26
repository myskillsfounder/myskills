import { useEffect, useState } from 'react'
import { createFileRoute, Link, useRouter } from '@tanstack/react-router'
import { ArrowLeft, ArrowRight, BarChart3, Briefcase, Building2, Check, Globe2, GraduationCap, HeartHandshake, LayoutGrid, Megaphone, Rocket, Sparkles } from 'lucide-react'
import { trackEvent, trackSignUp } from '@/lib/analytics'
import { completeOnboarding, signOut } from '@/lib/auth'
import { takeAfterOnboarding } from '@/lib/afterOnboarding'
import type { TestRoute } from '@/lib/pendingAptitude'
import type { LeadProgramme } from '@/lib/programmes'
import { ProgrammeLeadForm } from '@/components/programmes/ProgrammeLeadForm'
import { requirePhoneWelcome } from '@/lib/guards'
import { GOAL_ICONS } from '@/lib/goalIcons'
import { careerStageStep, goalsFor } from '@/lib/onboardingContent'
import { ensureProfile } from '@/lib/profile'
import { useAuthUser, userDisplayName } from '@/lib/useAuth'
import { GlowOrb, GridBackdrop } from '@/components/landing/GridBackdrop'
import type { Category } from '@/components/community/Marketplace'

/**
 * The phone's front door, and its own onboarding.
 *
 * A phone opens on the Community marketplace (lib/device.ts), so it doesn't get
 * the website's home page or the computer's onboarding, which is about
 * choosing a programme to practise. It gets this: what the marketplace
 * is, a way in, and, for a new account, three taps that say who they are, what
 * they want, and what they came to find. Then the marketplace, already open
 * on that.
 *
 * Signed out: "I want to learn…", four programmes. The open ones (Digital
 * Marketing, Global Leadership) go to their aptitude test through sign-up;
 * the coming ones (Entrepreneurship, Data Analytics) take a lead.
 * Signed in and new: the three questions. Anyone
 * else is sent on by the guard.
 */
export const Route = createFileRoute('/welcome')({
  beforeLoad: requirePhoneWelcome,
  component: WelcomePage,
})

const FINDS: { id: Category; label: string; body: string; icon: typeof GraduationCap; tile: string }[] = [
  { id: 'mentors', label: 'A mentor', body: 'Someone who has done it, to work with one to one.', icon: GraduationCap, tile: 'from-brand-400 to-brand-700' },
  { id: 'wellness', label: 'Someone to talk to', body: 'A counsellor or a career guide, privately.', icon: HeartHandshake, tile: 'from-rose-400 to-pink-600' },
  { id: 'internships', label: 'An internship', body: 'Real work with a partner company.', icon: Briefcase, tile: 'from-emerald-400 to-teal-600' },
  { id: 'institutions', label: 'A place to learn', body: 'A verified institute for classroom learning.', icon: Building2, tile: 'from-sky-400 to-blue-600' },
]

function Frame({ children }: { children: React.ReactNode }) {
  return (
    <div className="surface-wood-dark relative min-h-[100dvh] overflow-hidden">
      <GridBackdrop mask="ellipse 90% 55% at 50% 0%" />
      <GlowOrb className="-left-24 top-16 h-64 w-64" />
      <GlowOrb className="-right-24 bottom-10 h-64 w-64" color="rgba(211,164,65,0.10)" />
      <div className="relative mx-auto flex min-h-[100dvh] w-full max-w-md flex-col px-5 pb-[calc(1.5rem+env(safe-area-inset-bottom))] pt-6">{children}</div>
    </div>
  )
}

const Brand = () => (
  <span className="flex items-center gap-2.5">
    <span className="font-display text-lg font-semibold tracking-tight text-white">MySkills</span>
  </span>
)

/* --------------------------------------------------------------- signed out */

type Learn = {
  id: string
  label: string
  body: string
  icon: typeof GraduationCap
  tile: string
} & ({ open: true; test: TestRoute } | { open: false; lead: LeadProgramme })

/**
 * What a visitor can come to learn. The open programmes start with their free
 * aptitude test (Entrepreneurship's is the course engine's); the one that isn't
 * open yet takes a name and number so the team can call when it is.
 */
const LEARN: Learn[] = [
  { id: 'dm', label: 'Digital Marketing', body: 'Ads, content, SEO and data, with practice and a mentor.', icon: Megaphone, tile: 'from-brand-400 to-brand-700', open: true, test: '/aptitude-assessment' },
  { id: 'gl', label: 'Global Leadership', body: 'Goals, communication and leading people: the Global Readiness programme.', icon: Globe2, tile: 'from-amber-400 to-orange-500', open: true, test: '/career-readiness-assessment' },
  { id: 'en', label: 'Entrepreneurship', body: 'Turn an idea into a business people pay for, with AI at every step.', icon: Rocket, tile: 'from-rose-400 to-pink-600', open: true, test: '/programmes/ai-powered-entrepreneurship/aptitude' },
  { id: 'da', label: 'Data Analytics', body: 'Spreadsheets, SQL and dashboards that answer real questions.', icon: BarChart3, tile: 'from-emerald-400 to-teal-600', open: false, lead: 'data-analytics' },
]

function Intro() {
  const router = useRouter()
  const [opened, setOpened] = useState<string | null>(null)

  // An open programme starts with its aptitude test, before any account: the
  // result is what signing up unlocks (lib/pendingAptitude.ts).
  function start(l: Learn) {
    if (!l.open) {
      setOpened((cur) => (cur === l.id ? null : l.id))
      return
    }
    trackEvent('welcome_programme', { programme: l.id })
    router.history.push(l.test)
  }

  return (
    <Frame>
      <header className="flex items-center justify-between">
        <Brand />
        <Link to="/login" className="text-sm font-semibold text-white/80">
          Sign in
        </Link>
      </header>

      {/* What MySkills is, what this page gives them, and what happens after
          the tap, before they choose. */}
      <main className="flex flex-1 flex-col justify-center py-6">
        <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-gradient-to-r from-brand-500/40 to-brand-400/20 px-3 py-1 text-xs font-semibold text-brand-100 ring-1 ring-brand-300/30">
          <Sparkles size={13} />
          Powered by AI
        </span>
        <h1 className="mt-3 font-display text-[1.875rem] font-semibold leading-[1.12] tracking-tight text-white">
          Know your aptitude before you learn
        </h1>
        <p className="mt-2.5 text-[15px] leading-relaxed text-white/70">
          Take a short aptitude test first. Your AI coach reads your strengths and shows you where to start. Free, and
          no account needed yet.
        </p>

        <ol className="mt-5 grid grid-cols-3 gap-2" aria-label="How it works">
          {['Pick a programme', 'Take the aptitude test', 'Your AI coach’s read'].map((s, i) => (
            <li key={s} className="flex flex-col items-center gap-1.5 rounded-xl bg-white/[0.06] px-2 py-2.5 text-center">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-brand-500/40 font-display text-xs font-semibold text-white">
                {i + 1}
              </span>
              <span className="text-xs font-medium leading-tight text-white/80">{s}</span>
            </li>
          ))}
        </ol>

        <h2 className="mt-6 font-display text-lg font-semibold text-white">What do you want to learn?</h2>
        <ul className="mt-3 space-y-2.5">
          {LEARN.map((l) => (
            <li key={l.id} className="card-glass-dark p-3">
              <button
                type="button"
                onClick={() => start(l)}
                aria-expanded={l.open ? undefined : opened === l.id}
                className="flex w-full items-center gap-3.5 text-left"
              >
                <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br text-white shadow-e1 ${l.tile}`}>
                  <l.icon size={20} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-2">
                    <span className="text-[15px] font-semibold text-white">{l.label}</span>
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${l.open ? 'bg-emerald-400/20 text-emerald-200' : 'bg-white/10 text-white/60'}`}
                    >
                      {l.open ? 'Open' : 'Soon'}
                    </span>
                  </span>
                  <span className="block text-sm leading-snug text-white/60">{l.body}</span>
                  {l.open && <span className="mt-1 block text-xs font-semibold text-brand-200">Take the aptitude test →</span>}
                </span>
              </button>
              {!l.open && opened === l.id && <ProgrammeLeadForm programme={l.lead} title={l.label} start="mobile" />}
            </li>
          ))}
        </ul>

        <ul className="mt-4 flex flex-wrap gap-x-4 gap-y-1.5 text-[13px] text-white/65">
          {['Verified mentors', 'Internships', 'Certificates you can share'].map((t) => (
            <li key={t} className="inline-flex items-center gap-1.5">
              <Check size={14} className="text-emerald-300" />
              {t}
            </li>
          ))}
        </ul>
      </main>

      <footer className="space-y-3">
        <Link
          to="/login"
          className="press flex min-h-[3.25rem] w-full items-center justify-center rounded-full border border-white/25 text-base font-semibold text-white"
        >
          I already have an account
        </Link>
        <p className="pt-1 text-center text-sm text-white/55">
          A mentor, company or institute?{' '}
          <Link to="/community" search={{ partners: true }} className="font-semibold text-white underline underline-offset-4">
            Partner with MySkills
          </Link>
        </p>
      </footer>
    </Frame>
  )
}

/* ------------------------------------------------------ signed in, and new */

/** One question to a screen, each answer one tap: made for a thumb, not a mouse. */
function Questions() {
  const router = useRouter()
  const { user } = useAuthUser()
  const first = userDisplayName(user).split(' ')[0]

  const [step, setStep] = useState(0)
  const [stage, setStage] = useState('')
  const [goal, setGoal] = useState('')
  const [find, setFind] = useState<Category | 'all' | ''>('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string>()

  // Each step starts at the top, as a new screen would.
  useEffect(() => {
    window.scrollTo({ top: 0 })
  }, [step])

  const goals = goalsFor(stage)

  async function finish(looking: Category | 'all') {
    setFind(looking)
    setSaving(true)
    setError(undefined)
    try {
      const method = await completeOnboarding({ career_stage: stage, goals: goal ? [goal] : [] })
      // A mentor request and a support request both point at their profile row.
      try {
        await ensureProfile()
      } catch {
        /* created again by whatever needs it next */
      }
      trackSignUp(method)
      trackEvent('onboarding_finish', { start: 'mobile', goal, looking })
      // Someone who signed up to take an aptitude assessment still goes to it.
      const remembered = takeAfterOnboarding()
      if (remembered) router.navigate({ to: remembered })
      else router.navigate({ to: '/community', search: looking === 'all' ? {} : { category: looking } })
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not save that. Please try again.')
      setSaving(false)
    }
  }

  async function handleSignOut() {
    await signOut()
    router.navigate({ to: '/welcome' })
  }

  const option =
    'press flex w-full items-center gap-3.5 rounded-2xl border border-white/10 bg-white/[0.06] p-4 text-left transition-colors active:bg-white/15 disabled:opacity-50'

  return (
    <Frame>
      <header className="flex items-center justify-between gap-3">
        {step > 0 ? (
          <button
            type="button"
            onClick={() => setStep((s) => s - 1)}
            disabled={saving}
            aria-label="Back"
            className="-ml-2 flex h-10 w-10 items-center justify-center rounded-full text-white/70 hover:text-white"
          >
            <ArrowLeft size={20} />
          </button>
        ) : (
          <Brand />
        )}
        <span className="flex gap-1.5" role="img" aria-label={`Step ${step + 1} of 3`}>
          {[0, 1, 2].map((i) => (
            <span key={i} className={`h-1.5 w-7 rounded-full transition-colors ${i <= step ? 'bg-brand-300' : 'bg-white/15'}`} />
          ))}
        </span>
        <button type="button" onClick={() => void handleSignOut()} className="-mr-2 px-2 py-2 text-sm font-medium text-white/55 hover:text-white">
          Sign out
        </button>
      </header>

      <main className="flex flex-1 flex-col py-7">
        {step === 0 && (
          <>
            <p className="font-mono text-xs font-medium uppercase tracking-[0.16em] text-brand-200">Welcome{first ? `, ${first}` : ''}</p>
            <h1 className="mt-2 font-display text-[1.75rem] font-semibold leading-tight tracking-tight text-white">Where are you right now?</h1>
            <p className="mt-2 text-[15px] text-white/65">Three quick taps and the Community is set up for you.</p>
            <div className="mt-6 space-y-2.5">
              {careerStageStep.options.map((o) => (
                <button
                  key={o.id}
                  type="button"
                  onClick={() => {
                    // A goal the new stage isn't offered doesn't carry over.
                    if (goal && !goalsFor(o.id).some((g) => g.id === goal)) setGoal('')
                    setStage(o.id)
                    setStep(1)
                  }}
                  className={`${option} ${stage === o.id ? 'border-brand-300 bg-brand-500/20' : ''}`}
                >
                  <span className="min-w-0 flex-1">
                    <span className="block text-[15px] font-semibold text-white">{o.label}</span>
                    <span className="block text-sm leading-snug text-white/60">{o.description}</span>
                  </span>
                  {stage === o.id && <Check size={18} className="shrink-0 text-brand-200" />}
                </button>
              ))}
            </div>
          </>
        )}

        {step === 1 && (
          <>
            <p className="font-mono text-xs font-medium uppercase tracking-[0.16em] text-brand-200">Your goal</p>
            <h1 className="mt-2 font-display text-[1.75rem] font-semibold leading-tight tracking-tight text-white">What do you want most right now?</h1>
            <p className="mt-2 text-[15px] text-white/65">Pick the one that matters most.</p>
            <div className="mt-6 space-y-2.5">
              {goals.map((o) => {
                const Icon = GOAL_ICONS[o.icon]
                return (
                  <button
                    key={o.id}
                    type="button"
                    onClick={() => {
                      setGoal(o.id)
                      setStep(2)
                    }}
                    className={`${option} ${goal === o.id ? 'border-brand-300 bg-brand-500/20' : ''}`}
                  >
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/10 text-brand-200">
                      <Icon size={18} />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-[15px] font-semibold text-white">{o.label}</span>
                      <span className="block text-sm leading-snug text-white/60">{o.description}</span>
                    </span>
                  </button>
                )
              })}
            </div>
          </>
        )}

        {step === 2 && (
          <>
            <p className="flex items-center gap-2 font-mono text-xs font-medium uppercase tracking-[0.16em] text-brand-200">
              <Sparkles size={13} /> Last one
            </p>
            <h1 className="mt-2 font-display text-[1.75rem] font-semibold leading-tight tracking-tight text-white">What are you looking for first?</h1>
            <p className="mt-2 text-[15px] text-white/65">We’ll open the Community on it. Everything else is one tap away.</p>
            <div className="mt-6 space-y-2.5">
              {FINDS.map((f) => (
                <button key={f.id} type="button" disabled={saving} onClick={() => void finish(f.id)} className={option}>
                  <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br text-white shadow-e1 ${f.tile}`}>
                    <f.icon size={20} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-[15px] font-semibold text-white">{f.label}</span>
                    <span className="block text-sm leading-snug text-white/60">{f.body}</span>
                  </span>
                  {saving && find === f.id ? <span className="shrink-0 text-xs text-white/60">Opening…</span> : <ArrowRight size={17} className="shrink-0 text-white/40" />}
                </button>
              ))}
              <button type="button" disabled={saving} onClick={() => void finish('all')} className={option}>
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white/10 text-white/80">
                  <LayoutGrid size={20} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-[15px] font-semibold text-white">Just show me everything</span>
                  <span className="block text-sm leading-snug text-white/60">Browse the whole Community.</span>
                </span>
                {saving && find === 'all' ? <span className="shrink-0 text-xs text-white/60">Opening…</span> : <ArrowRight size={17} className="shrink-0 text-white/40" />}
              </button>
            </div>
          </>
        )}

        {error && (
          <p role="alert" className="mt-4 text-sm text-red-300">
            {error}
          </p>
        )}
      </main>
    </Frame>
  )
}

function WelcomePage() {
  const { user, loading } = useAuthUser()
  // The guard has already sent on anyone who doesn't belong here, so all that
  // is left to decide is which half to show; nothing until that is known.
  if (loading) return <Frame>{null}</Frame>
  return user ? <Questions /> : <Intro />
}
