import { useState } from 'react'
import { createFileRoute, Link, useRouter } from '@tanstack/react-router'
import { MailCheck } from 'lucide-react'
import { AuthError } from '@/lib/auth'
import {
  portalConfirm,
  portalResendCode,
  portalSignUp,
  requestProblem,
  type PortalRequestDetails,
} from '@/lib/portalAccess'
import { requireGuestForMentor } from '@/lib/guards'
import { TextField } from '@/components/auth/TextField'
import { PortalRequestFields } from '@/components/mentoring/PortalRequestFields'
import { Button } from '@/components/ui'

/**
 * Create a Community portal account: for mentors, counsellors, career guides,
 * companies and institutions. Not the student sign-up (no onboarding, no
 * student app). An account opens nothing by itself: the email is confirmed with
 * a code, then the MySkills team verifies the person before any access is given.
 */
export const Route = createFileRoute('/community-portal/signup')({
  beforeLoad: requireGuestForMentor,
  component: PortalSignupPage,
})

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const SPECIAL_RE = /[\^$*.[\]{}()?"!@#%&/\\,><':;|_~`+=-]/

function PortalSignupPage() {
  const router = useRouter()
  const [phase, setPhase] = useState<'form' | 'confirm'>('form')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [request, setRequest] = useState<PortalRequestDetails>({ role: '', organisation: '', phone: '', message: '' })
  const [code, setCode] = useState('')
  const [errors, setErrors] = useState<{ name?: string; email?: string; password?: string; code?: string }>({})
  const [formError, setFormError] = useState<string>()
  const [notice, setNotice] = useState<string>()
  const [submitting, setSubmitting] = useState(false)

  function validate() {
    const next: typeof errors = {}
    if (!name.trim()) next.name = 'Enter your name.'
    if (!EMAIL_RE.test(email)) next.email = 'Enter a valid email address.'
    if (password.length < 8) next.password = 'Use at least 8 characters.'
    else if (!/[a-z]/.test(password) || !/[A-Z]/.test(password) || !/[0-9]/.test(password) || !SPECIAL_RE.test(password)) {
      next.password = 'Include upper- and lower-case letters, a number, and a special character.'
    }
    setErrors(next)
    const problem = requestProblem(request)
    setFormError(problem ?? undefined)
    return Object.keys(next).length === 0 && !problem
  }

  function applyError(err: unknown) {
    if (err instanceof AuthError && err.field) setErrors((p) => ({ ...p, [err.field!]: err.message }))
    else setFormError(err instanceof Error ? err.message : 'Something went wrong.')
  }

  async function handleSignUp(e: React.FormEvent) {
    e.preventDefault()
    if (!validate()) return
    setSubmitting(true)
    try {
      await portalSignUp({ name, email, password, request })
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

  return (
    <div className="flex min-h-screen items-center justify-center bg-ink-50 px-4 py-10">
      <div className="w-full max-w-md">
        <div className="mb-6 flex flex-col items-center text-center">
          <img src="/logo-mark.png" alt="" className="h-10 w-10" />
          <h1 className="mt-3 font-display text-xl font-semibold text-ink-900">
            {phase === 'confirm' ? 'Confirm your email' : 'Request Community Portal access'}
          </h1>
          <p className="mt-1 max-w-sm text-sm text-ink-600">
            {phase === 'confirm'
              ? (notice ?? `We sent a 6-digit code to ${email}.`)
              : 'For mentors, counsellors, career guides, companies and institutions working with MySkills students.'}
          </p>
        </div>

        {phase === 'confirm' ? (
          <form onSubmit={handleConfirm} noValidate className="card space-y-4 p-6 shadow-sm">
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
              {submitting ? 'Confirming…' : 'Confirm and continue'}
            </Button>
            <p className="text-center text-sm text-ink-600">
              Didn’t get it?{' '}
              <button type="button" onClick={handleResend} className="font-semibold text-brand-700 hover:text-brand-800">
                Resend code
              </button>
              {' · '}
              <button type="button" onClick={() => setPhase('form')} className="font-semibold text-brand-700 hover:text-brand-800">
                Use a different email
              </button>
            </p>
          </form>
        ) : (
          <form onSubmit={handleSignUp} noValidate className="card space-y-4 p-6 shadow-sm">
            <TextField label="Name" autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} error={errors.name} />
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
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              error={errors.password}
            />

            <div className="border-t border-ink-900/[0.06] pt-4">
              <PortalRequestFields value={request} onChange={setRequest} />
            </div>

            <p className="flex items-start gap-2 rounded-xl bg-brand-50 px-3 py-2.5 text-xs leading-relaxed text-brand-900">
              <MailCheck size={15} className="mt-0.5 shrink-0" />
              You’ll confirm your email with a code, then the MySkills team verifies your request. You get access once
              they approve it, and we’ll email you.
            </p>

            {formError && <p className="text-sm text-red-500">{formError}</p>}
            <Button type="submit" disabled={submitting} size="lg" full>
              {submitting ? 'Creating account…' : 'Create account and request access'}
            </Button>
          </form>
        )}

        <p className="mt-5 text-center text-sm text-ink-600">
          Already verified?{' '}
          <Link to="/community-portal/login" className="font-semibold text-brand-700 hover:text-brand-800">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  )
}
