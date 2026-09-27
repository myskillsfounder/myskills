import { useCallback, useEffect, useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { CalendarPlus, Check, Mail, UserX, Users } from 'lucide-react'
import { requireOnboarded } from '@/lib/guards'
import { errorMessage } from '@/lib/errors'
import {
  decideRequest,
  fetchMyMentees,
  leaveMatch,
  logSession,
  type MentorSideMatch,
} from '@/lib/mentorMatches'
import { APTITUDES, levelFor as aptitudeLevel } from '@/lib/dmAptitude'
import { SKILLS, levelFor as skillLevel } from '@/lib/careerReadinessAssessment'
import { LIVE_SESSIONS_MAX_POINTS, POINTS_PER_LIVE_SESSION } from '@/lib/readinessScore'
import { AppShell } from '@/components/app/AppShell'
import { PageHeader } from '@/components/app/PageHeader'
import { Alert, Avatar, Badge, Button, EmptyState, Input, Skeleton, Textarea } from '@/components/ui'

// Behind sign-in; the functions it calls only ever return the signed-in
// mentor's own requests and students.
export const Route = createFileRoute('/mentoring')({
  beforeLoad: requireOnboarded,
  component: MentoringPage,
})

const PROGRAMME: Record<string, string> = {
  'digital-marketing': 'Digital Marketing',
  'career-readiness': 'Career Readiness',
}
const MAX_SESSIONS = LIVE_SESSIONS_MAX_POINTS / POINTS_PER_LIVE_SESSION
const today = () => new Date().toISOString().slice(0, 10)

/** The student's aptitude report — where the mentoring starts. */
function AptitudeReport({ m }: { m: MentorSideMatch }) {
  if (!m.aptitude) return <p className="text-sm text-ink-500">No aptitude report.</p>
  const dims =
    m.programme === 'digital-marketing'
      ? APTITUDES.map((a) => ({ name: a.name, score: m.aptitude!.scores[a.key] ?? 0, level: aptitudeLevel(m.aptitude!.scores[a.key] ?? 0) }))
      : SKILLS.map((s) => ({ name: s.name, score: m.aptitude!.scores[s.key] ?? 0, level: skillLevel(m.aptitude!.scores[s.key] ?? 0) }))
  return (
    <div>
      <ul className="space-y-1 text-sm">
        {dims.map((d) => (
          <li key={d.name} className="flex items-center justify-between gap-3">
            <span className="truncate text-ink-700">{d.name}</span>
            <span className="shrink-0 text-ink-500">
              <span className="font-semibold tabular-nums text-ink-900">{d.score}</span>/16 · {d.level}
            </span>
          </li>
        ))}
      </ul>
      {m.aptitude.reflection && <p className="mt-2 rounded-xl bg-ink-100 p-3 text-sm text-ink-700">“{m.aptitude.reflection}”</p>}
    </div>
  )
}

function RequestCard({ m, onDone }: { m: MentorSideMatch; onDone: () => void }) {
  const [note, setNote] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string>()
  async function decide(accept: boolean) {
    setBusy(true)
    setError(undefined)
    try {
      await decideRequest(m.id, accept, note)
      onDone()
    } catch (e) {
      setError(errorMessage(e))
    } finally {
      setBusy(false)
    }
  }
  return (
    <article className="card p-5 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <Avatar name={m.student_name || m.student_email} size={40} />
          <div className="min-w-0">
            <h3 className="truncate font-display text-lg font-semibold text-ink-900">{m.student_name || 'A student'}</h3>
            <p className="text-xs text-ink-500">{PROGRAMME[m.programme]} · asked {new Date(m.created_at).toLocaleDateString()}</p>
          </div>
        </div>
        <Badge tone="warning">Waiting for you</Badge>
      </div>
      {m.student_note && <p className="mt-3 rounded-xl bg-brand-50 p-3 text-sm text-ink-800">“{m.student_note}”</p>}
      <p className="mt-4 text-[11px] font-semibold uppercase tracking-wide text-ink-500">Aptitude report</p>
      <div className="mt-2">
        <AptitudeReport m={m} />
      </div>
      <div className="mt-4">
        <Textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          rows={2}
          maxLength={1000}
          required={false}
          aria-label="A note to the student"
          placeholder="A note to the student (optional) — e.g. how you’ll get in touch."
        />
      </div>
      {error && (
        <div className="mt-3">
          <Alert tone="danger" title="Couldn’t save that">
            <p>{error}</p>
          </Alert>
        </div>
      )}
      <div className="mt-3 flex flex-wrap gap-2">
        <Button size="sm" icon={Check} disabled={busy} onClick={() => void decide(true)}>
          Accept
        </Button>
        <Button size="sm" variant="secondary" icon={UserX} disabled={busy} onClick={() => void decide(false)}>
          Decline
        </Button>
      </div>
    </article>
  )
}

function StudentCard({ m, onDone }: { m: MentorSideMatch; onDone: () => void }) {
  const [title, setTitle] = useState('')
  const [heldOn, setHeldOn] = useState(today())
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string>()
  const [saved, setSaved] = useState(false)

  async function run(fn: () => Promise<void>) {
    setBusy(true)
    setError(undefined)
    setSaved(false)
    try {
      await fn()
      onDone()
    } catch (e) {
      setError(errorMessage(e))
    } finally {
      setBusy(false)
    }
  }

  return (
    <article className="card p-5 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <Avatar name={m.student_name || m.student_email} size={40} />
          <div className="min-w-0">
            <h3 className="truncate font-display text-lg font-semibold text-ink-900">{m.student_name || 'Student'}</h3>
            <a href={`mailto:${m.student_email}`} className="inline-flex items-center gap-1 text-xs text-ink-500 hover:text-brand-700">
              <Mail size={12} /> {m.student_email}
            </a>
          </div>
        </div>
        <div className="text-right">
          <Badge tone="success">{PROGRAMME[m.programme]}</Badge>
          <p className="mt-1 text-xs text-ink-500">
            {m.sessions} of {MAX_SESSIONS} sessions logged
          </p>
        </div>
      </div>

      <details className="mt-3">
        <summary className="cursor-pointer text-xs font-semibold text-brand-700">Their aptitude report</summary>
        <div className="mt-2">
          <AptitudeReport m={m} />
        </div>
      </details>

      <form
        className="mt-4 rounded-xl border border-ink-200 p-4"
        onSubmit={(e) => {
          e.preventDefault()
          void run(async () => {
            await logSession(m.id, title, heldOn)
            setTitle('')
            setSaved(true)
          })
        }}
      >
        <p className="text-sm font-semibold text-ink-900">Log a session you held</p>
        <div className="mt-3 grid gap-3 sm:grid-cols-[1fr_auto]">
          <Input label="What was it about?" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Planning a first Google Ads campaign" />
          <Input label="Date" type="date" max={today()} value={heldOn} onChange={(e) => setHeldOn(e.target.value)} />
        </div>
        {error && (
          <div className="mt-3">
            <Alert tone="danger" title="Couldn’t log that">
              <p>{error}</p>
            </Alert>
          </div>
        )}
        {saved && <p className="mt-2 text-sm text-emerald-700">Logged — it counts toward their score.</p>}
        <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
          <Button size="sm" type="submit" icon={CalendarPlus} disabled={busy || !title.trim()}>
            Log session
          </Button>
          <button
            type="button"
            disabled={busy}
            onClick={() => void run(() => leaveMatch(m.id))}
            className="text-xs font-semibold text-ink-500 hover:text-ink-800 disabled:opacity-50"
          >
            End mentoring
          </button>
        </div>
      </form>
    </article>
  )
}

/**
 * A mentor's page: students asking to work with them (with the aptitude report
 * they start from) and the students they've agreed to mentor, where each
 * session held is logged.
 */
function MentoringPage() {
  const [rows, setRows] = useState<MentorSideMatch[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string>()

  const load = useCallback(async () => {
    try {
      setRows(await fetchMyMentees())
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

  const requests = rows.filter((r) => r.status === 'requested')
  const students = rows.filter((r) => r.status === 'active')

  return (
    <AppShell wide>
      <PageHeader
        eyebrow="Mentoring"
        title="My students"
        description="Students who asked you to mentor them, and the ones you’re working with. Arrange sessions your own way, then log each one here."
      />
      {error && (
        <div className="mb-5">
          <Alert tone="danger" title="Couldn’t load your students">
            <p>{error}</p>
          </Alert>
        </div>
      )}
      {loading ? (
        <Skeleton className="h-64 w-full" />
      ) : rows.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No students yet"
          description="When a student asks you to mentor them, you’ll get an email and they’ll appear here."
        />
      ) : (
        <div className="space-y-8">
          {requests.length > 0 && (
            <section>
              <h2 className="mb-3 font-display text-lg font-semibold text-ink-900">Requests · {requests.length}</h2>
              <div className="space-y-4">
                {requests.map((m) => (
                  <RequestCard key={m.id} m={m} onDone={() => void load()} />
                ))}
              </div>
            </section>
          )}
          {students.length > 0 && (
            <section>
              <h2 className="mb-3 font-display text-lg font-semibold text-ink-900">Your students · {students.length}</h2>
              <div className="grid gap-4 lg:grid-cols-2">
                {students.map((m) => (
                  <StudentCard key={m.id} m={m} onDone={() => void load()} />
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </AppShell>
  )
}
