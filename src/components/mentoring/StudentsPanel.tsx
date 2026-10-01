import { useCallback, useEffect, useState } from 'react'
import { Link } from '@tanstack/react-router'
import { Award, CalendarPlus, Check, FolderPlus, GraduationCap, Mail, UserX, Users, X } from 'lucide-react'
import { errorMessage } from '@/lib/errors'
import {
  decideRequest,
  leaveMatch,
  logSession,
  type MentorSideMatch,
} from '@/lib/mentorMatches'
import { APTITUDES, levelFor as aptitudeLevel } from '@/lib/dmAptitude'
import { SKILLS, levelFor as skillLevel } from '@/lib/careerReadinessAssessment'
import { LIVE_SESSIONS_MAX_POINTS, POINTS_PER_LIVE_SESSION } from '@/lib/readinessScore'
import { awardBadge, fetchMenteeSkills, removeBadge, skillName, type MenteeSkill } from '@/lib/skillBadges'
import { addMenteeProject, fetchMenteeProjects, removeMenteeProject, type MentorProject } from '@/lib/mentorProjects'
import type { MyMentorProfile } from '@/lib/mentorPortal'
import { Alert, Avatar, Badge, Button, EmptyState, Input, Textarea } from '@/components/ui'

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

/**
 * Projects the mentor records for this student — work they saw them do on the
 * programme. They show on the student's profile as verified by this mentor;
 * the student can't add projects themselves.
 */
function ProjectsPanel({ matchId }: { matchId: string }) {
  const [projects, setProjects] = useState<MentorProject[] | null>(null)
  const [form, setForm] = useState({ title: '', year: String(new Date().getFullYear()), link: '', description: '' })
  const [adding, setAdding] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string>()

  const load = useCallback(async () => {
    try {
      setProjects(await fetchMenteeProjects(matchId))
    } catch (e) {
      setError(errorMessage(e))
    }
  }, [matchId])
  useEffect(() => {
    void load()
  }, [load])

  async function run(fn: () => Promise<void>) {
    setBusy(true)
    setError(undefined)
    try {
      await fn()
      await load()
    } catch (e) {
      setError(errorMessage(e))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="mt-4 rounded-xl border border-ink-200 p-4">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-semibold text-ink-900">Projects</p>
        {!adding && (
          <button
            type="button"
            onClick={() => setAdding(true)}
            className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold text-brand-700 hover:bg-brand-50"
          >
            <FolderPlus size={14} /> Add a project
          </button>
        )}
      </div>
      <p className="mt-0.5 text-xs text-ink-500">Work you saw them do. It shows on their profile as verified by you.</p>
      {error && <p className="mt-2 text-sm text-red-700">{error}</p>}

      {adding && (
        <form
          className="mt-3 space-y-3 rounded-xl bg-ink-50 p-3"
          onSubmit={(e) => {
            e.preventDefault()
            void run(async () => {
              await addMenteeProject(matchId, form)
              setForm({ title: '', year: String(new Date().getFullYear()), link: '', description: '' })
              setAdding(false)
            })
          }}
        >
          <Input label="Project title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          <div className="grid gap-3 sm:grid-cols-[120px_1fr]">
            <Input label="Year" value={form.year} onChange={(e) => setForm({ ...form, year: e.target.value })} />
            <Input
              label="Link"
              required={false}
              placeholder="https://"
              value={form.link}
              onChange={(e) => setForm({ ...form, link: e.target.value })}
            />
          </div>
          <Textarea
            label="What did they do?"
            required={false}
            rows={3}
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
          />
          <div className="flex gap-2">
            <Button size="sm" type="submit" disabled={busy || form.title.trim().length < 2}>
              Add to their profile
            </Button>
            <Button size="sm" variant="ghost" type="button" onClick={() => setAdding(false)}>
              Cancel
            </Button>
          </div>
        </form>
      )}

      {!projects ? (
        <p className="mt-3 text-xs text-ink-500">Loading…</p>
      ) : projects.length === 0 ? (
        !adding && <p className="mt-3 text-xs text-ink-400">No projects yet.</p>
      ) : (
        <ul className="mt-3 divide-y divide-ink-100">
          {projects.map((p) => (
            <li key={p.id} className="flex items-start justify-between gap-3 py-2">
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-ink-900">{p.title}</p>
                {p.year && <p className="text-[11px] text-ink-500">{p.year}</p>}
              </div>
              <button
                type="button"
                disabled={busy}
                onClick={() => void run(() => removeMenteeProject(p.id))}
                aria-label={`Remove ${p.title}`}
                className="rounded-full p-1 text-ink-400 hover:bg-ink-100 hover:text-red-600 disabled:opacity-50"
              >
                <X size={13} />
              </button>
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
            <h3 className="truncate font-display text-lg font-semibold text-ink-900">
              <Link to="/community-portal/student/$id" params={{ id: m.student_id }} className="hover:text-brand-700 hover:underline">
                {m.student_name || 'Student'}
              </Link>
            </h3>
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
      <ProjectsPanel matchId={m.id} />

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
/** The students side of the portal: requests waiting on the mentor, and the
 *  students they're working with. */
export function StudentsPanel({
  rows,
  profile,
  onChanged,
  onOpenProfile,
}: {
  rows: MentorSideMatch[]
  profile: MyMentorProfile
  onChanged: () => void
  onOpenProfile: () => void
}) {
  const requests = rows.filter((r) => r.status === 'requested')
  const students = rows.filter((r) => r.status === 'active')

  return (
    <div className="space-y-8">
      {!profile.ready && (
        <button
          type="button"
          onClick={onOpenProfile}
          className="flex w-full items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-left text-sm text-amber-900 hover:bg-amber-100"
        >
          <GraduationCap size={16} className="shrink-0" />
          <span>
            Students can’t find you yet — finish your profile to start receiving requests. <strong>Finish it →</strong>
          </span>
        </button>
      )}
      {profile.ready && !profile.accepting && (
        <button
          type="button"
          onClick={onOpenProfile}
          className="flex w-full items-center gap-2 rounded-xl border border-ink-200 bg-ink-100 px-4 py-3 text-left text-sm text-ink-700 hover:bg-ink-200"
        >
          You’ve paused new requests. <strong>Resume →</strong>
        </button>
      )}
      {rows.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No students yet"
          description="When a student asks you to mentor them, you’ll get an email and they’ll appear here."
        />
      ) : (
        <>
          {requests.length > 0 && (
            <section id="requests" className="scroll-mt-32">
              <h2 className="mb-3 font-display text-lg font-semibold text-ink-900">Requests · {requests.length}</h2>
              <div className="space-y-4">
                {requests.map((m) => (
                  <RequestCard key={m.id} m={m} onDone={onChanged} />
                ))}
              </div>
            </section>
          )}
          {students.length > 0 && (
            <section>
              <h2 className="mb-3 font-display text-lg font-semibold text-ink-900">Your students · {students.length}</h2>
              <div className="grid gap-4 lg:grid-cols-2">
                {students.map((m) => (
                  <StudentCard key={m.id} m={m} onDone={onChanged} />
                ))}
              </div>
            </section>
          )}
        </>
      )}
    </div>
  )
}
