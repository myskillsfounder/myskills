import { useCallback, useEffect, useMemo, useState } from 'react'
import { errorMessage } from '@/lib/errors'
import { createFileRoute } from '@tanstack/react-router'
import { Award, Check, ExternalLink, Globe, Inbox, Mail, MapPin, Phone, School, Search, Star, X } from 'lucide-react'
import {
  approveInstitutionPartnerApplication,
  fetchInstitutionCourses,
  fetchInstitutionPartnerApplications,
  fetchInstitutionPartners,
  fetchInstitutionRatings,
  rejectInstitutionPartnerApplication,
  type InstitutionApplicationStatus,
  type InstitutionPartner,
  type InstitutionPartnerApplication,
  type InstitutionPartnerCourse,
  type InstitutionPartnerRating,
} from '@/lib/institutionPartners'
import { fetchInstitutionLeads, type InstitutionLead } from '@/lib/institutionLeads'
import { useStaffAccessContext } from '@/lib/staffAccess'
import { OrgAvatar } from '@/components/admin/OrgAvatar'
import { RequireSection } from '@/components/admin/AdminSectionGate'
import { Alert, Badge, Button, Chip, EmptyState, PageHeader, Skeleton, Textarea } from '@/components/ui'

export const Route = createFileRoute('/admin/_layout/institution-partners')({
  component: () => (
    <RequireSection section="institution-partners">
      <InstitutionsPage />
    </RequireSection>
  ),
})

const FILTERS: { label: string; value: InstitutionApplicationStatus | 'all' }[] = [
  { label: 'Pending', value: 'pending' },
  { label: 'Approved', value: 'approved' },
  { label: 'Rejected', value: 'rejected' },
  { label: 'All', value: 'all' },
]

const TONE: Record<InstitutionApplicationStatus, 'warning' | 'success' | 'danger'> = {
  pending: 'warning',
  approved: 'success',
  rejected: 'danger',
}

function ApplicationCard({
  app,
  onApprove,
  onReject,
  busy,
}: {
  app: InstitutionPartnerApplication
  onApprove: () => void
  onReject: (note: string) => void
  busy: boolean
}) {
  const [rejecting, setRejecting] = useState(false)
  const [note, setNote] = useState('')

  return (
    <article className="card p-5 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="font-display text-xl font-semibold text-ink-900">{app.legal_name}</h2>
          <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-ink-600">
            {app.city && (
              <span className="inline-flex items-center gap-1">
                <MapPin size={13} className="text-ink-400" /> {app.city}
              </span>
            )}
            <span className="inline-flex items-center gap-1">
              <Award size={13} className="text-ink-400" />
              {app.years_in_education} {app.years_in_education === 1 ? 'year' : 'years'} in education
            </span>
            {app.google_rating != null && (
              <span className="inline-flex items-center gap-1 font-medium text-amber-700">
                <Star size={13} className="fill-amber-500 text-amber-500" /> {app.google_rating.toFixed(1)}
              </span>
            )}
          </div>
        </div>
        <Badge tone={TONE[app.status]}>{app.status}</Badge>
      </div>

      {app.courses_offered.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-1.5">
          {app.courses_offered.map((c) => (
            <span
              key={c}
              className="rounded-full border border-brand-200 bg-brand-50 px-3 py-1 text-xs font-medium text-brand-700"
            >
              {c}
            </span>
          ))}
        </div>
      )}

      <dl className="mt-5 grid gap-2 border-t border-ink-200 pt-4 text-sm sm:grid-cols-2">
        <div className="flex items-center gap-2 text-ink-700">
          <Mail size={14} className="shrink-0 text-ink-400" />
          <a href={`mailto:${app.email}`} className="truncate hover:text-brand-700">
            {app.email}
          </a>
        </div>
        {app.phone && (
          <div className="flex items-center gap-2 text-ink-700">
            <Phone size={14} className="shrink-0 text-ink-400" />
            {app.phone}
          </div>
        )}
        {app.website_url && (
          <div className="flex items-center gap-2 text-ink-700">
            <ExternalLink size={14} className="shrink-0 text-ink-400" />
            <a href={app.website_url} target="_blank" rel="noopener noreferrer" className="truncate hover:text-brand-700">
              Website
            </a>
          </div>
        )}
        {app.google_profile_url && (
          <div className="flex items-center gap-2 text-ink-700">
            <ExternalLink size={14} className="shrink-0 text-ink-400" />
            <a
              href={app.google_profile_url}
              target="_blank"
              rel="noopener noreferrer"
              className="truncate hover:text-brand-700"
            >
              Google profile
            </a>
          </div>
        )}
      </dl>

      <div className="mt-4 rounded-xl bg-ink-100 p-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-ink-500">Contact</p>
        <p className="mt-1.5 text-sm text-ink-700">
          {app.contact_name}
          {app.contact_role ? ` — ${app.contact_role}` : ''}
        </p>
      </div>

      {app.additional_info && (
        <div className="mt-4 rounded-xl bg-ink-100 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-ink-500">
            Why they'd be a good partner
          </p>
          <p className="mt-1.5 whitespace-pre-line text-sm leading-relaxed text-ink-700">
            {app.additional_info}
          </p>
        </div>
      )}

      {app.review_note && (
        <p className="mt-4 text-xs text-ink-500">
          <span className="font-semibold">Note:</span> {app.review_note}
        </p>
      )}

      <div className="mt-5 flex flex-wrap items-center gap-2 border-t border-ink-200 pt-4">
        <p className="mr-auto text-xs text-ink-500">
          Applied {new Date(app.created_at).toLocaleDateString()}
        </p>

        {rejecting ? null : (
          <>
            {app.status !== 'approved' && (
              <Button size="sm" icon={Check} onClick={onApprove} disabled={busy}>
                {app.status === 'rejected' ? 'Approve instead' : 'Approve'}
              </Button>
            )}
            {app.status !== 'rejected' && (
              <Button
                size="sm"
                variant="secondary"
                icon={X}
                onClick={() => setRejecting(true)}
                disabled={busy}
              >
                Reject
              </Button>
            )}
          </>
        )}
      </div>

      {rejecting && (
        <div className="mt-3 space-y-3">
          <Textarea
            label="Reason (kept internal)"
            required={false}
            rows={2}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Couldn't verify years of operation…"
          />
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="danger"
              disabled={busy}
              onClick={() => {
                onReject(note)
                setRejecting(false)
                setNote('')
              }}
            >
              Confirm reject
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setRejecting(false)} disabled={busy}>
              Cancel
            </Button>
          </div>
        </div>
      )}
    </article>
  )
}

/** One listed institution: what students see, and how it's doing with them. */
function ListedCard({
  p,
  courses,
  rating,
  leads,
}: {
  p: InstitutionPartner
  courses: string[]
  rating: { avg: number; n: number } | undefined
  leads: { total: number; open: number; enrolled: number } | undefined
}) {
  return (
    <article className="card flex flex-col p-5">
      <div className="flex items-start gap-3">
        <OrgAvatar name={p.legal_name} logo={p.logo_url} />
        <div className="min-w-0 flex-1">
          <h2 className="font-display text-lg font-semibold leading-tight text-ink-900">{p.legal_name}</h2>
          <p className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-sm text-ink-600">
            {p.city && (
              <span className="inline-flex items-center gap-1">
                <MapPin size={13} className="text-ink-400" /> {p.city}
              </span>
            )}
            {p.years_in_education > 0 && (
              <span className="inline-flex items-center gap-1">
                <Award size={13} className="text-ink-400" /> {p.years_in_education} years
              </span>
            )}
          </p>
        </div>
      </div>

      {courses.length > 0 && (
        <ul className="mt-4 flex flex-wrap gap-1.5">
          {courses.slice(0, 6).map((c) => (
            <li key={c} className="rounded-full bg-ink-100 px-2.5 py-1 text-xs font-medium text-ink-700">
              {c}
            </li>
          ))}
          {courses.length > 6 && <li className="px-1 py-1 text-xs text-ink-500">+{courses.length - 6} more</li>}
        </ul>
      )}

      <dl className="mt-4 grid grid-cols-3 gap-2 rounded-xl bg-ink-50 p-3 text-center">
        <div>
          <dt className="text-[11px] font-medium uppercase tracking-wide text-ink-500">Google</dt>
          <dd className="mt-0.5 inline-flex items-center gap-1 font-display text-lg font-semibold text-ink-900">
            {p.google_rating ?? '—'}
            {p.google_rating != null && <Star size={13} className="fill-gold-400 text-gold-400" />}
          </dd>
        </div>
        <div>
          <dt className="text-[11px] font-medium uppercase tracking-wide text-ink-500">Students</dt>
          <dd className="mt-0.5 font-display text-lg font-semibold text-ink-900" title={rating ? `${rating.n} ratings` : undefined}>
            {rating ? rating.avg.toFixed(1) : '—'}
          </dd>
        </div>
        <div>
          <dt className="text-[11px] font-medium uppercase tracking-wide text-ink-500">Leads</dt>
          <dd className="mt-0.5 font-display text-lg font-semibold text-ink-900">{leads ? leads.total : '—'}</dd>
        </div>
      </dl>
      {leads && leads.total > 0 && (
        <p className="mt-2 text-xs text-ink-500">
          {leads.open} open · {leads.enrolled} enrolled
        </p>
      )}

      <div className="mt-auto flex flex-wrap gap-x-4 gap-y-1 pt-4 text-sm">
        {p.website_url && (
          <a href={p.website_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 font-medium text-brand-700 hover:underline">
            <Globe size={13} /> Website
          </a>
        )}
        {p.google_profile_url && (
          <a href={p.google_profile_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 font-medium text-brand-700 hover:underline">
            <ExternalLink size={13} /> Google profile
          </a>
        )}
      </div>
    </article>
  )
}

/** Every institution students can see, with its numbers. */
function ListedInstitutions() {
  const { isAdmin, sections } = useStaffAccessContext()
  const canLeads = isAdmin === true || (sections?.includes('demo-requests') ?? false)
  const [partners, setPartners] = useState<InstitutionPartner[] | undefined>(undefined)
  const [courses, setCourses] = useState<InstitutionPartnerCourse[]>([])
  const [ratings, setRatings] = useState<InstitutionPartnerRating[]>([])
  const [leads, setLeads] = useState<InstitutionLead[] | null>(null)
  const [error, setError] = useState<string>()
  const [q, setQ] = useState('')

  useEffect(() => {
    let active = true
    fetchInstitutionPartners()
      .then((list) => {
        if (!active) return
        setPartners(list)
        const ids = list.map((p) => p.id)
        // Extras: the cards still show without them.
        void fetchInstitutionCourses(ids).then((c) => active && setCourses(c), () => {})
        void fetchInstitutionRatings(ids).then((r) => active && setRatings(r), () => {})
      })
      .catch((e) => {
        if (!active) return
        setError(errorMessage(e))
        setPartners([])
      })
    if (canLeads) void fetchInstitutionLeads().then((l) => active && setLeads(l), () => {})
    return () => {
      active = false
    }
  }, [canLeads])

  const coursesFor = useMemo(() => {
    const m = new Map<string, string[]>()
    for (const c of courses) m.set(c.institution_id, [...(m.get(c.institution_id) ?? []), c.name])
    return m
  }, [courses])
  const ratingFor = useMemo(() => {
    const m = new Map<string, { sum: number; n: number }>()
    for (const r of ratings) {
      const x = m.get(r.institution_id) ?? { sum: 0, n: 0 }
      m.set(r.institution_id, { sum: x.sum + r.rating, n: x.n + 1 })
    }
    return m
  }, [ratings])
  const leadsFor = useMemo(() => {
    const m = new Map<string, { total: number; open: number; enrolled: number }>()
    for (const l of leads ?? []) {
      if (!l.institution_id) continue
      const x = m.get(l.institution_id) ?? { total: 0, open: 0, enrolled: 0 }
      x.total += 1
      if (l.stage === 'new' || l.stage === 'contacted' || l.stage === 'visit') x.open += 1
      if (l.stage === 'enrolled') x.enrolled += 1
      m.set(l.institution_id, x)
    }
    return m
  }, [leads])

  if (partners === undefined) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    )
  }
  const term = q.trim().toLowerCase()
  const shown = partners.filter(
    (p) =>
      !term ||
      [p.legal_name, p.city ?? '', ...(coursesFor.get(p.id) ?? p.courses_offered)].some((v) => v.toLowerCase().includes(term)),
  )
  return (
    <>
      {error && (
        <div className="mb-5">
          <Alert tone="danger" title="Couldn’t load the institutions">
            <p>{error}</p>
          </Alert>
        </div>
      )}
      {partners.length === 0 ? (
        <EmptyState
          icon={School}
          title="No institutions listed yet"
          description="An institution is listed for students once its application is approved."
        />
      ) : (
        <>
          <div className="relative mb-4 max-w-sm">
            <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-400" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Name, city or course"
              aria-label="Search institutions"
              className="field h-10" style={{ paddingLeft: '2.25rem' }}
            />
          </div>
          {shown.length === 0 ? (
            <p className="text-sm text-ink-500">No institution matches “{q}”.</p>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {shown.map((p) => {
                const r = ratingFor.get(p.id)
                return (
                  <ListedCard
                    key={p.id}
                    p={p}
                    courses={coursesFor.get(p.id) ?? p.courses_offered}
                    rating={r ? { avg: r.sum / r.n, n: r.n } : undefined}
                    leads={leads ? (leadsFor.get(p.id) ?? { total: 0, open: 0, enrolled: 0 }) : undefined}
                  />
                )
              })}
            </div>
          )}
        </>
      )}
    </>
  )
}

/** The applications, as before: approve one to list that institution. */
function Applications({ onDecided }: { onDecided: () => void }) {
  const [filter, setFilter] = useState<InstitutionApplicationStatus | 'all'>('pending')
  const [apps, setApps] = useState<InstitutionPartnerApplication[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string>()
  const [busyId, setBusyId] = useState<string>()

  const load = useCallback(async () => {
    setLoading(true)
    setError(undefined)
    try {
      setApps(await fetchInstitutionPartnerApplications(filter === 'all' ? undefined : filter))
    } catch (e) {
      setError(errorMessage(e))
    } finally {
      setLoading(false)
    }
  }, [filter])

  useEffect(() => {
    void load()
  }, [load])

  async function act(id: string, run: () => Promise<void>) {
    setBusyId(id)
    setError(undefined)
    try {
      await run()
      await load()
      onDecided()
    } catch (e) {
      setError(errorMessage(e))
    } finally {
      setBusyId(undefined)
    }
  }

  return (
    <>
      <div className="mb-5 flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <Chip key={f.value} active={filter === f.value} onClick={() => setFilter(f.value)}>
            {f.label}
          </Chip>
        ))}
      </div>

      {error && (
        <div className="mb-5">
          <Alert tone="danger" title="Something went wrong">
            <p>{error}</p>
          </Alert>
        </div>
      )}

      {loading ? (
        <div className="space-y-4">
          <Skeleton className="h-52 w-full" />
          <Skeleton className="h-52 w-full" />
        </div>
      ) : apps.length === 0 ? (
        <EmptyState
          icon={Inbox}
          title={filter === 'pending' ? 'Nothing to review' : 'No applications here'}
          description={
            filter === 'pending'
              ? 'New institution partner applications will appear here as they come in.'
              : 'Try a different filter.'
          }
        />
      ) : (
        <div className="space-y-4">
          {apps.map((app) => (
            <ApplicationCard
              key={app.id}
              app={app}
              busy={busyId === app.id}
              onApprove={() => act(app.id, () => approveInstitutionPartnerApplication(app.id))}
              onReject={(note) => act(app.id, () => rejectInstitutionPartnerApplication(app.id, note))}
            />
          ))}
        </div>
      )}
    </>
  )
}

function InstitutionsPage() {
  const [view, setView] = useState<'listed' | 'applications'>('listed')
  const [listed, setListed] = useState<number>()
  const [pending, setPending] = useState<number>()
  const [stamp, setStamp] = useState(0)

  useEffect(() => {
    let active = true
    void fetchInstitutionPartners().then((l) => active && setListed(l.length), () => {})
    void fetchInstitutionPartnerApplications('pending').then((a) => active && setPending(a.length), () => {})
    return () => {
      active = false
    }
  }, [stamp])

  return (
    <>
      <PageHeader
        eyebrow="Institutions"
        title="Institutions"
        subtitle="Every institution listed for students, with how students rate them and the leads they bring. Approve an application to list a new one."
      />

      <div className="mb-6 inline-flex rounded-xl border border-ink-200 bg-white p-1" role="tablist" aria-label="View">
        {(
          [
            ['listed', 'Listed', listed],
            ['applications', 'Applications', pending],
          ] as const
        ).map(([k, label, n]) => (
          <button
            key={k}
            type="button"
            role="tab"
            aria-selected={view === k}
            onClick={() => setView(k)}
            className={`inline-flex items-center gap-1.5 rounded-lg px-4 py-1.5 text-sm font-medium transition-colors ${
              view === k ? 'bg-ink-900 text-white' : 'text-ink-600 hover:bg-ink-100'
            }`}
          >
            {label}
            {n !== undefined &&
              (k === 'applications' ? (
                n > 0 && <span className="rounded-full bg-amber-500 px-1.5 py-0.5 text-[11px] font-bold leading-none text-white">{n}</span>
              ) : (
                <span className={`tabular-nums ${view === k ? 'text-white/60' : 'text-ink-400'}`}>{n}</span>
              ))}
          </button>
        ))}
      </div>

      {view === 'listed' ? <ListedInstitutions key={stamp} /> : <Applications onDecided={() => setStamp((s) => s + 1)} />}
    </>
  )
}
