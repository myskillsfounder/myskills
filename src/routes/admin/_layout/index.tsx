import { useEffect, useState, type ReactNode } from 'react'
import { errorMessage } from '@/lib/errors'
import { createFileRoute, Link } from '@tanstack/react-router'
import {
  Activity,
  ArrowDownRight,
  ArrowUpRight,
  Award,
  BarChart3,
  Briefcase,
  Building2,
  CalendarCheck,
  ClipboardCheck,
  FileText,
  Gauge,
  Globe,
  GraduationCap,
  HeartHandshake,
  Minus,
  Repeat,
  School,
  ShieldCheck,
  Star,
  Target,
  UserCheck,
  UserPlus,
  Users,
} from 'lucide-react'
import { fetchOverviewV2, type AdminOverviewV2 } from '@/lib/adminStudents'
import { fetchDashboardAnalytics, fetchDashboardExtra, type DashboardAnalytics, type DashboardExtra } from '@/lib/adminTeam'
import { useStaffAccessContext } from '@/lib/staffAccess'
import { fetchInternshipOverview, type InternshipOverview } from '@/lib/internships'
import { Alert, PageHeader, Skeleton } from '@/components/ui'

// The numbers, and only the numbers: how many users, how many come back, and
// how the programmes, partners and internships are growing. What needs doing
// is in the Inbox. Needs the "Dashboard numbers" section (or a full admin);
// whoever handles internships sees that part with their own section.
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

type Step = { label: string; count: number }

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
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-brand-700">Global Readiness Score</p>
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

const num = (n: number | null | undefined) => (n === null || n === undefined ? '—' : n.toLocaleString('en-IN'))
const pct = (part: number, whole: number) => (whole > 0 ? Math.round((part / whole) * 100) : 0)

function Sub({ children }: { children: ReactNode }) {
  return <span className="text-xs text-ink-500">{children}</span>
}

function DashboardPage() {
  const { isAdmin, sections } = useStaffAccessContext()
  const canSeeNumbers = isAdmin === true || (sections?.includes('overview') ?? false)

  const [stats, setStats] = useState<AdminOverviewV2 | null>(null)
  const [extra, setExtra] = useState<DashboardExtra | null | undefined>(undefined)
  const [more, setMore] = useState<DashboardAnalytics | null>(null)
  // Null until docs/supabase-admin-internships.sql is in: the section is left out.
  const [interns, setInterns] = useState<InternshipOverview | null>(null)
  const [error, setError] = useState<string>()

  useEffect(() => {
    if (!canSeeNumbers) return
    let active = true
    fetchOverviewV2()
      .then((s) => active && setStats(s))
      .catch((e) => active && setError(errorMessage(e)))
    // Trends and the extra totals are extras: without them the cards show a dash.
    fetchDashboardExtra().then(
      (x) => active && setExtra(x),
      () => active && setExtra(null),
    )
    void fetchDashboardAnalytics().then((x) => active && setMore(x))
    return () => {
      active = false
    }
  }, [canSeeNumbers])

  // Whoever handles internship companies and roles sees this part, with or
  // without the rest of the numbers.
  const canSeeInternships = canSeeNumbers || (sections?.includes('partner-leads') ?? false)
  useEffect(() => {
    if (!canSeeInternships) return
    let active = true
    void fetchInternshipOverview().then((x) => active && setInterns(x))
    return () => {
      active = false
    }
  }, [canSeeInternships])

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
        { label: 'Took the Leadership Aptitude Test', count: stats.career_readiness.aptitude },
        { label: 'Started the modules', count: stats.career_readiness.started },
        { label: 'All 14 modules written', count: stats.career_readiness.all_modules },
        { label: 'Submitted a project', count: stats.career_readiness.review_asked },
        { label: 'Project passed', count: stats.career_readiness.signed_off },
      ]
    : []
  // From applying to a confirmed internship, in students.
  const internSteps: Step[] = interns
    ? [
        { label: 'Applied for a role', count: interns.students_applied },
        { label: 'Got an offer', count: interns.funnel_offered },
        { label: 'Started an internship', count: interns.funnel_interned },
        { label: 'Internship confirmed', count: interns.students_confirmed },
      ]
    : []
  const w = extra?.weeks
  const c = extra?.community
  const u = more?.users
  const leads = more?.leads
  const grid = 'grid gap-3 sm:grid-cols-2 xl:grid-cols-4'

  const internshipsSection = interns && (
    <>
      <SectionLabel>Internships</SectionLabel>
      <div className={grid}>
        <Kpi label="Companies" value={num(interns.companies_interested ?? interns.companies_posting)} icon={Building2}>
          {interns.companies_in_portal !== undefined && (
            <Sub>
              {num(interns.companies_in_portal)} in the portal · {num(interns.companies_new ?? 0)} not contacted
            </Sub>
          )}
        </Kpi>
        <Kpi label="Live roles" value={num(interns.roles_live)} icon={Briefcase}>
          <Sub>
            {num(interns.companies_posting)} {interns.companies_posting === 1 ? 'company' : 'companies'} posting
            {interns.roles_pending > 0 ? ` · ${interns.roles_pending} to approve` : ''}
          </Sub>
        </Kpi>
        <Kpi label="Applications" value={num(interns.applications)} icon={FileText}>
          <Sub>
            {num(interns.applications_30d)} in 30 days · {num(interns.students_applied)} students
          </Sub>
        </Kpi>
        <Kpi label="Interning now" value={num(interns.interns_now)} icon={GraduationCap}>
          <Sub>{num(interns.confirmed)} internships confirmed</Sub>
        </Kpi>
      </div>
      <div className="mt-4">
        <Funnel title="From applying to a confirmed internship" steps={internSteps} />
      </div>
    </>
  )

  return (
    <>
      <PageHeader
        eyebrow="MySkills Admin"
        title="Dashboard"
        subtitle="How MySkills is growing: users, programmes, mentors, institutions and internships."
      />

      {!canSeeNumbers ? (
        <>
          <div className="card flex items-start gap-4 p-5">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-ink-100 text-ink-600">
              <Gauge size={19} />
            </span>
            <div>
              <p className="font-semibold text-ink-900">The numbers aren’t part of your access</p>
              <p className="mt-0.5 text-sm text-ink-600">
                They need the “Dashboard numbers” section, which a super admin can add under Team &amp; roles. Your work is in
                the{' '}
                <Link to="/admin/inbox" className="font-semibold text-brand-700 hover:underline">
                  Inbox
                </Link>
                .{canSeeInternships && ' The internship numbers below come with your Internships section.'}
              </p>
            </div>
          </div>
          {internshipsSection}
        </>
      ) : error ? (
        <Alert tone="danger" title="Couldn’t load the numbers">
          <p>{error}</p>
          <p className="mt-1 text-xs">
            First run? Apply <code>docs/supabase-admin-v2.sql</code> in Supabase.
          </p>
        </Alert>
      ) : !stats ? (
        <div className="space-y-4">
          <Skeleton className="h-28 w-full" />
          <Skeleton className="h-48 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      ) : (
        <>
          <SectionLabel>Users</SectionLabel>
          <div className={grid}>
            <Kpi label="Total users" value={num(stats.activity.total_users)} icon={Users}>
              {u && (
                <Sub>
                  {num(u.students)} students · {num(stats.activity.total_users - u.students)} partners
                </Sub>
              )}
            </Kpi>
            <Kpi label="Returning users" value={num(u?.returning)} icon={Repeat}>
              {u && <Sub>{pct(u.returning, u.students)}% of students came back on another day</Sub>}
            </Kpi>
            <Kpi label="Active users" value={num(u?.active_30d)} icon={Activity}>
              <Sub>
                in 30 days · {num(stats.activity.active_today)} today · {num(w?.active_this_week ?? stats.activity.active_this_week)} this week
              </Sub>
            </Kpi>
            <Kpi label="New this week" value={num(w?.new_this_week ?? stats.activity.new_this_week)} icon={UserPlus}>
              {w && <Delta now={w.new_this_week} before={w.new_last_week} />}
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

          <SectionLabel>Programmes</SectionLabel>
          <div className={grid}>
            <Kpi label="Digital Marketing" value={num(more?.programmes?.dm)} icon={BarChart3}>
              <Sub>students · {num(stats.digital_marketing.practising)} practising</Sub>
            </Kpi>
            <Kpi label="Global Leadership" value={num(more?.programmes?.gl)} icon={Globe}>
              <Sub>students · {num(stats.career_readiness.started)} writing modules</Sub>
            </Kpi>
            <Kpi
              label="Projects passed"
              value={num(stats.digital_marketing.signed_off + stats.career_readiness.signed_off)}
              icon={ClipboardCheck}
            >
              <Sub>{num(stats.digital_marketing.review_asked + stats.career_readiness.review_asked)} submitted</Sub>
            </Kpi>
            <Kpi label="Certificates issued" value={num(stats.activity.certificates)} icon={Award} />
            <Kpi label="Practice attempts" value={num(stats.activity.practice_this_week)} icon={Target}>
              <Sub>this week</Sub>
            </Kpi>
            <Kpi label="Live sessions" value={num(stats.activity.live_sessions_this_month)} icon={CalendarCheck}>
              <Sub>in the last 30 days</Sub>
            </Kpi>
            <Kpi label="Average score" value={stats.score.average ?? '—'} icon={Gauge}>
              <Sub>out of 100 · {stats.score.verified_share}% of points verified</Sub>
            </Kpi>
            <Kpi
              label="App rating"
              value={stats.activity.avg_rating === null ? '—' : `${stats.activity.avg_rating}/10`}
              icon={Star}
            >
              <Sub>from students’ feedback</Sub>
            </Kpi>
          </div>
          <div className="mt-4 grid gap-4 lg:grid-cols-2">
            <Funnel title="Digital Marketing" steps={dm} />
            <Funnel title="Global Leadership" steps={cr} />
          </div>
          <div className="mt-4">
            <ScoreDistribution s={stats.score} />
          </div>

          {(c || leads) && (
            <>
              <SectionLabel>Mentors &amp; institutions</SectionLabel>
              <div className={grid}>
                <Kpi label="Mentors" value={num(c?.mentors_listed)} icon={UserCheck}>
                  {c && <Sub>{num(c.mentors_taking)} taking students</Sub>}
                </Kpi>
                <Kpi label="Mentored students" value={num(c?.students_with_mentor)} icon={Users}>
                  {c && <Sub>{num(c.mentor_requests_waiting)} waiting for a mentor</Sub>}
                </Kpi>
                <Kpi label="Institutions" value={num(c?.institutions_listed)} icon={School}>
                  <Sub>listed for students</Sub>
                </Kpi>
                <Kpi label="Institution leads" value={num(leads?.institution_total)} icon={Target}>
                  {leads && (
                    <Sub>
                      {num(leads.institution_open)} open · {num(leads.institution_enrolled)} enrolled
                    </Sub>
                  )}
                </Kpi>
                <Kpi label="Partner accounts" value={num(c?.partner_accounts)} icon={ShieldCheck}>
                  {c && <Sub>{num(c.signups_waiting)} sign-ups to verify</Sub>}
                </Kpi>
                <Kpi label="Leadership leads" value={num(leads?.gl_total)} icon={Globe}>
                  <Sub>asked about Global Leadership</Sub>
                </Kpi>
                <Kpi label="Guidance" value={num(c?.students_with_provider)} icon={HeartHandshake}>
                  <Sub>students with a counsellor or guide</Sub>
                </Kpi>
                <Kpi label="Partner sessions" value={num(c?.sessions_30d)} icon={CalendarCheck}>
                  <Sub>in the last 30 days</Sub>
                </Kpi>
              </div>
            </>
          )}

          {internshipsSection}
        </>
      )}
    </>
  )
}
