import { useEffect, useMemo, useState } from 'react'
import { Check, Mail, Phone, ShieldCheck, X } from 'lucide-react'
import { errorMessage } from '@/lib/errors'
import { fetchListedMentors, type ListedMentor } from '@/lib/mentors'
import {
  fetchPortalRequests,
  reviewPortalRequest,
  roleLabel,
  type AdminPortalRequest,
} from '@/lib/portalAccess'
import { Alert, Badge, Button, Skeleton, Textarea } from '@/components/ui'

const day = (iso: string) =>
  new Date(iso).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })

/** One sign-up: who they say they are, and the two decisions. */
function RequestCard({
  req,
  unlinked,
  busy,
  onApprove,
  onReject,
}: {
  req: AdminPortalRequest
  /** Mentor listings with no account, to link a mentor sign-up to. */
  unlinked: ListedMentor[] | null
  busy: boolean
  onApprove: (mentorId?: string) => void
  onReject: (note: string) => void
}) {
  const isMentor = req.role === 'mentor'
  // Suggest the listing with the same name, so the usual case is one click.
  const suggested = useMemo(
    () => unlinked?.find((m) => m.full_name.trim().toLowerCase() === (req.full_name ?? '').trim().toLowerCase())?.id ?? '',
    [unlinked, req.full_name],
  )
  const [mentorId, setMentorId] = useState(suggested)
  const [rejecting, setRejecting] = useState(false)
  const [note, setNote] = useState('')

  return (
    <article className="card p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="font-display text-lg font-semibold text-ink-900">{req.full_name || req.email}</h3>
          <p className="text-sm font-medium text-brand-700">
            {roleLabel(req.role)}
            {req.organisation ? ` · ${req.organisation}` : ''}
          </p>
        </div>
        <span className="text-xs text-ink-500">Asked {day(req.created_at)}</span>
      </div>

      <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-sm text-ink-700">
        <a href={`mailto:${req.email}`} className="inline-flex items-center gap-1.5 hover:text-brand-700">
          <Mail size={13} /> {req.email}
        </a>
        {req.phone && (
          <span className="inline-flex items-center gap-1.5">
            <Phone size={13} /> {req.phone}
          </span>
        )}
        <Badge tone="success" icon={Check}>
          Email confirmed
        </Badge>
      </div>

      {req.message && (
        <p className="mt-3 whitespace-pre-line rounded-xl bg-ink-100 p-3 text-sm leading-relaxed text-ink-700">{req.message}</p>
      )}

      {isMentor && (
        <div className="mt-4">
          <label className="block text-sm font-medium text-ink-800">
            Which mentor listing is this?
            <select value={mentorId} onChange={(e) => setMentorId(e.target.value)} className="field mt-1.5 block w-full sm:max-w-sm">
              <option value="">Choose a listing…</option>
              {(unlinked ?? []).map((m) => (
                <option key={m.id} value={m.id}>
                  {m.full_name} — {m.headline}
                </option>
              ))}
            </select>
          </label>
          <p className="mt-1.5 text-xs text-ink-500">
            {unlinked === null
              ? 'You need the Mentors section to link a mentor.'
              : unlinked.length === 0
                ? 'No unlinked listings. Add them first: Mentors > Listed mentors > Add a mentor.'
                : 'Approving links their account to this listing, so they can sign in and accept students.'}
          </p>
        </div>
      )}

      {rejecting ? (
        <div className="mt-4">
          <Textarea
            label="Why? (they see this)"
            hint="Tell them what to do next, for example which details you could not verify."
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={3}
            maxLength={1000}
          />
          <div className="mt-3 flex gap-2">
            <Button size="sm" variant="secondary" disabled={busy || note.trim().length < 3} onClick={() => onReject(note)}>
              Send and reject
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setRejecting(false)}>
              Cancel
            </Button>
          </div>
        </div>
      ) : (
        <div className="mt-4 flex flex-wrap gap-2 border-t border-ink-900/[0.06] pt-4">
          <Button
            size="sm"
            icon={ShieldCheck}
            disabled={busy || (isMentor && !mentorId)}
            onClick={() => onApprove(isMentor ? mentorId : undefined)}
          >
            Verify and give access
          </Button>
          <Button size="sm" variant="secondary" icon={X} disabled={busy} onClick={() => setRejecting(true)}>
            Reject
          </Button>
        </div>
      )}
    </article>
  )
}

/**
 * Sign-ups waiting for the team to verify. Nobody gets any access from signing
 * up; approving here is what gives it (a mentor is linked to their listing,
 * anyone else is granted their section). Hidden when nothing is waiting, and
 * quiet if the SQL for sign-up hasn't been run.
 */
export function PortalRequestsPanel({ onChanged }: { onChanged: () => void }) {
  const [requests, setRequests] = useState<AdminPortalRequest[] | null | undefined>(undefined)
  const [unlinked, setUnlinked] = useState<ListedMentor[] | null>(null)
  const [busyId, setBusyId] = useState<string>()
  const [error, setError] = useState<string>()

  async function load() {
    try {
      setRequests(await fetchPortalRequests())
    } catch (e) {
      setError(errorMessage(e))
      setRequests(null)
    }
    // Listings with no account, for linking a mentor. Needs the Mentors section.
    fetchListedMentors()
      .then((list) => setUnlinked(list.filter((m) => !m.linked)))
      .catch(() => setUnlinked(null))
  }

  useEffect(() => {
    void load()
  }, [])

  async function decide(id: string, run: () => Promise<void>) {
    setBusyId(id)
    setError(undefined)
    try {
      await run()
      await load()
      onChanged()
    } catch (e) {
      setError(errorMessage(e))
    } finally {
      setBusyId(undefined)
    }
  }

  if (requests === undefined) return <Skeleton className="mb-6 h-32 w-full" />
  const waiting = (requests ?? []).filter((r) => r.status === 'pending')
  if (!error && waiting.length === 0) return null

  return (
    <section className="mb-8">
      <h2 className="text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-500">
        Waiting for verification · {waiting.length}
      </h2>
      <p className="mt-1 text-sm text-ink-600">
        People who signed up for the Community portal and confirmed their email. They have no access until you verify
        them here.
      </p>
      {error && (
        <div className="mt-3">
          <Alert tone="danger" title="Couldn’t complete that">
            <p>{error}</p>
          </Alert>
        </div>
      )}
      <div className="mt-3 space-y-3">
        {waiting.map((r) => (
          <RequestCard
            key={r.id}
            req={r}
            unlinked={unlinked}
            busy={busyId === r.id}
            onApprove={(mentorId) => void decide(r.id, () => reviewPortalRequest(r.id, 'approved', { mentorId }))}
            onReject={(note) => void decide(r.id, () => reviewPortalRequest(r.id, 'rejected', { note }))}
          />
        ))}
      </div>
    </section>
  )
}
