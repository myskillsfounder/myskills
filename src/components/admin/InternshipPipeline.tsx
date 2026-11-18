import { useEffect, useMemo, useState } from 'react'
import { Link } from '@tanstack/react-router'
import { AlertCircle, Check, ChevronDown, FileText, Loader2, Phone, X } from 'lucide-react'
import {
  ADMIN_STATUS,
  adminDecideApplication,
  day,
  expectedEnd,
  fetchAdminApplication,
  type AdminApplication,
  type AdminApplicationDetail,
} from '@/lib/internships'
import { cvLink } from '@/lib/internshipInterest'
import { errorMessage } from '@/lib/errors'
import { Badge, Chip } from '@/components/ui'

const DAY = 24 * 60 * 60 * 1000
const daysSince = (iso: string) => Math.floor((Date.now() - new Date(iso).getTime()) / DAY)
const plural = (n: number, one: string, many = `${one}s`) => `${n} ${n === 1 ? one : many}`
const todayIso = () => {
  const d = new Date()
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

/**
 * Why an application needs the team to step in, if it does: a company that
 * hasn't looked at an applicant in a week, a student who hasn't answered an
 * offer in a week, or an internship past its end with no sign-off.
 */
export function stuckReason(a: AdminApplication): string | null {
  const waited = daysSince(a.updated_at)
  if ((a.status === 'applied' || a.status === 'shortlisted') && waited >= 7) {
    return `Waiting ${plural(waited, 'day')} for a decision`
  }
  if (a.status === 'offered' && waited >= 7) return `The student hasn’t answered the offer in ${plural(waited, 'day')}`
  const due = a.status === 'accepted' ? expectedEnd(a.started_on, a.duration_weeks) : null
  if (due && due < todayIso()) return `Was due to end on ${day(due)}; the company hasn’t signed it off`
  return null
}

type Filter = 'stuck' | 'open' | 'interning' | 'all'

const FILTERS: { key: Filter; label: string; test: (a: AdminApplication) => boolean }[] = [
  { key: 'stuck', label: 'Needs a nudge', test: (a) => stuckReason(a) !== null },
  { key: 'open', label: 'In progress', test: (a) => ['applied', 'shortlisted', 'offered'].includes(a.status) },
  { key: 'interning', label: 'Interning', test: (a) => a.status === 'accepted' || a.status === 'signoff_pending' },
  { key: 'all', label: 'All', test: () => true },
]

/** One application: who, for what, where it stands, and since when. */
export function ApplicationRow({
  a,
  showStudent = true,
  showRole = true,
  onChanged,
}: {
  a: AdminApplication
  showStudent?: boolean
  /** Off inside a role, where the role is already the heading. */
  showRole?: boolean
  /** Given where the team handles applications: the row opens to decide on it. */
  onChanged?: () => void
}) {
  const s = ADMIN_STATUS[a.status]
  const stuck = stuckReason(a)
  const [open, setOpen] = useState(false)
  return (
    <li className="px-4 py-3.5">
      <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-1.5">
      <div className="min-w-0">
        {showStudent && (
          <p className="text-sm font-semibold text-ink-900">
            <Link to="/admin/users/$id" params={{ id: a.student_id }} className="hover:text-brand-700 hover:underline">
              {a.student_name?.trim() || a.student_email || 'A student'}
            </Link>
            <span className="font-normal text-ink-500"> · score {a.score ?? '—'}</span>
          </p>
        )}
        {showRole && (
          <p className={showStudent ? 'text-sm text-ink-600' : 'text-sm font-semibold text-ink-900'}>
            {a.role_title} <span className="font-normal text-ink-500">· {a.organisation}</span>
          </p>
        )}
        <p className="mt-0.5 text-xs text-ink-500">
          Applied {day(a.applied_on)}
          {a.started_on && ` · started ${day(a.started_on)}`}
          {a.ended_on && ` · ended ${day(a.ended_on)}`}
          {a.supervisor_name && ` · supervised by ${a.supervisor_name}`}
        </p>
        {stuck && (
          <p className="mt-1 inline-flex items-center gap-1.5 text-xs font-semibold text-amber-700">
            <AlertCircle size={13} /> {stuck}
          </p>
        )}
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <Badge tone={s.tone}>{s.label}</Badge>
        {onChanged && (
          <button
            type="button"
            onClick={() => setOpen((o) => !o)}
            aria-expanded={open}
            className="inline-flex h-8 items-center gap-1 rounded-lg border border-ink-300 bg-white px-2.5 text-xs font-semibold text-ink-800 hover:bg-ink-100"
          >
            {open ? 'Close' : 'Open'}
            <ChevronDown size={14} className={`transition-transform ${open ? 'rotate-180' : ''}`} />
          </button>
        )}
      </div>
      </div>
      {open && onChanged && <HandleApplication a={a} onChanged={onChanged} />}
    </li>
  )
}

const CAN = {
  shortlist: (a: AdminApplication) => a.status === 'applied',
  offer: (a: AdminApplication) => a.status === 'applied' || a.status === 'shortlisted',
  reject: (a: AdminApplication) => ['applied', 'shortlisted', 'offered'].includes(a.status),
}

/**
 * The team handles the application (Paul, 18 Nov 2026: "Internship
 * Applications and Leads will be handled by internal team"): the student's
 * note, phone and CV, then shortlist, send the offer or turn it down
 * (docs/supabase-admin-internship-decide.sql). The student gets the same
 * email as when the company does it.
 */
function HandleApplication({ a, onChanged }: { a: AdminApplication; onChanged: () => void }) {
  const [detail, setDetail] = useState<AdminApplicationDetail | null>(null)
  const [busy, setBusy] = useState<string | null>(null)
  const [error, setError] = useState('')
  useEffect(() => {
    fetchAdminApplication(a.id).then(setDetail, (e) => setError(errorMessage(e)))
  }, [a.id])

  async function decide(action: 'shortlist' | 'offer' | 'reject') {
    if (action === 'reject' && !window.confirm('Turn this application down? The student is emailed.')) return
    setBusy(action)
    setError('')
    try {
      await adminDecideApplication(a.id, action)
      onChanged()
    } catch (e) {
      setError(errorMessage(e))
    } finally {
      setBusy(null)
    }
  }
  async function openCv(path: string) {
    try {
      window.open(await cvLink(path), '_blank', 'noopener,noreferrer')
    } catch (e) {
      setError(errorMessage(e))
    }
  }

  const btn = 'inline-flex h-9 items-center gap-1.5 rounded-lg px-3 text-sm font-semibold transition-colors disabled:opacity-50'
  const anyAction = CAN.shortlist(a) || CAN.offer(a) || CAN.reject(a)
  const cv = detail?.cv_path
  return (
    <div className="mt-3 rounded-xl border border-ink-200 bg-ink-50 p-4">
      {!detail && !error && <p className="text-sm text-ink-500">Loading…</p>}
      {detail && (
        <div className="space-y-2 text-sm text-ink-700">
          <p className="flex flex-wrap items-center gap-x-4 gap-y-1">
            {a.student_email && (
              <a href={`mailto:${a.student_email}`} className="text-brand-700 hover:underline">
                {a.student_email}
              </a>
            )}
            {detail.phone ? (
              <a href={`tel:${detail.phone}`} className="inline-flex items-center gap-1 text-brand-700 hover:underline">
                <Phone size={13} /> {detail.phone}
              </a>
            ) : (
              <span className="text-ink-500">No phone yet</span>
            )}
            {cv ? (
              <button type="button" onClick={() => void openCv(cv)} className="inline-flex items-center gap-1 font-semibold text-brand-700 hover:underline">
                <FileText size={13} /> Open CV
              </button>
            ) : (
              <span className="text-ink-500">No CV uploaded</span>
            )}
          </p>
          {detail.note ? (
            <p className="whitespace-pre-line leading-relaxed">“{detail.note}”</p>
          ) : (
            <p className="text-ink-500">No note with the application.</p>
          )}
        </div>
      )}
      {anyAction ? (
        <>
          <div className="mt-4 flex flex-wrap gap-2">
            {CAN.shortlist(a) && (
              <button type="button" disabled={!!busy} onClick={() => void decide('shortlist')} className={`${btn} border border-ink-300 bg-white text-ink-800 hover:bg-ink-100`}>
                {busy === 'shortlist' ? <Loader2 size={15} className="animate-spin" /> : <Check size={15} />} Shortlist
              </button>
            )}
            {CAN.offer(a) && (
              <button type="button" disabled={!!busy} onClick={() => void decide('offer')} className={`${btn} bg-brand-600 text-white hover:bg-brand-700`}>
                {busy === 'offer' ? <Loader2 size={15} className="animate-spin" /> : <Check size={15} />} Send Offer
              </button>
            )}
            {CAN.reject(a) && (
              <button type="button" disabled={!!busy} onClick={() => void decide('reject')} className={`${btn} border border-ink-300 bg-white text-red-700 hover:bg-red-50`}>
                {busy === 'reject' ? <Loader2 size={15} className="animate-spin" /> : <X size={15} />} Not Selected
              </button>
            )}
          </div>
          <p className="mt-2 text-xs text-ink-500">The student is emailed, and the company sees the new stage.</p>
        </>
      ) : (
        <p className="mt-3 text-xs text-ink-500">Nothing to decide at this stage.</p>
      )}
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
    </div>
  )
}

/**
 * Every application across every company, for the team: the flow between
 * approving a role and confirming a sign-off, which otherwise only the
 * company and the student see. Opens on what needs a nudge, if anything does.
 */
export function InternshipPipeline({ rows, onChanged }: { rows: AdminApplication[]; onChanged?: () => void }) {
  const counts = useMemo(
    () => Object.fromEntries(FILTERS.map((f) => [f.key, rows.filter(f.test).length])) as Record<Filter, number>,
    [rows],
  )
  const [filter, setFilter] = useState<Filter>(counts.stuck > 0 ? 'stuck' : 'open')
  const test = FILTERS.find((f) => f.key === filter)!.test
  const shown = rows.filter(test)

  return (
    <div>
      <div className="flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <Chip key={f.key} active={filter === f.key} onClick={() => setFilter(f.key)}>
            {f.label} · {counts[f.key]}
          </Chip>
        ))}
      </div>
      {shown.length === 0 ? (
        <p className="mt-3 text-sm text-ink-500">
          {filter === 'stuck' ? 'Nothing is stuck. Every application is moving.' : 'None here.'}
        </p>
      ) : (
        <ul className="card mt-3 divide-y divide-ink-900/[0.06]">
          {shown.map((a) => (
            <ApplicationRow key={a.id} a={a} onChanged={onChanged} />
          ))}
        </ul>
      )}
    </div>
  )
}
