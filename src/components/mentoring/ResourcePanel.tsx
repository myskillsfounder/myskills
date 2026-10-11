import { useCallback, useEffect, useState } from 'react'
import { Link } from '@tanstack/react-router'
import { CalendarCheck, CheckCircle2, Clock, Mail, UserPlus, Users } from 'lucide-react'
import { errorMessage } from '@/lib/errors'
import {
  LOGS_SESSIONS,
  RESOURCE_LABEL,
  addCommunityStudent,
  cancelCommunityInvite,
  endCommunityEngagement,
  fetchMyCommunityStudents,
  logCommunitySession,
  type CommunityStudent,
  type GrantedResource,
} from '@/lib/communityPortal'
import { Alert, Button, EmptyState, Input, Skeleton } from '@/components/ui'
import { ProvidersOverview } from '@/components/mentoring/ProvidersOverview'

const today = () => new Date().toISOString().slice(0, 10)
const day = (iso: string) =>
  new Date(`${iso}T00:00:00`).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })

const COPY: Record<GrantedResource, { intro: string; empty: string; active: string }> = {
  wellness: {
    intro:
      'Students the MySkills team has assigned to you. Arrange each conversation your own way, then log the date here. Only the date is recorded — never what was discussed.',
    empty: 'When the team assigns a student’s request to you, they appear here.',
    active: 'Working with you',
  },
  guidance: {
    intro:
      'Students the MySkills team has assigned to you for career guidance. Log the date of each session; nothing about its content is recorded.',
    empty: 'When the team assigns a student’s request to you, they appear here.',
    active: 'Working with you',
  },
  internships: {
    intro:
      'The students interning with you right now. Ask a student by the email they use on MySkills; they join your list once they accept. Mark them finished when the internship ends.',
    empty: 'Ask your first intern by their MySkills email.',
    active: 'Interning now',
  },
  institutions: {
    intro:
      'The students enrolled with you right now. Ask a student by the email they use on MySkills; they join your list once they accept. Mark them finished when they complete or leave.',
    empty: 'Ask your first student by their MySkills email.',
    active: 'Enrolled now',
  },
}

/** What an overview says at the top: the same list, across everyone. */
const OVERVIEW: Record<GrantedResource, string> = {
  wellness:
    'Every student working with a counsellor, and who with. You see dates and session counts only — never what was discussed.',
  guidance: 'Every student working with a career guide, and who with, with the sessions logged so far.',
  internships: 'Every student interning with a partner company right now, and the ones who have finished.',
  institutions: 'Every student enrolled with a partner institution right now, and the ones who have finished.',
}

/**
 * A student who has been asked and hasn't joined the list: the email that was
 * typed, and nothing else. Whether an account even uses it isn't the partner's
 * to know until the student accepts.
 */
function RequestRow({ s, onChanged }: { s: CommunityStudent; onChanged: () => void }) {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string>()
  const declined = s.status === 'declined'

  async function withdraw() {
    setBusy(true)
    setError(undefined)
    try {
      await cancelCommunityInvite(s.id)
      onChanged()
    } catch (e) {
      setError(errorMessage(e))
      setBusy(false)
    }
  }

  return (
    <li className="card flex flex-wrap items-center justify-between gap-x-4 gap-y-2 p-4">
      <div className="min-w-0">
        <p className="inline-flex items-center gap-1.5 text-sm font-semibold text-ink-900">
          <Mail size={13} className="shrink-0 text-ink-400" />
          <span className="truncate">{s.student_email}</span>
        </p>
        <p className="mt-0.5 text-xs text-ink-500">
          {declined
            ? 'Chose not to share their MySkills record with you.'
            : `Asked on ${day(s.started_on)}. They’ll join your list when they accept in MySkills.`}
        </p>
        {error && <p className="mt-1 text-sm text-red-700">{error}</p>}
      </div>
      {declined ? (
        <span className="rounded-full bg-ink-100 px-2.5 py-1 text-xs font-semibold text-ink-600">Declined</span>
      ) : (
        <button
          type="button"
          disabled={busy}
          onClick={() => void withdraw()}
          className="text-sm font-medium text-ink-600 hover:text-ink-900 disabled:opacity-60"
        >
          Withdraw
        </button>
      )}
    </li>
  )
}

/** One student's row: who they are, since when, and the one or two things the provider can do. */
function StudentRow({
  s,
  logs,
  activeLabel,
  onChanged,
}: {
  s: CommunityStudent
  logs: boolean
  activeLabel: string
  onChanged: () => void
}) {
  const [date, setDate] = useState(today())
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string>()
  const [confirming, setConfirming] = useState(false)
  const active = s.status === 'active'
  // A company or institution can open a student's record only while the
  // student is sharing with it; an overview, and the people the team assigns
  // students to, keep the link.
  const canOpen = s.student_id != null && (active || logs || s.mine === false)
  const name = s.student_name || 'A MySkills student'

  async function run(fn: () => Promise<void>) {
    setBusy(true)
    setError(undefined)
    try {
      await fn()
      onChanged()
    } catch (e) {
      setError(errorMessage(e))
    } finally {
      setBusy(false)
      setConfirming(false)
    }
  }

  return (
    <li className="card p-4 sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-display text-lg font-semibold text-ink-900">
            {canOpen && s.student_id ? (
              <Link
                to="/community-portal/student/$id"
                params={{ id: s.student_id }}
                className="hover:text-brand-700 hover:underline"
              >
                {name}
              </Link>
            ) : (
              name
            )}
          </p>
          {s.provider_name && s.mine === false && (
            <p className="text-sm font-medium text-brand-700">With {s.provider_name}</p>
          )}
          <a
            href={`mailto:${s.student_email}`}
            className="mt-0.5 inline-flex items-center gap-1.5 text-sm text-ink-600 hover:text-brand-700"
          >
            <Mail size={13} /> {s.student_email}
          </a>
        </div>
        <span
          className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
            active ? 'bg-emerald-50 text-emerald-700' : 'bg-ink-100 text-ink-600'
          }`}
        >
          {active ? activeLabel : `Finished ${s.ended_on ? day(s.ended_on) : ''}`}
        </span>
      </div>

      <p className="mt-2 text-xs text-ink-500">
        Since {day(s.started_on)}
        {logs && (
          <>
            {' · '}
            {s.sessions} {s.sessions === 1 ? 'session' : 'sessions'}
            {s.last_session && ` · last on ${day(s.last_session)}`}
          </>
        )}
      </p>

      {active && s.mine !== false && (
        <div className="mt-3 flex flex-wrap items-end gap-2 border-t border-ink-900/[0.06] pt-3">
          {logs && (
            <>
              <label className="text-xs font-medium text-ink-600">
                Session date
                <input
                  type="date"
                  value={date}
                  max={today()}
                  onChange={(e) => setDate(e.target.value)}
                  className="field mt-1 block h-10 w-40"
                />
              </label>
              <Button size="sm" icon={CalendarCheck} disabled={busy || !date} onClick={() => run(() => logCommunitySession(s.id, date))}>
                Log session
              </Button>
            </>
          )}
          {confirming ? (
            <span className="ml-auto inline-flex items-center gap-2 text-sm text-ink-700">
              Mark as finished?
              <Button size="sm" variant="secondary" disabled={busy} onClick={() => run(() => endCommunityEngagement(s.id))}>
                Yes
              </Button>
              <button type="button" className="text-sm font-medium text-ink-500 hover:text-ink-800" onClick={() => setConfirming(false)}>
                No
              </button>
            </span>
          ) : (
            <button
              type="button"
              onClick={() => setConfirming(true)}
              className="ml-auto inline-flex h-10 items-center gap-1.5 text-sm font-medium text-ink-600 hover:text-ink-900"
            >
              <CheckCircle2 size={15} /> Mark as finished
            </button>
          )}
        </div>
      )}
      {error && <p className="mt-2 text-sm text-red-700">{error}</p>}
    </li>
  )
}

/**
 * One resource of the Community portal for the four that share a shape:
 * counsellors and career guides see the students assigned to them and log
 * session dates; companies and institutions keep the list of students who are
 * with them now.
 */
export function ResourcePanel({
  resource,
  organisation,
  seesAll = false,
}: {
  resource: GrantedResource
  organisation: string | null
  /** An overview: every student in this resource, whoever they are with. Read-only. */
  seesAll?: boolean
}) {
  const [students, setStudents] = useState<CommunityStudent[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string>()
  const [email, setEmail] = useState('')
  const [adding, setAdding] = useState(false)
  const [addError, setAddError] = useState<string>()
  const [asked, setAsked] = useState<string>()
  const logs = LOGS_SESSIONS[resource]
  const copy = COPY[resource]
  // In an overview the students aren't "with you".
  const activeLabel = seesAll ? 'Active now' : copy.active

  const load = useCallback(async () => {
    try {
      setStudents(await fetchMyCommunityStudents(resource))
      setError(undefined)
    } catch (e) {
      setError(errorMessage(e))
    } finally {
      setLoading(false)
    }
  }, [resource])

  useEffect(() => {
    setLoading(true)
    void load()
  }, [load])

  async function add() {
    setAdding(true)
    setAddError(undefined)
    setAsked(undefined)
    try {
      await addCommunityStudent(resource, email)
      setAsked(email.trim())
      setEmail('')
      await load()
    } catch (e) {
      setAddError(errorMessage(e))
    } finally {
      setAdding(false)
    }
  }

  const active = students.filter((s) => s.status === 'active')
  const finished = students.filter((s) => s.status === 'ended')
  // Asked, and not (or not yet) on the list.
  const requests = students.filter((s) => s.status === 'invited' || s.status === 'declined')

  return (
    <div className="space-y-5">
      <p className="max-w-2xl text-sm leading-relaxed text-ink-600">
        {organisation && <span className="font-semibold text-ink-900">{organisation}. </span>}
        {seesAll ? OVERVIEW[resource] : copy.intro}
      </p>

      {/* An overview starts with who the students are working with. */}
      {seesAll && <ProvidersOverview resource={resource} />}
      {seesAll && (
        <h2 className="-mb-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-500">Students</h2>
      )}

      {/* Organisations add their own students; people are assigned theirs by the team. */}
      {!logs && !seesAll && (
        <div className="card p-4 sm:p-5">
          <p className="text-sm font-semibold text-ink-900">Ask a student to join your list</p>
          <p className="mt-1 max-w-xl text-xs leading-relaxed text-ink-500">
            We ask them in MySkills. You see their name, contact, progress and certificates once they accept, and
            for as long as they keep sharing.
          </p>
          <div className="mt-3 flex flex-wrap items-end gap-2">
            <div className="min-w-0 flex-1 sm:max-w-sm">
              <Input
                label="Their MySkills email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="student@example.com"
              />
            </div>
            <Button size="sm" icon={UserPlus} disabled={adding || !/^\S+@\S+\.\S+$/.test(email.trim())} onClick={() => void add()}>
              {adding ? 'Asking…' : 'Ask'}
            </Button>
          </div>
          {addError && <p className="mt-2 text-sm text-red-700">{addError}</p>}
          {asked && !addError && (
            <p className="mt-2 text-sm text-emerald-700">
              Asked {asked}. If they have a MySkills account, the request is waiting for them there.
            </p>
          )}
        </div>
      )}

      {error && (
        <Alert tone="danger" title={`Couldn’t load ${RESOURCE_LABEL[resource]}`}>
          <p>{error}</p>
        </Alert>
      )}

      {loading ? (
        <Skeleton className="h-32 w-full" />
      ) : students.length === 0 && !error ? (
        <EmptyState
          icon={Users}
          title="No students yet"
          description={seesAll ? 'Students appear here as soon as one is working with someone in this resource.' : copy.empty}
        />
      ) : (
        <>
          {active.length > 0 && (
            <section>
              <h2 className="text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-500">
                {activeLabel} · {active.length}
              </h2>
              <ul className="mt-2 space-y-3">
                {active.map((s) => (
                  <StudentRow key={s.id} s={s} logs={logs} activeLabel={activeLabel} onChanged={() => void load()} />
                ))}
              </ul>
            </section>
          )}
          {requests.length > 0 && (
            <section>
              <h2 className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-500">
                <Clock size={12} /> Asked · {requests.length}
              </h2>
              <ul className="mt-2 space-y-2">
                {requests.map((s) => (
                  <RequestRow key={s.id} s={s} onChanged={() => void load()} />
                ))}
              </ul>
            </section>
          )}
          {finished.length > 0 && (
            <section>
              <h2 className="text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-500">
                Finished · {finished.length}
              </h2>
              <ul className="mt-2 space-y-3">
                {finished.map((s) => (
                  <StudentRow key={s.id} s={s} logs={logs} activeLabel={activeLabel} onChanged={() => void load()} />
                ))}
              </ul>
            </section>
          )}
        </>
      )}
    </div>
  )
}
