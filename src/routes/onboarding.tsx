import { useEffect, useRef, useState } from 'react'
import { createFileRoute, useRouter } from '@tanstack/react-router'
import { ArrowRight, Briefcase, Laptop, Rocket, Sparkles, TrendingUp, Users } from 'lucide-react'
import { trackEvent, trackSignUp } from '@/lib/analytics'
import { completeOnboarding, signOut } from '@/lib/auth'
import { requireSession } from '@/lib/guards'
import { useAuthUser, userDisplayName } from '@/lib/useAuth'
import { peekAfterOnboarding, takeAfterOnboarding } from '@/lib/afterOnboarding'
import {
  ASSESSMENT_ROUTE,
  careerStageStep,
  focusStep,
  goalStep,
  planFor,
  type PrimaryGoal,
  type StartKey,
} from '@/lib/onboardingContent'
import { InlineSelect } from '@/components/onboarding/InlineSelect'
import { AnswerPanel } from '@/components/onboarding/AnswerPanel'
import { GlowOrb, GridBackdrop } from '@/components/landing/GridBackdrop'

export const Route = createFileRoute('/onboarding')({
  beforeLoad: requireSession,
  component: OnboardingPage,
})

const GOAL_ICONS: Record<PrimaryGoal['icon'], typeof Briefcase> = {
  briefcase: Briefcase,
  rocket: Rocket,
  sparkles: Sparkles,
  'trending-up': TrendingUp,
  laptop: Laptop,
  users: Users,
}

/** The same concentric rings as the landing hero, faint, top right. */
const Rings = () => (
  <span aria-hidden className="pointer-events-none absolute -right-24 -top-24 opacity-[0.12]">
    <svg width="420" height="420" viewBox="0 0 200 200" fill="none" stroke="#f6e3c8" strokeWidth="1.2">
      <circle cx="100" cy="100" r="96" />
      <circle cx="100" cy="100" r="74" />
      <circle cx="100" cy="100" r="52" />
      <circle cx="100" cy="100" r="30" />
    </svg>
  </span>
)

/**
 * Onboarding is one sentence — "I'm [a student] and I want to [find a new job].
 * I'd like to start with [digital marketing]." — completed with three
 * dropdowns, and then an answer: a plan built from the three choices, with the
 * button that starts it. Nothing is saved until they pick where to go.
 */
function OnboardingPage() {
  const router = useRouter()
  const { user } = useAuthUser()
  const firstName = userDisplayName(user).split(' ')[0]

  const [stage, setStage] = useState('')
  const [goal, setGoal] = useState('')
  const [focus, setFocus] = useState('')
  const [asked, setAsked] = useState(false)
  const [error, setError] = useState<string>()
  const [submitting, setSubmitting] = useState(false)
  const answerRef = useRef<HTMLDivElement>(null)

  const chosen = [stage, goal, focus].filter(Boolean).length
  const complete = chosen === 3

  // A visitor who came from "Take the aptitude test" (or a programme's "start")
  // has already said where they're heading, so there's nothing to ask: the
  // sentence finishes onboarding and lands them on that assessment.
  const knownDestination = peekAfterOnboarding()

  // Changing any choice withdraws the answer: it no longer matches the sentence.
  function pick(set: (v: string) => void) {
    return (id: string) => {
      set(id)
      setAsked(false)
      setError(undefined)
    }
  }

  useEffect(() => {
    if (asked) answerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
  }, [asked])

  function ask() {
    if (!complete) return
    trackEvent('onboarding_ask', { stage, goal, focus })
    if (knownDestination) {
      void finish(undefined, 'remembered')
    } else {
      setAsked(true)
    }
  }

  /** Saves the answers, then goes to `to` — the assessment they picked, where
   *  they were already heading, or the LaunchPad. */
  async function finish(to: string | undefined, how: string) {
    setSubmitting(true)
    setError(undefined)
    try {
      const method = await completeOnboarding({ career_stage: stage, goals: goal ? [goal] : [] })
      trackSignUp(method)
      trackEvent('onboarding_finish', { start: how, goal })
      const remembered = takeAfterOnboarding()
      router.navigate({ to: to ?? remembered ?? '/dashboard' })
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not save your profile. Please try again.')
      setSubmitting(false)
    }
  }

  async function handleSignOut() {
    await signOut()
    router.navigate({ to: '/login' })
  }

  const plan = complete ? planFor(stage, goal, focus) : null

  return (
    <div className="surface-wood-dark relative min-h-screen overflow-hidden">
      <GridBackdrop mask="ellipse 80% 60% at 50% 0%" />
      <Rings />
      <GlowOrb className="-left-24 top-24 h-72 w-72" />
      <GlowOrb className="-right-24 bottom-0 h-72 w-72" color="rgba(211,164,65,0.10)" />

      <div className="relative mx-auto flex min-h-screen w-full max-w-3xl flex-col px-4 py-6 sm:px-6 sm:py-10">
        <header className="flex items-center justify-between gap-3">
          <span className="flex items-center gap-2.5">
            <img src="/logo-mark.png" alt="" className="h-8 w-8" />
            <span className="font-display text-lg font-semibold tracking-tight text-white">MySkills</span>
          </span>
          <button
            type="button"
            onClick={handleSignOut}
            className="-mr-2 px-2 py-3 text-sm font-medium text-white/60 transition-colors hover:text-white"
          >
            Sign out
          </button>
        </header>

        <main className="flex flex-1 flex-col justify-center py-6 sm:py-10">
          {user && (
            <span className="mb-4 inline-flex w-fit items-center gap-2 rounded-full bg-white/10 px-3 py-1 font-mono text-xs font-medium text-white/85">
              <span className="relative flex h-1.5 w-1.5 rounded-full bg-emerald-400" />
              Welcome, {firstName}
            </span>
          )}
          <h1 className="font-display text-3xl font-semibold leading-[1.15] tracking-tight text-white sm:text-4xl">
            Let’s find your starting point
          </h1>
          <p className="mt-2.5 max-w-xl text-base leading-relaxed text-white/70">
            Complete the sentence — choose from each dropdown — and I’ll show you where to begin.
          </p>

          {/* The prompt: a sentence with three dropdowns in it. */}
          <div
            className={`card-glass-dark relative mt-7 rounded-2xl p-5 transition-shadow duration-500 sm:p-7 ${
              complete ? 'glow-edge' : ''
            }`}
          >
            <p className="mb-4 font-mono text-[11px] font-medium uppercase tracking-[0.18em] text-white/50">
              Your starting point
            </p>
            <p className="font-display text-[1.375rem] font-medium leading-[2.35] text-white sm:text-[1.75rem] sm:leading-[2.3]">
              I’m{' '}
              <InlineSelect
                value={stage}
                options={careerStageStep.options}
                onChange={pick(setStage)}
                placeholder="where you are"
                label="Where you are right now"
              />{' '}
              and I want to{' '}
              <InlineSelect
                value={goal}
                options={goalStep.options}
                onChange={pick(setGoal)}
                placeholder="your goal"
                label="The one goal you want to work towards"
                icon={(id) => {
                  const Icon = GOAL_ICONS[goalStep.options.find((o) => o.id === id)?.icon ?? 'sparkles']
                  return <Icon size={16} />
                }}
              />
              . I’d like to start with{' '}
              <InlineSelect
                value={focus}
                options={focusStep.options}
                onChange={pick(setFocus)}
                placeholder="a starting point"
                label="Where you'd like to start"
              />
              .
            </p>

            <div className="mt-5 flex items-center justify-between gap-4 border-t border-white/10 pt-4">
              <p className="flex items-center gap-2 font-mono text-xs text-white/50" aria-live="polite">
                <span className="flex gap-1" aria-hidden>
                  {[0, 1, 2].map((i) => (
                    <span
                      key={i}
                      className={`h-1.5 w-5 rounded-full transition-colors duration-300 ${
                        i < chosen ? 'bg-brand-300 shadow-[0_0_8px_rgba(143,133,238,0.7)]' : 'bg-white/15'
                      }`}
                    />
                  ))}
                </span>
                {chosen} of 3 chosen
              </p>
              <button
                type="button"
                onClick={ask}
                disabled={!complete || submitting || asked}
                className="press inline-flex h-12 items-center justify-center gap-2 rounded-full bg-white px-6 text-[15px] font-semibold text-ink-900 shadow-e2 transition-colors hover:bg-brand-50 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {knownDestination ? (
                  submitting ? (
                    'Finishing…'
                  ) : (
                    <>
                      Finish
                      <ArrowRight size={17} />
                    </>
                  )
                ) : (
                  <>
                    <Sparkles size={16} />
                    Show me my plan
                  </>
                )}
              </button>
            </div>
          </div>

          <div ref={answerRef}>
            {asked && plan && (
              <AnswerPanel
                key={`${stage}|${goal}|${focus}`}
                plan={plan}
                busy={submitting}
                onPick={(start: StartKey) => void finish(ASSESSMENT_ROUTE[start], start)}
                onSkip={() => void finish('/dashboard', 'later')}
              />
            )}
          </div>

          {error && (
            <p role="alert" className="mt-4 text-sm text-red-300">
              {error}
            </p>
          )}
        </main>
      </div>
    </div>
  )
}
