import { createFileRoute, Link, Outlet, useRouterState } from '@tanstack/react-router'
import { BarChart3, FileText, MessageSquare, Megaphone, ShieldAlert, UserCheck, Users } from 'lucide-react'
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

const TABS = [
  { to: '/admin', label: 'Overview', icon: BarChart3, exact: true },
  { to: '/admin/users', label: 'Users', icon: Users },
  { to: '/admin/feedback', label: 'Feedback', icon: MessageSquare },
  { to: '/admin/blog', label: 'Blog', icon: FileText },
  { to: '/admin/ads', label: 'Ads', icon: Megaphone },
  { to: '/admin/mentors', label: 'Mentors', icon: UserCheck },
]

function AdminNav() {
  const pathname = useRouterState({ select: (s) => s.location.pathname })

  return (
    <nav aria-label="Admin sections" className="mb-6 -mx-1 overflow-x-auto pb-1">
      <ul className="flex min-w-max gap-1 px-1">
        {TABS.map(({ to, label, icon: Icon, exact }) => {
          // Prefix matching so a sub-page keeps its tab lit; the overview tab
          // has to be exact or it would match every child route.
          const active = exact ? pathname === to : pathname === to || pathname.startsWith(`${to}/`)
          return (
            <li key={to}>
              <Link
                to={to}
                aria-current={active ? 'page' : undefined}
                className={`flex items-center gap-2 rounded-xl px-3.5 py-2 text-sm font-medium transition-colors ${
                  active
                    ? 'bg-brand-50 text-brand-800 ring-1 ring-brand-100'
                    : 'text-ink-600 hover:bg-ink-100 hover:text-ink-900'
                }`}
              >
                <Icon size={16} className={active ? 'text-brand-700' : 'text-ink-500'} />
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
