import { useEffect, useMemo, useState } from 'react'
import { errorMessage } from '@/lib/errors'
import { createFileRoute, Link } from '@tanstack/react-router'
import {
  ArrowLeft,
  Award,
  BookOpen,
  Building2,
  CheckCircle2,
  Clock,
  ExternalLink,
  GraduationCap,
  MapPin,
  Send,
  Star,
} from 'lucide-react'
import { requireOnboarded } from '@/lib/guards'
import { useAuthUser } from '@/lib/useAuth'
import { useProfile } from '@/lib/useProfile'
import {
  fetchInstitutionCourses,
  fetchInstitutionPartners,
  fetchInstitutionRatings,
  rateInstitutionPartner,
  type InstitutionPartner,
  type InstitutionPartnerCourse,
  type InstitutionPartnerRating,
} from '@/lib/institutionPartners'
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

interface RatingStats {
  average: number
  count: number
  mine: number | null
}

/** Clickable 1-5 stars. Every viewer of this page is signed in (the route
 *  guard requires it), so there's no read-only mode to design for — clicking
 *  always rates. Shows the viewer's own rating once they've set one (so they
 *  see their choice persisted), the rounded average before that. */
function RatingStars({
  stats,
  onRate,
  busy,
}: {
  stats: RatingStats
  onRate: (rating: number) => void
  busy: boolean
}) {
  const [hover, setHover] = useState<number | null>(null)
  const display = hover ?? stats.mine ?? Math.round(stats.average)

  return (
    <div className="flex items-center gap-1.5">
      <div className="flex items-center" onMouseLeave={() => setHover(null)}>
        {[1, 2, 3, 4, 5].map((i) => (
          <button
            key={i}
            type="button"
            disabled={busy}
            onMouseEnter={() => setHover(i)}
            onClick={() => onRate(i)}
            aria-label={`Rate ${i} star${i === 1 ? '' : 's'}`}
            className="p-0.5 text-ink-300 disabled:cursor-wait"
          >
            <Star size={16} className={i <= display ? 'fill-amber-500 text-amber-500' : ''} />
          </button>
        ))}
      </div>
      <span className="text-xs text-ink-500">
        {stats.count > 0
          ? `${stats.average.toFixed(1)} (${stats.count} ${stats.count === 1 ? 'rating' : 'ratings'})`
          : 'Be the first to rate'}
      </span>
    </div>
  )
}

/** Inline "get pricing" lead form, shared by every partner card. Writes into
 *  institution_demo_requests (docs/supabase-institution-demo-requests.sql)
 *  with `partner` set to this specific institution's name — that table
 *  predates the partner-directory rework and was never institution-specific
 *  on its own, just fed by a single hardcoded page before. */
function LeadForm({ partnerName, onDone }: { partnerName: string; onDone: () => void }) {
  const { user } = useAuthUser()
  const { profile } = useProfile()

  const [form, setForm] = useState<InstitutionLeadInput>(EMPTY_LEAD)
  const [errors, setErrors] = useState<Partial<Record<keyof InstitutionLeadInput, string>>>({})
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string>()

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
      await submitInstitutionLead(user.id, partnerName, form)
      onDone()
    } catch (err) {
      setSubmitError(errorMessage(err))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="mt-4 space-y-4 border-t border-ink-200 pt-4">
      <p className="text-sm text-ink-600">
        Share your details and {partnerName}'s admissions team will reach out with pricing and
        batch timings.
      </p>

      <Input label="Your name" value={form.full_name} onChange={set('full_name')} error={errors.full_name} autoComplete="name" />
      <div className="grid gap-4 sm:grid-cols-2">
        <Input label="Email" value={form.email} onChange={set('email')} error={errors.email} type="email" autoComplete="email" />
        <Input label="Phone" value={form.phone} onChange={set('phone')} error={errors.phone} required={false} type="tel" autoComplete="tel" />
      </div>
      <Input label="City" value={form.city} onChange={set('city')} error={errors.city} required={false} />
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

      <Button type="submit" size="sm" icon={Send} disabled={submitting}>
        {submitting ? 'Sending…' : 'Send my details'}
      </Button>
    </form>
  )
}

function PartnerCard({
  partner,
  courses,
  stats,
  onRate,
  ratingBusy,
}: {
  partner: InstitutionPartner
  courses: InstitutionPartnerCourse[]
  stats: RatingStats
  onRate: (rating: number) => void
  ratingBusy: boolean
}) {
  const [showForm, setShowForm] = useState(false)
  const [done, setDone] = useState(false)

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
              <span className="text-ink-400">Google {partner.google_rating.toFixed(1)}</span>
            )}
          </div>
          <div className="mt-2">
            <RatingStars stats={stats} onRate={onRate} busy={ratingBusy} />
          </div>
        </div>
      </div>

      {courses.length > 0 ? (
        <ul className="mt-4 divide-y divide-ink-100 rounded-xl border border-ink-100">
          {courses.map((c) => (
            <li key={c.id} className="flex items-center justify-between gap-4 px-4 py-2.5 text-sm">
              <span className="inline-flex items-center gap-2 font-medium text-ink-800">
                <BookOpen size={14} className="shrink-0 text-brand-600" />
                {c.name}
              </span>
              {c.duration && (
                <span className="inline-flex shrink-0 items-center gap-1 text-xs text-ink-500">
                  <Clock size={12} /> {c.duration}
                </span>
              )}
            </li>
          ))}
        </ul>
      ) : (
        partner.courses_offered.length > 0 && (
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
        )
      )}

      <div className="mt-4 flex flex-wrap items-center gap-4 border-t border-ink-200 pt-4 text-sm">
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
        {!done && !showForm && (
          <Button size="sm" variant="secondary" onClick={() => setShowForm(true)} className="ml-auto">
            Get pricing
          </Button>
        )}
      </div>

      {showForm && !done && <LeadForm partnerName={partner.legal_name} onDone={() => setDone(true)} />}

      {done && (
        <div className="mt-4 flex items-center gap-3 rounded-xl bg-emerald-50 p-4">
          <CheckCircle2 size={18} className="shrink-0 text-emerald-600" />
          <p className="text-sm text-emerald-800">
            Thanks! {partner.legal_name}'s team will reach out with pricing and next steps.
          </p>
        </div>
      )}
    </div>
  )
}

function InstitutionsPage() {
  const { user } = useAuthUser()
  const [partners, setPartners] = useState<InstitutionPartner[]>([])
  const [ratings, setRatings] = useState<InstitutionPartnerRating[]>([])
  const [courses, setCourses] = useState<InstitutionPartnerCourse[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string>()
  const [ratingBusyId, setRatingBusyId] = useState<string>()

  useEffect(() => {
    let active = true
    fetchInstitutionPartners()
      .then(async (list) => {
        if (!active) return
        setPartners(list)
        if (list.length > 0) {
          const ids = list.map((p) => p.id)
          const [r, c] = await Promise.all([fetchInstitutionRatings(ids), fetchInstitutionCourses(ids)])
          if (active) {
            setRatings(r)
            setCourses(c)
          }
        }
      })
      .catch((e) => active && setError(errorMessage(e)))
      .finally(() => active && setLoading(false))
    return () => {
      active = false
    }
  }, [])

  const coursesByInstitution = useMemo(() => {
    const map = new Map<string, InstitutionPartnerCourse[]>()
    for (const c of courses) {
      const list = map.get(c.institution_id)
      if (list) list.push(c)
      else map.set(c.institution_id, [c])
    }
    return map
  }, [courses])

  const statsByInstitution = useMemo(() => {
    const map = new Map<string, RatingStats>()
    for (const p of partners) map.set(p.id, { average: 0, count: 0, mine: null })
    for (const r of ratings) {
      const s = map.get(r.institution_id)
      if (!s) continue
      s.average = (s.average * s.count + r.rating) / (s.count + 1)
      s.count += 1
      if (r.profile_id === user?.id) s.mine = r.rating
    }
    return map
  }, [partners, ratings, user?.id])

  async function handleRate(institutionId: string, rating: number) {
    if (!user) return
    setRatingBusyId(institutionId)
    setError(undefined)
    try {
      await rateInstitutionPartner(institutionId, user.id, rating)
      setRatings((prev) => {
        const others = prev.filter((r) => !(r.institution_id === institutionId && r.profile_id === user.id))
        return [...others, { institution_id: institutionId, profile_id: user.id, rating }]
      })
    } catch (e) {
      setError(errorMessage(e))
    } finally {
      setRatingBusyId(undefined)
    }
  }

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
            assessments you practice here, offered offline or in a classroom. Rate the ones
            you've experienced.
          </p>
        </div>

        {error && (
          <div className="mb-5">
            <Alert tone="danger" title="Couldn’t load institutions">
              <p>{error}</p>
            </Alert>
          </div>
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
              <PartnerCard
                key={p.id}
                partner={p}
                courses={coursesByInstitution.get(p.id) ?? []}
                stats={statsByInstitution.get(p.id) ?? { average: 0, count: 0, mine: null }}
                onRate={(rating) => void handleRate(p.id, rating)}
                ratingBusy={ratingBusyId === p.id}
              />
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
