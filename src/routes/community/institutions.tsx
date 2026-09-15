import { useEffect, useState } from 'react'
import { errorMessage } from '@/lib/errors'
import { createFileRoute, Link } from '@tanstack/react-router'
import {
  ArrowLeft,
  Award,
  Building2,
  CheckCircle2,
  ExternalLink,
  GraduationCap,
  MapPin,
  Send,
  Sparkles,
  Star,
} from 'lucide-react'
import { requireOnboarded } from '@/lib/guards'
import { useAuthUser } from '@/lib/useAuth'
import { useProfile } from '@/lib/useProfile'
import { fetchInstitutionPartners, type InstitutionPartner } from '@/lib/institutionPartners'
import { submitInstitutionLead, type InstitutionLeadInput } from '@/lib/institutionDemoRequests'
import { AppShell } from '@/components/app/AppShell'
import { Alert, Button, EmptyState, Input, Skeleton, Textarea } from '@/components/ui'

// The parent /community layout allows signed-out visitors through (its index
// page is a public marketing page), so this leaf needs its own guard to stay
// authenticated-only — it renders inside AppShell, which assumes a session.
// (Applying to become a partner is the separate, public /become-a-partner-institution.)
export const Route = createFileRoute('/community/institutions')({
  beforeLoad: requireOnboarded,
  component: InstitutionsPage,
})

const EMPTY_LEAD: InstitutionLeadInput = {
  full_name: '',
  email: '',
  phone: '',
  city: '',
  message: '',
}

/**
 * Featured promo for our founding/exclusive partner — the "sponsored slot"
 * this section had before, brought back with an admission-lead form instead
 * of a demo-booking one. Writes into the same institution_demo_requests
 * table that flow always used (see src/lib/institutionDemoRequests.ts);
 * that table and its admin review queue never went away, only the page that
 * fed it did.
 */
function IntervalPromoCard() {
  const { user } = useAuthUser()
  const { profile } = useProfile()

  const [expanded, setExpanded] = useState(false)
  const [form, setForm] = useState<InstitutionLeadInput>(EMPTY_LEAD)
  const [errors, setErrors] = useState<Partial<Record<keyof InstitutionLeadInput, string>>>({})
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string>()
  const [done, setDone] = useState(false)

  useEffect(() => {
    setForm((f) => ({
      ...f,
      full_name: f.full_name || profile?.full_name || '',
      email: f.email || user?.email || '',
    }))
  }, [profile?.full_name, user?.email])

  const set = (key: keyof InstitutionLeadInput) => (e: { target: { value: string } }) => {
    setForm((f) => ({ ...f, [key]: e.target.value }))
    setErrors((prev) => (prev[key] ? { ...prev, [key]: undefined } : prev))
  }

  function validate(): Partial<Record<keyof InstitutionLeadInput, string>> {
    const found: Partial<Record<keyof InstitutionLeadInput, string>> = {}
    if (form.full_name.trim().length < 2) found.full_name = 'Please enter your full name.'
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(form.email.trim())) {
      found.email = 'Enter a valid email address.'
    }
    return found
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitError(undefined)

    const found = validate()
    if (Object.keys(found).length > 0) {
      setErrors(found)
      return
    }
    if (!user) return

    setSubmitting(true)
    try {
      await submitInstitutionLead(user.id, 'INTERVAL', form)
      setDone(true)
    } catch (err) {
      setSubmitError(errorMessage(err))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="mb-6 overflow-hidden rounded-2xl bg-gradient-to-br from-brand-700 via-brand-600 to-sky-500 shadow-e2">
      <div className="relative p-5 sm:p-6">
        <span aria-hidden className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full bg-white/10" />
        <span className="relative inline-flex items-center rounded-full bg-white/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white/80">
          Founding partner
        </span>

        <div className="relative mt-3 flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-5">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white text-brand-600 shadow-e1">
            <Sparkles size={22} />
          </span>
          <div className="min-w-0 flex-1">
            <h3 className="font-display text-lg font-semibold text-white">
              Get the digital marketing course with INTERVAL
            </h3>
            <p className="mt-1 text-sm leading-relaxed text-white/85">
              MySkills' exclusive offline partner — the same tracks and assessments you practice
              here, taught in person. Special pricing for MySkills students.
            </p>
          </div>

          {!expanded && !done && (
            <Button
              size="lg"
              icon={Send}
              onClick={() => setExpanded(true)}
              className="shrink-0 self-start bg-white text-brand-700 hover:bg-white/90 sm:self-auto"
            >
              Get discounted pricing
            </Button>
          )}
        </div>
      </div>

      {expanded && !done && (
        <form onSubmit={handleSubmit} noValidate className="space-y-4 bg-white p-5 sm:p-6">
          <p className="text-sm text-ink-600">
            Share your details and INTERVAL's admissions team will reach out with pricing and
            batch timings.
          </p>

          <Input
            label="Your name"
            value={form.full_name}
            onChange={set('full_name')}
            error={errors.full_name}
            autoComplete="name"
          />
          <div className="grid gap-4 sm:grid-cols-2">
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
          </div>
          <Input
            label="City"
            value={form.city}
            onChange={set('city')}
            error={errors.city}
            required={false}
          />
          <Textarea
            label="Anything else?"
            value={form.message}
            onChange={set('message')}
            error={errors.message}
            required={false}
            rows={2}
            placeholder="Preferred batch timing, course you're interested in…"
          />

          {submitError && (
            <Alert tone="danger" title="Couldn't send your details">
              <p>{submitError}</p>
            </Alert>
          )}

          <div className="flex gap-2">
            <Button type="submit" icon={Send} disabled={submitting}>
              {submitting ? 'Sending…' : 'Send my details'}
            </Button>
            <Button type="button" variant="ghost" onClick={() => setExpanded(false)} disabled={submitting}>
              Cancel
            </Button>
          </div>
        </form>
      )}

      {done && (
        <div className="flex items-center gap-3 bg-white p-5 sm:p-6">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
            <CheckCircle2 size={18} />
          </span>
          <p className="text-sm text-ink-700">
            Thanks! INTERVAL's team will reach out by email or phone with pricing and next steps.
          </p>
        </div>
      )}
    </div>
  )
}

function PartnerCard({ partner }: { partner: InstitutionPartner }) {
  return (
    <div className="card p-6 shadow-sm">
      <div className="flex items-start gap-4">
        {partner.logo_url ? (
          <img
            src={partner.logo_url}
            alt=""
            className="h-16 w-16 shrink-0 rounded-2xl border border-ink-100 object-contain"
          />
        ) : (
          <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-brand-600 text-white">
            <Building2 size={26} />
          </span>
        )}

        <div className="min-w-0 flex-1">
          <h2 className="font-display text-lg font-semibold text-ink-900">{partner.legal_name}</h2>
          <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-ink-600">
            {partner.city && (
              <span className="inline-flex items-center gap-1">
                <MapPin size={13} className="text-ink-400" /> {partner.city}
              </span>
            )}
            <span className="inline-flex items-center gap-1">
              <Award size={13} className="text-ink-400" />
              {partner.years_in_education} {partner.years_in_education === 1 ? 'year' : 'years'} in
              education
            </span>
            {partner.google_rating != null && (
              <span className="inline-flex items-center gap-1 font-medium text-amber-700">
                <Star size={13} className="fill-amber-500 text-amber-500" /> {partner.google_rating.toFixed(1)}
              </span>
            )}
          </div>
        </div>
      </div>

      {partner.courses_offered.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-1.5">
          {partner.courses_offered.map((c) => (
            <span
              key={c}
              className="rounded-full border border-brand-200 bg-brand-50 px-3 py-1 text-xs font-medium text-brand-700"
            >
              {c}
            </span>
          ))}
        </div>
      )}

      {(partner.website_url || partner.google_profile_url) && (
        <div className="mt-4 flex flex-wrap gap-4 border-t border-ink-200 pt-4 text-sm">
          {partner.website_url && (
            <a
              href={partner.website_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-ink-600 hover:text-brand-700"
            >
              <ExternalLink size={14} /> Website
            </a>
          )}
          {partner.google_profile_url && (
            <a
              href={partner.google_profile_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-ink-600 hover:text-brand-700"
            >
              <ExternalLink size={14} /> Google profile
            </a>
          )}
        </div>
      )}
    </div>
  )
}

function InstitutionsPage() {
  const [partners, setPartners] = useState<InstitutionPartner[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string>()

  useEffect(() => {
    let active = true
    fetchInstitutionPartners()
      .then((list) => active && setPartners(list))
      .catch((e) => active && setError(errorMessage(e)))
      .finally(() => active && setLoading(false))
    return () => {
      active = false
    }
  }, [])

  return (
    <AppShell>
      <div className="mx-auto max-w-2xl">
        <Link
          to="/community"
          className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-ink-600 hover:text-ink-900"
        >
          <ArrowLeft size={16} /> Back to Community
        </Link>

        <div className="mb-5">
          <h1 className="font-display text-2xl font-semibold tracking-tight text-ink-900">
            Institutions
          </h1>
          <p className="mt-1 text-sm text-ink-600">
            Training institutions verified as MySkills partners — the same skill tracks and
            assessments you practice here, offered offline or in a classroom.
          </p>
        </div>

        <IntervalPromoCard />

        {error && (
          <Alert tone="danger" title="Couldn’t load institutions">
            <p>{error}</p>
          </Alert>
        )}

        {loading ? (
          <Skeleton className="h-52 w-full" />
        ) : partners.length === 0 ? (
          <EmptyState
            icon={Building2}
            title="No partner institutions yet"
            description="We're onboarding the first ones now. Run a training institute — or know one?"
          />
        ) : (
          <div className="space-y-5">
            {partners.map((p) => (
              <PartnerCard key={p.id} partner={p} />
            ))}
          </div>
        )}

        <Link
          to="/become-a-partner-institution"
          className="lift mt-6 flex items-center justify-between gap-4 rounded-2xl border border-brand-200 bg-brand-50 p-5"
        >
          <div className="min-w-0">
            <p className="font-display text-base font-semibold text-brand-900">Partner with us</p>
            <p className="mt-0.5 text-sm text-brand-800/80">
              Run a training institute? Apply to be listed here for our students.
            </p>
          </div>
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-600 text-white">
            <GraduationCap size={18} />
          </span>
        </Link>
      </div>
    </AppShell>
  )
}
