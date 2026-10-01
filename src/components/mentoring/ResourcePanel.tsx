import { useCallback, useEffect, useState } from 'react'
import { CalendarCheck, CheckCircle2, Mail, UserPlus, Users } from 'lucide-react'
import { errorMessage } from '@/lib/errors'
import {
  LOGS_SESSIONS,
  RESOURCE_LABEL,
  addCommunityStudent,
  endCommunityEngagement,
  fetchMyCommunityStudents,
  logCommunitySession,
  type CommunityStudent,
  type GrantedResource,
} from '@/lib/communityPortal'
import { Alert, Button, EmptyState, Input, Skeleton } from '@/components/ui'

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
      'The students interning with you right now. Add a student by the email they use on MySkills, and mark them finished when the internship ends.',
    empty: 'Add your first intern by their MySkills email.',
    active: 'Interning now',
  },
  institutions: {
    intro:
      'The students enrolled with you right now. Add a student by the email they use on MySkills, and mark them finished when they complete or leave.',
    empty: 'Add your first student by their MySkills email.',
    active: 'Enrolled now',
  },
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
          <p className="font-display text-lg font-semibold text-ink-900">{s.student_name || 'A MySkills student'}</p>
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

      {active && (
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
export function ResourcePanel({ resource, organisation }: { resource: GrantedResource; organisation: string | null }) {
  const [students, setStudents] = useState<CommunityStudent[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string>()
  const [email, setEmail] = useState('')
  const [adding, setAdding] = useState(false)
  const [addError, setAddError] = useState<string>()
  const logs = LOGS_SESSIONS[resource]
  const copy = COPY[resource]

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
    try {
      await addCommunityStudent(resource, email)
      setEmail('')
      await load()
    } catch (e) {
      setAddError(errorMessage(e))
    } finally {
      setAdding(false)
    }
  }

  const active = students.filter((s) => s.status === 'active')
  const finished = students.filter((s) => s.status !== 'active')

  return (
    <div className="space-y-5">
      <p className="max-w-2xl text-sm leading-relaxed text-ink-600">
        {organisation && <span className="font-semibold text-ink-900">{organisation}. </span>}
        {copy.intro}
      </p>

      {/* Organisations add their own students; people are assigned theirs by the team. */}
      {!logs && (
        <div className="card p-4 sm:p-5">
          <p className="text-sm font-semibold text-ink-900">Add a student</p>
          <div className="mt-2 flex flex-wrap items-end gap-2">
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
              {adding ? 'Adding…' : 'Add'}
            </Button>
          </div>
          {addError && <p className="mt-2 text-sm text-red-700">{addError}</p>}
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
        <EmptyState icon={Users} title="No students yet" description={copy.empty} />
      ) : (
        <>
          {active.length > 0 && (
            <section>
              <h2 className="text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-500">
                {copy.active} · {active.length}
              </h2>
              <ul className="mt-2 space-y-3">
                {active.map((s) => (
                  <StudentRow key={s.id} s={s} logs={logs} activeLabel={copy.active} onChanged={() => void load()} />
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
                  <StudentRow key={s.id} s={s} logs={logs} activeLabel={copy.active} onChanged={() => void load()} />
                ))}
              </ul>
            </section>
          )}
        </>
      )}
    </div>
  )
}
