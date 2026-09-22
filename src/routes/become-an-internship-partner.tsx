import { useState } from 'react'
import { errorMessage } from '@/lib/errors'
import { trackLead } from '@/lib/analytics'
import { createFileRoute, Link } from '@tanstack/react-router'
import { ArrowLeft, CheckCircle2, Send } from 'lucide-react'
import { submitInternshipPartnerLead } from '@/lib/internshipPartners'
import { Navbar } from '@/components/landing/Navbar'
import { Footer } from '@/components/landing/Footer'
import { Alert, Button, Input, Textarea } from '@/components/ui'

// Public on purpose: an interested company is an outside party, and making
// someone create a learner account before they can even express interest
// loses most of them — same reasoning as /become-a-mentor and
// /become-a-partner-institution.
export const Route = createFileRoute('/become-an-internship-partner')({
  component: BecomeAnInternshipPartnerPage,
})

interface FormState {
  company: string
  roles_offered: string
  city: string
  contact_name: string
  role: string
  email: string
  phone: string
}

const EMPTY: FormState = {
  company: '',
  roles_offered: '',
  city: '',
  contact_name: '',
  role: '',
  email: '',
  phone: '',
}

/** Mirrors the CHECK constraints in docs/supabase-internship-partner-leads.sql,
 *  so a bad value is caught here with a useful message instead of as a
 *  Postgres error the applicant can't act on. */
function validate(form: FormState): Partial<Record<keyof FormState, string>> {
  const errors: Partial<Record<keyof FormState, string>> = {}
  const len = (s: string) => s.trim().length

  if (len(form.company) < 2 || len(form.company) > 160) {
    errors.company = 'Please enter your company’s name.'
  }
  if (len(form.contact_name) < 2 || len(form.contact_name) > 80) {
    errors.contact_name = 'Please enter your name.'
  }
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(form.email.trim())) {
    errors.email = 'Enter a valid email address.'
  }
  if (len(form.role) > 80) errors.role = 'Please keep this under 80 characters.'
  if (len(form.phone) > 32) errors.phone = 'Please keep this under 32 characters.'
  if (len(form.city) > 80) errors.city = 'Please keep this under 80 characters.'
  if (len(form.roles_offered) > 2000) errors.roles_offered = 'Please keep this under 2000 characters.'
  return errors
}

function BecomeAnInternshipPartnerPage() {
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
      await submitInternshipPartnerLead({
        company: form.company,
        roles_offered: form.roles_offered,
        city: form.city,
        contact_name: form.contact_name,
        role: form.role,
        email: form.email,
        phone: form.phone,
      })
      trackLead('internship_partner')
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
            to="/community"
            className="mb-6 inline-flex items-center gap-1.5 text-sm font-medium text-ink-600 transition-colors hover:text-ink-900"
          >
            <ArrowLeft size={16} />
            Back to Community
          </Link>

          {done ? (
            <div className="card px-6 py-14 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
                <CheckCircle2 size={28} />
              </div>
              <h1 className="mt-4 font-display text-2xl font-semibold text-ink-900">
                Interest received
              </h1>
              <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-ink-600">
                Thanks — a real person on the team will reach out to set up internship roles for
                MySkills students.
              </p>
              <div className="mt-6">
                <Link
                  to="/community"
                  className="press inline-flex items-center justify-center rounded-full bg-brand-600 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-brand-700"
                >
                  Back to Community
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
                  Offer internships through MySkills
                </h1>
                <p className="mt-2 text-[15px] leading-relaxed text-ink-600">
                  Every MySkills student practises real scenarios and gets a score before they ever
                  apply anywhere — so an internship you post here starts from a pool that's already
                  shown its work, not just a resume. Tell us about your company and we'll be in
                  touch to set it up.
                </p>
              </header>

              <form onSubmit={handleSubmit} noValidate className="card space-y-5 p-6 sm:p-7">
                <Input
                  label="Company name"
                  value={form.company}
                  onChange={set('company')}
                  error={errors.company}
                  placeholder="Acme Digital Pvt. Ltd."
                />

                <Textarea
                  label="What kind of internships could you offer?"
                  value={form.roles_offered}
                  onChange={set('roles_offered')}
                  error={errors.roles_offered}
                  required={false}
                  rows={3}
                  placeholder="e.g. 2 Performance Marketing interns, 3 months, remote"
                />

                <Input
                  label="City"
                  value={form.city}
                  onChange={set('city')}
                  error={errors.city}
                  required={false}
                  placeholder="Bengaluru, India"
                />

                <div className="border-t border-ink-200 pt-5">
                  <p className="mb-4 text-xs font-semibold uppercase tracking-wide text-ink-500">
                    Your contact details — never shown publicly
                  </p>

                  <div className="space-y-5">
                    <Input
                      label="Your name"
                      value={form.contact_name}
                      onChange={set('contact_name')}
                      error={errors.contact_name}
                      autoComplete="name"
                    />

                    <Input
                      label="Your role"
                      value={form.role}
                      onChange={set('role')}
                      error={errors.role}
                      required={false}
                      placeholder="Founder, HR, Talent Acquisition…"
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

                    <Input
                      label="Phone"
                      value={form.phone}
                      onChange={set('phone')}
                      error={errors.phone}
                      required={false}
                      type="tel"
                      autoComplete="tel"
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
                  <Alert tone="danger" title="Couldn't send your interest">
                    <p>{submitError}</p>
                  </Alert>
                )}

                <Button type="submit" size="lg" full icon={Send} disabled={submitting}>
                  {submitting ? 'Sending…' : 'Send interest'}
                </Button>

                <p className="text-center text-xs text-ink-500">
                  We review every submission by hand. Your contact details are never shown
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
