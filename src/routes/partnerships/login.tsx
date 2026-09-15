import { useState } from 'react'
import { createFileRoute, useRouter } from '@tanstack/react-router'
import { AuthError, signIn } from '@/lib/auth'
import { requireGuestForPartnerships } from '@/lib/guards'
import { TextField } from '@/components/auth/TextField'
import { Button } from '@/components/ui'

/**
 * A dedicated sign-in page for the partnerships portal — deliberately not
 * the main site's /login. Internal-team accounts (created directly in
 * Supabase, see docs/supabase-partnerships-portal.sql) never need the
 * student sign-up flow, Google OAuth, or the onboarding wizard; this page
 * only does email + password and lands straight on /partnerships.
 */
export const Route = createFileRoute('/partnerships/login')({
  beforeLoad: requireGuestForPartnerships,
  component: PartnershipsLoginPage,
})

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function PartnershipsLoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({})
  const [formError, setFormError] = useState<string>()
  const [submitting, setSubmitting] = useState(false)

  function validate() {
    const next: typeof errors = {}
    if (!EMAIL_RE.test(email)) next.email = 'Enter a valid email address.'
    if (!password) next.password = 'Enter your password.'
    setErrors(next)
    return Object.keys(next).length === 0
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setFormError(undefined)
    if (!validate()) return
    setSubmitting(true)
    try {
      await signIn({ email, password })
      router.navigate({ to: '/partnerships' })
    } catch (err) {
      if (err instanceof AuthError && err.field) {
        setErrors((prev) => ({ ...prev, [err.field!]: err.message }))
      } else {
        setFormError(err instanceof Error ? err.message : 'Something went wrong.')
      }
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-ink-50 px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center text-center">
          <img src="/logo-mark.png" alt="" className="h-10 w-10" />
          <h1 className="mt-3 font-display text-xl font-semibold text-ink-900">
            Partnerships portal
          </h1>
          <p className="mt-1 text-sm text-ink-600">
            Sign in to review mentor and institution applications.
          </p>
        </div>

        <form onSubmit={handleSubmit} noValidate className="card space-y-4 p-6 shadow-sm">
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
            autoComplete="current-password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            error={errors.password}
          />

          {formError && <p className="text-sm text-red-500">{formError}</p>}

          <Button type="submit" disabled={submitting} size="lg" full>
            {submitting ? 'Signing in…' : 'Sign in'}
          </Button>
        </form>
      </div>
    </div>
  )
}
