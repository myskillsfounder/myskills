import { useEffect, useState } from 'react'
import { createFileRoute, Link } from '@tanstack/react-router'
import { ArrowLeft, Building2, CalendarCheck, CheckCircle2, Send } from 'lucide-react'
import { requireOnboarded } from '@/lib/guards'
import { useAuthUser } from '@/lib/useAuth'
import { useProfile } from '@/lib/useProfile'
import { institutionPartner, submitDemoRequest, type DemoRequestInput } from '@/lib/institutions'
import { AppShell } from '@/components/app/AppShell'
import { Alert, Button, Input, Textarea } from '@/components/ui'

// Same in-app shell as /community/mentors — the booker is always a signed-in
// MySkills user, unlike a mentor application from an outside party.
export const Route = createFileRoute('/community/institutions')({
  beforeLoad: requireOnboarded,
  component: InstitutionsPage,
})

const EMPTY: DemoRequestInput = {
  full_name: '',
  role: '',
  institution: '',
  city: '',
  student_count: '',
  email: '',
  phone: '',
  message: '',
}

/** Text wordmark in the partner's two-tone palette — a real logo asset can
 *  replace this once we have the file (see chat: only an inline image was
 *  shared, not a path this build can read). */
function IntervalWordmark({ className = '' }: { className?: string }) {
  return (
    <div className={className}>
      <p className="font-display text-3xl font-extrabold leading-none tracking-tight sm:text-4xl">
        <span className="text-brand-600">INT</span>
        <span className="text-sky-600">ERVAL</span>
      </p>
      <div className="mt-1.5 h-1 w-24 rounded-full bg-gradient-to-r from-brand-600 to-sky-600" />
      <p className="mt-2 text-sm font-medium">
        <span className="text-brand-600">Personalised</span>{' '}
        <span className="text-sky-600">Learning Platform</span>
      </p>
    </div>
  )
}

function validate(form: DemoRequestInput): Partial<Record<keyof DemoRequestInput, string>> {
  const errors: Partial<Record<keyof DemoRequestInput, string>> = {}
  const len = (s: string) => s.trim().length

  if (len(form.full_name) < 2 || len(form.full_name) > 80) {
    errors.full_name = 'Please enter your full name.'
  }
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(form.email.trim())) {
    errors.email = 'Enter a valid email address.'
  }
  if (form.student_count.trim() && !/^\d+$/.test(form.student_count.trim())) {
    errors.student_count = 'Enter a number.'
  }
  if (len(form.role) > 80) errors.role = 'Please keep this under 80 characters.'
  if (len(form.institution) > 120) errors.institution = 'Please keep this under 120 characters.'
  if (len(form.city) > 80) errors.city = 'Please keep this under 80 characters.'
  if (len(form.phone) > 32) errors.phone = 'Please keep this under 32 characters.'
  if (len(form.message) > 2000) errors.message = 'Please keep this under 2000 characters.'
  return errors
}

function InstitutionsPage() {
  const { user } = useAuthUser()
  const { profile } = useProfile()

  const [form, setForm] = useState<DemoRequestInput>(EMPTY)
  const [errors, setErrors] = useState<Partial<Record<keyof DemoRequestInput, string>>>({})
  const [showForm, setShowForm] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string>()
  const [done, setDone] = useState(false)

  // Pre-fill from the account once it loads — only if the user hasn't
  // already typed something over it.
  useEffect(() => {
    setForm((f) => ({
      ...f,
      full_name: f.full_name || profile?.full_name || '',
      email: f.email || user?.email || '',
    }))
  }, [profile?.full_name, user?.email])

  const set = (key: keyof DemoRequestInput) => (e: { target: { value: string } }) => {
    setForm((f) => ({ ...f, [key]: e.target.value }))
    setErrors((prev) => (prev[key] ? { ...prev, [key]: undefined } : prev))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitError(undefined)

    const found = validate(form)
    if (Object.keys(found).length > 0) {
      setErrors(found)
      return
    }
    if (!user) return

    setSubmitting(true)
    try {
      await submitDemoRequest(user.id, form)
      setDone(true)
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : String(err))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <AppShell>
      <Link
        to="/community"
        className="mb-6 inline-flex items-center gap-1.5 text-sm font-medium text-ink-600 transition-colors hover:text-ink-900"
      >
        <ArrowLeft size={16} />
        Back to Community
      </Link>

      <div className="card overflow-hidden">
        <div className="surface-wood-dark relative p-6 sm:p-8">
          <span aria-hidden className="pointer-events-none absolute -right-10 -top-10 opacity-[0.16]">
            <svg width="200" height="200" viewBox="0 0 200 200" fill="none" stroke="#f6e3c8" strokeWidth="2">
              <circle cx="130" cy="70" r="76" />
              <circle cx="130" cy="70" r="56" />
              <circle cx="130" cy="70" r="36" />
              <circle cx="130" cy="70" r="16" />
            </svg>
          </span>
          <p className="relative text-[11px] font-semibold uppercase tracking-[0.18em] text-white/60">
            Exclusive offline partner
          </p>
          <div className="relative mt-3 rounded-2xl bg-white p-5 sm:inline-block sm:p-6">
            <IntervalWordmark />
          </div>
          <p className="relative mt-4 max-w-lg text-sm leading-relaxed text-white/75">
            {institutionPartner.description}
          </p>
        </div>

        <div className="p-6 sm:p-8">
          <h2 className="font-display text-xl font-semibold text-ink-900">
            What your students get
          </h2>
          <ul className="mt-4 space-y-3">
            {institutionPartner.highlights.map((line) => (
              <li key={line} className="flex items-start gap-2.5 text-sm text-ink-700">
                <CheckCircle2 size={18} className="mt-0.5 shrink-0 text-brand-600" />
                {line}
              </li>
            ))}
          </ul>

          {!showForm && !done && (
            <Button
              size="lg"
              icon={CalendarCheck}
              onClick={() => setShowForm(true)}
              className="mt-6"
            >
              Book a demo
            </Button>
          )}
        </div>
      </div>

      {showForm && !done && (
        <form onSubmit={handleSubmit} noValidate className="card mt-6 space-y-5 p-6 sm:p-7">
          <div>
            <h2 className="font-display text-lg font-semibold text-ink-900">Book a demo</h2>
            <p className="mt-1 text-sm text-ink-600">
              Tell us a bit about your institution and we'll set up an offline session with{' '}
              {institutionPartner.name}.
            </p>
          </div>

          <Input
            label="Your name"
            value={form.full_name}
            onChange={set('full_name')}
            error={errors.full_name}
            autoComplete="name"
          />

          <Input
            label="Your role"
            value={form.role}
            onChange={set('role')}
            error={errors.role}
            required={false}
            placeholder="Placement officer, Principal, Faculty…"
          />

          <Input
            label="Institution name"
            value={form.institution}
            onChange={set('institution')}
            error={errors.institution}
            required={false}
          />

          <div className="grid gap-5 sm:grid-cols-2">
            <Input
              label="City"
              value={form.city}
              onChange={set('city')}
              error={errors.city}
              required={false}
            />
            <Input
              label="Number of students"
              value={form.student_count}
              onChange={set('student_count')}
              error={errors.student_count}
              required={false}
              inputMode="numeric"
              placeholder="e.g. 40"
            />
          </div>

          <div className="border-t border-ink-200 pt-5">
            <p className="mb-4 text-xs font-semibold uppercase tracking-wide text-ink-500">
              How we reach you
            </p>
            <div className="space-y-5">
              <Input
                label="Email"
                value={form.email}
                onChange={set('email')}
                error={errors.email}
                type="email"
                autoComplete="email"
              />
              <Input
                label="Phone"
                value={form.phone}
                onChange={set('phone')}
                error={errors.phone}
                required={false}
                type="tel"
                autoComplete="tel"
              />
              <Textarea
                label="Anything else we should know?"
                value={form.message}
                onChange={set('message')}
                error={errors.message}
                required={false}
                rows={3}
                placeholder="Preferred dates, batch size, current skill level…"
              />
            </div>
          </div>

          {submitError && (
            <Alert tone="danger" title="Couldn't send your request">
              <p>{submitError}</p>
            </Alert>
          )}

          <div className="flex flex-col gap-3 sm:flex-row">
            <Button type="submit" size="lg" icon={Send} disabled={submitting}>
              {submitting ? 'Sending…' : 'Request demo'}
            </Button>
            <Button type="button" variant="ghost" size="lg" onClick={() => setShowForm(false)}>
              Cancel
            </Button>
          </div>
        </form>
      )}

      {done && (
        <div className="card mt-6 px-6 py-14 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
            <CheckCircle2 size={28} />
          </div>
          <h2 className="mt-4 font-display text-2xl font-semibold text-ink-900">
            Request received
          </h2>
          <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-ink-600">
            We'll reach out by email or phone to set up your {institutionPartner.name} demo
            session.
          </p>
          <div className="mt-6">
            <Link
              to="/community"
              className="press inline-flex items-center justify-center gap-2 rounded-full bg-brand-600 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-brand-700"
            >
              <Building2 size={16} />
              Back to Community
            </Link>
          </div>
        </div>
      )}
    </AppShell>
  )
}
