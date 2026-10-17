import { useEffect, useMemo, useState } from 'react'
import { Link } from '@tanstack/react-router'
import {
  AlertCircle,
  ArrowRight,
  Award,
  Briefcase,
  CalendarCheck,
  CheckCircle2,
  Clock,
  GraduationCap,
  Inbox,
  Plus,
  UserPlus,
  Users,
} from 'lucide-react'
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
import {
  day,
  expectedEnd,
  fetchMyPipeline,
  fetchMyRoles,
  type CompanyRole,
  type PipelineApplication,
} from '@/lib/internships'
import { Skeleton } from '@/components/ui'

const DAY = 24 * 60 * 60 * 1000
const daysSince = (iso: string) => Math.floor((Date.now() - new Date(iso).getTime()) / DAY)
const plural = (n: number, one: string, many = `${one}s`) => `${n} ${n === 1 ? one : many}`
const todayIso = () => {
  const d = new Date()
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}
const INTERNSHIPS = '/community-portal/internships'
/** Live and still taking applications (students stop seeing a role after its apply-by date). */
const isOpen = (r: CompanyRole) => r.status === 'live' && !(r.apply_by && r.apply_by < todayIso())

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
  /** The card's second line, when the section isn't counted in sessions. */
  line?: string
}

/** A company's own internships: its roles and everyone who applied to them. */
interface CompanyData {
  roles: CompanyRole[]
  /** Null before docs/supabase-internships-portal.sql: the role counts stand in. */
  pipeline: PipelineApplication[] | null
}

interface StatItem {
  key: string
  icon: React.ComponentType<{ size?: number }>
  label: string
  value: number
  tone: string
  hint?: string
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
  const [company, setCompany] = useState<CompanyData | null>(null)
  const [loading, setLoading] = useState(true)

  const overviewMentors = access.some((a) => a.resource === 'mentors' && a.sees_all)
  // A company posting its own roles (not the team's overview of everyone's).
  const isCompany = access.some((a) => a.resource === 'internships' && !a.sees_all)

  useEffect(() => {
    let active = true
    const wanted = access.map((a) => a.resource).filter((r): r is Exclude<CommunityResource, 'mentors'> =>
      (GRANTED_RESOURCES as string[]).includes(r),
    )
    Promise.allSettled([
      ...wanted.map((r) => fetchMyCommunityStudents(r).then((rows) => [r, rows] as const)),
      overviewMentors ? fetchCommunityMentorStudents() : Promise.resolve(null),
      isCompany
        ? Promise.all([fetchMyRoles(), fetchMyPipeline()]).then(([roles, pipeline]) => ({ roles, pipeline }))
        : Promise.resolve(null),
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
      const own = results[wanted.length + 1]
      setLists(next)
      setMentorOverview(last && last.status === 'fulfilled' ? (last.value as MentorStudent[] | null) : null)
      setCompany(own && own.status === 'fulfilled' ? (own.value as CompanyData | null) : null)
      setLoading(false)
    })
    return () => {
      active = false
    }
  }, [access, overviewMentors, isCompany])

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
      // A company's own internships are summed up from its roles, below.
      if (a.resource === 'internships' && !a.sees_all) continue
      const rows = lists[a.resource]
      if (!rows) continue
      const overview = a.sees_all === true
      summaries.push({
        resource: a.resource,
        to: `/community-portal/${a.resource}`,
        overview,
        active: rows.filter((r) => r.status === 'active').length,
        finished: rows.filter((r) => r.status === 'ended').length,
        sessions: rows.reduce((n, r) => n + r.sessions, 0),
        seenRecently: rows.filter((r) => r.last_session && daysSince(r.last_session) <= 30).length,
        waiting: 0,
      })
      // Only a person's own students are theirs to chase.
      if (!overview && LOGS_SESSIONS[a.resource as Exclude<CommunityResource, 'mentors'>]) {
        for (const r of rows) {
          if (r.status !== 'active' || r.mine === false || !r.student_id) continue
          const since = r.last_session ?? r.started_on
          const d = daysSince(since)
          if (d >= 21) {
            attention.push({
              key: `quiet-${r.id}`,
              text: r.last_session
                ? `${r.student_name || 'A student'} hasn’t had a session in ${plural(d, 'day')}`
                : `${r.student_name || 'A student'} has no session logged in ${plural(d, 'day')}`,
              to: '/community-portal/student/$id',
              params: { id: r.student_id },
              tone: 'info',
            })
          }
        }
      }
    }

    if (company) {
      const { roles, pipeline } = company
      const live = roles.filter(isOpen).length
      const newApplicants = pipeline
        ? pipeline.filter((a) => a.status === 'applied').length
        : roles.reduce((n, r) => n + r.waiting, 0)
      const interns = pipeline
        ? pipeline.filter((a) => a.status === 'accepted' || a.status === 'signoff_pending').length
        : roles.reduce((n, r) => n + r.interning, 0)
      summaries.push({
        resource: 'internships',
        to: INTERNSHIPS,
        overview: false,
        active: interns,
        finished: pipeline ? pipeline.filter((a) => a.status === 'completed').length : 0,
        sessions: 0,
        seenRecently: 0,
        waiting: 0,
        line: [
          plural(live, 'live role'),
          newApplicants > 0 ? `${newApplicants} new ${newApplicants === 1 ? 'applicant' : 'applicants'}` : null,
        ]
          .filter(Boolean)
          .join(' · '),
      })

      for (const r of roles.filter((x) => x.status === 'rejected')) {
        attention.push({
          key: `role-${r.id}`,
          text: `“${r.title}” needs a change before students can see it`,
          to: INTERNSHIPS,
          tone: 'warn',
        })
      }
      if (pipeline) {
        // New applicants, a line per role, flagged once the first has waited 3 days.
        const byRole = new Map<string, PipelineApplication[]>()
        for (const a of pipeline.filter((x) => x.status === 'applied')) {
          byRole.set(a.role_id, [...(byRole.get(a.role_id) ?? []), a])
        }
        for (const [roleId, list] of byRole) {
          const oldest = Math.max(...list.map((a) => daysSince(a.applied_on)))
          attention.push({
            key: `apps-${roleId}`,
            text: `${plural(list.length, 'new applicant')} for “${list[0].role_title}”${
              oldest >= 3 ? `, the first ${plural(oldest, 'day')} ago` : ''
            }`,
            to: INTERNSHIPS,
            tone: oldest >= 3 ? 'warn' : 'info',
          })
        }
        const today = todayIso()
        for (const a of pipeline) {
          const who = a.student_name || 'A student'
          if (a.status === 'accepted' && a.signoff_note) {
            attention.push({
              key: `note-${a.id}`,
              text: `MySkills sent back ${who}’s sign-off with a note`,
              to: INTERNSHIPS,
              tone: 'warn',
            })
            continue
          }
          const due = a.status === 'accepted' ? expectedEnd(a.started_on, a.duration_weeks) : null
          if (due && due <= today) {
            attention.push({
              key: `due-${a.id}`,
              text: `${who}’s internship was due to end on ${day(due)}. Mark it complete so it counts for them`,
              to: INTERNSHIPS,
              tone: 'warn',
            })
          }
          const waited = daysSince(a.updated_at)
          if (a.status === 'offered' && waited >= 7) {
            attention.push({
              key: `offer-${a.id}`,
              text: `${who} hasn’t answered your offer for “${a.role_title}” in ${plural(waited, 'day')}`,
              to: INTERNSHIPS,
              tone: 'info',
            })
          }
        }
      } else {
        for (const r of roles.filter((x) => x.waiting > 0)) {
          attention.push({
            key: `apps-${r.id}`,
            text: `${plural(r.waiting, 'new applicant')} for “${r.title}”`,
            to: INTERNSHIPS,
            tone: 'info',
          })
        }
      }
      if (roles.length === 0) {
        attention.push({
          key: 'first-role',
          text: 'Post your first internship role. Students apply with their Global Readiness Score',
          to: INTERNSHIPS,
          tone: 'info',
        })
      }
    }

    attention.sort((a, b) => (a.tone === b.tone ? 0 : a.tone === 'warn' ? -1 : 1))
    return { summaries, attention }
  }, [access, lists, mentorOverview, mentorRows, isMentor, overviewMentors, company])

  // The numbers across the top: only the ones this account's work has.
  // Sessions for the people who log them, requests for mentors, and a
  // company's roles, applicants and interns.
  const stats = useMemo(() => {
    const out: StatItem[] = []
    const people = summaries.filter((s) => s.resource !== 'internships' || s.overview)
    if (people.length > 0) {
      const t = people.reduce(
        (acc, s) => ({
          active: acc.active + s.active,
          finished: acc.finished + s.finished,
          sessions: acc.sessions + s.sessions,
          waiting: acc.waiting + s.waiting,
        }),
        { active: 0, finished: 0, sessions: 0, waiting: 0 },
      )
      const logs = people.some(
        (s) => s.resource === 'mentors' || LOGS_SESSIONS[s.resource as Exclude<CommunityResource, 'mentors'>],
      )
      out.push({ key: 'active', icon: Users, label: 'Active students', value: t.active, tone: 'text-emerald-700 bg-emerald-50' })
      if (isMentor || overviewMentors) {
        out.push({
          key: 'waiting',
          icon: Inbox,
          label: 'Requests waiting',
          value: t.waiting,
          tone: 'text-amber-700 bg-amber-50',
          hint: t.waiting > 0 ? 'Waiting for a mentor to accept' : 'Nothing waiting',
        })
      }
      if (logs) {
        out.push({ key: 'sessions', icon: CalendarCheck, label: 'Sessions logged', value: t.sessions, tone: 'text-brand-700 bg-brand-50' })
      }
      out.push({ key: 'finished', icon: CheckCircle2, label: 'Finished', value: t.finished, tone: 'text-ink-700 bg-ink-100' })
    }
    if (company) {
      const { roles, pipeline } = company
      const pending = roles.filter((r) => r.status === 'pending').length
      const toChange = roles.filter((r) => r.status === 'rejected').length
      const live = roles.filter(isOpen).length
      const fresh = pipeline
        ? pipeline.filter((a) => a.status === 'applied').length
        : roles.reduce((n, r) => n + r.waiting, 0)
      const inPlay = pipeline ? pipeline.filter((a) => a.status === 'shortlisted' || a.status === 'offered').length : 0
      const interns = pipeline
        ? pipeline.filter((a) => a.status === 'accepted' || a.status === 'signoff_pending').length
        : roles.reduce((n, r) => n + r.interning, 0)
      const confirming = pipeline ? pipeline.filter((a) => a.status === 'signoff_pending').length : 0
      const done = pipeline ? pipeline.filter((a) => a.status === 'completed').length : 0
      out.push(
        {
          key: 'roles',
          icon: Briefcase,
          label: 'Live roles',
          value: live,
          tone: 'text-brand-700 bg-brand-50',
          hint:
            toChange > 0
              ? `${toChange} ${toChange === 1 ? 'needs' : 'need'} a change`
              : pending > 0
                ? `${pending} waiting for MySkills`
                : roles.length === 0
                  ? 'Post your first role'
                  : undefined,
        },
        {
          key: 'applicants',
          icon: UserPlus,
          label: 'New applicants',
          value: fresh,
          tone: 'text-amber-700 bg-amber-50',
          hint: fresh > 0 ? 'Waiting for you to look' : inPlay > 0 ? `${inPlay} shortlisted or offered` : 'Nothing waiting',
        },
        {
          key: 'interns',
          icon: GraduationCap,
          label: 'Interns now',
          value: interns,
          tone: 'text-emerald-700 bg-emerald-50',
          hint: confirming > 0 ? `${confirming} being confirmed by MySkills` : undefined,
        },
        {
          key: 'completed',
          icon: Award,
          label: 'Completed',
          value: done,
          tone: 'text-ink-700 bg-ink-100',
          hint: done > 0 ? 'Confirmed by MySkills' : undefined,
        },
      )
    }
    return out
  }, [summaries, company, isMentor, overviewMentors])

  const first = (name ?? '').split(' ')[0]

  return (
    <div className="space-y-8">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-brand-700">Community portal</p>
          <h1 className="mt-1 font-display text-3xl font-semibold tracking-tight text-ink-900 sm:text-4xl">
            {greeting()}
            {first ? `, ${first}` : ''}
          </h1>
          <p className="mt-1.5 max-w-2xl text-sm text-ink-600">
            {summaries.some((s) => s.overview)
              ? 'Where students are across the Community right now.'
              : isCompany && summaries.length === 1
                ? 'Your roles, applicants and interns, and what needs you next.'
                : 'Where your students are right now.'}
          </p>
        </div>
        {isCompany && (
          <Link
            to="/community-portal/$resource"
            params={{ resource: 'internships' }}
            hash="post"
            className="press inline-flex h-10 items-center gap-1.5 rounded-full bg-brand-600 px-4 text-sm font-semibold text-white shadow-e1 hover:bg-brand-700"
          >
            <Plus size={16} /> Post a role
          </Link>
        )}
      </header>

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-28 w-full rounded-2xl" />
          ))}
        </div>
      ) : (
        <>
          {stats.length > 0 && (
            <section
              aria-label="Totals"
              className={`grid grid-cols-2 gap-3 sm:gap-4 ${stats.length === 3 ? 'lg:grid-cols-3' : 'lg:grid-cols-4'}`}
            >
              {stats.map(({ key, ...st }) => (
                <Stat key={key} {...st} />
              ))}
            </section>
          )}

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

          {summaries.length > 0 && !(isCompany && summaries.length === 1) && (
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
                      <span className="ml-1.5 text-sm font-medium text-ink-500">
                        {s.resource === 'internships' && !s.overview ? (s.active === 1 ? 'intern now' : 'interns now') : 'active'}
                      </span>
                    </p>
                    <p className="mt-1 text-xs text-ink-500">
                      {s.line ?? `${plural(s.sessions, 'session')} logged`}
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
          {isCompany && summaries.length === 1 && (
            <Link
              to="/community-portal/$resource"
              params={{ resource: 'internships' }}
              className="group inline-flex items-center gap-1.5 text-sm font-semibold text-brand-700"
            >
              Open your interns and roles
              <ArrowRight size={14} className="transition-transform group-hover:translate-x-0.5" />
            </Link>
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
    <div className="card p-4 sm:p-5">
      <span className={`flex h-9 w-9 items-center justify-center rounded-xl ${tone}`}>
        <Icon size={18} />
      </span>
      <p className="mt-3 font-display text-3xl font-semibold tabular-nums text-ink-900">{value}</p>
      <p className="mt-0.5 text-sm font-medium text-ink-700">{label}</p>
      {hint && <p className="mt-0.5 text-xs text-ink-500">{hint}</p>}
    </div>
  )
}
