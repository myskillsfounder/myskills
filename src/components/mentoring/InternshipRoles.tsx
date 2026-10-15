import { useCallback, useEffect, useState } from 'react'
import { Briefcase, CalendarCheck, Check, ChevronDown, Mail, Pencil, Phone, Plus, Star, X } from 'lucide-react'
import { errorMessage } from '@/lib/errors'
import {
  MODE_LABEL,
  ROLE_STATUS,
  closeRole,
  day,
  decideApplication,
  fetchApplicants,
  fetchMyRoles,
  requestSignoff,
  roleFacts,
  saveRole,
  type Applicant,
  type CompanyRole,
  type RoleDraft,
  type RoleMode,
} from '@/lib/internships'
import { Alert, Badge, Button, Chip, EmptyState, Input, Skeleton, Textarea } from '@/components/ui'

const today = () => new Date().toISOString().slice(0, 10)

const BLANK: RoleDraft = {
  id: null,
  title: '',
  description: '',
  skills: [],
  mode: 'remote',
  location: null,
  duration_weeks: 8,
  stipend: null,
  openings: 1,
  apply_by: null,
}

/** Write a role, or change one. Either way the team reads it before students do. */
function RoleForm({ initial, onSaved, onCancel }: { initial: RoleDraft; onSaved: () => void; onCancel: () => void }) {
  const [d, setD] = useState<RoleDraft>(initial)
  const [skills, setSkills] = useState(initial.skills.join(', '))
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string>()
  const set = <K extends keyof RoleDraft>(k: K, v: RoleDraft[K]) => setD((prev) => ({ ...prev, [k]: v }))

  async function submit() {
    setBusy(true)
    setError(undefined)
    try {
      await saveRole({
        ...d,
        skills: skills.split(',').map((s) => s.trim()).filter(Boolean),
        location: d.mode === 'remote' ? null : d.location,
      })
      onSaved()
    } catch (e) {
      setError(errorMessage(e))
      setBusy(false)
    }
  }

  return (
    <div className="card space-y-4 p-5">
      <div>
        <p className="font-display text-lg font-semibold text-ink-900">{initial.id ? 'Edit the role' : 'Post a role'}</p>
        <p className="mt-0.5 text-sm text-ink-600">
          The MySkills team reads every role before students see it{initial.id ? ', so an edit goes back for approval' : ''}.
        </p>
      </div>
      <Input label="Role title" value={d.title} maxLength={120} onChange={(e) => set('title', e.target.value)} placeholder="SEO & Content Intern" />
      <Textarea
        label="What the intern will do"
        rows={6}
        maxLength={3000}
        value={d.description}
        onChange={(e) => set('description', e.target.value)}
        placeholder="The work, who they report to, what they will have built by the end, and the hours per week."
      />
      <Input
        label="Skills"
        required={false}
        hint="Separate them with commas."
        value={skills}
        onChange={(e) => setSkills(e.target.value)}
        placeholder="SEO, Content Marketing, Analytics"
      />
      <div>
        <p className="text-sm font-medium text-ink-800">Where</p>
        <div className="mt-1.5 flex flex-wrap gap-2">
          {(Object.keys(MODE_LABEL) as RoleMode[]).map((m) => (
            <Chip key={m} active={d.mode === m} onClick={() => set('mode', m)}>
              {MODE_LABEL[m]}
            </Chip>
          ))}
        </div>
      </div>
      {d.mode !== 'remote' && (
        <Input label="City" value={d.location ?? ''} maxLength={80} onChange={(e) => set('location', e.target.value)} placeholder="Kochi" />
      )}
      <div className="grid gap-4 sm:grid-cols-3">
        <Input
          label="Weeks"
          type="number"
          min={1}
          max={52}
          value={d.duration_weeks}
          onChange={(e) => set('duration_weeks', Number(e.target.value))}
        />
        <Input label="Openings" type="number" min={1} max={50} value={d.openings} onChange={(e) => set('openings', Number(e.target.value))} />
        <Input
          label="Apply by"
          required={false}
          type="date"
          min={today()}
          value={d.apply_by ?? ''}
          onChange={(e) => set('apply_by', e.target.value || null)}
        />
      </div>
      <Input
        label="Stipend"
        required={false}
        hint="Leave empty if the internship is unpaid. Students see “Unpaid”."
        value={d.stipend ?? ''}
        maxLength={80}
        onChange={(e) => set('stipend', e.target.value || null)}
        placeholder="₹5,000 a month"
      />
      {error && <p className="text-sm text-red-700">{error}</p>}
      <div className="flex flex-wrap gap-2">
        <Button disabled={busy} onClick={() => void submit()}>
          {busy ? 'Sending…' : 'Send for approval'}
        </Button>
        <Button variant="secondary" disabled={busy} onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </div>
  )
}

const APPLICANT_STATUS: Record<Applicant['status'], { label: string; tone: 'neutral' | 'brand' | 'success' | 'warning' }> = {
  applied: { label: 'New', tone: 'brand' },
  shortlisted: { label: 'Shortlisted', tone: 'brand' },
  offered: { label: 'Offer sent', tone: 'warning' },
  accepted: { label: 'Interning now', tone: 'success' },
  signoff_pending: { label: 'Signed off · being confirmed', tone: 'success' },
  completed: { label: 'Completed', tone: 'success' },
  rejected: { label: 'Not selected', tone: 'neutral' },
}

/** One applicant: what they have shown on MySkills, and the next thing the company can do. */
function ApplicantRow({ a, onChanged }: { a: Applicant; onChanged: () => void }) {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string>()
  const [signing, setSigning] = useState(false)
  const [supervisor, setSupervisor] = useState('')
  const [ended, setEnded] = useState(today())

  async function run(fn: () => Promise<void>) {
    setBusy(true)
    setError(undefined)
    try {
      await fn()
      setSigning(false)
      onChanged()
    } catch (e) {
      setError(errorMessage(e))
    } finally {
      setBusy(false)
    }
  }

  const s = APPLICANT_STATUS[a.status]
  return (
    <li className="rounded-2xl border border-ink-900/[0.08] p-4">
      <div className="flex flex-wrap items-start justify-between gap-x-3 gap-y-1">
        <div className="min-w-0">
          <p className="font-display text-base font-semibold text-ink-900">{a.student_name || 'A MySkills student'}</p>
          {(a.headline || a.location) && (
            <p className="text-sm text-ink-600">{[a.headline, a.location].filter(Boolean).join(' · ')}</p>
          )}
        </div>
        <Badge tone={s.tone}>{s.label}</Badge>
      </div>

      <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
        <span className="inline-flex items-center gap-1.5 font-semibold text-ink-900">
          <Star size={14} className="text-brand-600" />
          {a.score == null ? 'No score yet' : `Global Readiness Score ${a.score} / 100`}
        </span>
        <span className="text-ink-500">Applied {day(a.applied_on)}</span>
      </div>
      {a.certificates.length > 0 && (
        <p className="mt-1 text-xs text-ink-600">Certificates: {a.certificates.join(' · ')}</p>
      )}
      {a.note && <p className="mt-2 whitespace-pre-line rounded-xl bg-ink-900/[0.03] p-3 text-sm leading-relaxed text-ink-700">{a.note}</p>}

      {a.email ? (
        <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm">
          <a href={`mailto:${a.email}`} className="inline-flex items-center gap-1.5 text-ink-700 hover:text-brand-700">
            <Mail size={13} /> {a.email}
          </a>
          {a.phone && (
            <a href={`tel:${a.phone}`} className="inline-flex items-center gap-1.5 text-ink-700 hover:text-brand-700">
              <Phone size={13} /> {a.phone}
            </a>
          )}
        </div>
      ) : (
        a.status === 'applied' && <p className="mt-2 text-xs text-ink-500">Their email and phone show once you shortlist or make an offer.</p>
      )}

      {a.status === 'accepted' && a.signoff_note && (
        <div className="mt-3">
          <Alert tone="warning" title="MySkills couldn’t confirm the sign-off yet">
            <p>{a.signoff_note}</p>
          </Alert>
        </div>
      )}

      {(a.status === 'applied' || a.status === 'shortlisted' || a.status === 'offered') && (
        <div className="mt-3 flex flex-wrap items-center gap-2">
          {a.status === 'applied' && (
            <Button size="sm" variant="secondary" disabled={busy} onClick={() => void run(() => decideApplication(a.id, 'shortlist'))}>
              Shortlist
            </Button>
          )}
          {a.status !== 'offered' && (
            <Button size="sm" icon={Check} disabled={busy} onClick={() => void run(() => decideApplication(a.id, 'offer'))}>
              Offer the internship
            </Button>
          )}
          {a.status === 'offered' && <span className="text-sm text-ink-600">Waiting for them to accept.</span>}
          <button
            type="button"
            disabled={busy}
            onClick={() => void run(() => decideApplication(a.id, 'reject'))}
            className="ml-auto text-sm font-medium text-ink-600 hover:text-ink-900 disabled:opacity-60"
          >
            {a.status === 'offered' ? 'Withdraw the offer' : 'Not selected'}
          </button>
        </div>
      )}

      {a.status === 'accepted' &&
        (signing ? (
          <div className="mt-3 border-t border-ink-900/[0.06] pt-3">
            <p className="text-sm font-semibold text-ink-900">Sign off this internship</p>
            <p className="mt-0.5 text-xs leading-relaxed text-ink-500">
              You are confirming {a.student_name || 'the student'} did the work. MySkills confirms it with you before it
              counts for their score.
            </p>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <Input label="Supervisor’s name" value={supervisor} maxLength={120} onChange={(e) => setSupervisor(e.target.value)} placeholder="Who they reported to" />
              <Input label="Last day" type="date" max={today()} value={ended} onChange={(e) => setEnded(e.target.value)} />
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              <Button
                size="sm"
                icon={CalendarCheck}
                disabled={busy || supervisor.trim().length < 2 || !ended}
                onClick={() => void run(() => requestSignoff(a.id, supervisor, ended))}
              >
                Send for confirmation
              </Button>
              <Button size="sm" variant="secondary" disabled={busy} onClick={() => setSigning(false)}>
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <span className="text-sm text-ink-600">Started {a.started_on ? day(a.started_on) : 'recently'}.</span>
            <Button size="sm" variant="secondary" icon={CalendarCheck} onClick={() => setSigning(true)}>
              Mark internship complete
            </Button>
          </div>
        ))}

      {(a.status === 'signoff_pending' || a.status === 'completed') && (
        <p className="mt-3 text-sm text-ink-600">
          {a.started_on && a.ended_on ? `${day(a.started_on)} to ${day(a.ended_on)}` : ''}
          {a.supervisor_name ? ` · supervised by ${a.supervisor_name}` : ''}
          {a.status === 'signoff_pending' ? ' · MySkills is confirming it.' : ' · confirmed by MySkills.'}
        </p>
      )}
      {error && <p className="mt-2 text-sm text-red-700">{error}</p>}
    </li>
  )
}

function Applicants({ roleId, onChanged }: { roleId: string; onChanged: () => void }) {
  const [rows, setRows] = useState<Applicant[] | null>(null)
  const [error, setError] = useState<string>()

  const load = useCallback(async () => {
    try {
      setRows(await fetchApplicants(roleId))
      setError(undefined)
    } catch (e) {
      setError(errorMessage(e))
    }
  }, [roleId])
  useEffect(() => {
    void load()
  }, [load])

  if (error) return <p className="mt-3 text-sm text-red-700">{error}</p>
  if (rows === null) return <Skeleton className="mt-3 h-24 w-full" />
  if (rows.length === 0) return <p className="mt-3 text-sm text-ink-500">No one has applied yet.</p>
  return (
    <ul className="mt-3 space-y-3">
      {rows.map((a) => (
        <ApplicantRow
          key={a.id}
          a={a}
          onChanged={() => {
            void load()
            onChanged()
          }}
        />
      ))}
    </ul>
  )
}

function RoleCard({ role, onEdit, onChanged }: { role: CompanyRole; onEdit: () => void; onChanged: () => void }) {
  // A role with something to act on opens by itself.
  const [open, setOpen] = useState(role.waiting > 0 || role.interning > 0)
  const [closing, setClosing] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string>()
  const s = ROLE_STATUS[role.status]

  async function close() {
    setBusy(true)
    try {
      await closeRole(role.id)
      onChanged()
    } catch (e) {
      setError(errorMessage(e))
    } finally {
      setBusy(false)
      setClosing(false)
    }
  }

  return (
    <li className="card p-5">
      <div className="flex flex-wrap items-start justify-between gap-x-3 gap-y-1">
        <div className="min-w-0">
          <h3 className="font-display text-lg font-semibold text-ink-900">{role.title}</h3>
          <p className="text-sm text-ink-600">
            {roleFacts(role)} · {role.openings} {role.openings === 1 ? 'opening' : 'openings'}
            {role.apply_by ? ` · apply by ${day(role.apply_by)}` : ''}
          </p>
        </div>
        <Badge tone={s.tone}>{s.label}</Badge>
      </div>

      {role.status === 'pending' && (
        <p className="mt-2 text-sm text-ink-600">The MySkills team is reading it. Students see it once it is approved; you’ll get an email.</p>
      )}
      {role.status === 'rejected' && role.review_note && (
        <div className="mt-3">
          <Alert tone="warning" title="From the MySkills team">
            <p>{role.review_note}</p>
          </Alert>
        </div>
      )}

      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand-700"
        >
          {role.applicants} {role.applicants === 1 ? 'applicant' : 'applicants'}
          {role.waiting > 0 && <span className="rounded-full bg-brand-600 px-1.5 py-0.5 text-[11px] font-semibold text-white">{role.waiting} new</span>}
          <ChevronDown size={15} className={`transition-transform ${open ? 'rotate-180' : ''}`} />
        </button>
        {role.interning > 0 && <span className="text-sm text-ink-600">{role.interning} interning now</span>}
        {role.status !== 'closed' && (
          <span className="ml-auto inline-flex items-center gap-4">
            <button type="button" onClick={onEdit} className="inline-flex items-center gap-1.5 text-sm font-medium text-ink-600 hover:text-ink-900">
              <Pencil size={13} /> Edit
            </button>
            {closing ? (
              <span className="inline-flex items-center gap-2 text-sm text-ink-700">
                Stop taking applications?
                <Button size="sm" variant="secondary" disabled={busy} onClick={() => void close()}>
                  Yes
                </Button>
                <button type="button" className="text-sm font-medium text-ink-500" onClick={() => setClosing(false)}>
                  No
                </button>
              </span>
            ) : (
              <button type="button" onClick={() => setClosing(true)} className="inline-flex items-center gap-1.5 text-sm font-medium text-ink-600 hover:text-ink-900">
                <X size={13} /> Close role
              </button>
            )}
          </span>
        )}
      </div>
      {error && <p className="mt-2 text-sm text-red-700">{error}</p>}
      {open && <Applicants roleId={role.id} onChanged={onChanged} />}
    </li>
  )
}

/**
 * A company's internship roles: post one, see where each stands with the team,
 * and work through the students who applied, from shortlist to sign-off. It
 * sits above the "Interning now" list, which fills as offers are accepted.
 */
export function InternshipRoles() {
  const [roles, setRoles] = useState<CompanyRole[] | null>(null)
  const [error, setError] = useState<string>()
  const [editing, setEditing] = useState<RoleDraft | null>(null)
  const [sent, setSent] = useState(false)

  const load = useCallback(async () => {
    try {
      setRoles(await fetchMyRoles())
      setError(undefined)
    } catch (e) {
      setError(errorMessage(e))
      setRoles([])
    }
  }, [])
  useEffect(() => {
    void load()
  }, [load])

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-500">Your roles</h2>
        {!editing && (
          <Button
            size="sm"
            icon={Plus}
            onClick={() => {
              setSent(false)
              setEditing(BLANK)
            }}
          >
            Post a role
          </Button>
        )}
      </div>

      {error && (
        <Alert tone="danger" title="Couldn’t load your roles">
          <p>{error}</p>
        </Alert>
      )}
      {sent && !editing && (
        <Alert tone="success" title="Sent to the MySkills team">
          <p>We’ll email you when it is live for students.</p>
        </Alert>
      )}

      {editing && (
        <RoleForm
          key={editing.id ?? 'new'}
          initial={editing}
          onCancel={() => setEditing(null)}
          onSaved={() => {
            setEditing(null)
            setSent(true)
            void load()
          }}
        />
      )}

      {roles === null ? (
        <Skeleton className="h-28 w-full" />
      ) : roles.length === 0 && !editing && !error ? (
        <EmptyState
          icon={Briefcase}
          title="No roles yet"
          description="Post your first internship role. Students apply with their Global Readiness Score, and you choose who to take."
        />
      ) : (
        <ul className="space-y-3">
          {roles.map((r) => (
            <RoleCard
              key={r.id}
              role={r}
              onChanged={() => void load()}
              onEdit={() => {
                setSent(false)
                setEditing({ ...r })
                window.scrollTo({ top: 0, behavior: 'smooth' })
              }}
            />
          ))}
        </ul>
      )}
    </section>
  )
}
