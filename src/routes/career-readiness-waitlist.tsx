import { useState } from 'react'
import { errorMessage } from '@/lib/errors'
import { trackLead } from '@/lib/analytics'
import { useAuthUser } from '@/lib/useAuth'
import { createFileRoute, Link } from '@tanstack/react-router'
import { ArrowLeft, ArrowRight, CheckCircle2, Send } from 'lucide-react'
import { submitCareerReadinessLead } from '@/lib/programmes'
import { Navbar } from '@/components/landing/Navbar'
import { Footer } from '@/components/landing/Footer'
import { Alert, Button, Input } from '@/components/ui'

// Public on purpose, same reasoning as /become-a-mentor: joining the
// waitlist shouldn't require a learner account first — the whole point is to
// capture a lead the team can call, not to onboard a student.
export const Route = createFileRoute('/career-readiness-waitlist')({
  component: CareerReadinessWaitlistPage,
})

interface FormState {
  full_name: string
  phone: string
  email: string
}

const EMPTY: FormState = { full_name: '', phone: '', email: '' }

/** Mirrors the CHECK constraints in docs/supabase-career-readiness-leads.sql,
 *  so a bad value is caught here with a useful message instead of as a
 *  Postgres error the visitor can't act on. */
function validate(form: FormState): Partial<Record<keyof FormState, string>> {
  const errors: Partial<Record<keyof FormState, string>> = {}
  const len = (s: string) => s.trim().length

  if (len(form.full_name) < 2 || len(form.full_name) > 80) {
    errors.full_name = 'Please enter your name.'
  }
  if (len(form.phone) < 6 || len(form.phone) > 20) {
    errors.phone = 'Enter a valid phone number.'
  }
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(form.email.trim()) || len(form.email) > 254) {
    errors.email = 'Enter a valid email address.'
  }
  return errors
}

function CareerReadinessWaitlistPage() {
  const { user } = useAuthUser()
  const [form, setForm] = useState<FormState>(EMPTY)
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({})
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string>()
  const [done, setDone] = useState(false)
  // Honeypot: a real visitor never sees this, so anything filled in here is a
  // bot. Review is the actual defence — this just keeps the queue quieter.
  const [website, setWebsite] = useState('')

  const set = (key: keyof FormState) => (e: { target: { value: string } }) => {
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
    if (website.trim()) {
      // Silently accept so the bot doesn't learn what tripped it.
      setDone(true)
      return
    }

    setSubmitting(true)
    try {
      await submitCareerReadinessLead(form)
      trackLead('career_readiness_waitlist')
      setDone(true)
    } catch (err) {
      setSubmitError(errorMessage(err))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      <main className="surface-paper">
        <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6 sm:py-16">
          <Link
            to="/career-readiness"
            className="mb-6 inline-flex items-center gap-1.5 text-sm font-medium text-ink-600 transition-colors hover:text-ink-900"
          >
            <ArrowLeft size={16} />
            Back to Career Readiness Programme
          </Link>

          {done ? (
            <div className="card px-6 py-14 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
                <CheckCircle2 size={28} />
              </div>
              <h1 className="mt-4 font-display text-2xl font-semibold text-ink-900">
                You're on the list
              </h1>
              <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-ink-600">
                Thanks, {form.full_name.split(' ')[0]} — we'll be in touch as soon as the Career
                Readiness Programme opens.
              </p>
              {/* While you wait: the assessment is open now. It needs an
                  account (results are saved to one), so a signed-out visitor
                  is sent to sign up rather than to a login wall. */}
              <div className="mx-auto mt-6 max-w-sm rounded-xl bg-brand-50 p-4 text-left">
                <p className="text-sm font-semibold text-ink-900">While you wait, see where you stand</p>
                <p className="mt-1 text-sm leading-relaxed text-ink-600">
                  A quick, honest look at goal setting, communication, leadership, agile working and a growth
                  mindset — about 5 minutes.
                </p>
                <Link
                  to={user ? '/career-readiness-assessment' : '/signup'}
                  className="press mt-3 inline-flex items-center justify-center gap-2 rounded-full bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-700"
                >
                  Take the personal aptitude assessment
                  <ArrowRight size={16} />
                </Link>
                {!user && (
                  <p className="mt-2 text-xs text-ink-500">You’ll need a free MySkills account to save your results.</p>
                )}
              </div>
              <div className="mt-5">
                <Link
                  to="/career-readiness"
                  className="text-sm font-medium text-ink-600 transition-colors hover:text-ink-900"
                >
                  Back to Career Readiness Programme
                </Link>
              </div>
            </div>
          ) : (
            <>
              <header className="mb-8">
                <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-brand-700">
                  Career Readiness Programme
                </p>
                <h1 className="font-display text-3xl font-semibold leading-tight text-ink-900 sm:text-[2.5rem]">
                  Join the waitlist
                </h1>
                <p className="mt-2 text-[15px] leading-relaxed text-ink-600">
                  The programme isn't open yet — leave your name, phone and email and we'll get
                  in touch the moment it is. No account needed.
                </p>
              </header>

              <form onSubmit={handleSubmit} noValidate className="card space-y-5 p-6 sm:p-7">
                <Input
                  label="Full name"
                  value={form.full_name}
                  onChange={set('full_name')}
                  error={errors.full_name}
                  autoComplete="name"
                />

                <Input
                  label="Phone number"
                  value={form.phone}
                  onChange={set('phone')}
                  error={errors.phone}
                  type="tel"
                  autoComplete="tel"
                />

                <Input
                  label="Email"
                  value={form.email}
                  onChange={set('email')}
                  error={errors.email}
                  type="email"
                  autoComplete="email"
                  placeholder="you@example.com"
                />

                {/* Honeypot. Hidden from people, not from bots. */}
                <div aria-hidden className="absolute left-[-9999px] h-0 w-0 overflow-hidden">
                  <label>
                    Website
                    <input
                      type="text"
                      tabIndex={-1}
                      autoComplete="off"
                      value={website}
                      onChange={(e) => setWebsite(e.target.value)}
                    />
                  </label>
                </div>

                {submitError && (
                  <Alert tone="danger" title="Couldn't join the waitlist">
                    <p>{submitError}</p>
                  </Alert>
                )}

                <Button type="submit" size="lg" full icon={Send} disabled={submitting}>
                  {submitting ? 'Joining…' : 'Join the waitlist'}
                </Button>

                <p className="text-center text-xs text-ink-500">
                  We'll only use this to contact you when the programme opens. Never shown publicly.
                </p>
              </form>
            </>
          )}
        </div>
      </main>

      <Footer />
    </div>
  )
}
