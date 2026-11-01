import { useState } from 'react'
import { Zap } from 'lucide-react'
import { createFileRoute, Link, useRouter } from '@tanstack/react-router'
import { AuthShell } from '@/components/auth/AuthShell'
import { TextField } from '@/components/auth/TextField'
import { GoogleButton } from '@/components/auth/GoogleButton'
import {
  AuthError,
  confirmSignUp,
  resendCode,
  confirmLandsOn,
  signInIfConfirmed,
  signIn,
  signInWithGoogle,
  signUp,
} from '@/lib/auth'
import { requireGuest } from '@/lib/guards'
import { Button } from '@/components/ui'

export const Route = createFileRoute('/signup')({
  beforeLoad: requireGuest,
  component: SignupPage,
})

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const SPECIAL_RE = /[\^$*.[\]{}()?"!@#%&/\\,><':;|_~`+=-]/

function SignupPage() {
  const router = useRouter()
  const [phase, setPhase] = useState<'form' | 'confirm'>('form')

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [code, setCode] = useState('')

  const [errors, setErrors] = useState<{
    name?: string
    email?: string
    password?: string
    code?: string
  }>({})
  const [formError, setFormError] = useState<string>()
  const [notice, setNotice] = useState<string>()
  const [submitting, setSubmitting] = useState(false)

  function validateForm() {
    const next: typeof errors = {}
    if (!name.trim()) next.name = 'Enter your name.'
    if (!EMAIL_RE.test(email)) next.email = 'Enter a valid email address.'
    if (password.length < 8) {
      next.password = 'Use at least 8 characters.'
    } else if (
      !/[a-z]/.test(password) ||
      !/[A-Z]/.test(password) ||
      !/[0-9]/.test(password) ||
      !SPECIAL_RE.test(password)
    ) {
      next.password = 'Include upper- and lower-case letters, a number, and a special character.'
    }
    setErrors(next)
    return Object.keys(next).length === 0
  }

  async function handleSignUp(e: React.FormEvent) {
    e.preventDefault()
    setFormError(undefined)
    if (!validateForm()) return
    setSubmitting(true)
    try {
      // The email's link lands on onboarding, signed in (a phone is sent on to its own).
      await signUp({ name, email, password, redirectTo: confirmLandsOn('/onboarding') })
      setNotice(`We emailed ${email} a verification code. You can also use the link in that email.`)
      setPhase('confirm')
    } catch (err) {
      applyError(err)
    } finally {
      setSubmitting(false)
    }
  }

  async function handleConfirm(e: React.FormEvent) {
    e.preventDefault()
    setFormError(undefined)
    // Supabase's code length is a dashboard setting (6 to 10 digits), so
    // accept any of them rather than tie the form to one.
    if (!/^\d{6,10}$/.test(code.trim())) {
      setErrors((p) => ({ ...p, code: 'Enter the code from your email.' }))
      return
    }
    setSubmitting(true)
    try {
      await confirmSignUp(email, code.trim())
      // Account confirmed — sign the user straight in, then onboard.
      await signIn({ email, password })
      router.navigate({ to: '/onboarding' })
    } catch (err) {
      applyError(err)
    } finally {
      setSubmitting(false)
    }
  }

  async function handleResend() {
    setFormError(undefined)
    setErrors((p) => ({ ...p, code: undefined }))
    try {
      // Confirmed already (with the link, or in another tab): no code is coming,
      // and none is needed. On to onboarding, signed in.
      if (await signInIfConfirmed(email, password)) {
        router.navigate({ to: '/onboarding' })
        return
      }
      await resendCode(email, confirmLandsOn('/onboarding'))
      setNotice(`New code sent to ${email}.`)
    } catch (err) {
      applyError(err)
    }
  }

  async function handleGoogle() {
    setFormError(undefined)
    setSubmitting(true)
    try {
      await signInWithGoogle()
    } catch (err) {
      applyError(err)
    } finally {
      setSubmitting(false)
    }
  }

  function applyError(err: unknown) {
    if (err instanceof AuthError && err.field) {
      setErrors((prev) => ({ ...prev, [err.field!]: err.message }))
    } else {
      setFormError(err instanceof Error ? err.message : 'Something went wrong.')
    }
  }

  if (phase === 'confirm') {
    return (
      <AuthShell
        title="Verify your email"
        subtitle={notice ?? `We emailed ${email} a verification code. You can also use the link in that email.`}
        footer={
          <button
            type="button"
            onClick={() => setPhase('form')}
            className="font-semibold text-brand-700 hover:text-brand-800"
          >
            Use a different email
          </button>
        }
      >
        <form onSubmit={handleConfirm} noValidate className="space-y-4">
          <TextField
            label="Verification code"
            inputMode="numeric"
            autoComplete="one-time-code"
            placeholder="123456"
            maxLength={10}
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
            error={errors.code}
          />

          {formError && <p className="text-sm text-red-500">{formError}</p>}

          <Button type="submit" disabled={submitting} size="lg" full>
            {submitting ? 'Verifying…' : 'Verify and continue'}
          </Button>

          <p className="text-center text-sm text-ink-600">
            Didn’t get it?{' '}
            <button
              type="button"
              onClick={handleResend}
              className="font-semibold text-brand-700 hover:text-brand-800"
            >
              Resend code
            </button>
          </p>
        </form>
      </AuthShell>
    )
  }

  return (
    <AuthShell
      title="Create your account"
      subtitle="Take a 5-minute aptitude assessment, then start practising — free."
      footer={
        <>
          Already have an account?{' '}
          <Link to="/login" className="font-semibold text-brand-700 hover:text-brand-800">
            Sign in
          </Link>
        </>
      }
    >
      {/* On phones Google leads; from sm up the form leads and Google sits under it. */}
      <div className="flex flex-col">
        <form onSubmit={handleSignUp} noValidate className="order-3 space-y-4 sm:order-1">
          <TextField
            label="Name"
            autoComplete="name"
            placeholder="Ada Lovelace"
            value={name}
            onChange={(e) => setName(e.target.value)}
            error={errors.name}
          />
          <TextField
            label="Email"
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            error={errors.email}
          />
          <TextField
            label="Create a new password"
            hint="Make up a new password just for MySkills. Don’t use your email’s password. You’ll sign in with this email and this password."
            passwordToggle
            autoComplete="new-password"
            placeholder="At least 8 characters"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            error={errors.password}
          />

          {formError && <p className="text-sm text-red-500">{formError}</p>}

          <Button type="submit" variant="secondary" disabled={submitting} size="lg" full>
            {submitting ? 'Creating account…' : 'Create account with email'}
          </Button>
        </form>

        <div className="order-2 my-6 flex items-center gap-3 text-xs text-ink-500">
          <span className="h-px flex-1 bg-ink-200" />
          or
          <span className="h-px flex-1 bg-ink-200" />
        </div>

        {/* Preferred path: first on mobile, and everywhere it carries the visual
            weight — badge, tinted card and a heavier button — so most people take it. */}
        <div className="relative order-1 rounded-2xl border border-brand-200 bg-brand-50 px-4 pb-4 pt-6 sm:order-3">
          <span className="absolute -top-2.5 left-4 inline-flex items-center gap-1 rounded-full bg-brand-600 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-white shadow-e1">
            <Zap size={11} />
            Fastest
          </span>

          <GoogleButton
            label="Sign up with Google"
            onClick={handleGoogle}
            disabled={submitting}
            highlighted
          />

          <p className="mt-2.5 text-center text-[13px] leading-relaxed text-ink-600">
            One tap — no password to create and no email code to wait for.
          </p>
        </div>
      </div>
    </AuthShell>
  )
}
