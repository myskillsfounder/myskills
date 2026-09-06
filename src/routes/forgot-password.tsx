import { useState } from 'react'
import { createFileRoute, Link } from '@tanstack/react-router'
import { CheckCircle2 } from 'lucide-react'
import { AuthShell } from '@/components/auth/AuthShell'
import { TextField } from '@/components/auth/TextField'
import { requestPasswordReset } from '@/lib/auth'
import { requireGuest } from '@/lib/guards'
import { Button } from '@/components/ui'

export const Route = createFileRoute('/forgot-password')({
  beforeLoad: requireGuest,
  component: ForgotPasswordPage,
})

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [fieldError, setFieldError] = useState<string>()
  const [formError, setFormError] = useState<string>()
  const [submitting, setSubmitting] = useState(false)
  const [sent, setSent] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setFormError(undefined)
    if (!EMAIL_RE.test(email)) {
      setFieldError('Enter a valid email address.')
      return
    }
    setFieldError(undefined)
    setSubmitting(true)
    try {
      await requestPasswordReset(email)
      setSent(true)
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Something went wrong. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  const backToSignIn = (
    <>
      Remembered it?{' '}
      <Link to="/login" className="font-semibold text-brand-700 hover:text-brand-800">
        Sign in
      </Link>
    </>
  )

  if (sent) {
    return (
      <AuthShell
        title="Check your email"
        subtitle={`If an account exists for ${email}, we've sent a link to reset your password.`}
        footer={backToSignIn}
      >
        <div className="flex items-start gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
          <CheckCircle2 size={18} className="mt-0.5 shrink-0" />
          The link expires in an hour. Check your spam folder if it doesn't show up in a minute.
        </div>
      </AuthShell>
    )
  }

  return (
    <AuthShell
      title="Forgot your password?"
      subtitle="Enter the email on your account and we'll send you a link to reset it."
      footer={backToSignIn}
    >
      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        <TextField
          label="Email"
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          error={fieldError}
        />

        {formError && <p className="text-sm text-red-500">{formError}</p>}

        <Button type="submit" disabled={submitting} size="lg" full>
          {submitting ? 'Sending…' : 'Send reset link'}
        </Button>
      </form>
    </AuthShell>
  )
}
