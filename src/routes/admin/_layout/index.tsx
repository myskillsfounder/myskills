import { useEffect, useState } from 'react'
import { errorMessage } from '@/lib/errors'
import { createFileRoute, Link, useRouter } from '@tanstack/react-router'
import {
  Activity,
  Award,
  ClipboardCheck,
  FileText,
  LogIn,
  MessageSquare,
  ShieldAlert,
  Star,
  UserCheck,
  UserPlus,
  Users,
} from 'lucide-react'
import { fetchOverview, type AdminOverview } from '@/lib/admin'
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

function StatCard({
  label,
  value,
  icon: Icon,
  tone = 'neutral',
}: {
  label: string
  value: string | number
  icon: IconType
  tone?: 'neutral' | 'brand' | 'success' | 'warning' | 'gold'
}) {
  const tones = {
    neutral: 'border-ink-200 bg-white text-ink-600',
    brand: 'border-brand-200 bg-brand-50 text-brand-700',
    success: 'border-emerald-200 bg-emerald-50 text-emerald-700',
    warning: 'border-amber-200 bg-amber-50 text-amber-700',
    gold: 'border-gold-200 bg-gold-50 text-gold-700',
  }
  return (
    <div className={`rounded-2xl border p-5 ${tones[tone]}`}>
      <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/70 shadow-e1">
        <Icon size={18} />
      </span>
      <p className="mt-4 font-display text-3xl font-semibold leading-none text-ink-900">{value}</p>
      <p className="mt-1.5 text-sm text-ink-600">{label}</p>
    </div>
  )
}

function OverviewPage() {
  const [stats, setStats] = useState<AdminOverview | null>(null)
  const [error, setError] = useState<string>()

  useEffect(() => {
    let active = true
    fetchOverview()
      .then((s) => active && setStats(s))
      .catch((e) => active && setError(errorMessage(e)))
    return () => {
      active = false
    }
  }, [])

  return (
    <>
      <PageHeader eyebrow="Admin" title="Overview" subtitle="App analytics at a glance." />

      {error && (
        <Alert tone="danger" title="Couldn’t load analytics">
          <p>{error}</p>
          <p className="mt-1 text-xs">
            First run? Apply <code>docs/supabase-mentor-onboarding.sql</code> then{' '}
            <code>docs/supabase-admin.sql</code>.
          </p>
        </Alert>
      )}

      {!stats && !error ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 8 }, (_, i) => (
            <Skeleton key={i} className="h-36 w-full" />
          ))}
        </div>
      ) : stats ? (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard label="Total users" value={stats.total_users} icon={Users} tone="brand" />
            <StatCard label="Active today" value={stats.active_today} icon={Activity} tone="success" />
            <StatCard label="New this week" value={stats.new_this_week} icon={UserPlus} />
            <StatCard label="Total logins" value={stats.total_logins} icon={LogIn} tone="warning" />

            <StatCard
              label="Assessments done"
              value={stats.assessments_done}
              icon={ClipboardCheck}
            />
            <StatCard label="Practice attempts" value={stats.practice_attempts} icon={Activity} />
            <StatCard
              label="Avg rating"
              value={stats.avg_rating === null ? '—' : `${stats.avg_rating}/10`}
              icon={Star}
              tone="gold"
            />
            <StatCard label="Feedback" value={stats.feedback_count} icon={MessageSquare} />

            <StatCard label="Certificates issued" value={stats.certificates} icon={Award} tone="gold" />
            <StatCard label="Blog posts" value={stats.blog_posts} icon={FileText} />
            <StatCard label="Published" value={stats.blog_published} icon={FileText} />
          </div>

          {stats.mentor_applications_pending > 0 && (
            <Link
              to="/admin/mentors"
              className="lift mt-5 flex items-center justify-between gap-4 rounded-2xl border border-brand-200 bg-brand-50 p-5"
            >
              <div>
                <p className="font-display text-base font-semibold text-brand-900">
                  {stats.mentor_applications_pending} mentor{' '}
                  {stats.mentor_applications_pending === 1 ? 'application' : 'applications'} waiting
                </p>
                <p className="mt-0.5 text-sm text-brand-800/80">
                  Approve one to publish that mentor in the Community.
                </p>
              </div>
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-600 text-white">
                <UserCheck size={18} />
              </span>
            </Link>
          )}
        </>
      ) : null}
    </>
  )
}
