import { useCallback, useEffect, useState } from 'react'
import { createFileRoute, Link } from '@tanstack/react-router'
import { Briefcase, Check, Star } from 'lucide-react'
import { errorMessage } from '@/lib/errors'
import {
  ROLE_STATUS,
  confirmSignoff,
  day,
  fetchAdminRoles,
  fetchAdminSignoffs,
  reviewRole,
  roleFacts,
  type AdminRole,
  type AdminSignoff,
} from '@/lib/internships'
import { RequireSection } from '@/components/admin/AdminSectionGate'
import { Alert, Badge, Button, EmptyState, PageHeader, Skeleton, Textarea } from '@/components/ui'

// The same section as the internship companies: whoever handles them handles their roles.
export const Route = createFileRoute('/admin/_layout/internships')({
  component: () => (
    <RequireSection section="partner-leads">
      <InternshipsAdminPage />
    </RequireSection>
  ),
})

/** A decision that may need a note: approve / confirm in one click, or send back with the reason. */
function Decide({
  yes,
  no,
  placeholder,
  onYes,
  onNo,
}: {
  yes: string
  no: string
  placeholder: string
  onYes: () => Promise<void>
  onNo: (note: string) => Promise<void>
}) {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string>()
  const [writing, setWriting] = useState(false)
  const [note, setNote] = useState('')

  async function run(fn: () => Promise<void>) {
    setBusy(true)
    setError(undefined)
    try {
      await fn()
    } catch (e) {
      setError(errorMessage(e))
      setBusy(false)
    }
  }

  return (
    <div className="mt-4 border-t border-ink-900/[0.06] pt-4">
      {writing ? (
        <>
          <Textarea label="What needs changing" rows={3} maxLength={500} value={note} onChange={(e) => setNote(e.target.value)} placeholder={placeholder} />
          <div className="mt-3 flex flex-wrap gap-2">
            <Button size="sm" variant="secondary" disabled={busy || note.trim().length < 3} onClick={() => void run(() => onNo(note))}>
              {no}
            </Button>
            <button type="button" className="text-sm font-medium text-ink-500" onClick={() => setWriting(false)}>
              Cancel
            </button>
          </div>
        </>
      ) : (
        <div className="flex flex-wrap items-center gap-2">
          <Button size="sm" icon={Check} disabled={busy} onClick={() => void run(onYes)}>
            {yes}
          </Button>
          <Button size="sm" variant="secondary" disabled={busy} onClick={() => setWriting(true)}>
            {no}
          </Button>
        </div>
      )}
      {error && <p className="mt-2 text-sm text-red-700">{error}</p>}
    </div>
  )
}

function RoleCard({ r, onChanged }: { r: AdminRole; onChanged: () => void }) {
  const s = ROLE_STATUS[r.status]
  const [busy, setBusy] = useState(false)
  return (
    <article className="card p-5">
      <div className="flex flex-wrap items-start justify-between gap-x-3 gap-y-1">
        <div className="min-w-0">
          <h3 className="font-display text-lg font-semibold text-ink-900">{r.title}</h3>
          <p className="text-sm font-medium text-ink-700">
            {r.organisation}
            {r.company_email && <span className="font-normal text-ink-500"> · {r.company_email}</span>}
          </p>
          <p className="text-sm text-ink-600">
            {roleFacts(r)} · {r.openings} {r.openings === 1 ? 'opening' : 'openings'}
            {r.apply_by ? ` · apply by ${day(r.apply_by)}` : ''}
          </p>
        </div>
        <Badge tone={r.status === 'pending' ? 'warning' : s.tone}>{r.status === 'pending' ? 'To approve' : s.label}</Badge>
      </div>
      {r.skills.length > 0 && <p className="mt-2 text-xs text-ink-500">Skills: {r.skills.join(' · ')}</p>}
      <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-ink-700">{r.description}</p>
      {r.status === 'rejected' && r.review_note && <p className="mt-3 text-sm text-ink-600">Sent back: {r.review_note}</p>}
      {r.status !== 'pending' && (
        <p className="mt-3 text-xs text-ink-500">
          {r.applicants} {r.applicants === 1 ? 'applicant' : 'applicants'} · {r.interning} interning now · posted {day(r.created_at)}
        </p>
      )}

      {r.status === 'pending' && (
        <Decide
          yes="Approve and publish"
          no="Send back"
          placeholder="What the company should change before this can go live."
          onYes={async () => {
            await reviewRole(r.id, 'live')
            onChanged()
          }}
          onNo={async (note) => {
            await reviewRole(r.id, 'rejected', note)
            onChanged()
          }}
        />
      )}
      {r.status === 'live' && (
        <button
          type="button"
          disabled={busy}
          onClick={() => {
            setBusy(true)
            void reviewRole(r.id, 'closed').then(onChanged, () => setBusy(false))
          }}
          className="mt-3 text-sm font-medium text-ink-600 underline underline-offset-2 hover:text-ink-900 disabled:opacity-60"
        >
          Take this role down
        </button>
      )}
    </article>
  )
}

function SignoffCard({ s, onChanged }: { s: AdminSignoff; onChanged: () => void }) {
  const pending = s.status === 'signoff_pending'
  return (
    <article className={`card p-5 ${pending ? '' : 'opacity-75'}`}>
      <div className="flex flex-wrap items-start justify-between gap-x-3 gap-y-1">
        <div className="min-w-0">
          <h3 className="font-display text-lg font-semibold text-ink-900">
            <Link to="/admin/users/$id" params={{ id: s.student_id }} className="hover:text-brand-700 hover:underline">
              {s.student_name || 'A MySkills student'}
            </Link>
          </h3>
          <p className="text-sm text-ink-700">
            {s.title} · {s.organisation}
          </p>
          <p className="text-sm text-ink-600">
            {s.started_on && s.ended_on ? `${day(s.started_on)} to ${day(s.ended_on)}` : 'Dates not given'}
            {s.supervisor_name ? ` · supervised by ${s.supervisor_name}` : ''}
          </p>
          {s.student_email && <p className="text-xs text-ink-500">{s.student_email}</p>}
        </div>
        <Badge tone={pending ? 'warning' : 'success'}>{pending ? 'To confirm' : 'Confirmed'}</Badge>
      </div>
      {pending && (
        <p className="mt-3 inline-flex items-start gap-1.5 text-sm text-ink-700">
          <Star size={14} className="mt-0.5 shrink-0 text-brand-600" />
          {s.first_internship
            ? 'This is their first internship: confirming it adds 20 points to their Career Readiness Score.'
            : 'They already have a confirmed internship: this one goes on their record, with no more points.'}
        </p>
      )}
      {pending && (
        <Decide
          yes="Confirm the internship"
          no="Send back to the company"
          placeholder="What the company should correct, for example the dates or the supervisor."
          onYes={async () => {
            await confirmSignoff(s.id, true)
            onChanged()
          }}
          onNo={async (note) => {
            await confirmSignoff(s.id, false, note)
            onChanged()
          }}
        />
      )}
    </article>
  )
}

/**
 * Internships through MySkills, for the team: roles companies have written
 * (nothing reaches students until it is approved here), and internships
 * companies have signed off (nothing reaches a student's score until it is
 * confirmed here).
 */
function InternshipsAdminPage() {
  const [roles, setRoles] = useState<AdminRole[]>([])
  const [signoffs, setSignoffs] = useState<AdminSignoff[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string>()

  const load = useCallback(async () => {
    try {
      const [r, s] = await Promise.all([fetchAdminRoles(), fetchAdminSignoffs()])
      setRoles(r)
      setSignoffs(s)
      setError(undefined)
    } catch (e) {
      setError(errorMessage(e))
    } finally {
      setLoading(false)
    }
  }, [])
  useEffect(() => {
    void load()
  }, [load])

  const toApprove = roles.filter((r) => r.status === 'pending')
  const others = roles.filter((r) => r.status !== 'pending')
  const toConfirm = signoffs.filter((s) => s.status === 'signoff_pending')
  const confirmed = signoffs.filter((s) => s.status === 'completed')
  const heading = 'text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-500'

  return (
    <>
      <PageHeader
        eyebrow="Partners"
        title="Internship roles"
        subtitle={`${toApprove.length} to approve · ${toConfirm.length} sign-offs to confirm · ${roles.filter((r) => r.status === 'live').length} live`}
      />
      {error && (
        <div className="mb-5">
          <Alert tone="danger" title="Something went wrong">
            <p>{error}</p>
          </Alert>
        </div>
      )}
      {loading ? (
        <Skeleton className="h-64 w-full" />
      ) : roles.length === 0 && signoffs.length === 0 && !error ? (
        <EmptyState
          icon={Briefcase}
          title="No roles yet"
          description="When a verified company posts an internship role in the Community portal, it appears here for approval."
        />
      ) : (
        <div className="space-y-8">
          {toConfirm.length > 0 && (
            <section>
              <h2 className={heading}>Sign-offs to confirm · {toConfirm.length}</h2>
              <div className="mt-2 space-y-3">
                {toConfirm.map((s) => (
                  <SignoffCard key={s.id} s={s} onChanged={() => void load()} />
                ))}
              </div>
            </section>
          )}
          {toApprove.length > 0 && (
            <section>
              <h2 className={heading}>Roles to approve · {toApprove.length}</h2>
              <div className="mt-2 space-y-3">
                {toApprove.map((r) => (
                  <RoleCard key={r.id} r={r} onChanged={() => void load()} />
                ))}
              </div>
            </section>
          )}
          {others.length > 0 && (
            <section>
              <h2 className={heading}>All roles · {others.length}</h2>
              <div className="mt-2 space-y-3">
                {others.map((r) => (
                  <RoleCard key={r.id} r={r} onChanged={() => void load()} />
                ))}
              </div>
            </section>
          )}
          {confirmed.length > 0 && (
            <section>
              <h2 className={heading}>Confirmed internships · {confirmed.length}</h2>
              <div className="mt-2 space-y-3">
                {confirmed.map((s) => (
                  <SignoffCard key={s.id} s={s} onChanged={() => void load()} />
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </>
  )
}
