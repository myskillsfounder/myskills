import { useState } from 'react'
import { errorMessage } from '@/lib/errors'
import { createFileRoute, Link } from '@tanstack/react-router'
import { ArrowLeft, CheckCircle2, Send } from 'lucide-react'
import { submitInstitutionPartnerApplication } from '@/lib/institutionPartners'
import { Navbar } from '@/components/landing/Navbar'
import { Footer } from '@/components/landing/Footer'
import { Alert, Button, Input, Textarea } from '@/components/ui'

// Public on purpose: an applying institution is an outside party, and making
// someone create a learner account before they can even apply loses most of
// them — same reasoning as /become-a-mentor.
export const Route = createFileRoute('/become-a-partner-institution')({
  component: BecomeAPartnerInstitutionPage,
})

interface FormState {
  legal_name: string
  courses_offered: string
  years_in_education: string
  city: string
  google_profile_url: string
  google_rating: string
  website_url: string
  contact_name: string
  contact_role: string
  email: string
  phone: string
  additional_info: string
}

const EMPTY: FormState = {
  legal_name: '',
  courses_offered: '',
  years_in_education: '',
  city: '',
  google_profile_url: '',
  google_rating: '',
  website_url: '',
  contact_name: '',
  contact_role: '',
  email: '',
  phone: '',
  additional_info: '',
}

const parseCourses = (raw: string) =>
  raw
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)

/** Mirrors the CHECK constraints in docs/supabase-institution-partner-onboarding.sql,
 *  so a bad value is caught here with a useful message instead of as a
 *  Postgres error the applicant can't act on. */
function validate(form: FormState): Partial<Record<keyof FormState, string>> {
  const errors: Partial<Record<keyof FormState, string>> = {}
  const len = (s: string) => s.trim().length

  if (len(form.legal_name) < 2 || len(form.legal_name) > 160) {
    errors.legal_name = 'Please enter your institution’s legal name.'
  }
  if (parseCourses(form.courses_offered).length === 0) {
    errors.courses_offered = 'List at least one course.'
  } else if (parseCourses(form.courses_offered).length > 15) {
    errors.courses_offered = 'Up to 15 courses, separated by commas.'
  }
  const years = Number(form.years_in_education.trim())
  if (!form.years_in_education.trim() || !Number.isFinite(years) || years < 0 || years > 150) {
    errors.years_in_education = 'Enter a number of years, 0 or more.'
  }
  if (len(form.contact_name) < 2 || len(form.contact_name) > 80) {
    errors.contact_name = 'Please enter your name.'
  }
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(form.email.trim())) {
    errors.email = 'Enter a valid email address.'
  }
  if (form.google_profile_url.trim() && !/^https:\/\//i.test(form.google_profile_url.trim())) {
    errors.google_profile_url = 'Should be a link starting with https://'
  }
  if (form.website_url.trim() && !/^https?:\/\//i.test(form.website_url.trim())) {
    errors.website_url = 'Should be a link starting with http:// or https://'
  }
  if (form.google_rating.trim()) {
    const rating = Number(form.google_rating.trim())
    if (!Number.isFinite(rating) || rating < 0 || rating > 5) {
      errors.google_rating = 'Enter a rating between 0 and 5.'
    }
  }
  if (len(form.city) > 80) errors.city = 'Please keep this under 80 characters.'
  if (len(form.contact_role) > 80) errors.contact_role = 'Please keep this under 80 characters.'
  if (len(form.phone) > 32) errors.phone = 'Please keep this under 32 characters.'
  if (len(form.additional_info) > 2000) errors.additional_info = 'Please keep this under 2000 characters.'
  return errors
}

function BecomeAPartnerInstitutionPage() {
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
      await submitInstitutionPartnerApplication({
        legal_name: form.legal_name,
        courses_offered: parseCourses(form.courses_offered),
        years_in_education: Number(form.years_in_education.trim()),
        city: form.city,
        google_profile_url: form.google_profile_url,
        google_rating: form.google_rating.trim() ? Number(form.google_rating.trim()) : undefined,
        website_url: form.website_url,
        contact_name: form.contact_name,
        contact_role: form.contact_role,
        email: form.email,
        phone: form.phone,
        additional_info: form.additional_info,
      })
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
            to="/community/institutions"
            className="mb-6 inline-flex items-center gap-1.5 text-sm font-medium text-ink-600 transition-colors hover:text-ink-900"
          >
            <ArrowLeft size={16} />
            Back to Institutions
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
                Thanks for your interest. We review every application by hand — if it's a fit,
                you'll hear from us by email and your institution will go live in the Community.
              </p>
              <div className="mt-6">
                <Link
                  to="/community/institutions"
                  className="press inline-flex items-center justify-center rounded-full bg-brand-600 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-brand-700"
                >
                  Back to Institutions
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
                  Partner with MySkills
                </h1>
                <p className="mt-2 text-[15px] leading-relaxed text-ink-600">
                  Run digital marketing courses or training programs? Get listed as a verified
                  MySkills partner institution so our students know who to trust for offline or
                  classroom learning. Tell us about your institution and we'll be in touch.
                </p>
              </header>

              <form onSubmit={handleSubmit} noValidate className="card space-y-5 p-6 sm:p-7">
                <Input
                  label="Institution's legal name"
                  value={form.legal_name}
                  onChange={set('legal_name')}
                  error={errors.legal_name}
                  placeholder="Acme Institute of Digital Marketing Pvt. Ltd."
                />

                <Input
                  label="Courses offered"
                  value={form.courses_offered}
                  onChange={set('courses_offered')}
                  error={errors.courses_offered}
                  hint="Comma separated, up to 15. e.g. Digital Marketing, SEO, Web Design"
                  placeholder="Digital Marketing, Performance Marketing"
                />

                <Input
                  label="Years in education and training"
                  value={form.years_in_education}
                  onChange={set('years_in_education')}
                  error={errors.years_in_education}
                  inputMode="numeric"
                  placeholder="e.g. 8"
                />

                <Input
                  label="City"
                  value={form.city}
                  onChange={set('city')}
                  error={errors.city}
                  required={false}
                  placeholder="Bengaluru, India"
                />

                <div className="grid gap-5 sm:grid-cols-2">
                  <Input
                    label="Google Business profile link"
                    value={form.google_profile_url}
                    onChange={set('google_profile_url')}
                    error={errors.google_profile_url}
                    required={false}
                    type="url"
                    placeholder="https://g.co/kgs/…"
                  />
                  <Input
                    label="Google rating"
                    value={form.google_rating}
                    onChange={set('google_rating')}
                    error={errors.google_rating}
                    required={false}
                    inputMode="decimal"
                    placeholder="e.g. 4.5"
                    hint="Out of 5, if you know it."
                  />
                </div>

                <Input
                  label="Website"
                  value={form.website_url}
                  onChange={set('website_url')}
                  error={errors.website_url}
                  required={false}
                  type="url"
                  placeholder="https://example.com"
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
                      value={form.contact_role}
                      onChange={set('contact_role')}
                      error={errors.contact_role}
                      required={false}
                      placeholder="Director, Principal, Placement Officer…"
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

                    <Textarea
                      label="Anything else that shows you'd be a good partner?"
                      value={form.additional_info}
                      onChange={set('additional_info')}
                      error={errors.additional_info}
                      required={false}
                      rows={3}
                      placeholder="Accreditations, notable alumni outcomes, placement partners…"
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
