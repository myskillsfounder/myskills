import { useEffect, useMemo, useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { CalendarClock, Mail, Phone, ShieldCheck, Video } from 'lucide-react'
import { errorMessage } from '@/lib/errors'
import type { Education, Experience, Project } from '@/lib/profile'
import { EDUCATION_LEVELS, educationLevelOf } from '@/lib/careerProfile'
import {
  buildVerificationView,
  completeVerification,
  educationSnapshot,
  experienceSnapshot,
  fetchCandidate,
  fetchVerificationQueue,
  identitySnapshot,
  projectSnapshot,
  scheduleVerification,
  type Candidate,
  type EntryStatus,
  type QueueRow,
  type RequestStatus,
  type VerifiedItem,
} from '@/lib/verification'
import { RequireSection } from '@/components/admin/AdminSectionGate'
import { VerificationBadge } from '@/components/profile/VerificationSection'
import { Alert, Badge, Button, EmptyState, Input, PageHeader, Skeleton, Textarea } from '@/components/ui'

export const Route = createFileRoute('/admin/_layout/verification')({
  component: () => (
    <RequireSection section="verification">
      <VerificationPage />
    </RequireSection>
  ),
})

const TONE: Record<RequestStatus, 'warning' | 'brand' | 'success' | 'neutral'> = {
  requested: 'warning',
  scheduled: 'brand',
  completed: 'success',
  cancelled: 'neutral',
}

const fmt = (iso: string) =>
  new Date(iso).toLocaleString('en-IN', {
    day: 'numeric',
    month: 'short',
    hour: 'numeric',
    minute: '2-digit',
    timeZone: 'Asia/Kolkata',
  }) + ' IST'

const levelLabel = (e: Education) => EDUCATION_LEVELS.find((l) => l.value === educationLevelOf(e))?.label

function ScheduleForm({ req, onDone }: { req: QueueRow; onDone: () => void }) {
  const [when, setWhen] = useState('')
  const [link, setLink] = useState(req.meeting_link ?? '')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string>()

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!/^https:\/\//i.test(link.trim())) {
      setError('Paste a https:// meeting link (Google Meet, Zoom, etc.).')
      return
    }
    setBusy(true)
    setError(undefined)
    try {
      // datetime-local is the reviewer's own clock; toISOString stores the
      // absolute instant, and the student's email shows it in IST.
      await scheduleVerification(req.id, new Date(when).toISOString(), link)
      onDone()
    } catch (err) {
      setError(errorMessage(err))
    } finally {
      setBusy(false)
    }
  }

  return (
    <form onSubmit={submit} className="mt-4 grid gap-3 border-t border-ink-200 pt-4 sm:grid-cols-[1fr_1.4fr_auto] sm:items-end">
      <Input label="Call time (your local time)" type="datetime-local" required value={when} onChange={(e) => setWhen(e.target.value)} />
      <Input label="Meeting link" type="url" placeholder="https://meet.google.com/…" value={link} onChange={(e) => setLink(e.target.value)} />
      <Button type="submit" size="sm" disabled={busy || !when}>
        {busy ? 'Saving…' : req.status === 'scheduled' ? 'Reschedule' : 'Schedule & email student'}
      </Button>
      {error && <p className="text-sm text-red-700 sm:col-span-3">{error}</p>}
    </form>
  )
}

interface CheckRow {
  key: string
  item: VerifiedItem
  title: string
  detail: string
  status: EntryStatus
}

/** The live review: everything the student claims, one checkbox each. Only
 *  tick what was actually shown on camera. */
function ReviewPanel({ req, onDone }: { req: QueueRow; onDone: () => void }) {
  const [candidate, setCandidate] = useState<Candidate | null>(null)
  const [loading, setLoading] = useState(true)
  const [ticked, setTicked] = useState<Set<string>>(new Set())
  const [note, setNote] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string>()

  useEffect(() => {
    fetchCandidate(req.user_id)
      .then(setCandidate)
      .catch((e) => setError(errorMessage(e)))
      .finally(() => setLoading(false))
  }, [req.user_id])

  const rows: CheckRow[] = useMemo(() => {
    if (!candidate) return []
    const asProfile = {
      full_name: candidate.full_name ?? '',
      date_of_birth: candidate.date_of_birth ?? '',
      education: candidate.education,
      experience: candidate.experience,
      projects: candidate.projects,
    }
    // Reuse the student-side logic so "verified / changed" means exactly the
    // same thing here as on their profile.
    const view = buildVerificationView(asProfile, candidate.verified)
    const r: CheckRow[] = [
      {
        key: 'identity:self',
        item: { item_type: 'identity', item_id: 'self', snapshot: identitySnapshot(asProfile) },
        title: `Identity — ${candidate.full_name || 'no name on profile'}`,
        detail: `Date of birth: ${candidate.date_of_birth || 'not given'}. Check against a government photo ID; don't note the ID number.`,
        status: view.identity,
      },
    ]
    for (const e of candidate.education as Education[]) {
      r.push({
        key: `education:${e.id}`,
        item: { item_type: 'education', item_id: e.id, snapshot: educationSnapshot(e) },
        title: `Education — ${e.school}`,
        detail: [levelLabel(e) ?? 'Level not set', e.degree, e.field, [e.startYear, e.endYear].filter(Boolean).join('–')]
          .filter(Boolean)
          .join(' · '),
        status: view.status('education', e),
      })
    }
    for (const x of candidate.experience as Experience[]) {
      r.push({
        key: `experience:${x.id}`,
        item: { item_type: 'experience', item_id: x.id, snapshot: experienceSnapshot(x) },
        title: `Experience — ${x.title} at ${x.company}`,
        detail: [x.employmentType, [x.startDate, x.current ? 'present' : x.endDate].filter(Boolean).join(' → ')]
          .filter(Boolean)
          .join(' · '),
        status: view.status('experience', x),
      })
    }
    for (const p of candidate.projects as Project[]) {
      r.push({
        key: `project:${p.id}`,
        item: { item_type: 'project', item_id: p.id, snapshot: projectSnapshot(p) },
        title: `Project — ${p.title}`,
        detail: [p.year, p.link].filter(Boolean).join(' · ') || 'No link given',
        status: view.status('project', p),
      })
    }
    return r
  }, [candidate])

  async function complete() {
    setBusy(true)
    setError(undefined)
    try {
      await completeVerification(
        req.id,
        rows.filter((r) => ticked.has(r.key)).map((r) => r.item),
        note,
      )
      onDone()
    } catch (err) {
      setError(errorMessage(err))
    } finally {
      setBusy(false)
    }
  }

  if (loading) return <Skeleton className="mt-4 h-40 w-full" />
  if (!candidate) return <p className="mt-4 text-sm text-red-700">{error ?? 'Could not load this profile.'}</p>

  return (
    <div className="mt-4 border-t border-ink-200 pt-4">
      <p className="text-sm text-ink-600">
        Tick only what the student showed proof for on the call. Anything left unticked stays
        unverified and won’t count toward their score.
      </p>
      <ul className="mt-3 space-y-2">
        {rows.map((r) => (
          <li key={r.key}>
            <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-ink-200 p-3 hover:border-brand-300">
              <input
                type="checkbox"
                className="mt-1"
                checked={ticked.has(r.key)}
                onChange={(e) =>
                  setTicked((prev) => {
                    const next = new Set(prev)
                    if (e.target.checked) next.add(r.key)
                    else next.delete(r.key)
                    return next
                  })
                }
              />
              <span className="min-w-0 flex-1">
                <span className="flex flex-wrap items-center gap-2 text-sm font-semibold text-ink-900">
                  {r.title} <VerificationBadge status={r.status} />
                </span>
                <span className="mt-0.5 block text-xs text-ink-500">{r.detail}</span>
              </span>
            </label>
          </li>
        ))}
      </ul>
      <div className="mt-4">
        <Textarea
          label="Note to the student (optional — they’ll see this)"
          required={false}
          rows={2}
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="e.g. Your internship couldn't be verified — please bring the offer letter next time."
        />
      </div>
      {error && <p className="mt-2 text-sm text-red-700">{error}</p>}
      <div className="mt-4 flex justify-end">
        <Button size="sm" icon={ShieldCheck} disabled={busy} onClick={complete}>
          {busy ? 'Saving…' : `Complete — verify ${ticked.size} of ${rows.length}`}
        </Button>
      </div>
    </div>
  )
}

function RequestCard({ req, onChange }: { req: QueueRow; onChange: () => void }) {
  const [mode, setMode] = useState<'none' | 'schedule' | 'review'>('none')
  const open = req.status === 'requested' || req.status === 'scheduled'
  const link = req.meeting_link && /^https:\/\//i.test(req.meeting_link) ? req.meeting_link : null

  return (
    <article className="card p-5 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="font-display text-xl font-semibold text-ink-900">{req.full_name || 'Unnamed learner'}</h2>
          <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-sm text-ink-600">
            <span className="inline-flex items-center gap-1.5">
              <Mail size={14} className="text-ink-400" />
              {req.email}
            </span>
            {req.phone && (
              <span className="inline-flex items-center gap-1.5">
                <Phone size={14} className="text-ink-400" />
                {req.phone}
              </span>
            )}
          </div>
        </div>
        <Badge tone={TONE[req.status]}>{req.status}</Badge>
      </div>

      {req.preferred_times && (
        <p className="mt-3 rounded-xl bg-ink-100 p-3 text-sm text-ink-700">
          <span className="font-semibold">Prefers: </span>
          {req.preferred_times}
        </p>
      )}
      {req.status === 'scheduled' && req.scheduled_at && (
        <p className="mt-3 flex flex-wrap items-center gap-2 text-sm text-ink-800">
          <CalendarClock size={15} className="text-brand-600" /> {fmt(req.scheduled_at)}
          {link && (
            <a href={link} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 font-semibold text-brand-700 hover:underline">
              <Video size={14} /> Join
            </a>
          )}
        </p>
      )}
      {req.status === 'completed' && req.completed_at && (
        <p className="mt-3 text-sm text-ink-600">Completed {fmt(req.completed_at)}</p>
      )}

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-ink-200 pt-4">
        <time className="text-xs text-ink-500" dateTime={req.created_at}>
          Requested {new Date(req.created_at).toLocaleDateString()}
        </time>
        {open && (
          <div className="flex gap-2">
            <Button size="sm" variant="secondary" onClick={() => setMode(mode === 'schedule' ? 'none' : 'schedule')}>
              {req.status === 'scheduled' ? 'Reschedule' : 'Schedule call'}
            </Button>
            <Button size="sm" onClick={() => setMode(mode === 'review' ? 'none' : 'review')}>
              Review on call
            </Button>
          </div>
        )}
      </div>

      {mode === 'schedule' && (
        <ScheduleForm
          req={req}
          onDone={() => {
            setMode('none')
            onChange()
          }}
        />
      )}
      {mode === 'review' && (
        <ReviewPanel
          req={req}
          onDone={() => {
            setMode('none')
            onChange()
          }}
        />
      )}
    </article>
  )
}

function VerificationPage() {
  const [rows, setRows] = useState<QueueRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string>()
  const [showClosed, setShowClosed] = useState(false)

  async function load() {
    setError(undefined)
    try {
      setRows(await fetchVerificationQueue())
    } catch (e) {
      setError(errorMessage(e))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void load()
  }, [])

  const openRows = rows.filter((r) => r.status === 'requested' || r.status === 'scheduled')
  const closedRows = rows.filter((r) => r.status === 'completed' || r.status === 'cancelled')

  return (
    <>
      <PageHeader
        eyebrow="Admin"
        title="Verification"
        subtitle="Students' KYC video calls. Check ID and each credential on camera — never record the call or note ID numbers."
      />

      {error && (
        <div className="mb-5">
          <Alert tone="danger" title="Couldn’t load the queue">
            <p>{error}</p>
            <p className="mt-1 text-xs">
              First run? Apply <code>docs/supabase-profile-verification.sql</code>.
            </p>
          </Alert>
        </div>
      )}

      {loading ? (
        <div className="space-y-4">
          <Skeleton className="h-40 w-full" />
          <Skeleton className="h-40 w-full" />
        </div>
      ) : openRows.length === 0 && !showClosed ? (
        <EmptyState icon={ShieldCheck} title="No one waiting" description="New verification requests will show up here — and you’ll get an email for each." />
      ) : (
        <div className="space-y-4">
          {openRows.map((r) => (
            <RequestCard key={r.id} req={r} onChange={() => void load()} />
          ))}
        </div>
      )}

      {closedRows.length > 0 && (
        <div className="mt-8">
          <button
            type="button"
            onClick={() => setShowClosed((v) => !v)}
            className="text-sm font-semibold text-ink-600 hover:text-ink-900"
          >
            {showClosed ? 'Hide' : 'Show'} completed & cancelled ({closedRows.length})
          </button>
          {showClosed && (
            <div className="mt-4 space-y-4">
              {closedRows.map((r) => (
                <RequestCard key={r.id} req={r} onChange={() => void load()} />
              ))}
            </div>
          )}
        </div>
      )}
    </>
  )
}
