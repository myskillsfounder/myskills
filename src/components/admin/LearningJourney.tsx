import { useEffect, useMemo, useState, type ReactNode } from 'react'
import {
  Award,
  Briefcase,
  CalendarCheck,
  ChevronDown,
  ClipboardCheck,
  Dumbbell,
  FileText,
  Flag,
  PenLine,
  Sparkles,
  UserCheck,
} from 'lucide-react'
import { errorMessage } from '@/lib/errors'
import {
  EVENT_KIND,
  fetchLearnerEvents,
  fetchLearnerTopics,
  type LearnerEvent,
  type LearnerEventKind,
  type LearnerTopic,
} from '@/lib/learnerEvents'
import { Alert, Skeleton } from '@/components/ui'

const ICON: Record<LearnerEventKind, typeof Award> = {
  aptitude: Sparkles,
  practice: Dumbbell,
  foundation: ClipboardCheck,
  module_answer: PenLine,
  project: FileText,
  mentor: UserCheck,
  live_session: CalendarCheck,
  internship: Briefcase,
  certificate: Award,
  goal: Flag,
  programme_quiz: Dumbbell,
  programme_final: ClipboardCheck,
}

const label = (slug: unknown) =>
  String(slug ?? '')
    .split('-')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ')
const day = (iso: string) => new Date(iso).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })
const time = (iso: string) => new Date(iso).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })

function Line({ k, children }: { k: string; children: ReactNode }) {
  return (
    <p className="text-xs text-ink-600">
      <span className="font-semibold text-ink-700">{k}:</span> {children}
    </p>
  )
}

/** The detail behind one event: what was missed, written, graded or said. */
function EventDetail({ e }: { e: LearnerEvent }) {
  const d = e.data
  const missed = Array.isArray(d.missed) ? (d.missed as Record<string, string>[]) : []
  switch (e.kind) {
    case 'practice':
    case 'foundation':
    case 'programme_quiz':
    case 'programme_final':
      return (
        <div className="space-y-1">
          <Line k="Result">
            {String(d.correct ?? '?')}/{String(d.total ?? '?')} right · {String(d.percent ?? '?')}%
          </Line>
          {missed.length > 0 ? (
            <Line k="Missed">{missed.map((m) => m.competency ?? m.topic ?? m.category ?? m.question_id).join(', ')}</Line>
          ) : d.answers_kept === false ? (
            <p className="text-xs text-ink-500">Taken before answers were kept, so only the total is known.</p>
          ) : null}
        </div>
      )
    case 'aptitude': {
      const scores = (d.scores ?? {}) as Record<string, unknown>
      return (
        <div className="space-y-1">
          <Line k="Scores">
            {Object.entries(scores)
              .map(([skill, v]) => `${label(skill)} ${typeof v === 'object' && v ? JSON.stringify(v) : String(v)}`)
              .join(' · ')}
          </Line>
          {typeof d.reflection === 'string' && d.reflection && <Line k="Their reflection">{d.reflection}</Line>}
        </div>
      )
    }
    case 'module_answer':
      return d.private ? (
        <p className="text-xs text-ink-500">A personal module: only the fact it was done is kept, not what they wrote.</p>
      ) : (
        <p className="whitespace-pre-line rounded-lg bg-ink-50 p-2.5 text-xs leading-relaxed text-ink-700">{String(d.response ?? '')}</p>
      )
    case 'project':
      return (
        <div className="space-y-1">
          {typeof d.title === 'string' && d.title && <Line k="Project">{d.title}</Line>}
          {d.points != null && <Line k="Grade">{String(d.points)}/20</Line>}
          {typeof d.reviewer_note === 'string' && d.reviewer_note && <Line k="Reviewer’s note">{d.reviewer_note}</Line>}
          {typeof d.student_note === 'string' && d.student_note && <Line k="Their note">{d.student_note}</Line>}
        </div>
      )
    case 'mentor':
      return (
        <div className="space-y-1">
          {typeof d.student_note === 'string' && d.student_note && <Line k="Their request">{d.student_note}</Line>}
          {typeof d.mentor_note === 'string' && d.mentor_note && <Line k="Mentor’s note">{d.mentor_note}</Line>}
        </div>
      )
    case 'goal':
      return Array.isArray(d.previous) ? <Line k="Before">{(d.previous as string[]).join(', ')}</Line> : null
    case 'internship':
      return typeof d.signoff_note === 'string' && d.signoff_note ? <Line k="Sign-off note">{d.signoff_note}</Line> : null
    default:
      return null
  }
}

function hasDetail(e: LearnerEvent): boolean {
  const d = e.data
  return (
    e.kind === 'practice' ||
    e.kind === 'foundation' ||
    e.kind === 'programme_quiz' ||
    e.kind === 'programme_final' ||
    e.kind === 'aptitude' ||
    e.kind === 'module_answer' ||
    (e.kind === 'project' && Boolean(d.title || d.points != null || d.reviewer_note || d.student_note)) ||
    (e.kind === 'mentor' && Boolean(d.student_note || d.mentor_note)) ||
    (e.kind === 'goal' && Array.isArray(d.previous)) ||
    (e.kind === 'internship' && Boolean(d.signoff_note))
  )
}

/** The skills a student keeps getting wrong, most-missed first. */
function TopicsPanel({ topics }: { topics: LearnerTopic[] }) {
  const weak = topics.filter((t) => t.missed > 0).slice(0, 8)
  return (
    <section className="card p-5 sm:p-6 lg:col-span-2">
      <h2 className="font-display text-base font-semibold text-ink-900">Topics to work on</h2>
      <p className="mt-0.5 text-xs text-ink-500">From every practice and Foundation answer kept so far.</p>
      {weak.length === 0 ? (
        <p className="mt-3 text-sm text-ink-500">
          {topics.length === 0
            ? 'Nothing yet: answers are kept from now on, so this fills in as they practise.'
            : 'No topic missed so far.'}
        </p>
      ) : (
        <ul className="mt-3 space-y-2.5">
          {weak.map((t) => {
            const share = t.answered > 0 ? t.missed / t.answered : 0
            return (
              <li key={`${t.source}-${t.track}-${t.topic}`}>
                <div className="flex items-baseline justify-between gap-3 text-sm">
                  <span className="min-w-0 truncate text-ink-800">
                    {t.topic}
                    <span className="text-ink-400"> · {t.source === 'foundation' ? 'Foundation' : label(t.track)}</span>
                  </span>
                  <span className="shrink-0 text-xs font-semibold tabular-nums text-ink-700">
                    missed {t.missed} of {t.answered}
                  </span>
                </div>
                <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-ink-100">
                  <div
                    className={`h-full rounded-full ${share >= 0.5 ? 'bg-red-400' : 'bg-amber-400'}`}
                    style={{ width: `${Math.max(share * 100, 6)}%` }}
                  />
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}

/**
 * A student's learning journey on their admin page: the topics they keep
 * missing, and everything they have done, newest first, each opening to
 * the detail behind it.
 */
export function LearningJourney({ studentId }: { studentId: string }) {
  const [events, setEvents] = useState<LearnerEvent[] | null | undefined>(undefined)
  const [topics, setTopics] = useState<LearnerTopic[] | null>(null)
  const [error, setError] = useState<string>()
  const [kind, setKind] = useState<LearnerEventKind | 'all'>('all')
  const [open, setOpen] = useState<number>()
  const [limit, setLimit] = useState(40)

  useEffect(() => {
    let active = true
    Promise.all([fetchLearnerEvents(studentId), fetchLearnerTopics(studentId)])
      .then(([e, t]) => {
        if (!active) return
        setEvents(e)
        setTopics(t)
      })
      .catch((e) => active && setError(errorMessage(e)))
    return () => {
      active = false
    }
  }, [studentId])

  const counts = useMemo(() => {
    const c = new Map<LearnerEventKind, number>()
    for (const e of events ?? []) c.set(e.kind, (c.get(e.kind) ?? 0) + 1)
    return c
  }, [events])

  if (error) {
    return (
      <div className="lg:col-span-2">
        <Alert tone="danger" title="Couldn’t load the learning journey">
          <p>{error}</p>
        </Alert>
      </div>
    )
  }
  if (events === undefined) return <Skeleton className="h-48 w-full lg:col-span-2" />
  if (events === null) {
    return (
      <div className="lg:col-span-2">
        <Alert tone="info" title="The learning journey isn’t set up yet">
          <p>Run docs/supabase-learner-events.sql in Supabase to see everything this student has done in one place.</p>
        </Alert>
      </div>
    )
  }

  const shown = events.filter((e) => kind === 'all' || e.kind === kind)
  let lastDay = ''

  return (
    <>
      <TopicsPanel topics={topics ?? []} />

      <section className="card p-5 sm:p-6 lg:col-span-2">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="font-display text-base font-semibold text-ink-900">Learning journey</h2>
          <p className="text-xs text-ink-500">{events.length} things done · newest first · never part of the score</p>
        </div>

        {events.length === 0 ? (
          <p className="mt-3 text-sm text-ink-500">Nothing yet.</p>
        ) : (
          <>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {(['all', ...counts.keys()] as (LearnerEventKind | 'all')[]).map((k) => (
                <button
                  key={k}
                  type="button"
                  onClick={() => {
                    setKind(k)
                    setOpen(undefined)
                  }}
                  className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                    kind === k ? 'border-brand-500 bg-brand-50 text-brand-800' : 'border-ink-300 text-ink-600 hover:bg-ink-100'
                  }`}
                >
                  {k === 'all' ? 'All' : EVENT_KIND[k]}{' '}
                  <span className="tabular-nums text-ink-400">{k === 'all' ? events.length : counts.get(k)}</span>
                </button>
              ))}
            </div>

            <ol className="mt-4">
              {shown.slice(0, limit).map((e, i) => {
                const Icon = ICON[e.kind]
                const d = day(e.at)
                const header = d !== lastDay
                lastDay = d
                const detail = hasDetail(e)
                const isOpen = open === i
                return (
                  <li key={`${e.at}-${i}`}>
                    {header && (
                      <p className="mb-1 mt-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-400 first:mt-0">{d}</p>
                    )}
                    <button
                      type="button"
                      disabled={!detail}
                      onClick={() => setOpen(isOpen ? undefined : i)}
                      aria-expanded={detail ? isOpen : undefined}
                      className="flex w-full items-start gap-3 rounded-lg px-2 py-2 text-left transition-colors enabled:hover:bg-ink-50"
                    >
                      <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-700">
                        <Icon size={14} />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block text-sm text-ink-900">{e.summary}</span>
                        <span className="text-xs text-ink-400">{time(e.at)}</span>
                      </span>
                      {detail && (
                        <ChevronDown size={15} className={`mt-1 shrink-0 text-ink-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                      )}
                    </button>
                    {isOpen && (
                      <div className="mb-2 ml-12 mr-2">
                        <EventDetail e={e} />
                      </div>
                    )}
                  </li>
                )
              })}
            </ol>
            {shown.length > limit && (
              <button
                type="button"
                onClick={() => setLimit((n) => n + 60)}
                className="mt-3 text-sm font-semibold text-brand-700 hover:underline"
              >
                Show more ({shown.length - limit} older)
              </button>
            )}
          </>
        )}
      </section>
    </>
  )
}
