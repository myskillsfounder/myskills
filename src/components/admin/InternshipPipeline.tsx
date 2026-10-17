import { useMemo, useState } from 'react'
import { Link } from '@tanstack/react-router'
import { AlertCircle } from 'lucide-react'
import { ADMIN_STATUS, day, expectedEnd, type AdminApplication } from '@/lib/internships'
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
    return `The company hasn’t moved this on in ${plural(waited, 'day')}`
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
export function ApplicationRow({ a, showStudent = true }: { a: AdminApplication; showStudent?: boolean }) {
  const s = ADMIN_STATUS[a.status]
  const stuck = stuckReason(a)
  return (
    <li className="flex flex-wrap items-start justify-between gap-x-4 gap-y-1.5 px-4 py-3.5">
      <div className="min-w-0">
        {showStudent && (
          <p className="text-sm font-semibold text-ink-900">
            <Link to="/admin/users/$id" params={{ id: a.student_id }} className="hover:text-brand-700 hover:underline">
              {a.student_name?.trim() || a.student_email || 'A student'}
            </Link>
            <span className="font-normal text-ink-500"> · score {a.score ?? '—'}</span>
          </p>
        )}
        <p className={showStudent ? 'text-sm text-ink-600' : 'text-sm font-semibold text-ink-900'}>
          {a.role_title} <span className="font-normal text-ink-500">· {a.organisation}</span>
        </p>
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
      <Badge tone={s.tone}>{s.label}</Badge>
    </li>
  )
}

/**
 * Every application across every company, for the team: the flow between
 * approving a role and confirming a sign-off, which otherwise only the
 * company and the student see. Opens on what needs a nudge, if anything does.
 */
export function InternshipPipeline({ rows }: { rows: AdminApplication[] }) {
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
            <ApplicationRow key={a.id} a={a} />
          ))}
        </ul>
      )}
    </div>
  )
}
