import { useEffect, useState, type ReactNode } from 'react'
import { errorMessage } from '@/lib/errors'
import { createFileRoute, Link, useRouter } from '@tanstack/react-router'
import {
  Activity,
  Award,
  CalendarCheck,
  ClipboardCheck,
  LogIn,
  ShieldAlert,
  Star,
  UserPlus,
  Users,
} from 'lucide-react'
import { fetchOverviewV2, type AdminOverviewV2 } from '@/lib/adminStudents'
import { STAFF_SECTIONS, useStaffAccessContext, type StaffSection } from '@/lib/staffAccess'
import { Alert, EmptyState, PageHeader, Skeleton } from '@/components/ui'

// Overview is admin-only (it aggregates every section's stats in one call),
// but a non-admin staff member with real section access shouldn't land here
// and just see a wall — send them straight to their first granted section
// instead. Only truly access-less accounts (unreachable in practice, the
// parent layout already blocks those before this ever renders) see "Not
// available" here.
const SECTION_PATH: Record<StaffSection, string> = {
  users: '/admin/users',
  assessment: '/admin/assessment-questions',
  certificates: '/admin/certificates',
  feedback: '/admin/feedback',
  wellness: '/admin/wellness',
  verification: '/admin/verification',
  'mentor-reviews': '/admin/mentor-reviews',
  mentors: '/admin/mentors',
  'institution-partners': '/admin/institution-partners',
  'demo-requests': '/admin/demo-requests',
  blog: '/admin/blog',
  ads: '/admin/ads',
}

function OverviewGate() {
  const router = useRouter()
  const { isAdmin, sections } = useStaffAccessContext()
  const firstSection = sections ? STAFF_SECTIONS.find((s) => sections.includes(s)) : undefined

  useEffect(() => {
    if (isAdmin === false && firstSection) {
      router.navigate({ to: SECTION_PATH[firstSection] })
    }
  }, [isAdmin, firstSection, router])

  if (isAdmin === null || sections === null || (isAdmin === false && firstSection)) {
    return (
      <>
        <Skeleton className="h-8 w-48" />
        <Skeleton className="mt-4 h-40 w-full" />
      </>
    )
  }

  if (!isAdmin) {
    return (
      <EmptyState
        icon={ShieldAlert}
        title="Not available"
        description="You don't have access to this section."
      />
    )
  }

  return <OverviewPage />
}

export const Route = createFileRoute('/admin/_layout/')({
  component: OverviewGate,
})

type IconType = typeof Users

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

function SectionLabel({ children }: { children: ReactNode }) {
  return <h2 className="mb-3 mt-8 font-display text-lg font-semibold text-ink-900">{children}</h2>
}

/** Things waiting on the team, busiest first; quiet ones stay visible but muted. */
function NeedsAction({ n }: { n: AdminOverviewV2['needs_action'] }) {
  const items: { label: string; count: number; to?: string }[] = [
    { label: 'Mentor reviews waiting', count: n.mentor_reviews, to: '/admin/mentor-reviews' },
    { label: 'Verification requests', count: n.verification, to: '/admin/verification' },
    { label: 'Mentor applications', count: n.mentor_applications, to: '/admin/mentors' },
    { label: 'Institution applications', count: n.institution_applications, to: '/admin/institution-partners' },
    { label: 'Demo requests', count: n.demo_requests, to: '/admin/demo-requests' },
    { label: 'Wellness requests', count: n.wellness, to: '/admin/wellness' },
    { label: 'Internship partner leads', count: n.internship_leads, to: '/admin/internship-partners' },
    { label: 'Career Readiness leads', count: n.career_readiness_leads, to: '/admin/cr-leads' },
  ].sort((x, y) => y.count - x.count)
  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {items.map((it) => {
        const body = (
          <>
            <span
              className={`font-display text-2xl font-semibold tabular-nums ${it.count > 0 ? 'text-brand-700' : 'text-ink-300'}`}
            >
              {it.count}
            </span>
            <span className={`text-sm ${it.count > 0 ? 'text-ink-800' : 'text-ink-500'}`}>{it.label}</span>
          </>
        )
        const cls = `flex items-center gap-3 rounded-2xl border p-4 ${
          it.count > 0 ? 'border-brand-200 bg-brand-50/60' : 'border-ink-200 bg-white'
        }`
        return it.to ? (
          <Link key={it.label} to={it.to} className={`lift ${cls}`}>
            {body}
          </Link>
        ) : (
          <div key={it.label} className={cls}>
            {body}
          </div>
        )
      })}
    </div>
  )
}

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
          <div
            key={b.label}
            className={b.cls}
            style={{ width: `${(b.count / total) * 100}%` }}
            title={`${b.label}: ${b.count}`}
          />
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
function Funnel({ title, steps }: { title: string; steps: { label: string; count: number }[] }) {
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

function OverviewPage() {
  const [stats, setStats] = useState<AdminOverviewV2 | null>(null)
  const [error, setError] = useState<string>()

  useEffect(() => {
    let active = true
    fetchOverviewV2()
      .then((s) => active && setStats(s))
      .catch((e) => active && setError(errorMessage(e)))
    return () => {
      active = false
    }
  }, [])

  return (
    <>
      <PageHeader
        eyebrow="Admin"
        title="Overview"
        subtitle="What needs you, how students are scoring, and how both programmes are moving."
      />

      {error && (
        <Alert tone="danger" title="Couldn’t load the overview">
          <p>{error}</p>
          <p className="mt-1 text-xs">
            First run? Apply <code>docs/supabase-admin-v2.sql</code> in Supabase.
          </p>
        </Alert>
      )}

      {!stats && !error ? (
        <div className="space-y-4">
          <Skeleton className="h-28 w-full" />
          <Skeleton className="h-48 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      ) : stats ? (
        <>
          <SectionLabel>Needs action</SectionLabel>
          <NeedsAction n={stats.needs_action} />

          <SectionLabel>Scores</SectionLabel>
          <ScoreDistribution s={stats.score} />

          <SectionLabel>Programmes</SectionLabel>
          <div className="grid gap-4 lg:grid-cols-2">
            <Funnel
              title="Digital Marketing"
              steps={[
                { label: 'Took the aptitude assessment', count: stats.digital_marketing.aptitude },
                { label: 'Practising', count: stats.digital_marketing.practising },
                { label: 'All 8 tracks practised', count: stats.digital_marketing.all_tracks },
                { label: 'Foundation assessment done', count: stats.digital_marketing.foundation },
                { label: 'Asked for a mentor review', count: stats.digital_marketing.review_asked },
                { label: 'Signed off by a mentor', count: stats.digital_marketing.signed_off },
              ]}
            />
            <Funnel
              title="Career Readiness"
              steps={[
                { label: 'Took the personal aptitude assessment', count: stats.career_readiness.aptitude },
                { label: 'Started the modules', count: stats.career_readiness.started },
                { label: 'All 5 modules written', count: stats.career_readiness.all_modules },
                { label: 'Asked for a mentor review', count: stats.career_readiness.review_asked },
                { label: 'Signed off by a mentor', count: stats.career_readiness.signed_off },
              ]}
            />
          </div>

          <SectionLabel>Activity</SectionLabel>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard label="Students" value={stats.activity.total_users} icon={Users} />
            <StatCard label="New this week" value={stats.activity.new_this_week} icon={UserPlus} />
            <StatCard label="Active today" value={stats.activity.active_today} icon={Activity} />
            <StatCard label="Active this week" value={stats.activity.active_this_week} icon={LogIn} />
            <StatCard label="Practice attempts this week" value={stats.activity.practice_this_week} icon={ClipboardCheck} />
            <StatCard label="Live sessions, last 30 days" value={stats.activity.live_sessions_this_month} icon={CalendarCheck} />
            <StatCard label="Certificates issued" value={stats.activity.certificates} icon={Award} />
            <StatCard
              label="Average feedback rating"
              value={stats.activity.avg_rating === null ? '—' : `${stats.activity.avg_rating}/10`}
              icon={Star}
            />
          </div>
        </>
      ) : null}
    </>
  )
}
