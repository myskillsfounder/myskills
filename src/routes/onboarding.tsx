import { useState } from 'react'
import { createFileRoute, useRouter } from '@tanstack/react-router'
import { Briefcase, Check, Laptop, Rocket, Sparkles, TrendingUp, Users } from 'lucide-react'
import { trackEvent, trackSignUp } from '@/lib/analytics'
import { completeOnboarding, signOut } from '@/lib/auth'
import { requireSession } from '@/lib/guards'
import { useAuthUser, userDisplayName } from '@/lib/useAuth'
import { peekAfterOnboarding, takeAfterOnboarding } from '@/lib/afterOnboarding'
import {
  careerStageStep,
  goalLabel,
  goalStep,
  recommendStart,
  startStep,
  stepLabels,
  type PrimaryGoal,
} from '@/lib/onboardingContent'
import { StartChoice } from '@/components/practice/StartChoice'
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

const choiceBase = 'press group relative flex w-full items-start gap-3.5 rounded-xl border p-4 text-left transition-all duration-200'
const choiceOn =
  'border-brand-400/70 bg-brand-500/15 shadow-[0_0_0_1px_rgba(143,133,238,0.45),0_14px_40px_-14px_rgba(111,99,226,0.75)]'
const choiceOff = 'border-white/10 bg-white/[0.05] hover:border-white/25 hover:bg-white/[0.08]'

function OnboardingPage() {
  const router = useRouter()
  const { user } = useAuthUser()
  const firstName = userDisplayName(user).split(' ')[0]

  const [step, setStep] = useState(0)
  const [goal, setGoal] = useState('')
  const [careerStage, setCareerStage] = useState('')
  const [error, setError] = useState<string>()
  const [submitting, setSubmitting] = useState(false)

  const ready = step === 0 ? goal !== '' : step === 1 ? careerStage !== '' : true

  // A visitor who came from "Take the aptitude test" (or a programme's "start")
  // has already said where they're heading, so there's nothing left to ask:
  // their second answer finishes onboarding and lands them on that assessment.
  const knownDestination = peekAfterOnboarding()
  const lastQuestion = step === 1 && knownDestination !== null

  function handleNext() {
    if (!ready) return
    setError(undefined)
    trackEvent('onboarding_step', { step: step + 1 })
    if (lastQuestion) {
      void finish(undefined, 'remembered')
    } else {
      setStep((s) => s + 1)
    }
  }

  /** Saves the answers, then goes to `to` — the assessment they picked, where
   *  they were already heading, or the LaunchPad. */
  async function finish(to: string | undefined, how: string) {
    setSubmitting(true)
    setError(undefined)
    try {
      const method = await completeOnboarding({ career_stage: careerStage, goals: goal ? [goal] : [] })
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

  const current = step === 0 ? goalStep : step === 1 ? careerStageStep : startStep

  return (
    <div className="surface-wood-dark relative min-h-screen overflow-hidden">
      <GridBackdrop mask="ellipse 80% 60% at 50% 0%" />
      <Rings />
      <GlowOrb className="-left-24 top-24 h-72 w-72" />
      <GlowOrb className="-right-24 bottom-0 h-72 w-72" color="rgba(211,164,65,0.10)" />

      <div className="relative mx-auto flex min-h-screen w-full max-w-3xl flex-col px-4 py-6 sm:px-6 sm:py-10">
        <header className="flex items-center gap-2.5">
          <img src="/logo-mark.png" alt="" className="h-8 w-8" />
          <span className="font-display text-lg font-semibold tracking-tight text-white">MySkills</span>
        </header>

        <main className="flex flex-1 flex-col justify-center py-8 sm:py-10">
          {/* Progress */}
          <div className="mb-7">
            <p className="font-mono text-[11px] font-medium uppercase tracking-[0.18em] text-white/60">
              Step {step + 1} of {stepLabels.length} · {stepLabels[step]}
            </p>
            <div className="mt-2.5 flex gap-1.5" aria-hidden>
              {stepLabels.map((label, i) => (
                <span
                  key={label}
                  className={`h-1.5 flex-1 rounded-full transition-all duration-500 ${
                    i <= step
                      ? 'bg-gradient-to-r from-brand-400 to-brand-200 shadow-[0_0_12px_rgba(143,133,238,0.7)]'
                      : 'bg-white/10'
                  }`}
                />
              ))}
            </div>
          </div>

          {/* Keyed by step so each one rises in, rather than swapping abruptly. */}
          <div key={step} className="rise-in">
            {step === 0 && user && (
              <span className="mb-4 inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 font-mono text-xs font-medium text-white/85">
                <span className="relative flex h-1.5 w-1.5 rounded-full bg-emerald-400" />
                Welcome, {firstName}
              </span>
            )}
            <h1 className="font-display text-3xl font-semibold leading-[1.15] tracking-tight text-white sm:text-4xl">
              {current.title}
            </h1>
            <p className="mt-2.5 max-w-xl text-base leading-relaxed text-white/70">{current.subtitle}</p>

            {step === 2 && goal && (
              <p className="mt-4 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.06] px-3.5 py-1.5 text-sm text-white/85">
                <span className="text-white/55">{startStep.goalPrefix}</span>
                <span className="font-semibold text-white">{goalLabel(goal)}</span>
              </p>
            )}

            <div className="mt-7">
              {step === 0 && (
                <div role="radiogroup" aria-label={goalStep.title} className="grid gap-3 sm:grid-cols-2">
                  {goalStep.options.map((opt) => {
                    const active = goal === opt.id
                    const Icon = GOAL_ICONS[opt.icon]
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        role="radio"
                        aria-checked={active}
                        onClick={() => setGoal(opt.id)}
                        className={`${choiceBase} ${active ? choiceOn : choiceOff}`}
                      >
                        <span
                          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl transition-colors ${
                            active
                              ? 'bg-gradient-to-br from-brand-400 to-brand-700 text-white shadow-[0_8px_18px_-8px_rgba(111,99,226,0.9)]'
                              : 'bg-white/10 text-brand-200'
                          }`}
                        >
                          <Icon size={20} />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block text-[15px] font-semibold leading-snug text-white">{opt.title}</span>
                          <span className="mt-0.5 block text-[13px] leading-snug text-white/60">{opt.description}</span>
                        </span>
                        <span
                          aria-hidden
                          className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border transition-colors ${
                            active ? 'border-brand-300 bg-brand-400 text-white' : 'border-white/25'
                          }`}
                        >
                          {active && <Check size={12} />}
                        </span>
                      </button>
                    )
                  })}
                </div>
              )}

              {step === 1 && (
                <div role="radiogroup" aria-label={careerStageStep.title} className="grid gap-2.5 sm:grid-cols-2">
                  {careerStageStep.options.map((opt) => {
                    const active = careerStage === opt.id
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        role="radio"
                        aria-checked={active}
                        onClick={() => setCareerStage(opt.id)}
                        className={`${choiceBase} py-3.5 sm:[&:last-child:nth-child(odd)]:col-span-2 ${
                          active ? choiceOn : choiceOff
                        }`}
                      >
                        <span
                          aria-hidden
                          className={`mt-0.5 flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-full border transition-colors ${
                            active ? 'border-brand-300 bg-brand-400 text-white' : 'border-white/30'
                          }`}
                        >
                          {active && <Check size={12} />}
                        </span>
                        <span>
                          <span className="block text-sm font-semibold leading-snug text-white">{opt.title}</span>
                          <span className="mt-0.5 block text-[13px] leading-snug text-white/60">{opt.description}</span>
                        </span>
                      </button>
                    )
                  })}
                </div>
              )}

              {step === 2 && (
                <StartChoice
                  tone="dark"
                  showHeading={false}
                  recommended={recommendStart(goal)}
                  disabled={submitting}
                  onChoose={(option, to) => void finish(to, option)}
                />
              )}
            </div>
          </div>

          {error && (
            <p role="alert" className="mt-4 text-sm text-red-300">
              {error}
            </p>
          )}

          <div className="mt-8 flex items-center justify-between gap-3">
            {step > 0 ? (
              <button
                type="button"
                onClick={() => {
                  setError(undefined)
                  setStep((s) => s - 1)
                }}
                className="-ml-2 px-2 py-3 text-sm font-medium text-white/70 transition-colors hover:text-white"
              >
                Back
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSignOut}
                className="-ml-2 px-2 py-3 text-sm font-medium text-white/60 transition-colors hover:text-white"
              >
                Sign out
              </button>
            )}

            {step < stepLabels.length - 1 ? (
              <button
                type="button"
                onClick={handleNext}
                disabled={!ready || submitting}
                className="press inline-flex h-12 items-center justify-center rounded-full bg-white px-8 text-[15px] font-semibold text-ink-900 shadow-e2 transition-colors hover:bg-brand-50 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {lastQuestion ? (submitting ? 'Finishing…' : 'Finish') : 'Continue'}
              </button>
            ) : (
              <button
                type="button"
                onClick={() => void finish('/dashboard', 'later')}
                disabled={submitting}
                className="-mr-2 px-2 py-3 text-sm font-medium text-white/70 transition-colors hover:text-white disabled:opacity-60"
              >
                {submitting ? 'Finishing…' : startStep.skip}
              </button>
            )}
          </div>
        </main>
      </div>
    </div>
  )
}
