import { useState } from 'react'
import { createFileRoute, useRouter } from '@tanstack/react-router'
import { Check } from 'lucide-react'
import { completeOnboarding, signOut } from '@/lib/auth'
import { requireSession } from '@/lib/guards'
import { careerStageStep, goalsStep, stepLabels } from '@/lib/onboardingContent'

export const Route = createFileRoute('/onboarding')({
  beforeLoad: requireSession,
  component: OnboardingPage,
})

function OnboardingPage() {
  const router = useRouter()

  const [step, setStep] = useState(0)
  const [careerStage, setCareerStage] = useState('')
  const [goals, setGoals] = useState<string[]>([])
  const [error, setError] = useState<string>()
  const [submitting, setSubmitting] = useState(false)

  function toggleGoal(id: string) {
    setGoals((g) => (g.includes(id) ? g.filter((x) => x !== id) : [...g, id]))
  }

  function validate(): boolean {
    if (step === 0 && !careerStage) {
      setError('Pick the option that fits you best.')
      return false
    }
    if (step === 1 && goals.length === 0) {
      setError('Choose at least one goal.')
      return false
    }
    setError(undefined)
    return true
  }

  function handleNext() {
    if (!validate()) return
    if (step < stepLabels.length - 1) {
      setStep((s) => s + 1)
    } else {
      void finish()
    }
  }

  async function finish() {
    setSubmitting(true)
    setError(undefined)
    try {
      await completeOnboarding({ career_stage: careerStage, goals })
      router.navigate({ to: '/profile' })
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not save your profile. Please try again.')
      setSubmitting(false)
    }
  }

  function handleSignOut() {
    signOut()
    router.navigate({ to: '/login' })
  }

  const current = step === 0 ? careerStageStep : goalsStep

  return (
    <div className="flex min-h-screen flex-col justify-center bg-ink-100">
      <div className="mx-auto w-full max-w-2xl px-4 py-6 sm:px-6 sm:py-10">
        {/* Progress */}
        <div className="mb-4">
          <p className="text-xs font-medium uppercase tracking-wide text-ink-500">
            Step {step + 1} of {stepLabels.length} · {stepLabels[step]}
          </p>
          <div className="mt-2 flex gap-1.5">
            {stepLabels.map((label, i) => (
              <span
                key={label}
                className={`h-1.5 flex-1 rounded-full ${i <= step ? 'bg-brand-600' : 'bg-ink-200'}`}
              />
            ))}
          </div>
        </div>

        <div className="card p-5 shadow-[0_1px_2px_rgba(0,0,0,0.04),0_12px_32px_-12px_rgba(0,0,0,0.12)] sm:p-7">
          <h1 className="text-xl font-semibold tracking-tight text-ink-900 sm:text-2xl">
            {current.title}
          </h1>
          <p className="mt-1 text-sm text-ink-600">{current.subtitle}</p>

          <div className="mt-5">
            {step === 0 && (
              <div className="grid gap-2.5 sm:grid-cols-2">
                {careerStageStep.options.map((opt) => {
                  const active = careerStage === opt.id
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setCareerStage(opt.id)}
                      className={`flex h-full w-full items-start gap-2.5 rounded-xl border px-3.5 py-2.5 text-left transition-colors ${
                        active
                          ? 'border-brand-500 bg-brand-50'
                          : 'border-ink-300 hover:border-ink-400'
                      }`}
                    >
                      <span
                        className={`mt-0.5 flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-full border ${
                          active ? 'border-brand-600 bg-brand-600 text-white' : 'border-ink-300'
                        }`}
                      >
                        {active && <Check size={12} />}
                      </span>
                      <span>
                        <span className="block text-sm font-semibold leading-snug text-ink-900">
                          {opt.title}
                        </span>
                        <span className="mt-0.5 block text-[13px] leading-snug text-ink-600">
                          {opt.description}
                        </span>
                      </span>
                    </button>
                  )
                })}
              </div>
            )}

            {step === 1 && (
              <div className="flex flex-wrap gap-2">
                {goalsStep.options.map((opt) => {
                  const active = goals.includes(opt.id)
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => toggleGoal(opt.id)}
                      className={`inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-[13px] transition-colors ${
                        active
                          ? 'border-brand-500 bg-brand-50 text-brand-800'
                          : 'border-ink-300 text-ink-800 hover:border-ink-400'
                      }`}
                    >
                      {active && <Check size={14} className="text-brand-600" />}
                      {opt.label}
                    </button>
                  )
                })}
              </div>
            )}
          </div>

          {error && <p className="mt-3 text-sm text-red-500">{error}</p>}

          <div className="mt-6 flex items-center justify-between gap-3">
            {step > 0 ? (
              <button
                type="button"
                onClick={() => {
                  setError(undefined)
                  setStep((s) => s - 1)
                }}
                className="rounded-full border border-ink-300 px-5 py-2.5 text-sm font-medium text-ink-900 transition-colors hover:border-ink-400"
              >
                Back
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSignOut}
                className="text-sm font-medium text-ink-600 hover:text-ink-900"
              >
                Sign out
              </button>
            )}

            <button
              type="button"
              onClick={handleNext}
              disabled={submitting}
              className="press h-11 rounded-xl bg-brand-600 px-6 text-sm font-semibold text-white shadow-e1 transition-colors hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {step < stepLabels.length - 1 ? 'Continue' : submitting ? 'Finishing…' : 'Finish'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
