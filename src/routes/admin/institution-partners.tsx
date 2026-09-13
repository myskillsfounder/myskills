import { useCallback, useEffect, useState } from 'react'
import { errorMessage } from '@/lib/errors'
import { createFileRoute } from '@tanstack/react-router'
import { Award, Check, ExternalLink, Inbox, Mail, MapPin, Phone, Star, X } from 'lucide-react'
import {
  approveInstitutionPartnerApplication,
  fetchInstitutionPartnerApplications,
  rejectInstitutionPartnerApplication,
  type InstitutionApplicationStatus,
  type InstitutionPartnerApplication,
} from '@/lib/institutionPartners'
import { Alert, Badge, Button, Chip, EmptyState, PageHeader, Skeleton, Textarea } from '@/components/ui'

export const Route = createFileRoute('/admin/institution-partners')({
  component: InstitutionPartnerReviewQueue,
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

function InstitutionPartnerReviewQueue() {
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
    } catch (e) {
      setError(errorMessage(e))
    } finally {
      setBusyId(undefined)
    }
  }

  return (
    <>
      <PageHeader
        eyebrow="Admin"
        title="Institution partner applications"
        subtitle="Approve an application to publish that institution in the Community."
      />

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
