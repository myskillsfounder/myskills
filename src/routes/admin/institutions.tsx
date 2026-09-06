import { useEffect, useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { Building2, Mail, MapPin, Phone, Users } from 'lucide-react'
import {
  fetchDemoRequests,
  setDemoRequestStatus,
  type AdminDemoRequest,
  type DemoRequestStatus,
} from '@/lib/admin'
import { Alert, Badge, Button, EmptyState, PageHeader, Skeleton } from '@/components/ui'

export const Route = createFileRoute('/admin/institutions')({
  component: InstitutionsAdminPage,
})

const FILTERS: { label: string; value: DemoRequestStatus | 'all' }[] = [
  { label: 'Pending', value: 'pending' },
  { label: 'Contacted', value: 'contacted' },
  { label: 'Scheduled', value: 'scheduled' },
  { label: 'Closed', value: 'closed' },
  { label: 'All', value: 'all' },
]

const TONE: Record<DemoRequestStatus, 'warning' | 'brand' | 'success' | 'neutral'> = {
  pending: 'warning',
  contacted: 'brand',
  scheduled: 'success',
  closed: 'neutral',
}

const NEXT: Record<DemoRequestStatus, DemoRequestStatus | null> = {
  pending: 'contacted',
  contacted: 'scheduled',
  scheduled: 'closed',
  closed: null,
}

const NEXT_LABEL: Record<DemoRequestStatus, string> = {
  pending: 'Mark contacted',
  contacted: 'Mark scheduled',
  scheduled: 'Mark closed',
  closed: '',
}

function RequestCard({
  req,
  busy,
  onAdvance,
}: {
  req: AdminDemoRequest
  busy: boolean
  onAdvance: () => void
}) {
  const next = NEXT[req.status]

  return (
    <article className="card p-5 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="font-display text-xl font-semibold text-ink-900">{req.full_name}</h2>
          <p className="mt-0.5 text-sm font-medium text-brand-600">
            {req.role ? `${req.role} · ` : ''}
            {req.institution || 'Institution not given'}
          </p>
        </div>
        <Badge tone={TONE[req.status]}>{req.status}</Badge>
      </div>

      <dl className="mt-4 grid gap-2 border-t border-ink-200 pt-4 text-sm sm:grid-cols-2">
        <div className="flex items-center gap-2 text-ink-700">
          <Mail size={14} className="shrink-0 text-ink-400" />
          <a href={`mailto:${req.email}`} className="truncate hover:text-brand-700">
            {req.email}
          </a>
        </div>
        {req.phone && (
          <div className="flex items-center gap-2 text-ink-700">
            <Phone size={14} className="shrink-0 text-ink-400" />
            {req.phone}
          </div>
        )}
        {req.city && (
          <div className="flex items-center gap-2 text-ink-700">
            <MapPin size={14} className="shrink-0 text-ink-400" />
            {req.city}
          </div>
        )}
        {req.student_count != null && (
          <div className="flex items-center gap-2 text-ink-700">
            <Users size={14} className="shrink-0 text-ink-400" />
            {req.student_count} students
          </div>
        )}
      </dl>

      {req.message && (
        <div className="mt-4 rounded-xl bg-ink-100 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-ink-500">Message</p>
          <p className="mt-1.5 whitespace-pre-line text-sm leading-relaxed text-ink-700">
            {req.message}
          </p>
        </div>
      )}

      <div className="mt-4 flex items-center justify-between gap-3 border-t border-ink-200 pt-4">
        <time className="text-xs text-ink-500" dateTime={req.created_at}>
          Requested {new Date(req.created_at).toLocaleDateString()}
        </time>
        {next && (
          <Button size="sm" variant="secondary" disabled={busy} onClick={onAdvance}>
            {NEXT_LABEL[req.status]}
          </Button>
        )}
      </div>
    </article>
  )
}

function InstitutionsAdminPage() {
  const [requests, setRequests] = useState<AdminDemoRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string>()
  const [filter, setFilter] = useState<DemoRequestStatus | 'all'>('pending')
  const [busyId, setBusyId] = useState<string>()

  async function load() {
    setLoading(true)
    setError(undefined)
    try {
      setRequests(await fetchDemoRequests())
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void load()
  }, [])

  async function advance(req: AdminDemoRequest) {
    const next = NEXT[req.status]
    if (!next) return
    setBusyId(req.id)
    try {
      await setDemoRequestStatus(req.id, next)
      await load()
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    } finally {
      setBusyId(undefined)
    }
  }

  const visible = filter === 'all' ? requests : requests.filter((r) => r.status === filter)

  return (
    <>
      <PageHeader
        eyebrow="Admin"
        title="Institutions"
        subtitle="Demo requests from the Community > Institutions “Book a demo” form."
      />

      <div className="mb-5 flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <button
            key={f.value}
            type="button"
            onClick={() => setFilter(f.value)}
            className={`rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors ${
              filter === f.value
                ? 'border-brand-500 bg-brand-50 text-brand-800'
                : 'border-ink-300 text-ink-600 hover:bg-ink-100'
            }`}
          >
            {f.label}
          </button>
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
          <Skeleton className="h-40 w-full" />
          <Skeleton className="h-40 w-full" />
        </div>
      ) : visible.length === 0 ? (
        <EmptyState
          icon={Building2}
          title="No requests here"
          description="Demo bookings from Community > Institutions will show up here."
        />
      ) : (
        <div className="space-y-4">
          {visible.map((req) => (
            <RequestCard
              key={req.id}
              req={req}
              busy={busyId === req.id}
              onAdvance={() => advance(req)}
            />
          ))}
        </div>
      )}
    </>
  )
}
