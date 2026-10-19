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
import { STUDENT_STAGE, enquireInstitution, fetchMyEnquiries, type EnquiryInput, type MyEnquiry } from '@/lib/institutionLeads'
import { AppShell } from '@/components/app/AppShell'
import { PageHeader } from '@/components/app/PageHeader'
import { Alert, Button, EmptyState, Input, Skeleton, Textarea } from '@/components/ui'

// The parent /community layout allows signed-out visitors through (its index
// page is a public marketing page), so this leaf needs its own guard to stay
// authenticated-only — it renders inside AppShell, which assumes a session.
// (Applying to become a partner is the separate, public /become-a-partner-institution.)
export const Route = createFileRoute('/community/institutions')({
  beforeLoad: requireOnboarded,
  component: InstitutionsPage,
})

const WHEN = ['Any time', 'Weekday mornings', 'Weekday afternoons', 'Weekday evenings', 'Weekends']

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

/**
 * "I'm interested": the student's enquiry, which goes to the MySkills team as a
 * lead (docs/supabase-institution-leads.sql). Their name and email come from
 * their account; the phone from their profile, which they can change here.
 */
function EnquiryForm({
  partner,
  courses,
  onDone,
}: {
  partner: InstitutionPartner
  courses: string[]
  onDone: () => void
}) {
  const { profile } = useProfile()
  const [form, setForm] = useState<EnquiryInput>({ course: '', phone: '', city: '', preferred: WHEN[0], message: '' })
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string>()

  useEffect(() => {
    setForm((f) => ({ ...f, phone: f.phone || profile?.phone || '', city: f.city || partner.city || '' }))
  }, [profile?.phone, partner.city])

  const set = (key: keyof EnquiryInput) => (e: { target: { value: string } }) => setForm((f) => ({ ...f, [key]: e.target.value }))

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitError(undefined)
    setSubmitting(true)
    try {
      await enquireInstitution(partner.id, form)
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
        The MySkills team will call you within two working days to help you choose, and to set up a visit to{' '}
        {partner.legal_name}.
      </p>
      {courses.length > 0 && (
        <label className="block text-sm font-medium text-ink-800">
          Course you’re interested in
          <select value={form.course} onChange={set('course')} className="field mt-1.5 block w-full">
            <option value="">Not sure yet</option>
            {courses.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </label>
      )}
      <div className="grid gap-4 sm:grid-cols-2">
        <Input label="Phone" value={form.phone} onChange={set('phone')} required={false} type="tel" autoComplete="tel" />
        <Input label="City" value={form.city} onChange={set('city')} required={false} />
      </div>
      <label className="block text-sm font-medium text-ink-800">
        When suits you for a call
        <select value={form.preferred} onChange={set('preferred')} className="field mt-1.5 block w-full">
          {WHEN.map((w) => (
            <option key={w} value={w}>
              {w}
            </option>
          ))}
        </select>
      </label>
      <Textarea
        label="Anything else?"
        value={form.message}
        onChange={set('message')}
        required={false}
        rows={2}
        maxLength={2000}
        placeholder="Batch timing, fees, or a question for the team"
      />
      <p className="text-xs text-ink-500">Your name, email and phone go to the MySkills team only.</p>

      {submitError && (
        <Alert tone="danger" title="Couldn't send your enquiry">
          <p>{submitError}</p>
        </Alert>
      )}

      <Button type="submit" size="sm" icon={Send} disabled={submitting}>
        {submitting ? 'Sending…' : 'Send my enquiry'}
      </Button>
    </form>
  )
}

/** Where a student's enquiry stands, in plain words. */
function EnquiryStatus({ enquiry }: { enquiry: MyEnquiry }) {
  const st = STUDENT_STAGE[enquiry.stage]
  const done = enquiry.stage === 'enrolled'
  return (
    <div className={`mt-4 flex items-start gap-3 rounded-xl p-4 ${done ? 'bg-emerald-50' : enquiry.stage === 'lost' ? 'bg-ink-100' : 'bg-brand-50'}`}>
      <CheckCircle2 size={18} className={`mt-0.5 shrink-0 ${done ? 'text-emerald-600' : 'text-brand-600'}`} />
      <div className="min-w-0">
        <p className="text-sm font-semibold text-ink-900">
          {st.label}
          {enquiry.course ? <span className="font-normal text-ink-600"> · {enquiry.course}</span> : null}
        </p>
        <p className="text-xs text-ink-600">
          {st.note} Sent {new Date(enquiry.created_at).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })}.
        </p>
      </div>
    </div>
  )
}

function PartnerCard({
  partner,
  courses,
  stats,
  onRate,
  ratingBusy,
  enquiry,
  onEnquired,
}: {
  partner: InstitutionPartner
  courses: InstitutionPartnerCourse[]
  stats: RatingStats
  onRate: (rating: number) => void
  ratingBusy: boolean
  /** The student's latest enquiry with this institution, if any. */
  enquiry?: MyEnquiry
  onEnquired: () => void
}) {
  const [showForm, setShowForm] = useState(false)
  // An open or successful enquiry replaces the button; a closed one lets them ask again.
  const open = enquiry && enquiry.stage !== 'lost'
  const courseNames = courses.length > 0 ? courses.map((c) => c.name) : partner.courses_offered

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
        {!open && !showForm && (
          <Button size="sm" onClick={() => setShowForm(true)} className="ml-auto">
            {enquiry ? 'Enquire again' : 'I’m interested'}
          </Button>
        )}
      </div>

      {enquiry && !showForm && <EnquiryStatus enquiry={enquiry} />}

      {showForm && !open && (
        <EnquiryForm
          partner={partner}
          courses={courseNames}
          onDone={() => {
            setShowForm(false)
            onEnquired()
          }}
        />
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
  const [enquiries, setEnquiries] = useState<MyEnquiry[]>([])
  const loadEnquiries = () => void fetchMyEnquiries().then(setEnquiries)
  useEffect(loadEnquiries, [])
  const latestEnquiry = useMemo(() => {
    const map = new Map<string, MyEnquiry>()
    // Newest first from the server: the first one seen per institution is the latest.
    for (const e of enquiries) if (e.institution_id && !map.has(e.institution_id)) map.set(e.institution_id, e)
    return map
  }, [enquiries])

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

        <PageHeader
          eyebrow="Community"
          title="Institutions"
          description="Training institutions verified as MySkills partners, for classroom and offline learning. Tell us which one interests you and the MySkills team will help you choose and visit."
        />

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
                enquiry={latestEnquiry.get(p.id)}
                onEnquired={loadEnquiries}
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
