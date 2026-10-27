import { useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { errorMessage } from '@/lib/errors'
import { createFileRoute, Link } from '@tanstack/react-router'
import {
  Award,
  BadgeCheck,
  BookOpen,
  Building2,
  CheckCircle2,
  Clock,
  ExternalLink,
  GraduationCap,
  MapPin,
  School,
  Send,
  Star,
  Trophy,
  Users,
  X,
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
import { CommunityHero, HowItWorks } from '@/components/community/CommunityHero'
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
 * "Get a quote" (Paul, 27 Oct 2026): the student's request for fees and batch
 * dates, which goes to the MySkills team as a lead
 * (docs/supabase-institution-leads.sql). Their name and email come from
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
    <form onSubmit={handleSubmit} noValidate className="space-y-4">
      <p className="text-sm text-ink-600">
        Tell us what you want to learn. The MySkills team will send you {partner.legal_name}’s fees and batch dates
        within two working days, and can set up a visit.
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
        placeholder="Your budget, batch timing, or a question for the team"
      />
      <p className="text-xs text-ink-500">Your name, email and phone go to the MySkills team only.</p>

      {submitError && (
        <Alert tone="danger" title="Couldn't send your request">
          <p>{submitError}</p>
        </Alert>
      )}

      <Button type="submit" size="sm" icon={Send} disabled={submitting}>
        {submitting ? 'Sending…' : 'Request a quote'}
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

/** The quote request, over the page. */
function QuoteDialog({ partner, courses, onClose, onDone }: { partner: InstitutionPartner; courses: string[]; onClose: () => void; onDone: () => void }) {
  const closeRef = useRef<HTMLButtonElement>(null)
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null
    closeRef.current?.focus()
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    const overflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = overflow
      previous?.focus()
    }
  }, [onClose])

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-6" role="dialog" aria-modal="true" aria-label={`Get a quote from ${partner.legal_name}`}>
      <button type="button" aria-label="Close" onClick={onClose} className="absolute inset-0 bg-ink-900/50" />
      <div className="relative max-h-[90vh] w-full overflow-y-auto rounded-t-3xl bg-white p-6 shadow-e2 sm:max-w-lg sm:rounded-3xl">
        <button
          ref={closeRef}
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-full text-ink-500 hover:bg-ink-100 hover:text-ink-900"
        >
          <X size={18} />
        </button>
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-sky-700">Get a quote</p>
        <h2 className="mt-1 pr-10 font-display text-xl font-semibold text-ink-900">{partner.legal_name}</h2>
        <div className="mt-4">
          <EnquiryForm partner={partner} courses={courses} onDone={onDone} />
        </div>
      </div>
    </div>,
    document.body,
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
  top,
}: {
  partner: InstitutionPartner
  courses: InstitutionPartnerCourse[]
  stats: RatingStats
  onRate: (rating: number) => void
  ratingBusy: boolean
  /** The student's latest enquiry with this institution, if any. */
  enquiry?: MyEnquiry
  onEnquired: () => void
  /** The best rated, marked as such. */
  top: boolean
}) {
  const [quoting, setQuoting] = useState(false)
  // An open or successful request replaces the button; a closed one lets them ask again.
  const open = enquiry && enquiry.stage !== 'lost'
  const courseNames = courses.length > 0 ? courses.map((c) => c.name) : partner.courses_offered

  return (
    <article className="card relative flex h-full flex-col p-5 shadow-sm transition-shadow hover:shadow-e2">
      {top && (
        <span className="absolute right-4 top-4 inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-[11px] font-semibold text-amber-700 ring-1 ring-amber-200">
          <Trophy size={12} /> Top rated
        </span>
      )}
      <div className="flex items-start gap-3.5 pr-20">
        {partner.logo_url ? (
          <img src={partner.logo_url} alt="" className="h-14 w-14 shrink-0 rounded-2xl border border-ink-100 object-contain" />
        ) : (
          <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-500 to-blue-700 text-white">
            <Building2 size={24} />
          </span>
        )}
        <div className="min-w-0">
          <h2 className="font-display text-lg font-semibold leading-snug text-ink-900">{partner.legal_name}</h2>
          <p className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[13px] text-ink-600">
            {partner.city && (
              <span className="inline-flex items-center gap-1">
                <MapPin size={12} className="text-ink-400" /> {partner.city}
              </span>
            )}
            <span className="inline-flex items-center gap-1">
              <Award size={12} className="text-ink-400" />
              {partner.years_in_education} {partner.years_in_education === 1 ? 'year' : 'years'} in education
            </span>
          </p>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1">
        <RatingStars stats={stats} onRate={onRate} busy={ratingBusy} />
        {partner.google_rating != null && <span className="text-xs text-ink-400">Google {partner.google_rating.toFixed(1)}</span>}
      </div>

      {courses.length > 0 ? (
        <ul className="mt-4 divide-y divide-ink-100 rounded-xl border border-ink-100">
          {courses.slice(0, 3).map((c) => (
            <li key={c.id} className="flex items-center justify-between gap-3 px-3.5 py-2 text-sm">
              <span className="inline-flex min-w-0 items-center gap-2 font-medium text-ink-800">
                <BookOpen size={14} className="shrink-0 text-sky-600" />
                <span className="truncate">{c.name}</span>
              </span>
              {c.duration && (
                <span className="inline-flex shrink-0 items-center gap-1 text-xs text-ink-500">
                  <Clock size={12} /> {c.duration}
                </span>
              )}
            </li>
          ))}
          {courses.length > 3 && <li className="px-3.5 py-2 text-xs text-ink-500">+{courses.length - 3} more courses</li>}
        </ul>
      ) : (
        partner.courses_offered.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-1.5">
            {partner.courses_offered.map((c) => (
              <span key={c} className="rounded-full border border-sky-200 bg-sky-50 px-3 py-1 text-xs font-medium text-sky-700">
                {c}
              </span>
            ))}
          </div>
        )
      )}

      {enquiry && <EnquiryStatus enquiry={enquiry} />}

      <div className="mt-auto flex flex-wrap items-center gap-x-4 gap-y-2 pt-5 text-sm">
        {partner.website_url && (
          <a href={partner.website_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-ink-600 hover:text-sky-700">
            <ExternalLink size={14} /> Website
          </a>
        )}
        {partner.google_profile_url && (
          <a href={partner.google_profile_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-ink-600 hover:text-sky-700">
            <ExternalLink size={14} /> Google
          </a>
        )}
        {!open && (
          <button
            type="button"
            onClick={() => setQuoting(true)}
            className="press ml-auto inline-flex h-10 items-center gap-1.5 rounded-xl bg-sky-600 px-4 text-sm font-semibold text-white shadow-e1 transition-colors hover:bg-sky-700"
          >
            <Send size={14} /> {enquiry ? 'Ask again' : 'Get a quote'}
          </button>
        )}
      </div>

      {quoting && (
        <QuoteDialog
          partner={partner}
          courses={courseNames}
          onClose={() => setQuoting(false)}
          onDone={() => {
            setQuoting(false)
            onEnquired()
          }}
        />
      )}
    </article>
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

  const ranked = useMemo(() => {
    const st = (id: string) => statsByInstitution.get(id) ?? { average: 0, count: 0, mine: null }
    return [...partners].sort(
      (a, b) =>
        st(b.id).average - st(a.id).average ||
        st(b.id).count - st(a.id).count ||
        (b.google_rating ?? 0) - (a.google_rating ?? 0) ||
        a.legal_name.localeCompare(b.legal_name),
    )
  }, [partners, statsByInstitution])

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
    <AppShell wide>
      {/* Offline and peer learning (Paul, 27 Oct 2026): a classroom, people
          beside you, learning out loud together. */}
      <div className="mb-6 space-y-6">
        <CommunityHero
          tone="institutions"
          icon={Users}
          eyebrow="Institutions"
          title="Learn in a room,"
          accent="together."
          body="Some things are learnt best in person: a classroom, a trainer who sees you, and classmates to practise with. These are verified training institutions near you, for offline and peer learning."
          points={[
            { icon: School, label: 'Offline classes' },
            { icon: Users, label: 'Learn with peers' },
            { icon: BadgeCheck, label: 'Verified partners' },
          ]}
        />
        <HowItWorks
          tone="institutions"
          steps={[
            { title: 'Find one near you', body: 'See each institution’s city, courses and ratings from students.' },
            { title: 'Tell us your interest', body: 'Say what you want to learn and when you are free.' },
            { title: 'Visit and join a class', body: 'The MySkills team helps you choose, visit and enrol.' },
          ]}
        />
      </div>
      <div>

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
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {ranked.map((p, i) => (
              <PartnerCard
                key={p.id}
                top={i === 0 && (statsByInstitution.get(p.id)?.count ?? 0) > 0}
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
