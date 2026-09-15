import type { ReactNode } from 'react'
import { createFileRoute, Link, Outlet, useRouter, useRouterState } from '@tanstack/react-router'
import { Building2, GraduationCap, LogOut, ShieldAlert, UserCheck } from 'lucide-react'
import { signOut } from '@/lib/auth'
import { requirePartnershipsSession } from '@/lib/guards'
import { useHasPartnershipsAccess } from '@/lib/partnerships'
import { EmptyState, Skeleton } from '@/components/ui'

/**
 * Pathless layout for every /partnerships page EXCEPT /partnerships/login —
 * the leading underscore means this segment contributes nothing to the URL,
 * it only groups index/mentors/institution-partners/demo-requests under one
 * guard + shell. login.tsx is a sibling of this file (not inside _layout/),
 * so it never goes through requirePartnershipsSession or renders inside
 * AppShell — it IS the place an unauthenticated visitor lands, so it can't
 * be behind the same gate it's redirecting them to.
 *
 * A second, narrower door into the same review queues /admin's Mentors,
 * Partners and Demo Requests cards used to open, for someone who runs
 * partnerships but shouldn't have the rest of /admin (Users, Assessment
 * grading, Ads). See docs/supabase-partnerships-portal.sql.
 *
 * beforeLoad only keeps signed-out users away; the access check below
 * decides what renders, same split as AdminLayout — neither is a security
 * boundary, RLS is.
 */
export const Route = createFileRoute('/partnerships/_layout')({
  beforeLoad: requirePartnershipsSession,
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

/**
 * Its own minimal shell, deliberately NOT the shared AppShell — this is a
 * staff tool for the internal team handling onboarding/demos, not a student
 * surface, so it drops the Dashboard/Practice/Community/Feedback sidebar,
 * the ad slider, and the profile-completion nudge entirely. Just a logo, a
 * sign-out button, and the content.
 */
function PartnershipsShell({ children }: { children: ReactNode }) {
  const router = useRouter()

  async function handleSignOut() {
    await signOut()
    router.navigate({ to: '/partnerships/login' })
  }

  return (
    <div className="surface-paper min-h-screen">
      <header className="surface-paper sticky top-0 z-30 border-b border-ink-900/[0.06] backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2.5">
            <img src="/logo-mark.png" alt="" className="h-8 w-8 shrink-0" />
            <span className="font-display text-lg font-semibold tracking-tight text-ink-900">
              MySkills <span className="text-ink-400">·</span> Partnerships
            </span>
          </div>
          <button
            type="button"
            onClick={() => void handleSignOut()}
            className="group flex items-center gap-2 rounded-xl border border-ink-900/[0.08] bg-white px-3.5 py-2 text-sm font-medium text-ink-700 shadow-e1 transition-colors hover:bg-ink-100"
          >
            <LogOut size={15} className="text-ink-500 transition-transform duration-300 group-hover:-translate-x-0.5" />
            Sign out
          </button>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 pb-10 pt-6 sm:px-6 sm:pt-8 lg:px-8">{children}</main>
    </div>
  )
}

function PartnershipsLayout() {
  const access = useHasPartnershipsAccess()

  if (access === null) {
    return (
      <PartnershipsShell>
        <Skeleton className="h-8 w-48" />
        <Skeleton className="mt-4 h-40 w-full" />
      </PartnershipsShell>
    )
  }

  if (!access) {
    return (
      <PartnershipsShell>
        <EmptyState
          icon={ShieldAlert}
          title="Not available"
          description="This area is limited to MySkills partnerships managers."
        />
      </PartnershipsShell>
    )
  }

  return (
    <PartnershipsShell>
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
    </PartnershipsShell>
  )
}
