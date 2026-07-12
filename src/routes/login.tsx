import { useState } from 'react'
import { createFileRoute, Link, useRouter } from '@tanstack/react-router'
import { AuthShell } from '@/components/auth/AuthShell'
import { TextField } from '@/components/auth/TextField'
import { GoogleButton } from '@/components/auth/GoogleButton'
import { AuthError, signIn, signInWithGoogle } from '@/lib/auth'
import { requireGuest } from '@/lib/guards'

export const Route = createFileRoute('/login')({
  beforeLoad: requireGuest,
  component: LoginPage,
})

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function LoginPage() {
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
      // /profile redirects to /onboarding if the user hasn't onboarded yet.
      router.navigate({ to: '/profile' })
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

  async function handleGoogle() {
    setFormError(undefined)
    setSubmitting(true)
    try {
      await signInWithGoogle()
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Something went wrong.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <AuthShell
      title="Welcome back"
      subtitle="Sign in to continue your skill tracks."
      footer={
        <>
          Don’t have an account?{' '}
          <Link to="/signup" className="font-medium text-brand-600 hover:text-brand-700">
            Sign up
          </Link>
        </>
      }
    >
      <GoogleButton label="Continue with Google" onClick={handleGoogle} disabled={submitting} />

      <div className="my-5 flex items-center gap-3 text-xs text-ink-400">
        <span className="h-px flex-1 bg-ink-100" />
        or
        <span className="h-px flex-1 bg-ink-100" />
      </div>

      <form onSubmit={handleSubmit} noValidate className="space-y-4">
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

        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-full bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {submitting ? 'Signing in…' : 'Sign in'}
        </button>
      </form>
    </AuthShell>
  )
}
