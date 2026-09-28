import { useCallback, useEffect, useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { Award, CalendarPlus, Check, Mail, UserX, Users, X } from 'lucide-react'
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
import { awardBadge, fetchMenteeSkills, removeBadge, skillName, type MenteeSkill } from '@/lib/skillBadges'
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

/**
 * The programme's skills for one student: which they've earned in practice,
 * and a button to award the badge for each earned one. A badge can only be
 * awarded once the work is done — the server checks that too.
 */
function SkillBadgesPanel({ matchId }: { matchId: string }) {
  const [skills, setSkills] = useState<MenteeSkill[] | null>(null)
  const [busy, setBusy] = useState<string>()
  const [error, setError] = useState<string>()

  const load = useCallback(async () => {
    try {
      setSkills(await fetchMenteeSkills(matchId))
    } catch (e) {
      setError(errorMessage(e))
    }
  }, [matchId])
  useEffect(() => {
    void load()
  }, [load])

  async function run(key: string, fn: () => Promise<void>) {
    setBusy(key)
    setError(undefined)
    try {
      await fn()
      await load()
    } catch (e) {
      setError(errorMessage(e))
    } finally {
      setBusy(undefined)
    }
  }

  return (
    <div className="mt-4 rounded-xl border border-ink-200 p-4">
      <p className="text-sm font-semibold text-ink-900">Skill badges</p>
      <p className="mt-0.5 text-xs text-ink-500">Award a badge for a skill they’ve earned in practice. It shows on their profile.</p>
      {error && <p className="mt-2 text-sm text-red-700">{error}</p>}
      {!skills ? (
        <p className="mt-3 text-xs text-ink-500">Loading…</p>
      ) : (
        <ul className="mt-3 divide-y divide-ink-100">
          {skills.map((sk) => (
            <li key={sk.skill} className="flex items-center justify-between gap-3 py-2">
              <div className="min-w-0">
                <p className={`truncate text-sm font-medium ${sk.earned ? 'text-ink-900' : 'text-ink-400'}`}>
                  {skillName(sk.skill)}
                </p>
                <p className="text-[11px] text-ink-500">{sk.result}</p>
              </div>
              {sk.awarded ? (
                <span className="inline-flex shrink-0 items-center gap-1.5">
                  <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-semibold text-amber-800">
                    <Award size={12} /> Awarded
                  </span>
                  <button
                    type="button"
                    disabled={busy === sk.skill}
                    onClick={() => sk.badge_id && void run(sk.skill, () => removeBadge(sk.badge_id!))}
                    aria-label={`Remove the ${skillName(sk.skill)} badge`}
                    className="rounded-full p-1 text-ink-400 hover:bg-ink-100 hover:text-red-600 disabled:opacity-50"
                  >
                    <X size={13} />
                  </button>
                </span>
              ) : sk.earned ? (
                <Button
                  size="sm"
                  variant="secondary"
                  icon={Award}
                  disabled={busy === sk.skill}
                  onClick={() => void run(sk.skill, () => awardBadge(matchId, sk.skill))}
                >
                  Award
                </Button>
              ) : (
                <span className="shrink-0 text-[11px] text-ink-400">Not earned yet</span>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
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

      <SkillBadgesPanel matchId={m.id} />

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
