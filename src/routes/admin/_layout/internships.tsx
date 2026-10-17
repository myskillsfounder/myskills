import { useCallback, useEffect, useMemo, useState } from 'react'
import { createFileRoute, Link } from '@tanstack/react-router'
import { Briefcase, Check, ChevronDown, Search, Star } from 'lucide-react'
import { errorMessage } from '@/lib/errors'
import {
  confirmSignoff,
  day,
  fetchAdminPipeline,
  fetchAdminRoles,
  fetchAdminSignoffs,
  reviewRole,
  roleFacts,
  type AdminApplication,
  type AdminRole,
  type AdminSignoff,
} from '@/lib/internships'
import { RequireSection } from '@/components/admin/AdminSectionGate'
import { ApplicationRow, InternshipPipeline, stuckReason } from '@/components/admin/InternshipPipeline'
import { Alert, Badge, Button, Chip, EmptyState, PageHeader, Skeleton, Textarea } from '@/components/ui'

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

const todayIso = () => {
  const d = new Date()
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

/** Where a role stands, as the team tracks it: a live role past its apply-by date is no longer seen by students. */
type RoleView = 'pending' | 'live' | 'expired' | 'rejected' | 'closed'
function viewOf(r: AdminRole): RoleView {
  if (r.status === 'live' && r.apply_by && r.apply_by < todayIso()) return 'expired'
  return r.status
}
const VIEW: Record<RoleView, { label: string; tone: 'neutral' | 'success' | 'warning' | 'danger' }> = {
  pending: { label: 'To approve', tone: 'warning' },
  live: { label: 'Live', tone: 'success' },
  expired: { label: 'Apply-by passed', tone: 'neutral' },
  rejected: { label: 'Sent back', tone: 'danger' },
  closed: { label: 'Closed', tone: 'neutral' },
}

/** The applications to one role, counted by stage. */
interface RoleCounts {
  total: number
  fresh: number
  interning: number
  done: number
  rows: AdminApplication[]
}

/** A role opened from the list: everything about it, what can be done, and who applied. */
function RoleDetail({ r, counts, onChanged }: { r: AdminRole; counts: RoleCounts | null; onChanged: () => void }) {
  const [busy, setBusy] = useState(false)
  const [full, setFull] = useState(false)
  // Long, or many short lines: either way it folds to a few lines until asked.
  const long = r.description.length > 400 || r.description.split('\n').length > 6
  return (
    <div className="space-y-3 border-t border-ink-900/[0.06] bg-ink-50/60 px-4 py-4 sm:px-5">
      <p className="text-sm text-ink-700">
        {roleFacts(r)} · {r.openings} {r.openings === 1 ? 'opening' : 'openings'}
        {r.company_email && <span className="text-ink-500"> · {r.company_email}</span>}
      </p>
      {r.skills.length > 0 && <p className="text-xs text-ink-500">Skills: {r.skills.join(' · ')}</p>}
      <div>
        <p className={`whitespace-pre-line text-sm leading-relaxed text-ink-700 ${long && !full ? 'line-clamp-4' : ''}`}>{r.description}</p>
        {long && (
          <button type="button" onClick={() => setFull((v) => !v)} className="mt-1 text-sm font-semibold text-brand-700">
            {full ? 'Show less' : 'Show the full description'}
          </button>
        )}
      </div>
      {r.status === 'rejected' && r.review_note && <p className="text-sm text-ink-600">Sent back: {r.review_note}</p>}

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
          className="text-sm font-medium text-ink-600 underline underline-offset-2 hover:text-ink-900 disabled:opacity-60"
        >
          Take this role down
        </button>
      )}

      {counts && (
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-500">Applications · {counts.total}</p>
          {counts.rows.length === 0 ? (
            <p className="mt-1 text-sm text-ink-500">No one has applied yet.</p>
          ) : (
            <ul className="card mt-2 divide-y divide-ink-900/[0.06]">
              {counts.rows.map((a) => (
                <ApplicationRow key={a.id} a={a} showRole={false} />
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  )
}

type Sort = 'newest' | 'applicants' | 'apply_by'

/**
 * Every role posted, as a list to track at a glance: one line each with its
 * company, where it stands, its dates and its applicants. Filter by where it
 * stands, search by role or company, and open one for the rest.
 */
function RolesTable({
  roles,
  pipeline,
  onChanged,
}: {
  roles: AdminRole[]
  /** Every application, when the SQL for it is in: counts by stage, and who applied. */
  pipeline: AdminApplication[] | null
  onChanged: () => void
}) {
  const counts = useMemo(() => {
    if (!pipeline) return null
    const m = new Map<string, RoleCounts>()
    for (const a of pipeline) {
      if (a.status === 'withdrawn') continue
      const c = m.get(a.role_id) ?? { total: 0, fresh: 0, interning: 0, done: 0, rows: [] }
      c.total += 1
      if (a.status === 'applied') c.fresh += 1
      if (a.status === 'accepted' || a.status === 'signoff_pending') c.interning += 1
      if (a.status === 'completed') c.done += 1
      c.rows.push(a)
      m.set(a.role_id, c)
    }
    return m
  }, [pipeline])

  const byView = useMemo(() => {
    const c: Record<'all' | RoleView, number> = { all: roles.length, pending: 0, live: 0, expired: 0, rejected: 0, closed: 0 }
    for (const r of roles) c[viewOf(r)] += 1
    return c
  }, [roles])

  const [filter, setFilter] = useState<'all' | RoleView>(byView.pending > 0 ? 'pending' : 'all')
  const [q, setQ] = useState('')
  const [sort, setSort] = useState<Sort>('newest')
  const [open, setOpen] = useState<string>()

  const term = q.trim().toLowerCase()
  const shown = roles
    .filter((r) => filter === 'all' || viewOf(r) === filter)
    .filter(
      (r) =>
        !term ||
        r.title.toLowerCase().includes(term) ||
        r.organisation.toLowerCase().includes(term) ||
        (r.company_email ?? '').toLowerCase().includes(term),
    )
    .sort((a, b) =>
      sort === 'applicants'
        ? b.applicants - a.applicants
        : sort === 'apply_by'
          ? (a.apply_by ?? '9999').localeCompare(b.apply_by ?? '9999')
          : b.created_at.localeCompare(a.created_at),
    )

  const order: ('all' | RoleView)[] = ['all', 'pending', 'live', 'expired', 'rejected', 'closed']
  const cols = 'xl:grid xl:grid-cols-[minmax(0,1fr)_8rem_6.5rem_6.5rem_6.5rem_1rem] xl:items-center xl:gap-4'

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        {order
          .filter((f) => f === 'all' || byView[f] > 0)
          .map((f) => (
            <Chip key={f} active={filter === f} onClick={() => setFilter(f)}>
              {f === 'all' ? 'All' : VIEW[f].label} · {byView[f]}
            </Chip>
          ))}
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-0 flex-1 sm:max-w-sm">
          <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-400" />
          <input
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search by role or company"
            aria-label="Search roles by title or company"
            className="field h-10 w-full pl-9"
          />
        </div>
        <label className="inline-flex items-center gap-2 text-sm text-ink-600">
          Sort
          <select value={sort} onChange={(e) => setSort(e.target.value as Sort)} className="field h-10 py-0">
            <option value="newest">Newest posted</option>
            <option value="applicants">Most applicants</option>
            <option value="apply_by">Apply-by date</option>
          </select>
        </label>
      </div>

      {shown.length === 0 ? (
        <p className="text-sm text-ink-500">No roles match.</p>
      ) : (
        <div className="card overflow-hidden">
          {/* Column names, on a computer. */}
          <div className={`hidden border-b border-ink-900/[0.06] px-5 py-2.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-ink-500 ${cols}`}>
            <span>Role · company</span>
            <span>Status</span>
            <span>Posted</span>
            <span>Apply by</span>
            <span>Applicants</span>
            <span />
          </div>
          <ul className="divide-y divide-ink-900/[0.06]">
            {shown.map((r) => {
              const v = VIEW[viewOf(r)]
              const c = counts?.get(r.id)
              const isOpen = open === r.id
              return (
                <li key={r.id}>
                  <button
                    type="button"
                    onClick={() => setOpen(isOpen ? undefined : r.id)}
                    aria-expanded={isOpen}
                    className={`w-full px-4 py-3.5 text-left transition-colors hover:bg-ink-50 sm:px-5 ${cols}`}
                  >
                    <span className="block min-w-0">
                      <span className="block truncate font-semibold text-ink-900">{r.title}</span>
                      <span className="block truncate text-sm text-ink-600">{r.organisation}</span>
                    </span>
                    <span className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 xl:mt-0 xl:contents">
                      <span>
                        <Badge tone={v.tone}>{v.label}</Badge>
                      </span>
                      <span className="text-xs text-ink-500 xl:text-sm xl:text-ink-600">
                        <span className="xl:hidden">Posted </span>
                        {day(r.created_at)}
                      </span>
                      <span className="text-xs text-ink-500 xl:text-sm xl:text-ink-600">
                        <span className="xl:hidden">Apply by </span>
                        {r.apply_by ? day(r.apply_by) : '—'}
                      </span>
                      <span className="text-xs text-ink-700 xl:text-sm">
                        <span className="font-semibold tabular-nums text-ink-900">{r.applicants}</span>
                        <span className="xl:hidden"> applicants</span>
                        {c && c.fresh > 0 && <span className="ml-1.5 rounded-full bg-brand-50 px-1.5 py-0.5 text-[11px] font-semibold text-brand-700">{c.fresh} new</span>}
                        {r.interning > 0 && <span className="block text-xs text-emerald-700">{r.interning} interning</span>}
                      </span>
                    </span>
                    <ChevronDown size={16} className={`hidden shrink-0 text-ink-400 transition-transform xl:block ${isOpen ? 'rotate-180' : ''}`} />
                  </button>
                  {isOpen && <RoleDetail r={r} counts={c ?? (counts ? { total: 0, fresh: 0, interning: 0, done: 0, rows: [] } : null)} onChanged={onChanged} />}
                </li>
              )
            })}
          </ul>
        </div>
      )}
    </div>
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
            ? 'This is their first internship: confirming it adds 20 points to their Global Readiness Score.'
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
  // Null before docs/supabase-admin-internships.sql: the section is left out.
  const [pipeline, setPipeline] = useState<AdminApplication[] | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string>()

  const load = useCallback(async () => {
    try {
      const [r, s, p] = await Promise.all([fetchAdminRoles(), fetchAdminSignoffs(), fetchAdminPipeline()])
      setRoles(r)
      setSignoffs(s)
      setPipeline(p)
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
  const toConfirm = signoffs.filter((s) => s.status === 'signoff_pending')
  const confirmed = signoffs.filter((s) => s.status === 'completed')
  const heading = 'text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-500'
  const stuck = pipeline ? pipeline.filter((a) => stuckReason(a) !== null).length : 0

  return (
    <>
      <PageHeader
        eyebrow="Internships"
        title="Roles & applications"
        subtitle={[
          `${toApprove.length} to approve`,
          `${toConfirm.length} sign-offs to confirm`,
          pipeline ? `${stuck} ${stuck === 1 ? 'application needs' : 'applications need'} a nudge` : null,
          `${roles.filter((r) => r.status === 'live').length} live`,
        ]
          .filter(Boolean)
          .join(' · ')}
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
          {roles.length > 0 && (
            <section>
              <h2 className={heading}>Roles · {roles.length}</h2>
              <div className="mt-3">
                <RolesTable roles={roles} pipeline={pipeline} onChanged={() => void load()} />
              </div>
            </section>
          )}
          {pipeline && pipeline.length > 0 && (
            <section>
              <h2 className={heading}>Applications · {pipeline.length}</h2>
              <p className="mt-1 max-w-2xl text-sm text-ink-600">
                Every student who applied, at every company, and where it stands. Something is flagged when it hasn’t
                moved in a week, or an internship is past its end with no sign-off: a nudge to the company or student.
              </p>
              <div className="mt-3">
                <InternshipPipeline rows={pipeline} />
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
