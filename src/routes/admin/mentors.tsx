import { useCallback, useEffect, useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { Check, Inbox, Link2, Mail, MapPin, Phone, X } from 'lucide-react'
import {
  approveMentorApplication,
  fetchMentorApplications,
  rejectMentorApplication,
  type ApplicationStatus,
  type MentorApplication,
} from '@/lib/mentors'
import { AppShell } from '@/components/app/AppShell'
import { Alert, Badge, Button, Chip, EmptyState, PageHeader, Skeleton, Textarea } from '@/components/ui'

export const Route = createFileRoute('/admin/mentors')({
  component: MentorReviewQueue,
})

const FILTERS: { label: string; value: ApplicationStatus | 'all' }[] = [
  { label: 'Pending', value: 'pending' },
  { label: 'Approved', value: 'approved' },
  { label: 'Rejected', value: 'rejected' },
  { label: 'All', value: 'all' },
]

const TONE: Record<ApplicationStatus, 'warning' | 'success' | 'danger'> = {
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
  app: MentorApplication
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
          <h2 className="font-display text-xl font-semibold text-ink-900">{app.full_name}</h2>
          <p className="mt-0.5 text-sm font-medium text-brand-600">{app.headline}</p>
        </div>
        <Badge tone={TONE[app.status]}>{app.status}</Badge>
      </div>

      <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-ink-600">{app.bio}</p>

      {app.expertise.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-1.5">
          {app.expertise.map((e) => (
            <span
              key={e}
              className="rounded-full border border-brand-200 bg-brand-50 px-3 py-1 text-xs font-medium text-brand-700"
            >
              {e}
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
        {app.location && (
          <div className="flex items-center gap-2 text-ink-700">
            <MapPin size={14} className="shrink-0 text-ink-400" />
            {app.location}
          </div>
        )}
        {app.linkedin_url && (
          <div className="flex items-center gap-2 text-ink-700">
            <Link2 size={14} className="shrink-0 text-ink-400" />
            <a
              href={app.linkedin_url}
              target="_blank"
              rel="noopener noreferrer"
              className="truncate hover:text-brand-700"
            >
              {app.linkedin_url.replace(/^https:\/\/(www\.)?linkedin\.com\//, '')}
            </a>
          </div>
        )}
      </dl>

      {app.motivation && (
        <div className="mt-4 rounded-xl bg-ink-100 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-ink-500">Motivation</p>
          <p className="mt-1.5 whitespace-pre-line text-sm leading-relaxed text-ink-700">
            {app.motivation}
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
            placeholder="Not enough hands-on experience yet…"
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

function MentorReviewQueue() {
  const [filter, setFilter] = useState<ApplicationStatus | 'all'>('pending')
  const [apps, setApps] = useState<MentorApplication[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string>()
  const [busyId, setBusyId] = useState<string>()

  const load = useCallback(async () => {
    setLoading(true)
    setError(undefined)
    try {
      setApps(await fetchMentorApplications(filter === 'all' ? undefined : filter))
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
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
      setError(e instanceof Error ? e.message : String(e))
    } finally {
      setBusyId(undefined)
    }
  }

  return (
    <AppShell wide>
      <PageHeader
        eyebrow="Admin"
        title="Mentor applications"
        subtitle="Approve an application to publish that mentor in the Community."
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
              ? 'New mentor applications will appear here as they come in.'
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
              onApprove={() => act(app.id, () => approveMentorApplication(app.id))}
              onReject={(note) => act(app.id, () => rejectMentorApplication(app.id, note))}
            />
          ))}
        </div>
      )}
    </AppShell>
  )
}
