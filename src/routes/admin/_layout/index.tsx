import { useEffect, useState, type ReactNode } from 'react'
import { errorMessage } from '@/lib/errors'
import { createFileRoute, Link } from '@tanstack/react-router'
import {
  Activity,
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  Award,
  CalendarCheck,
  CheckCircle2,
  ClipboardCheck,
  Crown,
  Gauge,
  Inbox,
  Lightbulb,
  LogIn,
  Minus,
  ShieldCheck,
  Star,
  UserPlus,
  Users,
} from 'lucide-react'
import { fetchOverviewV2, type AdminOverviewV2 } from '@/lib/adminStudents'
import { INBOX_KINDS, daysWaiting, fetchInbox, waitedLabel, type InboxItem, type InboxKind } from '@/lib/adminInbox'
import { fetchDashboardExtra, sectionLabel, type DashboardExtra } from '@/lib/adminTeam'
import { useStaffAccessContext } from '@/lib/staffAccess'
import { useAuthUser, userDisplayName } from '@/lib/useAuth'
import { Alert, PageHeader, Skeleton } from '@/components/ui'

// Home for everyone on the team. What is waiting comes from the Inbox, which
// the database already limits to each person's sections; the numbers below it
// need the "Dashboard numbers" section (or a full admin).
export const Route = createFileRoute('/admin/_layout/')({
  component: DashboardPage,
})

type IconType = typeof Users

function SectionLabel({ children, action }: { children: ReactNode; action?: ReactNode }) {
  return (
    <div className="mb-3 mt-9 flex items-end justify-between gap-3">
      <h2 className="font-display text-lg font-semibold text-ink-900">{children}</h2>
      {action}
    </div>
  )
}

/** This week against last week: up, down or level, in words a glance can read. */
function Delta({ now, before }: { now: number; before: number | undefined }) {
  if (before === undefined) return null
  const diff = now - before
  const Icon = diff > 0 ? ArrowUpRight : diff < 0 ? ArrowDownRight : Minus
  const tone = diff > 0 ? 'text-emerald-700' : diff < 0 ? 'text-red-600' : 'text-ink-500'
  return (
    <span className={`inline-flex items-center gap-0.5 text-xs font-semibold ${tone}`}>
      <Icon size={13} />
      {diff === 0 ? 'same as last week' : `${Math.abs(diff)} ${diff > 0 ? 'more' : 'fewer'} than last week`}
    </span>
  )
}

function Kpi({ label, value, icon: Icon, children }: { label: string; value: string | number; icon: IconType; children?: ReactNode }) {
  return (
    <div className="card p-5">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-medium text-ink-600">{label}</p>
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-50 text-brand-700">
          <Icon size={15} />
        </span>
      </div>
      <p className="mt-2 font-display text-3xl font-semibold leading-none tabular-nums text-ink-900">{value}</p>
      <div className="mt-2 min-h-[1rem]">{children}</div>
    </div>
  )
}

function StatCard({ label, value, icon: Icon }: { label: string; value: string | number; icon: IconType }) {
  return (
    <div className="rounded-2xl border border-ink-200 bg-white p-4">
      <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-ink-100 text-ink-600">
        <Icon size={16} />
      </span>
      <p className="mt-3 font-display text-2xl font-semibold leading-none text-ink-900">{value}</p>
      <p className="mt-1 text-sm text-ink-600">{label}</p>
    </div>
  )
}

/* ------------------------------------------------------------ needs you */

/** Amber after three days, red after a week: how long someone has been left waiting. */
function ageTone(days: number): string {
  if (days >= 7) return 'bg-red-50 text-red-700'
  if (days >= 3) return 'bg-amber-50 text-amber-800'
  return 'bg-ink-100 text-ink-600'
}

function NeedsYou({ items }: { items: InboxItem[] }) {
  if (items.length === 0) {
    return (
      <div className="card flex items-center gap-4 p-5">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
          <CheckCircle2 size={22} />
        </span>
        <div>
          <p className="font-display text-lg font-semibold text-ink-900">Nothing is waiting on you</p>
          <p className="text-sm text-ink-600">Every request in your sections has been dealt with.</p>
        </div>
      </div>
    )
  }

  const counts = new Map<InboxKind, number>()
  for (const i of items) counts.set(i.kind, (counts.get(i.kind) ?? 0) + 1)
  const kinds = [...counts.entries()].sort((a, b) => b[1] - a[1])
  const overdue = items.filter((i) => daysWaiting(i.created_at) >= 7).length

  return (
    <div className="card overflow-hidden">
      <div className="grid gap-px bg-ink-900/[0.06] lg:grid-cols-[18rem_minmax(0,1fr)]">
        <div className="bg-white p-5">
          <p className="font-display text-5xl font-semibold leading-none tabular-nums text-ink-900">{items.length}</p>
          <p className="mt-1.5 text-sm text-ink-600">{items.length === 1 ? 'thing is' : 'things are'} waiting on the team</p>
          {overdue > 0 && (
            <p className="mt-3 inline-flex rounded-full bg-red-50 px-2.5 py-1 text-xs font-semibold text-red-700">
              {overdue} waiting a week or more
            </p>
          )}
          <ul className="mt-4 space-y-1.5">
            {kinds.map(([kind, n]) => (
              <li key={kind}>
                <Link to={INBOX_KINDS[kind].to} className="flex items-center justify-between gap-3 rounded-lg px-2 py-1 text-sm hover:bg-ink-50">
                  <span className="truncate text-ink-700">{n === 1 ? INBOX_KINDS[kind].label : INBOX_KINDS[kind].plural}</span>
                  <span className="font-semibold tabular-nums text-ink-900">{n}</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div className="bg-white p-5">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-500">Waiting longest</p>
          <ul className="mt-2 divide-y divide-ink-100">
            {items.slice(0, 5).map((i) => {
              const days = daysWaiting(i.created_at)
              return (
                <li key={`${i.kind}-${i.ref}`}>
                  <Link to={INBOX_KINDS[i.kind].to} className="group flex items-center gap-3 py-2.5">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-ink-900 group-hover:text-brand-700">{i.title}</p>
                      <p className="truncate text-xs text-ink-500">
                        {INBOX_KINDS[i.kind].label}
                        {i.detail ? ` · ${i.detail}` : ''}
                      </p>
                    </div>
                    <span className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold ${ageTone(days)}`}>
                      {waitedLabel(i.created_at)}
                    </span>
                  </Link>
                </li>
              )
            })}
          </ul>
        </div>
      </div>
    </div>
  )
}

/* -------------------------------------------------------------- trends */

/** Thirty days as bars: tall enough to compare, each bar titled with its day. */
function DayBars({ title, total, days, pick, tone }: { title: string; total: string; days: NonNullable<DashboardExtra['days']>; pick: 'signups' | 'active'; tone: string }) {
  const top = Math.max(...days.map((d) => d[pick]), 1)
  const fmt = (iso: string) => new Date(iso).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })
  return (
    <div className="card p-5">
      <div className="flex items-baseline justify-between gap-3">
        <h3 className="font-display text-base font-semibold text-ink-900">{title}</h3>
        <p className="text-sm text-ink-600">{total}</p>
      </div>
      <div className="mt-4 flex h-28 items-end gap-[3px]" role="img" aria-label={`${title}, last 30 days. ${total}.`}>
        {days.map((d) => (
          <div
            key={d.day}
            title={`${fmt(d.day)}: ${d[pick]}`}
            className={`min-w-0 flex-1 rounded-t ${d[pick] > 0 ? tone : 'bg-ink-100'}`}
            style={{ height: `${Math.max((d[pick] / top) * 100, 3)}%` }}
          />
        ))}
      </div>
      <div className="mt-1.5 flex justify-between text-[11px] text-ink-400">
        <span>{fmt(days[0].day)}</span>
        <span>Today</span>
      </div>
    </div>
  )
}

/* ------------------------------------------------------------ insights */

type Step = { label: string; count: number }

/** Where a programme loses the most students between two steps. */
function biggestDrop(steps: Step[]): { from: Step; to: Step; lost: number } | null {
  let worst: { from: Step; to: Step; lost: number } | null = null
  for (let i = 0; i < steps.length - 1; i++) {
    const lost = steps[i].count - steps[i + 1].count
    if (lost > 0 && (!worst || lost > worst.lost)) worst = { from: steps[i], to: steps[i + 1], lost }
  }
  return worst
}

/** A handful of sentences worked out from the numbers, so the page says what
 *  they mean instead of leaving it to be read off the charts. */
function insights(stats: AdminOverviewV2, extra: DashboardExtra | null, inbox: InboxItem[] | null, dm: Step[], cr: Step[]) {
  const out: { tone: 'good' | 'watch' | 'info'; text: string; to?: string }[] = []
  const w = extra?.weeks
  if (w) {
    if (w.new_this_week > w.new_last_week) {
      out.push({ tone: 'good', text: `Sign-ups are up: ${w.new_this_week} new students this week against ${w.new_last_week} last week.` })
    } else if (w.new_this_week < w.new_last_week) {
      out.push({ tone: 'watch', text: `Sign-ups are down: ${w.new_this_week} new students this week against ${w.new_last_week} last week.` })
    }
    if (stats.activity.total_users > 0) {
      const share = Math.round((w.active_this_week / stats.activity.total_users) * 100)
      out.push({ tone: share >= 25 ? 'good' : 'watch', text: `${share}% of students signed in this week (${w.active_this_week} of ${stats.activity.total_users}).` })
    }
  }
  const dmDrop = biggestDrop(dm)
  if (dmDrop) {
    out.push({
      tone: 'watch',
      text: `Digital Marketing loses the most students between “${dmDrop.from.label}” and “${dmDrop.to.label}”: ${dmDrop.lost} stop there.`,
      to: '/admin/practice',
    })
  }
  const crDrop = biggestDrop(cr)
  if (crDrop) {
    out.push({
      tone: 'watch',
      text: `Career Readiness loses the most students between “${crDrop.from.label}” and “${crDrop.to.label}”: ${crDrop.lost} stop there.`,
      to: '/admin/modules',
    })
  }
  if (stats.score.students > 0) {
    const early = Math.round((stats.score.getting_started / stats.score.students) * 100)
    out.push({
      tone: early > 60 ? 'watch' : 'info',
      text: `${early}% of students are still in the Getting started band, and ${stats.score.verified_share}% of all points earned are verified.`,
      to: '/admin/users',
    })
  }
  const c = extra?.community
  if (c) {
    if (c.mentor_requests_waiting > 0) {
      out.push({ tone: 'watch', text: `${c.mentor_requests_waiting} ${c.mentor_requests_waiting === 1 ? 'student is' : 'students are'} waiting for a mentor to accept them.`, to: '/admin/users' })
    }
    if (c.mentors_listed > 0 && c.mentors_taking < c.mentors_listed) {
      out.push({
        tone: 'info',
        text: `${c.mentors_taking} of ${c.mentors_listed} mentors can be asked right now. The rest haven’t finished their profile, or are paused.`,
        to: '/admin/mentors',
      })
    }
  }
  const oldest = inbox?.[0]
  if (oldest && daysWaiting(oldest.created_at) >= 7) {
    out.push({ tone: 'watch', text: `The oldest thing in the Inbox has waited ${waitedLabel(oldest.created_at)}: ${oldest.title}.`, to: '/admin/inbox' })
  }
  return out.slice(0, 6)
}

/* ------------------------------------------------- scores and programmes */

/** How the students spread across the score bands. */
function ScoreDistribution({ s }: { s: AdminOverviewV2['score'] }) {
  const bands = [
    { label: 'Standout', count: s.standout, cls: 'bg-emerald-500' },
    { label: 'Strong', count: s.strong, cls: 'bg-brand-600' },
    { label: 'Building', count: s.building, cls: 'bg-brand-300' },
    { label: 'Getting started', count: s.getting_started, cls: 'bg-ink-300' },
  ]
  const total = Math.max(s.students, 1)
  return (
    <div className="card p-5 sm:p-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-brand-700">Career Readiness Score</p>
          <p className="mt-1 font-display text-3xl font-semibold text-ink-900">
            {s.average ?? '—'}
            <span className="text-base font-normal text-ink-500"> average · {s.students} students</span>
          </p>
        </div>
        <p className="text-sm text-ink-600">
          <span className="font-semibold text-emerald-700">{s.verified_share}%</span> of all points earned are verified
        </p>
      </div>
      <div className="mt-5 flex h-3 overflow-hidden rounded-full bg-ink-100">
        {bands.map((b) => (
          <div key={b.label} className={b.cls} style={{ width: `${(b.count / total) * 100}%` }} title={`${b.label}: ${b.count}`} />
        ))}
      </div>
      <ul className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {bands.map((b) => (
          <li key={b.label} className="flex items-start gap-2">
            <span className={`mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full ${b.cls}`} />
            <span>
              <span className="block font-display text-lg font-semibold leading-tight text-ink-900">{b.count}</span>
              <span className="text-xs text-ink-600">{b.label}</span>
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}

/** A programme's steps, each bar relative to the biggest step. */
function Funnel({ title, steps }: { title: string; steps: Step[] }) {
  const top = Math.max(...steps.map((x) => x.count), 1)
  return (
    <div className="card p-5 sm:p-6">
      <h3 className="font-display text-base font-semibold text-ink-900">{title}</h3>
      <ol className="mt-4 space-y-3">
        {steps.map((st) => (
          <li key={st.label}>
            <div className="flex items-baseline justify-between gap-3 text-sm">
              <span className="text-ink-700">{st.label}</span>
              <span className="shrink-0 font-semibold tabular-nums text-ink-900">{st.count}</span>
            </div>
            <div className="mt-1 h-2 overflow-hidden rounded-full bg-ink-100">
              <div className="h-full rounded-full bg-brand-500" style={{ width: `${(st.count / top) * 100}%` }} />
            </div>
          </li>
        ))}
      </ol>
    </div>
  )
}

/* ---------------------------------------------------------------- page */

function greeting() {
  const h = new Date().getHours()
  return h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening'
}

function DashboardPage() {
  const { isAdmin, sections } = useStaffAccessContext()
  const { user } = useAuthUser()
  const canSeeNumbers = isAdmin === true || (sections?.includes('overview') ?? false)

  const [inbox, setInbox] = useState<InboxItem[] | null | undefined>(undefined)
  const [stats, setStats] = useState<AdminOverviewV2 | null>(null)
  const [extra, setExtra] = useState<DashboardExtra | null | undefined>(undefined)
  const [error, setError] = useState<string>()

  useEffect(() => {
    let active = true
    fetchInbox().then(
      (r) => active && setInbox(r),
      () => active && setInbox(null),
    )
    return () => {
      active = false
    }
  }, [])

  useEffect(() => {
    if (!canSeeNumbers) return
    let active = true
    fetchOverviewV2()
      .then((s) => active && setStats(s))
      .catch((e) => active && setError(errorMessage(e)))
    // Trends are an extra: without them the Dashboard still has its numbers.
    fetchDashboardExtra().then(
      (x) => active && setExtra(x),
      () => active && setExtra(null),
    )
    return () => {
      active = false
    }
  }, [canSeeNumbers])

  const first = user ? userDisplayName(user).split(' ')[0] : ''
  const dm: Step[] = stats
    ? [
        { label: 'Took the aptitude assessment', count: stats.digital_marketing.aptitude },
        { label: 'Practising', count: stats.digital_marketing.practising },
        { label: 'All 8 tracks practised', count: stats.digital_marketing.all_tracks },
        { label: 'Foundation assessment done', count: stats.digital_marketing.foundation },
        { label: 'Submitted a project', count: stats.digital_marketing.review_asked },
        { label: 'Project passed', count: stats.digital_marketing.signed_off },
      ]
    : []
  const cr: Step[] = stats
    ? [
        { label: 'Took the personal aptitude assessment', count: stats.career_readiness.aptitude },
        { label: 'Started the modules', count: stats.career_readiness.started },
        { label: 'All 5 modules written', count: stats.career_readiness.all_modules },
        { label: 'Submitted a project', count: stats.career_readiness.review_asked },
        { label: 'Project passed', count: stats.career_readiness.signed_off },
      ]
    : []
  const notes = stats ? insights(stats, extra ?? null, inbox ?? null, dm, cr) : []
  const w = extra?.weeks
  const c = extra?.community

  return (
    <>
      <PageHeader
        eyebrow="MySkills Admin"
        title={`${greeting()}${first ? `, ${first}` : ''}`}
        subtitle="What needs the team today, and how students and both programmes are moving."
      />

      <SectionLabel
        action={
          <Link to="/admin/inbox" className="inline-flex items-center gap-1 text-sm font-semibold text-brand-700 hover:text-brand-800">
            Open the Inbox <ArrowRight size={14} />
          </Link>
        }
      >
        <span className="inline-flex items-center gap-2">
          <Inbox size={18} className="text-ink-500" /> Needs the team
        </span>
      </SectionLabel>
      {inbox === undefined ? <Skeleton className="h-40 w-full" /> : inbox === null ? (
        <Alert tone="warning" title="The Inbox isn’t set up yet">
          <p>
            Run <code>docs/supabase-admin-inbox.sql</code> in Supabase to see what is waiting here.
          </p>
        </Alert>
      ) : (
        <NeedsYou items={inbox} />
      )}

      {!canSeeNumbers ? (
        <div className="card mt-9 flex items-start gap-4 p-5">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-ink-100 text-ink-600">
            <Gauge size={19} />
          </span>
          <div>
            <p className="font-semibold text-ink-900">Numbers and insights aren’t part of your access</p>
            <p className="mt-0.5 text-sm text-ink-600">
              Scores, trends and programme progress need the “Dashboard numbers” section. A full admin can add it under
              Team &amp; access.
            </p>
          </div>
        </div>
      ) : error ? (
        <div className="mt-9">
          <Alert tone="danger" title="Couldn’t load the numbers">
            <p>{error}</p>
            <p className="mt-1 text-xs">
              First run? Apply <code>docs/supabase-admin-v2.sql</code> in Supabase.
            </p>
          </Alert>
        </div>
      ) : !stats ? (
        <div className="mt-9 space-y-4">
          <Skeleton className="h-28 w-full" />
          <Skeleton className="h-48 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      ) : (
        <>
          <SectionLabel>At a glance</SectionLabel>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <Kpi label="Students" value={stats.activity.total_users} icon={Users}>
              <span className="text-xs text-ink-500">{stats.activity.active_today} signed in today</span>
            </Kpi>
            <Kpi label="New this week" value={w?.new_this_week ?? stats.activity.new_this_week} icon={UserPlus}>
              {w && <Delta now={w.new_this_week} before={w.new_last_week} />}
            </Kpi>
            <Kpi label="Signed in this week" value={w?.active_this_week ?? stats.activity.active_this_week} icon={LogIn}>
              {w && <Delta now={w.active_this_week} before={w.active_last_week} />}
            </Kpi>
            <Kpi label="Average score" value={stats.score.average ?? '—'} icon={Gauge}>
              <span className="text-xs text-ink-500">out of 100 · {stats.score.verified_share}% verified</span>
            </Kpi>
          </div>

          {extra?.days && extra.days.length > 0 && (
            <div className="mt-4 grid gap-4 lg:grid-cols-2">
              <DayBars
                title="New students"
                total={`${extra.days.reduce((n, d) => n + d.signups, 0)} in 30 days`}
                days={extra.days}
                pick="signups"
                tone="bg-brand-500"
              />
              <DayBars
                title="Students signing in"
                total={`up to ${Math.max(...extra.days.map((d) => d.active))} in a day`}
                days={extra.days}
                pick="active"
                tone="bg-emerald-500"
              />
            </div>
          )}
          {extra === null && isAdmin && (
            <p className="mt-3 text-xs text-ink-500">
              Trends, week-on-week changes and community numbers appear once <code>docs/supabase-admin-team.sql</code> is
              run in Supabase.
            </p>
          )}

          {notes.length > 0 && (
            <>
              <SectionLabel>
                <span className="inline-flex items-center gap-2">
                  <Lightbulb size={18} className="text-gold-500" /> What the numbers say
                </span>
              </SectionLabel>
              <ul className="grid gap-3 lg:grid-cols-2">
                {notes.map((n) => {
                  const dot = n.tone === 'good' ? 'bg-emerald-500' : n.tone === 'watch' ? 'bg-amber-500' : 'bg-ink-300'
                  const body = (
                    <>
                      <span className={`mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full ${dot}`} />
                      <span className="min-w-0 flex-1 text-sm leading-relaxed text-ink-800">{n.text}</span>
                      {n.to && <ArrowRight size={15} className="mt-1 shrink-0 text-ink-400" />}
                    </>
                  )
                  return (
                    <li key={n.text}>
                      {n.to ? (
                        <Link to={n.to} className="lift flex h-full items-start gap-3 rounded-2xl border border-ink-900/[0.07] bg-white p-4">
                          {body}
                        </Link>
                      ) : (
                        <div className="flex h-full items-start gap-3 rounded-2xl border border-ink-900/[0.07] bg-white p-4">{body}</div>
                      )}
                    </li>
                  )
                })}
              </ul>
            </>
          )}

          <SectionLabel>Scores</SectionLabel>
          <ScoreDistribution s={stats.score} />

          <SectionLabel>Programmes</SectionLabel>
          <div className="grid gap-4 lg:grid-cols-2">
            <Funnel title="Digital Marketing" steps={dm} />
            <Funnel title="Career Readiness" steps={cr} />
          </div>

          {c && (
            <>
              <SectionLabel
                action={
                  <Link to="/admin/community-portal" className="inline-flex items-center gap-1 text-sm font-semibold text-brand-700 hover:text-brand-800">
                    Portal access &amp; usage <ArrowRight size={14} />
                  </Link>
                }
              >
                Community &amp; partners
              </SectionLabel>
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                <StatCard label={`Mentors · ${c.mentors_taking} taking students`} value={c.mentors_listed} icon={Users} />
                <StatCard label="Students working with a mentor" value={c.students_with_mentor} icon={Star} />
                <StatCard label="Institutions listed" value={c.institutions_listed} icon={Award} />
                <StatCard label="Partner accounts in the portal" value={c.partner_accounts} icon={ShieldCheck} />
                <StatCard label="Portal sign-ups to verify" value={c.signups_waiting} icon={UserPlus} />
                <StatCard label="Mentor requests waiting on mentors" value={c.mentor_requests_waiting} icon={Inbox} />
                <StatCard label="Students with a counsellor, guide or company" value={c.students_with_provider} icon={Users} />
                <StatCard label="Partner sessions logged, 30 days" value={c.sessions_30d} icon={CalendarCheck} />
              </div>
            </>
          )}

          <SectionLabel>Activity</SectionLabel>
          <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_20rem]">
            <div className="grid gap-3 sm:grid-cols-2">
              <StatCard label="Signed in today" value={stats.activity.active_today} icon={Activity} />
              <StatCard label="Practice attempts this week" value={stats.activity.practice_this_week} icon={ClipboardCheck} />
              <StatCard label="Live sessions, last 30 days" value={stats.activity.live_sessions_this_month} icon={CalendarCheck} />
              <StatCard label="Certificates issued" value={stats.activity.certificates} icon={Award} />
              <StatCard
                label="Average feedback rating"
                value={stats.activity.avg_rating === null ? '—' : `${stats.activity.avg_rating}/10`}
                icon={Star}
              />
            </div>
            {extra?.recent && extra.recent.length > 0 && (
              <div className="card p-5">
                <div className="flex items-center justify-between gap-3">
                  <h3 className="font-display text-base font-semibold text-ink-900">Newest students</h3>
                  <Link to="/admin/users" className="text-xs font-semibold text-brand-700 hover:underline">
                    All students
                  </Link>
                </div>
                <ul className="mt-3 divide-y divide-ink-100">
                  {extra.recent.map((r) => (
                    <li key={r.id}>
                      <Link to="/admin/users/$id" params={{ id: r.id }} className="flex items-center justify-between gap-3 py-2 text-sm hover:text-brand-700">
                        <span className="truncate font-medium text-ink-900">{r.name?.trim() || 'No name yet'}</span>
                        <span className="shrink-0 text-xs text-ink-500">{waitedLabel(r.created_at) === 'today' ? 'today' : `${waitedLabel(r.created_at)} ago`}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </>
      )}

      {/* Who you are here, because the same person can have several sign-ins. */}
      <SectionLabel>Your access</SectionLabel>
      <div className="card flex flex-wrap items-start gap-4 p-5">
        <span
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
            isAdmin ? 'bg-gold-50 text-gold-700' : 'bg-brand-50 text-brand-700'
          }`}
        >
          {isAdmin ? <Crown size={19} /> : <ShieldCheck size={19} />}
        </span>
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-ink-900">
            {isAdmin ? 'Full admin' : 'Team member'}
            {user?.email ? <span className="font-normal text-ink-600"> · {user.email}</span> : null}
          </p>
          {isAdmin ? (
            <p className="mt-0.5 text-sm text-ink-600">
              You can open everything, and give the rest of the team access under{' '}
              <Link to="/admin/team" className="font-semibold text-brand-700 hover:underline">
                Team &amp; access
              </Link>
              .
            </p>
          ) : (
            <>
              <p className="mt-0.5 text-sm text-ink-600">
                You can open the sections below. A full admin changes this under Team &amp; access.
              </p>
              <ul className="mt-2.5 flex flex-wrap gap-1.5">
                {(sections ?? []).map((s) => (
                  <li key={s} className="rounded-full bg-ink-100 px-2.5 py-1 text-xs font-medium text-ink-700">
                    {sectionLabel(s)}
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
      </div>
    </>
  )
}
