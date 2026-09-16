import type { ReactNode } from 'react'
import { createFileRoute, Link, Outlet, useRouter, useRouterState } from '@tanstack/react-router'
import {
  Award,
  BarChart3,
  Building2,
  ClipboardList,
  FileText,
  GraduationCap,
  LogOut,
  MessageSquare,
  Megaphone,
  ShieldAlert,
  UserCheck,
  Users,
} from 'lucide-react'
import { signOut } from '@/lib/auth'
import { requireStaffSession } from '@/lib/guards'
import { StaffAccessContext, useStaffAccess, type StaffSection } from '@/lib/staffAccess'
import { EmptyState, Skeleton } from '@/components/ui'

/**
 * Pathless layout for every /admin page EXCEPT /admin/login — the leading
 * underscore means this segment contributes nothing to the URL, it only
 * groups the real admin pages under one guard + shell. login.tsx is a
 * sibling of this file (not inside _layout/), so it never goes through
 * requireStaffSession or renders inside this shell — it IS where a
 * signed-out visitor lands, so it can't be behind the gate it redirects to.
 *
 * Per-section access replaces the old binary is_admin()-only gate — see
 * docs/supabase-staff-permissions.sql. This layout only checks "is this any
 * kind of staff member at all"; each leaf page below gates its own section
 * via <RequireSection>/<RequireAdmin> (src/components/admin/AdminSectionGate.tsx).
 *
 * beforeLoad only keeps signed-out users away; the checks below decide what
 * renders — neither is a security boundary, RLS is.
 */
export const Route = createFileRoute('/admin/_layout')({
  beforeLoad: requireStaffSession,
  component: AdminLayout,
})

// Ordered by how often an admin actually reaches for it, not alphabetically.
// `section: null` marks Overview — not a grantable slug, shown only to full
// admins (see src/lib/staffAccess.ts for why that's checked separately from
// "granted all 9 sections").
const TABS: { to: string; label: string; icon: typeof BarChart3; exact?: boolean; section: StaffSection | null }[] = [
  { to: '/admin', label: 'Overview', icon: BarChart3, exact: true, section: null },
  { to: '/admin/users', label: 'Users', icon: Users, section: 'users' },
  { to: '/admin/assessment-questions', label: 'Assessment', icon: ClipboardList, section: 'assessment' },
  { to: '/admin/certificates', label: 'Certificates', icon: Award, section: 'certificates' },
  { to: '/admin/feedback', label: 'Feedback', icon: MessageSquare, section: 'feedback' },
  { to: '/admin/mentors', label: 'Mentors', icon: UserCheck, section: 'mentors' },
  { to: '/admin/institution-partners', label: 'Institution Partners', icon: GraduationCap, section: 'institution-partners' },
  { to: '/admin/demo-requests', label: 'Demo Requests', icon: Building2, section: 'demo-requests' },
  { to: '/admin/blog', label: 'Blog', icon: FileText, section: 'blog' },
  { to: '/admin/ads', label: 'Ads', icon: Megaphone, section: 'ads' },
]

function AdminNav({ isAdmin, sections }: { isAdmin: boolean; sections: StaffSection[] }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname })
  const visible = TABS.filter((t) => t.section === null ? isAdmin : isAdmin || sections.includes(t.section))

  return (
    <nav aria-label="Admin sections" className="mb-6">
      <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-5">
        {visible.map(({ to, label, icon: Icon, exact }) => {
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

/**
 * Its own minimal shell, deliberately NOT the shared AppShell — this is a
 * staff tool, not a student surface, so it drops the Dashboard/Practice/
 * Community/Feedback sidebar, the ad slider, and the profile-completion
 * nudge entirely. No link back to the main app either — admin/staff users
 * shouldn't need it. Just a logo, a sign-out button, and the content.
 */
function StaffShell({ children }: { children: ReactNode }) {
  const router = useRouter()

  async function handleSignOut() {
    await signOut()
    router.navigate({ to: '/admin/login' })
  }

  return (
    <div className="surface-paper min-h-screen">
      <header className="surface-paper sticky top-0 z-30 border-b border-ink-900/[0.06] backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2.5">
            <img src="/logo-mark.png" alt="" className="h-8 w-8 shrink-0" />
            <span className="font-display text-lg font-semibold tracking-tight text-ink-900">
              MySkills <span className="text-ink-400">·</span> Admin
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

function AdminLayout() {
  const access = useStaffAccess()
  const { isAdmin, sections } = access

  if (isAdmin === null || sections === null) {
    return (
      <StaffShell>
        <Skeleton className="h-8 w-48" />
        <Skeleton className="mt-4 h-40 w-full" />
      </StaffShell>
    )
  }

  if (!isAdmin && sections.length === 0) {
    return (
      <StaffShell>
        <EmptyState
          icon={ShieldAlert}
          title="Not available"
          description="This area is limited to MySkills staff."
        />
      </StaffShell>
    )
  }

  return (
    <StaffAccessContext.Provider value={access}>
      <StaffShell>
        <AdminNav isAdmin={isAdmin} sections={sections} />
        <Outlet />
      </StaffShell>
    </StaffAccessContext.Provider>
  )
}
