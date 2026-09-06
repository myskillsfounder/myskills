import { useEffect, useState } from 'react'
import { createFileRoute, useRouter } from '@tanstack/react-router'
import { AuthShell } from '@/components/auth/AuthShell'
import { TextField } from '@/components/auth/TextField'
import { updatePassword } from '@/lib/auth'
import { supabase } from '@/lib/supabase'
import { Button, ButtonLink } from '@/components/ui'

/**
 * Where the emailed reset link lands. Supabase's client auto-detects the
 * recovery token in the URL (detectSessionInUrl) and exchanges it for a real
 * session before this component ever renders -- so by the time we check, a
 * missing session means the link was already used, expired, or someone
 * opened this page directly rather than from an actual email.
 *
 * No auth guard on this route: it must work for a signed-out visitor whose
 * only credential is the one-time link.
 */
export const Route = createFileRoute('/reset-password')({
  component: ResetPasswordPage,
})

function ResetPasswordPage() {
  const router = useRouter()
  const [checking, setChecking] = useState(true)
  const [hasSession, setHasSession] = useState(false)
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [errors, setErrors] = useState<{ password?: string; confirm?: string }>({})
  const [formError, setFormError] = useState<string>()
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState(false)

  useEffect(() => {
    let active = true
    supabase.auth.getSession().then(({ data }) => {
      if (!active) return
      setHasSession(!!data.session)
      setChecking(false)
    })
    return () => {
      active = false
    }
  }, [])

  function validate() {
    const next: typeof errors = {}
    if (password.length < 8) next.password = 'Use at least 8 characters.'
    if (confirm !== password) next.confirm = "Passwords don't match."
    setErrors(next)
    return Object.keys(next).length === 0
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setFormError(undefined)
    if (!validate()) return
    setSubmitting(true)
    try {
      await updatePassword(password)
      setDone(true)
      window.setTimeout(() => router.navigate({ to: '/dashboard' }), 1500)
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Something went wrong. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  if (checking) {
    return (
      <AuthShell title="Reset your password" subtitle="One moment…" footer={null}>
        <div className="h-11" />
      </AuthShell>
    )
  }

  if (!hasSession) {
    return (
      <AuthShell
        title="Link expired"
        subtitle="This password reset link is invalid or has already been used."
        footer={null}
      >
        <ButtonLink to="/forgot-password" size="lg" full>
          Request a new link
        </ButtonLink>
      </AuthShell>
    )
  }

  if (done) {
    return (
      <AuthShell title="Password updated" subtitle="Taking you to your dashboard…" footer={null}>
        <div className="h-11" />
      </AuthShell>
    )
  }

  return (
    <AuthShell title="Set a new password" subtitle="Choose a new password for your account." footer={null}>
      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        <TextField
          label="New password"
          passwordToggle
          autoComplete="new-password"
          placeholder="••••••••"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          error={errors.password}
        />
        <TextField
          label="Confirm password"
          passwordToggle
          autoComplete="new-password"
          placeholder="••••••••"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          error={errors.confirm}
        />

        {formError && <p className="text-sm text-red-500">{formError}</p>}

        <Button type="submit" disabled={submitting} size="lg" full>
          {submitting ? 'Updating…' : 'Update password'}
        </Button>
      </form>
    </AuthShell>
  )
}
