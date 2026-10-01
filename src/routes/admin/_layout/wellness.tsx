import { useEffect, useState } from 'react'
import { errorMessage } from '@/lib/errors'
import { createFileRoute } from '@tanstack/react-router'
import { Compass, HeartHandshake, Mail, Phone } from 'lucide-react'
import {
  fetchWellnessRequests,
  setWellnessRequestStatus,
  type AdminWellnessRequest,
  type WellnessRequestStatus,
  type WellnessRequestType,
} from '@/lib/admin'
import {
  assignSupportRequest,
  fetchRequestAssignments,
  fetchSupportProviders,
  type SupportProvider,
} from '@/lib/communityPortal'
import { RequireSection } from '@/components/admin/AdminSectionGate'
import { Alert, Badge, Button, EmptyState, PageHeader, Skeleton } from '@/components/ui'

export const Route = createFileRoute('/admin/_layout/wellness')({
  component: () => (
    <RequireSection section="wellness">
      <WellnessRequestsPage />
    </RequireSection>
  ),
})

const STATUS_FILTERS: { label: string; value: WellnessRequestStatus | 'all' }[] = [
  { label: 'Pending', value: 'pending' },
  { label: 'Contacted', value: 'contacted' },
  { label: 'Closed', value: 'closed' },
  { label: 'All', value: 'all' },
]

const TYPE_LABEL: Record<WellnessRequestType, string> = {
  psychologist: 'Counselling',
  career_mentor: 'Career guidance',
}

const TYPE_ICON: Record<WellnessRequestType, typeof HeartHandshake> = {
  psychologist: HeartHandshake,
  career_mentor: Compass,
}

const TONE: Record<WellnessRequestStatus, 'warning' | 'brand' | 'neutral'> = {
  pending: 'warning',
  contacted: 'brand',
  closed: 'neutral',
}

const NEXT: Record<WellnessRequestStatus, WellnessRequestStatus | null> = {
  pending: 'contacted',
  contacted: 'closed',
  closed: null,
}

const NEXT_LABEL: Record<WellnessRequestStatus, string> = {
  pending: 'Mark contacted',
  contacted: 'Mark closed',
  closed: '',
}

function RequestCard({
  req,
  busy,
  onAdvance,
  providers,
  assignedTo,
  onAssign,
}: {
  req: AdminWellnessRequest
  busy: boolean
  onAdvance: () => void
  /** Counsellors (or career guides) with Community portal access for this kind of request. */
  providers: SupportProvider[]
  /** Who this request has already been handed to. */
  assignedTo?: string
  onAssign: (providerId: string) => void
}) {
  const next = NEXT[req.status]
  const Icon = TYPE_ICON[req.type]
  const [pick, setPick] = useState('')

  return (
    <article className="card p-5 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-start gap-3 min-w-0">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-700">
            <Icon size={18} />
          </span>
          <div className="min-w-0">
            <h2 className="font-display text-xl font-semibold text-ink-900">{req.full_name}</h2>
            <p className="mt-0.5 text-sm font-medium text-brand-600">{TYPE_LABEL[req.type]}</p>
          </div>
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
      </dl>

      {req.message && (
        <div className="mt-4 rounded-xl bg-ink-100 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-ink-500">Message</p>
          <p className="mt-1.5 whitespace-pre-line text-sm leading-relaxed text-ink-700">
            {req.message}
          </p>
        </div>
      )}

      {/* Hand the request to one person. They see the student in their Community
          portal and log session dates there; the message stays here with the team. */}
      {assignedTo ? (
        <p className="mt-4 rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          Assigned to <span className="font-semibold">{assignedTo}</span>
        </p>
      ) : providers.length > 0 && req.status !== 'closed' ? (
        <div className="mt-4 flex flex-wrap items-end gap-2">
          <label className="min-w-0 flex-1 text-xs font-medium text-ink-600 sm:max-w-xs">
            Assign to
            <select value={pick} onChange={(e) => setPick(e.target.value)} className="field mt-1 block w-full">
              <option value="">Choose a person…</option>
              {providers.map((p) => (
                <option key={p.user_id} value={p.user_id}>
                  {p.full_name || p.email} ({p.active} now)
                </option>
              ))}
            </select>
          </label>
          <Button size="sm" disabled={busy || !pick} onClick={() => onAssign(pick)}>
            Assign
          </Button>
        </div>
      ) : null}

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

function WellnessRequestsPage() {
  const [requests, setRequests] = useState<AdminWellnessRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string>()
  const [statusFilter, setStatusFilter] = useState<WellnessRequestStatus | 'all'>('pending')
  const [typeFilter, setTypeFilter] = useState<WellnessRequestType | 'all'>('all')
  const [busyId, setBusyId] = useState<string>()
  const [providers, setProviders] = useState<SupportProvider[]>([])
  const [assigned, setAssigned] = useState<Record<string, string>>({})

  async function load() {
    setLoading(true)
    setError(undefined)
    try {
      const [reqs, people, done] = await Promise.all([
        fetchWellnessRequests(),
        fetchSupportProviders(),
        fetchRequestAssignments(),
      ])
      setRequests(reqs)
      setProviders(people)
      setAssigned(done)
    } catch (e) {
      setError(errorMessage(e))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void load()
  }, [])

  async function advance(req: AdminWellnessRequest) {
    const next = NEXT[req.status]
    if (!next) return
    setBusyId(req.id)
    try {
      await setWellnessRequestStatus(req.id, next)
      await load()
    } catch (e) {
      setError(errorMessage(e))
    } finally {
      setBusyId(undefined)
    }
  }

  async function assign(req: AdminWellnessRequest, providerId: string) {
    setBusyId(req.id)
    try {
      await assignSupportRequest(req.id, providerId)
      await load()
    } catch (e) {
      setError(errorMessage(e))
    } finally {
      setBusyId(undefined)
    }
  }

  const visible = requests
    .filter((r) => statusFilter === 'all' || r.status === statusFilter)
    .filter((r) => typeFilter === 'all' || r.type === typeFilter)

  return (
    <>
      <PageHeader
        eyebrow="Admin"
        title="Wellness requests"
        subtitle="Counselling and career-guidance requests from the dashboard's Wellness Support card."
      />

      <div className="mb-3 flex flex-wrap gap-2">
        {STATUS_FILTERS.map((f) => (
          <button
            key={f.value}
            type="button"
            onClick={() => setStatusFilter(f.value)}
            className={`rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors ${
              statusFilter === f.value
                ? 'border-brand-500 bg-brand-50 text-brand-800'
                : 'border-ink-300 text-ink-600 hover:bg-ink-100'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className="mb-5 flex flex-wrap gap-2">
        {(['all', 'psychologist', 'career_mentor'] as const).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTypeFilter(t)}
            className={`rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors ${
              typeFilter === t
                ? 'border-ink-400 bg-ink-100 text-ink-900'
                : 'border-ink-200 text-ink-500 hover:bg-ink-50'
            }`}
          >
            {t === 'all' ? 'All types' : TYPE_LABEL[t]}
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
          icon={HeartHandshake}
          title="No requests here"
          description="Counselling and career-guidance requests from the dashboard will show up here."
        />
      ) : (
        <div className="space-y-4">
          {visible.map((req) => (
            <RequestCard
              key={req.id}
              req={req}
              busy={busyId === req.id}
              onAdvance={() => advance(req)}
              providers={providers.filter((p) => p.resource === (req.type === 'psychologist' ? 'wellness' : 'guidance'))}
              assignedTo={assigned[req.id]}
              onAssign={(providerId) => void assign(req, providerId)}
            />
          ))}
        </div>
      )}
    </>
  )
}
