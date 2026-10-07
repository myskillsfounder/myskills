import { useState } from 'react'
import { createFileRoute, Link, useRouter } from '@tanstack/react-router'
import {
  ArrowLeft,
  ArrowRight,
  Briefcase,
  Building2,
  Check,
  Compass,
  GraduationCap,
  HeartHandshake,
  MailCheck,
  ShieldCheck,
  type LucideIcon,
} from 'lucide-react'
import { AuthError } from '@/lib/auth'
import {
  isPortalRole,
  PORTAL_ROLES,
  portalConfirm,
  portalResendCode,
  portalSignUp,
  requestProblem,
  type PortalRequestDetails,
  type PortalRole,
} from '@/lib/portalAccess'
import { requireGuestForMentor } from '@/lib/guards'
import { TextField } from '@/components/auth/TextField'
import { Button, Input, Textarea } from '@/components/ui'

/**
 * Partner with MySkills: create a Community portal account as a mentor,
 * counsellor, career guide, company or institution. Not the student sign-up (no
 * onboarding, no student app). An account opens nothing by itself: the email is
 * confirmed with a code, then the MySkills team verifies the person before any
 * access is given.
 *
 * `?role=` only presets which card is chosen (the public pages link here with
 * it); nothing personal is ever put in the address.
 */
export const Route = createFileRoute('/community-portal/signup')({
  validateSearch: (s: Record<string, unknown>): { role?: PortalRole } => ({
    role: isPortalRole(s.role) ? s.role : undefined,
  }),
  beforeLoad: requireGuestForMentor,
  component: PortalSignupPage,
})

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const SPECIAL_RE = /[\^$*.[\]{}()?"!@#%&/\\,><':;|_~`+=-]/

const ROLE_ICONS: Record<PortalRole, LucideIcon> = {
  mentor: GraduationCap,
  wellness: HeartHandshake,
  guidance: Compass,
  internships: Briefcase,
  institutions: Building2,
}

const STEPS = ['Your role', 'About you', 'Your login', 'Confirm email'] as const

const PASSWORD_RULES: { label: string; test: (p: string) => boolean }[] = [
  { label: 'At least 8 characters', test: (p) => p.length >= 8 },
  { label: 'Upper- and lower-case letters', test: (p) => /[a-z]/.test(p) && /[A-Z]/.test(p) },
  { label: 'A number', test: (p) => /[0-9]/.test(p) },
  { label: 'A special character', test: (p) => SPECIAL_RE.test(p) },
]

type Errors = { name?: string; email?: string; password?: string; code?: string }

function PortalSignupPage() {
  const router = useRouter()
  const preset = Route.useSearch().role
  // A role chosen on the page that sent them here skips the first step.
  const [step, setStep] = useState(preset ? 1 : 0)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [request, setRequest] = useState<PortalRequestDetails>({
    role: preset ?? '',
    organisation: '',
    phone: '',
    message: '',
  })
  const [code, setCode] = useState('')
  const [errors, setErrors] = useState<Errors>({})
  const [formError, setFormError] = useState<string>()
  const [notice, setNotice] = useState<string>()
  const [submitting, setSubmitting] = useState(false)
  // The email they typed already has a MySkills account: they sign in instead.
  const [hasAccount, setHasAccount] = useState(false)

  const role = PORTAL_ROLES.find((r) => r.value === request.role)
  const set = <K extends keyof PortalRequestDetails>(key: K, v: PortalRequestDetails[K]) =>
    setRequest((r) => ({ ...r, [key]: v }))

  function pickRole(value: PortalRole) {
    setRequest((r) => ({ ...r, role: value }))
    setFormError(undefined)
    setStep(1)
  }

  function nextFromAbout() {
    const next: Errors = {}
    if (!name.trim()) next.name = 'Enter your name.'
    setErrors(next)
    const problem = requestProblem(request)
    setFormError(problem ?? undefined)
    if (Object.keys(next).length === 0 && !problem) setStep(2)
  }

  function applyError(err: unknown) {
    setHasAccount(err instanceof AuthError && err.alreadyRegistered)
    if (err instanceof AuthError && err.field) setErrors((p) => ({ ...p, [err.field!]: err.message }))
    else setFormError(err instanceof Error ? err.message : 'Something went wrong.')
  }

  async function handleSignUp(e: React.FormEvent) {
    e.preventDefault()
    const next: Errors = {}
    if (!EMAIL_RE.test(email)) next.email = 'Enter a valid email address.'
    if (!PASSWORD_RULES.every((r) => r.test(password))) next.password = 'Meet every point on the list below.'
    setErrors(next)
    setFormError(undefined)
    setHasAccount(false)
    if (Object.keys(next).length) return
    setSubmitting(true)
    try {
      await portalSignUp({ name, email, password, request })
      setNotice(`We sent a 6-digit code to ${email}.`)
      setStep(3)
    } catch (err) {
      applyError(err)
    } finally {
      setSubmitting(false)
    }
  }

  async function handleConfirm(e: React.FormEvent) {
    e.preventDefault()
    setFormError(undefined)
    if (!/^\d{6}$/.test(code.trim())) {
      setErrors((p) => ({ ...p, code: 'Enter the 6-digit code from your email.' }))
      return
    }
    setSubmitting(true)
    try {
      await portalConfirm(email, password, code.trim())
      // The portal files the request when it opens, and says it is waiting.
      router.navigate({ to: '/community-portal' })
    } catch (err) {
      applyError(err)
    } finally {
      setSubmitting(false)
    }
  }

  async function handleResend() {
    setFormError(undefined)
    try {
      await portalResendCode(email)
      setNotice(`New code sent to ${email}.`)
    } catch (err) {
      applyError(err)
    }
  }

  const Icon = role ? ROLE_ICONS[role.value] : ShieldCheck

  return (
    <div className="min-h-screen bg-ink-50 lg:grid lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)]">
      {/* What they get, and what happens next: the reassurance beside the form.
          On a phone it shrinks to a heading so the form is the first thing reached. */}
      <aside className="bg-ink-900 px-6 py-6 text-white sm:px-10 lg:flex lg:min-h-screen lg:flex-col lg:justify-between lg:px-14 lg:py-12">
        <div>
          <Link to="/community" className="inline-flex items-center gap-2.5">
            <img src="/logo-mark.png" alt="" className="h-9 w-9" />
            <span className="font-display text-lg font-semibold">MySkills Community</span>
          </Link>

          <p className="mt-5 text-xs font-semibold uppercase tracking-[0.14em] text-brand-300 lg:mt-8">Partner with MySkills</p>
          <h1 className="mt-2 font-display text-2xl font-semibold leading-tight sm:text-4xl">
            {role ? `Join as ${role.label.replace(/^An? /, 'a ')}` : 'Work with students who are ready'}
          </h1>
          <p className="mt-3 hidden max-w-md text-sm leading-relaxed text-ink-300 sm:block">
            {role
              ? role.blurb
              : 'Mentors, counsellors, career guides, companies and institutions meet students who have practised, scored and earned certificates.'}
          </p>

          {role && (
            <ul className="mt-6 hidden space-y-3 lg:block">
              {role.perks.map((perk) => (
                <li key={perk} className="flex items-start gap-3 text-sm text-ink-100">
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-brand-500/20 text-brand-300">
                    <Check size={12} strokeWidth={3} />
                  </span>
                  {perk}
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="mt-8 hidden rounded-2xl bg-white/[0.06] p-5 lg:mt-12 lg:block">
          <p className="flex items-center gap-2 text-sm font-semibold">
            <ShieldCheck size={16} className="text-brand-300" />
            Everyone is verified before they get access
          </p>
          <p className="mt-1.5 text-xs leading-relaxed text-ink-300">
            You confirm your email, then the MySkills team checks your request. Until they approve it you can’t see any
            student, and no student sees you. We email you either way.
          </p>
        </div>
      </aside>

      <main className="flex items-start justify-center px-4 py-8 sm:px-8 lg:items-center lg:py-12">
        <div className="w-full max-w-lg">
          <ol className="mb-6 flex items-center gap-2" aria-label="Progress">
            {STEPS.map((label, i) => {
              const done = i < step
              const current = i === step
              return (
                <li key={label} className="flex min-w-0 flex-1 flex-col gap-1.5" aria-current={current ? 'step' : undefined}>
                  <span className={`h-1.5 rounded-full ${done || current ? 'bg-brand-600' : 'bg-ink-200'}`} />
                  <span
                    className={`truncate text-[11px] font-semibold ${
                      current ? 'text-ink-900' : done ? 'text-brand-700' : 'text-ink-400'
                    }`}
                  >
                    {i + 1}. {label}
                  </span>
                </li>
              )
            })}
          </ol>

          {step === 0 && (
            <section>
              <h2 className="font-display text-2xl font-semibold text-ink-900">How will you work with students?</h2>
              <p className="mt-1 text-sm text-ink-600">Choose the one that fits best. You can’t change it later without the team.</p>
              <div className="mt-5 grid gap-3">
                {PORTAL_ROLES.map((r) => {
                  const RoleIcon = ROLE_ICONS[r.value]
                  const chosen = request.role === r.value
                  return (
                    <button
                      key={r.value}
                      type="button"
                      onClick={() => pickRole(r.value)}
                      aria-pressed={chosen}
                      className={`card group flex items-center gap-4 p-4 text-left transition hover:border-brand-300 hover:shadow-md ${
                        chosen ? 'border-brand-500 ring-2 ring-brand-500/20' : ''
                      }`}
                    >
                      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-700">
                        <RoleIcon size={20} />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block font-semibold text-ink-900">{r.short}</span>
                        <span className="mt-0.5 block text-sm text-ink-600">{r.blurb}</span>
                      </span>
                      <ArrowRight size={16} className="shrink-0 text-ink-400 transition group-hover:translate-x-0.5 group-hover:text-brand-700" />
                    </button>
                  )
                })}
              </div>
            </section>
          )}

          {step === 1 && role && (
            <form
              noValidate
              onSubmit={(e) => {
                e.preventDefault()
                nextFromAbout()
              }}
              className="card space-y-4 p-6 shadow-sm"
            >
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-brand-700">
                  <Icon size={19} />
                </span>
                <div>
                  <h2 className="font-display text-xl font-semibold text-ink-900">Tell us about you</h2>
                  <p className="text-xs text-ink-500">
                    Joining as {role.label.replace(/^An? /, 'a ')} ·{' '}
                    <button type="button" onClick={() => setStep(0)} className="font-semibold text-brand-700 hover:underline">
                      change
                    </button>
                  </p>
                </div>
              </div>

              <TextField label="Your name" autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} error={errors.name} />
              {role.organisation && (
                <Input
                  label={role.organisation}
                  value={request.organisation}
                  onChange={(e) => set('organisation', e.target.value)}
                  maxLength={160}
                />
              )}
              <Input
                label="Phone"
                required={false}
                hint="Helps the team reach you while verifying."
                autoComplete="tel"
                value={request.phone}
                onChange={(e) => set('phone', e.target.value)}
                placeholder="+91 98470 12345"
              />
              <Textarea
                label="A little about you"
                required={false}
                hint={role.introHint}
                value={request.message}
                onChange={(e) => set('message', e.target.value)}
                rows={4}
                maxLength={1000}
              />

              {formError && <p className="text-sm text-red-500">{formError}</p>}
              <div className="flex items-center justify-between gap-3 pt-1">
                <Button type="button" variant="ghost" icon={ArrowLeft} onClick={() => setStep(0)}>
                  Back
                </Button>
                <Button type="submit">
                  Continue <ArrowRight size={16} />
                </Button>
              </div>
            </form>
          )}

          {step === 2 && (
            <form onSubmit={handleSignUp} noValidate className="card space-y-4 p-6 shadow-sm">
              <div>
                <h2 className="font-display text-xl font-semibold text-ink-900">Create your login</h2>
                <p className="mt-1 text-sm text-ink-600">
                  You’ll use this to open the portal once the team has verified you.
                </p>
              </div>
              <TextField
                label="Email"
                type="email"
                autoComplete="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                error={errors.email}
              />
              {hasAccount && (
                <div className="rounded-xl bg-amber-50 p-4">
                  <p className="text-sm font-semibold text-amber-900">You already have a MySkills account</p>
                  <p className="mt-0.5 text-sm text-amber-900/80">
                    No code was sent, because {email.trim()} is already registered. Sign in with that account instead: if
                    it has no portal access yet, you can ask for it there and the team will verify you.
                  </p>
                  <Link
                    to="/community-portal/login"
                    className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-amber-900 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-800"
                  >
                    Sign in to the portal <ArrowRight size={15} />
                  </Link>
                </div>
              )}
              <div>
                <TextField
                  label="Password"
                  passwordToggle
                  autoComplete="new-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  error={errors.password}
                />
                <ul className="mt-2 grid gap-x-4 gap-y-1 sm:grid-cols-2">
                  {PASSWORD_RULES.map((rule) => {
                    const ok = rule.test(password)
                    return (
                      <li key={rule.label} className={`flex items-center gap-1.5 text-xs ${ok ? 'text-emerald-700' : 'text-ink-500'}`}>
                        <span
                          className={`flex h-3.5 w-3.5 items-center justify-center rounded-full ${
                            ok ? 'bg-emerald-500 text-white' : 'border border-ink-300'
                          }`}
                        >
                          {ok && <Check size={9} strokeWidth={4} />}
                        </span>
                        {rule.label}
                      </li>
                    )
                  })}
                </ul>
              </div>

              {formError && <p className="text-sm text-red-500">{formError}</p>}
              <div className="flex items-center justify-between gap-3 pt-1">
                <Button type="button" variant="ghost" icon={ArrowLeft} onClick={() => setStep(1)}>
                  Back
                </Button>
                <Button type="submit" disabled={submitting}>
                  {submitting ? 'Creating account…' : 'Create account'}
                </Button>
              </div>
            </form>
          )}

          {step === 3 && (
            <form onSubmit={handleConfirm} noValidate className="card space-y-4 p-6 shadow-sm">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-brand-700">
                  <MailCheck size={19} />
                </span>
                <div>
                  <h2 className="font-display text-xl font-semibold text-ink-900">Confirm your email</h2>
                  <p className="text-xs text-ink-500">{notice ?? `We sent a 6-digit code to ${email}.`}</p>
                </div>
              </div>
              <TextField
                label="Verification code"
                inputMode="numeric"
                autoComplete="one-time-code"
                placeholder="123456"
                maxLength={6}
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                error={errors.code}
              />
              {formError && <p className="text-sm text-red-500">{formError}</p>}
              <Button type="submit" disabled={submitting} size="lg" full>
                {submitting ? 'Confirming…' : 'Confirm and request access'}
              </Button>
              <p className="text-center text-sm text-ink-600">
                Didn’t get it?{' '}
                <button type="button" onClick={handleResend} className="font-semibold text-brand-700 hover:text-brand-800">
                  Resend code
                </button>
                {' · '}
                <button
                  type="button"
                  onClick={() => {
                    setCode('')
                    setErrors({})
                    setStep(2)
                  }}
                  className="font-semibold text-brand-700 hover:text-brand-800"
                >
                  Use a different email
                </button>
              </p>
            </form>
          )}

          <p className="mt-5 flex items-start gap-2 text-xs leading-relaxed text-ink-500 lg:hidden">
            <ShieldCheck size={14} className="mt-0.5 shrink-0 text-brand-600" />
            Everyone is verified before they get access: you confirm your email, then the MySkills team checks your
            request and emails you.
          </p>

          <p className="mt-6 text-center text-sm text-ink-600">
            Already have an account?{' '}
            <Link to="/community-portal/login" className="font-semibold text-brand-700 hover:text-brand-800">
              Sign in
            </Link>
          </p>
        </div>
      </main>
    </div>
  )
}
