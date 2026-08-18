import { useState } from 'react'
import { createFileRoute, Link, useRouter } from '@tanstack/react-router'
import { AuthShell } from '@/components/auth/AuthShell'
import { TextField } from '@/components/auth/TextField'
import { GoogleButton } from '@/components/auth/GoogleButton'
import {
  AuthError,
  confirmSignUp,
  resendCode,
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
      await signUp({ name, email, password })
      setNotice(`We sent a 6-digit code to ${email}.`)
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
    if (!/^\d{6}$/.test(code.trim())) {
      setErrors((p) => ({ ...p, code: 'Enter the 6-digit code from your email.' }))
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
      await resendCode(email)
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
        subtitle={notice ?? `We sent a 6-digit code to ${email}.`}
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
            maxLength={6}
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
      subtitle="Start the initial assessment and unlock all 8 tracks."
      footer={
        <>
          Already have an account?{' '}
          <Link to="/login" className="font-semibold text-brand-700 hover:text-brand-800">
            Sign in
          </Link>
        </>
      }
    >
      <GoogleButton label="Sign up with Google" onClick={handleGoogle} disabled={submitting} />

      <div className="my-5 flex items-center gap-3 text-xs text-ink-500">
        <span className="h-px flex-1 bg-ink-200" />
        or
        <span className="h-px flex-1 bg-ink-200" />
      </div>

      <form onSubmit={handleSignUp} noValidate className="space-y-4">
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
          label="Password"
          passwordToggle
          autoComplete="new-password"
          placeholder="At least 8 characters"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          error={errors.password}
        />

        {formError && <p className="text-sm text-red-500">{formError}</p>}

        <Button type="submit" disabled={submitting} size="lg" full>
            {submitting ? 'Creating account…' : 'Create account'}
          </Button>
      </form>
    </AuthShell>
  )
}
