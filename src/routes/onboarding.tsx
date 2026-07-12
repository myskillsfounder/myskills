import { useState } from 'react'
import { createFileRoute, useRouter } from '@tanstack/react-router'
import { Check } from 'lucide-react'
import { TextField } from '@/components/auth/TextField'
import { completeOnboarding, signOut } from '@/lib/auth'
import { requireSession } from '@/lib/guards'
import {
  careerStageStep,
  genderOptions,
  goalsStep,
  personalDetailsStep,
  stepLabels,
} from '@/lib/onboardingContent'

export const Route = createFileRoute('/onboarding')({
  beforeLoad: requireSession,
  component: OnboardingPage,
})

interface Details {
  phone: string
  dob: string
  gender: string
  country: string
  state: string
}

function OnboardingPage() {
  const router = useRouter()
  const f = personalDetailsStep.fields

  const [step, setStep] = useState(0)
  const [details, setDetails] = useState<Details>({
    phone: '',
    dob: '',
    gender: '',
    country: f.country.default,
    state: f.state.default,
  })
  const [careerStage, setCareerStage] = useState('')
  const [goals, setGoals] = useState<string[]>([])
  const [error, setError] = useState<string>()
  const [submitting, setSubmitting] = useState(false)

  function setField<K extends keyof Details>(key: K, value: string) {
    setDetails((d) => ({ ...d, [key]: value }))
  }

  function toggleGoal(id: string) {
    setGoals((g) => (g.includes(id) ? g.filter((x) => x !== id) : [...g, id]))
  }

  function validate(): boolean {
    if (step === 0) {
      if (!details.phone.trim() || !details.dob || !details.gender || !details.country.trim() || !details.state.trim()) {
        setError('Please fill in all your details.')
        return false
      }
    }
    if (step === 1 && !careerStage) {
      setError('Pick the option that fits you best.')
      return false
    }
    if (step === 2 && goals.length === 0) {
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
      await completeOnboarding({
        phone: details.phone,
        date_of_birth: details.dob,
        gender: details.gender,
        country: details.country,
        state: details.state,
        career_stage: careerStage,
        goals,
      })
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

  const current =
    step === 0 ? personalDetailsStep : step === 1 ? careerStageStep : goalsStep

  return (
    <div className="flex min-h-screen flex-col bg-ink-50">
      <div className="mx-auto w-full max-w-lg px-4 py-8 sm:px-6 sm:py-12">
        {/* Progress */}
        <div className="mb-6">
          <p className="text-xs font-medium uppercase tracking-wide text-ink-400">
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

        <div className="rounded-2xl border border-ink-100 bg-white p-6 shadow-[0_1px_2px_rgba(0,0,0,0.04),0_12px_32px_-12px_rgba(0,0,0,0.12)] sm:p-8">
          <h1 className="text-xl font-semibold tracking-tight text-ink-900 sm:text-2xl">
            {current.title}
          </h1>
          <p className="mt-1.5 text-sm text-ink-500">{current.subtitle}</p>

          <div className="mt-6">
            {step === 0 && (
              <div className="space-y-4">
                <TextField
                  label={f.phone.label}
                  type="tel"
                  inputMode="tel"
                  autoComplete="tel"
                  placeholder={f.phone.placeholder}
                  value={details.phone}
                  onChange={(e) => setField('phone', e.target.value)}
                />
                <TextField
                  label={f.dob.label}
                  type="date"
                  value={details.dob}
                  onChange={(e) => setField('dob', e.target.value)}
                />
                <div>
                  <label htmlFor="ob-gender" className="block text-sm font-medium text-ink-700">
                    {f.gender.label}
                  </label>
                  <select
                    id="ob-gender"
                    value={details.gender}
                    onChange={(e) => setField('gender', e.target.value)}
                    className="mt-1.5 w-full rounded-lg border border-ink-200 bg-white px-3 py-2.5 text-sm text-ink-900 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/40"
                  >
                    <option value="" disabled>
                      {f.gender.placeholder}
                    </option>
                    {genderOptions.map((o) => (
                      <option key={o.value} value={o.value}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <TextField
                    label={f.country.label}
                    placeholder={f.country.placeholder}
                    value={details.country}
                    onChange={(e) => setField('country', e.target.value)}
                  />
                  <TextField
                    label={f.state.label}
                    placeholder={f.state.placeholder}
                    value={details.state}
                    onChange={(e) => setField('state', e.target.value)}
                  />
                </div>
              </div>
            )}

            {step === 1 && (
              <div className="space-y-3">
                {careerStageStep.options.map((opt) => {
                  const active = careerStage === opt.id
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setCareerStage(opt.id)}
                      className={`flex w-full items-start gap-3 rounded-xl border px-4 py-3 text-left transition-colors ${
                        active
                          ? 'border-brand-500 bg-brand-50'
                          : 'border-ink-200 hover:border-ink-300'
                      }`}
                    >
                      <span
                        className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border ${
                          active ? 'border-brand-600 bg-brand-600 text-white' : 'border-ink-300'
                        }`}
                      >
                        {active && <Check size={13} />}
                      </span>
                      <span>
                        <span className="block text-sm font-semibold text-ink-900">
                          {opt.title}
                        </span>
                        <span className="mt-0.5 block text-sm text-ink-500">
                          {opt.description}
                        </span>
                      </span>
                    </button>
                  )
                })}
              </div>
            )}

            {step === 2 && (
              <div className="flex flex-wrap gap-2">
                {goalsStep.options.map((opt) => {
                  const active = goals.includes(opt.id)
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => toggleGoal(opt.id)}
                      className={`inline-flex items-center gap-1.5 rounded-full border px-3.5 py-2 text-sm transition-colors ${
                        active
                          ? 'border-brand-500 bg-brand-50 text-brand-800'
                          : 'border-ink-200 text-ink-700 hover:border-ink-300'
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

          {error && <p className="mt-4 text-sm text-red-500">{error}</p>}

          <div className="mt-8 flex items-center justify-between gap-3">
            {step > 0 ? (
              <button
                type="button"
                onClick={() => {
                  setError(undefined)
                  setStep((s) => s - 1)
                }}
                className="rounded-full border border-ink-200 px-5 py-2.5 text-sm font-medium text-ink-900 transition-colors hover:border-ink-300"
              >
                Back
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSignOut}
                className="text-sm font-medium text-ink-500 hover:text-ink-900"
              >
                Sign out
              </button>
            )}

            <button
              type="button"
              onClick={handleNext}
              disabled={submitting}
              className="rounded-full bg-brand-600 px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {step < stepLabels.length - 1 ? 'Continue' : submitting ? 'Finishing…' : 'Finish'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
