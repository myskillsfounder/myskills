import { useEffect, useMemo, useState } from 'react'
import { Link } from '@tanstack/react-router'
import { AlertCircle, ArrowRight, CalendarCheck, CheckCircle2, Clock, Inbox, Users } from 'lucide-react'
import {
  GRANTED_RESOURCES,
  LOGS_SESSIONS,
  RESOURCE_LABEL,
  fetchCommunityMentorStudents,
  fetchMyCommunityStudents,
  type CommunityAccess,
  type CommunityResource,
  type CommunityStudent,
  type MentorStudent,
} from '@/lib/communityPortal'
import type { MentorSideMatch } from '@/lib/mentorMatches'
import { Skeleton } from '@/components/ui'

const DAY = 24 * 60 * 60 * 1000
const daysSince = (iso: string) => Math.floor((Date.now() - new Date(iso).getTime()) / DAY)
const plural = (n: number, one: string, many = `${one}s`) => `${n} ${n === 1 ? one : many}`

interface ResourceSummary {
  resource: CommunityResource
  to: string
  /** Everyone in the resource (an overview) rather than just this account's students. */
  overview: boolean
  active: number
  finished: number
  sessions: number
  /** Students with a session in the last 30 days. */
  seenRecently: number
  /** Mentor requests waiting for a decision. */
  waiting: number
}

interface Attention {
  key: string
  text: string
  to: string
  params?: Record<string, string>
  tone: 'warn' | 'info'
}

function greeting(): string {
  const h = new Date().getHours()
  return h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening'
}

/**
 * The portal's front page: the numbers that matter across everything this
 * account can see, what needs attention first, and a card per section. Built
 * from the same lists the sections show, so it never disagrees with them.
 */
export function PortalHome({
  name,
  access,
  mentorRows,
  isMentor,
}: {
  name?: string
  access: CommunityAccess[]
  /** This account's own mentor students and requests (a mentor only). */
  mentorRows: MentorSideMatch[]
  isMentor: boolean
}) {
  const [lists, setLists] = useState<Partial<Record<CommunityResource, CommunityStudent[]>>>({})
  const [mentorOverview, setMentorOverview] = useState<MentorStudent[] | null>(null)
  const [loading, setLoading] = useState(true)

  const overviewMentors = access.some((a) => a.resource === 'mentors' && a.sees_all)

  useEffect(() => {
    let active = true
    const wanted = access.map((a) => a.resource).filter((r): r is Exclude<CommunityResource, 'mentors'> =>
      (GRANTED_RESOURCES as string[]).includes(r),
    )
    Promise.allSettled([
      ...wanted.map((r) => fetchMyCommunityStudents(r).then((rows) => [r, rows] as const)),
      overviewMentors ? fetchCommunityMentorStudents() : Promise.resolve(null),
    ]).then((results) => {
      if (!active) return
      const next: Partial<Record<CommunityResource, CommunityStudent[]>> = {}
      for (const r of results.slice(0, wanted.length)) {
        if (r.status === 'fulfilled') {
          const [res, rows] = r.value as readonly [CommunityResource, CommunityStudent[]]
          next[res] = rows
        }
      }
      const last = results[wanted.length]
      setLists(next)
      setMentorOverview(last && last.status === 'fulfilled' ? (last.value as MentorStudent[] | null) : null)
      setLoading(false)
    })
    return () => {
      active = false
    }
  }, [access, overviewMentors])

  const { summaries, attention } = useMemo(() => {
    const summaries: ResourceSummary[] = []
    const attention: Attention[] = []

    // Mentors: this account's own students, or everyone's for the overview.
    if (isMentor || overviewMentors) {
      if (overviewMentors && mentorOverview) {
        const waiting = mentorOverview.filter((r) => r.status === 'requested')
        summaries.push({
          resource: 'mentors',
          to: '/community-portal/mentors',
          overview: true,
          active: mentorOverview.filter((r) => r.status === 'active').length,
          finished: mentorOverview.filter((r) => r.status === 'ended').length,
          sessions: mentorOverview.reduce((n, r) => n + r.sessions, 0),
          seenRecently: mentorOverview.filter((r) => r.last_session && daysSince(r.last_session) <= 30).length,
          waiting: waiting.length,
        })
        const stale = waiting.filter((r) => daysSince(r.started_on) >= 3)
        if (stale.length > 0) {
          attention.push({
            key: 'mentor-stale',
            text: `${plural(stale.length, 'mentor request')} ${stale.length === 1 ? 'has' : 'have'} waited 3 days or more for a mentor to accept`,
            to: '/community-portal/mentors',
            tone: 'warn',
          })
        }
      }
      if (isMentor) {
        const own = mentorRows
        for (const r of own.filter((x) => x.status === 'requested')) {
          const d = daysSince(r.created_at)
          attention.push({
            key: `req-${r.id}`,
            text: `${r.student_name || 'A student'} is waiting for you to accept${d >= 1 ? ` (${plural(d, 'day')})` : ''}`,
            to: '/community-portal/students',
            tone: d >= 3 ? 'warn' : 'info',
          })
        }
        for (const r of own.filter((x) => x.status === 'active' && x.sessions === 0 && daysSince(x.created_at) >= 14)) {
          attention.push({
            key: `nosess-${r.id}`,
            text: `${r.student_name || 'A student'} has no session logged yet`,
            to: '/community-portal/student/$id',
            params: { id: r.student_id },
            tone: 'info',
          })
        }
        if (!overviewMentors) {
          summaries.push({
            resource: 'mentors',
            to: '/community-portal/students',
            overview: false,
            active: own.filter((x) => x.status === 'active').length,
            finished: 0,
            sessions: own.reduce((n, x) => n + x.sessions, 0),
            seenRecently: 0,
            waiting: own.filter((x) => x.status === 'requested').length,
          })
        }
      }
    }

    for (const a of access) {
      if (a.resource === 'mentors') continue
      const rows = lists[a.resource]
      if (!rows) continue
      const overview = a.sees_all === true
      summaries.push({
        resource: a.resource,
        to: `/community-portal/${a.resource}`,
        overview,
        active: rows.filter((r) => r.status === 'active').length,
        finished: rows.filter((r) => r.status !== 'active').length,
        sessions: rows.reduce((n, r) => n + r.sessions, 0),
        seenRecently: rows.filter((r) => r.last_session && daysSince(r.last_session) <= 30).length,
        waiting: 0,
      })
      // Only a person's own students are theirs to chase.
      if (!overview && LOGS_SESSIONS[a.resource as Exclude<CommunityResource, 'mentors'>]) {
        for (const r of rows.filter((x) => x.status === 'active' && x.mine !== false)) {
          const since = r.last_session ?? r.started_on
          const d = daysSince(since)
          if (d >= 21) {
            attention.push({
              key: `quiet-${r.id}`,
              text: r.last_session
                ? `${r.student_name || 'A student'} hasn’t had a session in ${plural(d, 'day')}`
                : `${r.student_name || 'A student'} has no session logged since ${plural(d, 'day')} ago`,
              to: '/community-portal/student/$id',
              params: { id: r.student_id },
              tone: 'info',
            })
          }
        }
      }
    }

    attention.sort((a, b) => (a.tone === b.tone ? 0 : a.tone === 'warn' ? -1 : 1))
    return { summaries, attention }
  }, [access, lists, mentorOverview, mentorRows, isMentor, overviewMentors])

  const totals = summaries.reduce(
    (t, s) => ({
      active: t.active + s.active,
      finished: t.finished + s.finished,
      sessions: t.sessions + s.sessions,
      waiting: t.waiting + s.waiting,
    }),
    { active: 0, finished: 0, sessions: 0, waiting: 0 },
  )
  const first = (name ?? '').split(' ')[0]

  return (
    <div className="space-y-8">
      <header>
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-brand-700">Community portal</p>
        <h1 className="mt-1 font-display text-3xl font-semibold tracking-tight text-ink-900 sm:text-4xl">
          {greeting()}
          {first ? `, ${first}` : ''}
        </h1>
        <p className="mt-1.5 max-w-2xl text-sm text-ink-600">
          {summaries.some((s) => s.overview)
            ? 'Where students are across the Community right now.'
            : 'Where your students are right now.'}
        </p>
      </header>

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-28 w-full rounded-2xl" />
          ))}
        </div>
      ) : (
        <>
          <section aria-label="Totals" className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Stat icon={Users} label="Active students" value={totals.active} tone="text-emerald-700 bg-emerald-50" />
            <Stat
              icon={Inbox}
              label="Requests waiting"
              value={totals.waiting}
              tone="text-amber-700 bg-amber-50"
              hint={totals.waiting > 0 ? 'Waiting for a mentor to accept' : 'Nothing waiting'}
            />
            <Stat icon={CalendarCheck} label="Sessions logged" value={totals.sessions} tone="text-brand-700 bg-brand-50" />
            <Stat icon={CheckCircle2} label="Finished" value={totals.finished} tone="text-ink-700 bg-ink-100" />
          </section>

          <section>
            <h2 className="text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-500">Needs your attention</h2>
            {attention.length === 0 ? (
              <div className="card mt-3 flex items-center gap-3 p-5 text-sm text-ink-700">
                <CheckCircle2 size={20} className="shrink-0 text-emerald-600" />
                You’re all caught up. Nothing is waiting on you.
              </div>
            ) : (
              <ul className="card mt-3 divide-y divide-ink-900/[0.06]">
                {attention.slice(0, 6).map((a) => (
                  <li key={a.key}>
                    <Link
                      to={a.to}
                      params={a.params as never}
                      className="group flex items-center gap-3 px-4 py-3.5 text-sm transition-colors hover:bg-ink-50"
                    >
                      {a.tone === 'warn' ? (
                        <AlertCircle size={18} className="shrink-0 text-amber-600" />
                      ) : (
                        <Clock size={18} className="shrink-0 text-ink-400" />
                      )}
                      <span className="min-w-0 flex-1 text-ink-800">{a.text}</span>
                      <ArrowRight size={15} className="shrink-0 text-ink-400 transition-transform group-hover:translate-x-0.5" />
                    </Link>
                  </li>
                ))}
              </ul>
            )}
            {attention.length > 6 && (
              <p className="mt-2 text-xs text-ink-500">And {attention.length - 6} more.</p>
            )}
          </section>

          {summaries.length > 0 && (
            <section>
              <h2 className="text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-500">
                {summaries.length > 1 ? 'Your sections' : 'Your section'}
              </h2>
              <div className="mt-3 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {summaries.map((s) => (
                  <Link key={s.resource + s.to} to={s.to} className="card lift group flex flex-col p-5">
                    <div className="flex items-start justify-between gap-2">
                      <p className="font-display text-lg font-semibold text-ink-900">{RESOURCE_LABEL[s.resource]}</p>
                      {s.overview && (
                        <span className="rounded-full bg-ink-100 px-2 py-0.5 text-[11px] font-medium text-ink-600">Overview</span>
                      )}
                    </div>
                    <p className="mt-3 font-display text-3xl font-semibold tabular-nums text-ink-900">
                      {s.active}
                      <span className="ml-1.5 text-sm font-medium text-ink-500">active</span>
                    </p>
                    <p className="mt-1 text-xs text-ink-500">
                      {plural(s.sessions, 'session')} logged
                      {s.waiting > 0 && ` · ${s.waiting} waiting`}
                      {s.finished > 0 && ` · ${s.finished} finished`}
                    </p>
                    <span className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-brand-700">
                      Open
                      <ArrowRight size={14} className="transition-transform group-hover:translate-x-0.5" />
                    </span>
                  </Link>
                ))}
              </div>
            </section>
          )}
        </>
      )}
    </div>
  )
}

function Stat({
  icon: Icon,
  label,
  value,
  tone,
  hint,
}: {
  icon: React.ComponentType<{ size?: number }>
  label: string
  value: number
  tone: string
  hint?: string
}) {
  return (
    <div className="card p-5">
      <span className={`flex h-9 w-9 items-center justify-center rounded-xl ${tone}`}>
        <Icon size={18} />
      </span>
      <p className="mt-3 font-display text-3xl font-semibold tabular-nums text-ink-900">{value}</p>
      <p className="mt-0.5 text-sm font-medium text-ink-700">{label}</p>
      {hint && <p className="mt-0.5 text-xs text-ink-500">{hint}</p>}
    </div>
  )
}
