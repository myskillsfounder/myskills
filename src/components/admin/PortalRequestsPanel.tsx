import { useEffect, useState } from 'react'
import { Check, CheckCircle2, Mail, Phone, ShieldCheck, X } from 'lucide-react'
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
  const { requests, busyId, error, decide } = useRequests(onChanged)

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

/** Load the sign-ups, and decide one then reload. */
function useRequests(onChanged: () => void) {
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

  return { requests, busyId, error, decide }
}

/** Each kind of partner, in the order the menu lists them, with a plural for headings. */
const CATEGORIES: { role: PortalRole; plural: string }[] = [
  { role: 'mentor', plural: 'Mentors' },
  { role: 'wellness', plural: 'Counsellors' },
  { role: 'guidance', plural: 'Career guides' },
  { role: 'internships', plural: 'Companies' },
  { role: 'institutions', plural: 'Institutions' },
]
const pluralOf = (r: PortalRole) => CATEGORIES.find((c) => c.role === r)?.plural ?? r

const heading = 'text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-500'

/** Verified or turned down: who, and when. */
function DecidedList({ rows }: { rows: AdminPortalRequest[] }) {
  return (
    <ul className="card divide-y divide-ink-900/[0.06]">
      {rows.map((r) => (
        <li key={r.id} className="flex flex-wrap items-center gap-x-3 gap-y-1 px-4 py-3 text-sm">
          <span className="min-w-0 flex-1">
            <span className="font-semibold text-ink-900">{r.full_name || r.email}</span>
            {r.organisation && <span className="text-ink-500"> · {r.organisation}</span>}
          </span>
          <Badge tone={r.status === 'approved' ? 'success' : 'neutral'}>{r.status === 'approved' ? 'Verified' : 'Turned down'}</Badge>
          <span className="w-24 text-right text-xs text-ink-500">{day(r.reviewed_at ?? r.created_at)}</span>
        </li>
      ))}
    </ul>
  )
}

/**
 * The Partners to verify page: every sign-up, by kind of partner. A tab for
 * each kind with what is waiting; under it, who is waiting, then who was
 * verified or turned down. "All partners" groups both lists by kind.
 */
export function PartnerVerificationBoard() {
  const { requests, busyId, error, decide } = useRequests(() => {})
  const [tab, setTab] = useState<PortalRole | 'all'>('all')

  if (requests === undefined) return <Skeleton className="h-64 w-full" />
  const all = requests ?? []
  const byNewest = (a: AdminPortalRequest, b: AdminPortalRequest) =>
    (b.reviewed_at ?? b.created_at).localeCompare(a.reviewed_at ?? a.created_at)
  const waitingIn = (r: PortalRole) => all.filter((x) => x.role === r && x.status === 'pending')
  const decidedIn = (r: PortalRole) => all.filter((x) => x.role === r && x.status !== 'pending').sort(byNewest)
  const totalWaiting = all.filter((x) => x.status === 'pending').length
  const shownCats = tab === 'all' ? CATEGORIES : CATEGORIES.filter((c) => c.role === tab)

  const card = (r: AdminPortalRequest) => (
    <RequestCard
      key={r.id}
      req={r}
      busy={busyId === r.id}
      onApprove={() => void decide(r.id, () => reviewPortalRequest(r.id, 'approved'))}
      onReject={(note) => void decide(r.id, () => reviewPortalRequest(r.id, 'rejected', { note }))}
    />
  )
  const waitingCats = shownCats.filter((c) => waitingIn(c.role).length > 0)
  const decidedCats = shownCats.filter((c) => decidedIn(c.role).length > 0)

  return (
    <>
      <div className="mb-6 flex flex-wrap gap-2" role="tablist" aria-label="Kind of partner">
        {[{ role: 'all' as const, plural: 'All partners' }, ...CATEGORIES].map((c) => {
          const n = c.role === 'all' ? totalWaiting : waitingIn(c.role).length
          const active = tab === c.role
          return (
            <button
              key={c.role}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => setTab(c.role)}
              className={`inline-flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors ${
                active ? 'border-brand-500 bg-brand-50 text-brand-800' : 'border-ink-300 bg-white text-ink-600 hover:bg-ink-100'
              }`}
            >
              {c.plural}
              {n > 0 && <span className="rounded-full bg-amber-500 px-1.5 py-0.5 text-[11px] font-bold leading-none text-white">{n}</span>}
            </button>
          )
        })}
      </div>

      {error && (
        <div className="mb-5">
          <Alert tone="danger" title="Couldn’t complete that">
            <p>{error}</p>
          </Alert>
        </div>
      )}

      <h2 className={heading}>Waiting to be verified</h2>
      {waitingCats.length === 0 ? (
        <div className="card mt-3 flex items-center gap-3 p-5">
          <CheckCircle2 size={20} className="shrink-0 text-emerald-600" />
          <p className="text-sm text-ink-700">
            {tab === 'all' ? 'Nobody is waiting.' : `No ${pluralOf(tab).toLowerCase()} waiting.`} New sign-ups appear here once
            they confirm their email.
          </p>
        </div>
      ) : (
        <div className="mt-3 space-y-6">
          {waitingCats.map((c) => (
            <div key={c.role}>
              {tab === 'all' && (
                <h3 className="mb-2 font-display text-base font-semibold text-ink-900">
                  {c.plural} <span className="text-ink-400">· {waitingIn(c.role).length}</span>
                </h3>
              )}
              <div className="space-y-3">{waitingIn(c.role).map(card)}</div>
            </div>
          ))}
        </div>
      )}

      {decidedCats.length > 0 && (
        <>
          <h2 className={`${heading} mt-10`}>Verified &amp; turned down</h2>
          <div className="mt-3 grid gap-5 xl:grid-cols-2">
            {decidedCats.map((c) => {
              const rows = decidedIn(c.role)
              const verified = rows.filter((r) => r.status === 'approved').length
              // On All partners, the latest five of each; a kind's own tab lists them all.
              const shown = tab === 'all' ? rows.slice(0, 5) : rows
              return (
                <div key={c.role} className={tab === 'all' ? '' : 'xl:col-span-2'}>
                  <div className="mb-2 flex items-baseline justify-between gap-3">
                    <h3 className="font-display text-base font-semibold text-ink-900">{c.plural}</h3>
                    <p className="text-xs text-ink-500">
                      {verified} verified{rows.length - verified > 0 ? ` · ${rows.length - verified} turned down` : ''}
                    </p>
                  </div>
                  <DecidedList rows={shown} />
                  {shown.length < rows.length && (
                    <button
                      type="button"
                      onClick={() => setTab(c.role)}
                      className="mt-2 text-sm font-semibold text-brand-700 hover:underline"
                    >
                      All {rows.length} {c.plural.toLowerCase()}
                    </button>
                  )}
                </div>
              )
            })}
          </div>
        </>
      )}
    </>
  )
}
