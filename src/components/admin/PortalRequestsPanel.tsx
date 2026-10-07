import { useEffect, useState } from 'react'
import { Check, Mail, Phone, ShieldCheck, X } from 'lucide-react'
import { errorMessage } from '@/lib/errors'
import {
  fetchPortalRequests,
  reviewPortalRequest,
  roleLabel,
  type AdminPortalRequest,
  type PortalRole,
} from '@/lib/portalAccess'
import { Alert, Badge, Button, Skeleton, Textarea } from '@/components/ui'

const day = (iso: string) =>
  new Date(iso).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })

/** One sign-up: who they say they are, and the two decisions. */
function RequestCard({
  req,
  busy,
  onApprove,
  onReject,
}: {
  req: AdminPortalRequest
  busy: boolean
  onApprove: () => void
  onReject: (note: string) => void
}) {
  const isMentor = req.role === 'mentor'
  // Suggest the listing with the same name, so the usual case is one click.
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
        {req.application_status && (
          <Badge tone={req.application_status === 'rejected' ? 'danger' : req.application_status === 'pending' || req.application_status === 'new' ? 'warning' : 'success'}>
            Applied{req.application_on ? ` ${day(req.application_on)}` : ''} · {req.application_status}
          </Badge>
        )}
      </div>

      {req.message && (
        <p className="mt-3 whitespace-pre-line rounded-xl bg-ink-100 p-3 text-sm leading-relaxed text-ink-700">{req.message}</p>
      )}

      {isMentor && (
        <p className="mt-4 rounded-xl bg-brand-50 px-3.5 py-3 text-sm text-ink-800">
          Verifying makes them a mentor: their listing is created for this account, and they finish their profile in the
          portal. Students see them once it is complete.
        </p>
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
            disabled={busy}
            onClick={onApprove}
          >
            {isMentor ? 'Verify as a mentor' : 'Verify and give access'}
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
 * up; approving here is what gives it (a mentor's listing is created for their
 * account, anyone else is granted their section). Hidden when nothing is
 * waiting, and quiet if the SQL for sign-up hasn't been run or the signed-in
 * person can't verify. `only` narrows it to one kind of partner.
 */
export function PortalRequestsPanel({ onChanged, only }: { onChanged: () => void; only?: PortalRole }) {
  const [requests, setRequests] = useState<AdminPortalRequest[] | null | undefined>(undefined)
  const [busyId, setBusyId] = useState<string>()
  const [error, setError] = useState<string>()

  async function load() {
    try {
      setRequests(await fetchPortalRequests())
    } catch (e) {
      setError(errorMessage(e))
      setRequests(null)
    }
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
  const waiting = (requests ?? []).filter((r) => r.status === 'pending' && (!only || r.role === only))
  if (!error && waiting.length === 0) return null

  return (
    <section className="mb-8">
      <h2 className="text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-500">
        {only === 'mentor' ? 'Mentors waiting to be verified' : 'Waiting for verification'} · {waiting.length}
      </h2>
      <p className="mt-1 text-sm text-ink-600">
        {only === 'mentor'
          ? 'People who signed up as a mentor and confirmed their email. Nobody is a mentor until you verify them here.'
          : 'People who signed up for the Community portal and confirmed their email. They have no access until you verify them here.'}
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
            busy={busyId === r.id}
            onApprove={() => void decide(r.id, () => reviewPortalRequest(r.id, 'approved'))}
            onReject={(note) => void decide(r.id, () => reviewPortalRequest(r.id, 'rejected', { note }))}
          />
        ))}
      </div>
    </section>
  )
}
