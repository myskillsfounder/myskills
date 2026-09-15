import { createFileRoute, Link, Outlet, useRouterState } from '@tanstack/react-router'
import {
  Award,
  BarChart3,
  Building2,
  ClipboardList,
  FileText,
  GraduationCap,
  MessageSquare,
  Megaphone,
  ShieldAlert,
  UserCheck,
  Users,
} from 'lucide-react'
import { requireOnboarded } from '@/lib/guards'
import { useIsAdmin } from '@/lib/mentors'
import { AppShell } from '@/components/app/AppShell'
import { EmptyState, Skeleton } from '@/components/ui'

/**
 * Layout for /admin and its children. The guard here only keeps signed-out
 * users away; the admin check below decides what renders.
 *
 * Neither is a security boundary — the client can't be trusted with that.
 * Every admin table and function enforces `is_admin()` in Postgres, so a
 * non-admin who forces this route sees empty lists and failed writes.
 */
export const Route = createFileRoute('/admin')({
  beforeLoad: requireOnboarded,
  component: AdminLayout,
})

// Ordered by how often an admin actually reaches for it, not alphabetically —
// the daily-use sections (analytics, users, grading, certificates) come
// first; the ones opened occasionally (blog, ads) or nearly never
// (institution_demo_requests is superseded by the partner-application flow,
// kept only as historical data) trail at the end.
const TABS = [
  { to: '/admin', label: 'Overview', icon: BarChart3, exact: true },
  { to: '/admin/users', label: 'Users', icon: Users },
  { to: '/admin/assessment-questions', label: 'Assessment', icon: ClipboardList },
  { to: '/admin/certificates', label: 'Certificates', icon: Award },
  { to: '/admin/feedback', label: 'Feedback', icon: MessageSquare },
  { to: '/admin/mentors', label: 'Mentors', icon: UserCheck },
  { to: '/admin/institution-partners', label: 'Partners', icon: GraduationCap },
  { to: '/admin/blog', label: 'Blog', icon: FileText },
  { to: '/admin/ads', label: 'Ads', icon: Megaphone },
  { to: '/admin/institutions', label: 'Demo Requests', icon: Building2 },
]

function AdminNav() {
  const pathname = useRouterState({ select: (s) => s.location.pathname })

  return (
    <nav aria-label="Admin sections" className="mb-6">
      <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-5">
        {TABS.map(({ to, label, icon: Icon, exact }) => {
          // Prefix matching so a sub-page keeps its tab lit; the overview tab
          // has to be exact or it would match every child route.
          const active = exact ? pathname === to : pathname === to || pathname.startsWith(`${to}/`)
          return (
            <li key={to}>
              <Link
                to={to}
                aria-current={active ? 'page' : undefined}
                className={`lift flex flex-col items-center gap-1.5 rounded-2xl border px-3 py-3.5 text-center text-sm font-medium transition-colors ${
                  active
                    ? 'border-brand-200 bg-brand-50 text-brand-800'
                    : 'border-ink-100 bg-white text-ink-600 hover:border-ink-200 hover:text-ink-900'
                }`}
              >
                <span
                  className={`flex h-9 w-9 items-center justify-center rounded-xl ${
                    active ? 'bg-brand-600 text-white' : 'bg-ink-100 text-ink-500'
                  }`}
                >
                  <Icon size={17} />
                </span>
                {label}
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}

function AdminLayout() {
  const admin = useIsAdmin()

  if (admin === null) {
    return (
      <AppShell wide>
        <Skeleton className="h-8 w-48" />
        <Skeleton className="mt-4 h-40 w-full" />
      </AppShell>
    )
  }

  if (!admin) {
    return (
      <AppShell wide>
        <EmptyState
          icon={ShieldAlert}
          title="Not available"
          description="This area is limited to MySkills administrators."
        />
      </AppShell>
    )
  }

  return (
    <AppShell wide>
      <AdminNav />
      <Outlet />
    </AppShell>
  )
}
