import { createFileRoute, Link, Outlet, useRouterState } from '@tanstack/react-router'
import { Building2, GraduationCap, ShieldAlert, UserCheck } from 'lucide-react'
import { requireOnboarded } from '@/lib/guards'
import { useHasPartnershipsAccess } from '@/lib/partnerships'
import { AppShell } from '@/components/app/AppShell'
import { EmptyState, Skeleton } from '@/components/ui'

/**
 * Layout for /partnerships and its children — a second, narrower door into
 * the same review queues /admin's Mentors, Partners and Demo Requests cards
 * used to open, for someone who runs partnerships but shouldn't have the
 * rest of /admin (Users, Assessment grading, Ads). See
 * docs/supabase-partnerships-portal.sql.
 *
 * beforeLoad only keeps signed-out users away; the access check below
 * decides what renders, same split as AdminLayout — neither is a security
 * boundary, RLS is.
 */
export const Route = createFileRoute('/partnerships')({
  beforeLoad: requireOnboarded,
  component: PartnershipsLayout,
})

const TABS = [
  { to: '/partnerships/mentors', label: 'Mentors', icon: UserCheck },
  { to: '/partnerships/institution-partners', label: 'Institution Partners', icon: GraduationCap },
  { to: '/partnerships/demo-requests', label: 'Demo Requests', icon: Building2 },
]

function PartnershipsNav() {
  const pathname = useRouterState({ select: (s) => s.location.pathname })

  return (
    <nav aria-label="Partnerships sections" className="mb-6">
      <ul className="grid grid-cols-1 gap-2 sm:grid-cols-3">
        {TABS.map(({ to, label, icon: Icon }) => {
          const active = pathname === to || pathname.startsWith(`${to}/`)
          return (
            <li key={to}>
              <Link
                to={to}
                aria-current={active ? 'page' : undefined}
                className={`lift flex items-center gap-3 rounded-2xl border px-4 py-3.5 text-sm font-medium transition-colors ${
                  active
                    ? 'border-brand-200 bg-brand-50 text-brand-800'
                    : 'border-ink-100 bg-white text-ink-600 hover:border-ink-200 hover:text-ink-900'
                }`}
              >
                <span
                  className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${
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

function PartnershipsLayout() {
  const access = useHasPartnershipsAccess()

  if (access === null) {
    return (
      <AppShell wide>
        <Skeleton className="h-8 w-48" />
        <Skeleton className="mt-4 h-40 w-full" />
      </AppShell>
    )
  }

  if (!access) {
    return (
      <AppShell wide>
        <EmptyState
          icon={ShieldAlert}
          title="Not available"
          description="This area is limited to MySkills partnerships managers."
        />
      </AppShell>
    )
  }

  return (
    <AppShell wide>
      <div className="mb-5">
        <p className="text-xs font-semibold uppercase tracking-wide text-brand-600">Partnerships</p>
        <h1 className="font-display text-2xl font-semibold tracking-tight text-ink-900">
          Partner onboarding
        </h1>
        <p className="mt-1 text-sm text-ink-600">
          Review mentor and institution partner applications, and follow up on demo requests.
        </p>
      </div>
      <PartnershipsNav />
      <Outlet />
    </AppShell>
  )
}
