import { useState } from 'react'
import { createFileRoute, Link } from '@tanstack/react-router'
import { ArrowLeft, CheckCircle2, Send } from 'lucide-react'
import { submitMentorApplication } from '@/lib/mentors'
import { Navbar } from '@/components/landing/Navbar'
import { Footer } from '@/components/landing/Footer'
import { Alert, Button, Input, Textarea } from '@/components/ui'

// Public on purpose: a mentor is an outside party, and making them create a
// learner account before they can even offer to help loses most of them.
export const Route = createFileRoute('/become-a-mentor')({
  component: BecomeAMentorPage,
})

interface FormState {
  full_name: string
  headline: string
  bio: string
  location: string
  expertise: string
  linkedin_url: string
  email: string
  phone: string
  motivation: string
}

const EMPTY: FormState = {
  full_name: '',
  headline: '',
  bio: '',
  location: '',
  expertise: '',
  linkedin_url: '',
  email: '',
  phone: '',
  motivation: '',
}

const parseExpertise = (raw: string) =>
  raw
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)

/** Mirrors the CHECK constraints in docs/supabase-mentor-onboarding.sql, so a
 *  bad value is caught here with a useful message instead of as a Postgres
 *  error the applicant can't act on. */
function validate(form: FormState): Partial<Record<keyof FormState, string>> {
  const errors: Partial<Record<keyof FormState, string>> = {}
  const len = (s: string) => s.trim().length

  if (len(form.full_name) < 2 || len(form.full_name) > 80) {
    errors.full_name = 'Please enter your full name.'
  }
  if (len(form.headline) < 2 || len(form.headline) > 120) {
    errors.headline = 'A short professional title, up to 120 characters.'
  }
  if (len(form.bio) < 20) {
    errors.bio = 'Tell learners a little more — at least 20 characters.'
  } else if (len(form.bio) > 1200) {
    errors.bio = 'Please keep this under 1200 characters.'
  }
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(form.email.trim())) {
    errors.email = 'Enter a valid email address.'
  }
  if (form.linkedin_url.trim() && !/^https:\/\/([a-z]+\.)?linkedin\.com\//i.test(form.linkedin_url.trim())) {
    errors.linkedin_url = 'Should look like https://www.linkedin.com/in/your-name'
  }
  if (len(form.location) > 80) errors.location = 'Please keep this under 80 characters.'
  if (len(form.phone) > 32) errors.phone = 'Please keep this under 32 characters.'
  if (len(form.motivation) > 2000) errors.motivation = 'Please keep this under 2000 characters.'
  if (parseExpertise(form.expertise).length > 10) {
    errors.expertise = 'Up to 10 areas, separated by commas.'
  }
  return errors
}

function BecomeAMentorPage() {
  const [form, setForm] = useState<FormState>(EMPTY)
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({})
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string>()
  const [done, setDone] = useState(false)
  // Honeypot: a real applicant never sees this, so anything filled in here is a
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
      await submitMentorApplication({ ...form, expertise: parseExpertise(form.expertise) })
      setDone(true)
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : String(err))
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
            to="/"
            className="mb-6 inline-flex items-center gap-1.5 text-sm font-medium text-ink-600 transition-colors hover:text-ink-900"
          >
            <ArrowLeft size={16} />
            Back to MySkills
          </Link>

          {done ? (
            <div className="card px-6 py-14 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
                <CheckCircle2 size={28} />
              </div>
              <h1 className="mt-4 font-display text-2xl font-semibold text-ink-900">
                Application received
              </h1>
              <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-ink-600">
                Thanks for offering to help. We review every application by hand — if it's a
                fit, you'll hear from us by email and your profile will go live in the
                Community.
              </p>
              <div className="mt-6">
                <Link
                  to="/"
                  className="press inline-flex items-center justify-center rounded-full bg-brand-600 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-brand-700"
                >
                  Back to home
                </Link>
              </div>
            </div>
          ) : (
            <>
              <header className="mb-8">
                <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-brand-700">
                  Community
                </p>
                <h1 className="font-display text-3xl font-semibold leading-tight text-ink-900 sm:text-[2.5rem]">
                  Become a mentor
                </h1>
                <p className="mt-2 text-[15px] leading-relaxed text-ink-600">
                  Students across India use MySkills to build real digital marketing skills.
                  If you've done the work, a little of your time goes a long way. Tell us
                  about yourself and we'll be in touch.
                </p>
              </header>

              <form onSubmit={handleSubmit} noValidate className="card space-y-5 p-6 sm:p-7">
                <Input
                  label="Full name"
                  value={form.full_name}
                  onChange={set('full_name')}
                  error={errors.full_name}
                  autoComplete="name"
                  placeholder="Priya Sharma"
                />

                <Input
                  label="Professional title"
                  value={form.headline}
                  onChange={set('headline')}
                  error={errors.headline}
                  hint="Shown under your name in the Community."
                  placeholder="Performance Marketing Lead at Acme"
                />

                <Textarea
                  label="About you"
                  value={form.bio}
                  onChange={set('bio')}
                  error={errors.bio}
                  rows={5}
                  hint={`${form.bio.trim().length}/1200 — what you do, and how you can help a student starting out.`}
                  placeholder="I've spent six years running paid social for D2C brands…"
                />

                <Input
                  label="Areas of expertise"
                  value={form.expertise}
                  onChange={set('expertise')}
                  error={errors.expertise}
                  required={false}
                  hint="Comma separated, up to 10. e.g. SEO, Google Ads, Analytics"
                  placeholder="SEO, Google Ads, Career Coaching"
                />

                <Input
                  label="Location"
                  value={form.location}
                  onChange={set('location')}
                  error={errors.location}
                  required={false}
                  placeholder="Bengaluru, India"
                />

                <Input
                  label="LinkedIn profile"
                  value={form.linkedin_url}
                  onChange={set('linkedin_url')}
                  error={errors.linkedin_url}
                  required={false}
                  type="url"
                  placeholder="https://www.linkedin.com/in/your-name"
                />

                <div className="border-t border-ink-200 pt-5">
                  <p className="mb-4 text-xs font-semibold uppercase tracking-wide text-ink-500">
                    How we reach you — never shown publicly
                  </p>

                  <div className="space-y-5">
                    <Input
                      label="Email"
                      value={form.email}
                      onChange={set('email')}
                      error={errors.email}
                      type="email"
                      autoComplete="email"
                      placeholder="you@example.com"
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
                      label="Why do you want to mentor?"
                      value={form.motivation}
                      onChange={set('motivation')}
                      error={errors.motivation}
                      required={false}
                      rows={3}
                      hint="Only we see this — it helps us understand the fit."
                    />
                  </div>
                </div>

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
                  <Alert tone="danger" title="Couldn't send your application">
                    <p>{submitError}</p>
                  </Alert>
                )}

                <Button type="submit" size="lg" full icon={Send} disabled={submitting}>
                  {submitting ? 'Sending…' : 'Send application'}
                </Button>

                <p className="text-center text-xs text-ink-500">
                  We review every application by hand. Your contact details are never shown
                  publicly.
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
