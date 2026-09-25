import { useState, type ReactNode } from 'react'
import { createFileRoute, Link, Outlet, useRouter, useRouterState } from '@tanstack/react-router'
import {
  Award,
  BarChart3,
  BookOpen,
  Briefcase,
  Building2,
  CalendarCheck,
  ChevronDown,
  ClipboardCheck,
  ClipboardList,
  Dumbbell,
  FileText,
  GraduationCap,
  HeartHandshake,
  LogOut,
  Menu,
  MessageSquare,
  Megaphone,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  UserCheck,
  Users,
} from 'lucide-react'
import { signOut } from '@/lib/auth'
import type { ReviewProgramme } from '@/lib/mentorReview'
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

type NavItem = {
  to: string
  /** For a page that serves several items (mentor reviews, one per programme). */
  search?: { programme?: ReviewProgramme }
  label: string
  icon: typeof BarChart3
  exact?: boolean
  /** null = full admins only (Overview, and the lead lists, whose tables only admins can read). */
  section: StaffSection | null
}

// Grouped the way the work is: the students and their score, the two
// programmes, the people and organisations MySkills works with, and the site
// itself. `section: null` marks Overview — not a grantable slug, shown only to
// full admins (see src/lib/staffAccess.ts).
const GROUPS: { label: string; items: NavItem[] }[] = [
  {
    label: 'Overview',
    items: [{ to: '/admin', label: 'Overview', icon: BarChart3, exact: true, section: null }],
  },
  {
    label: 'Students',
    items: [
      { to: '/admin/users', label: 'All students', icon: Users, section: 'users' },
      { to: '/admin/verification', label: 'Verification', icon: ShieldCheck, section: 'verification' },
      { to: '/admin/live-sessions', label: 'Live sessions', icon: CalendarCheck, section: 'mentor-reviews' },
    ],
  },
  {
    label: 'Digital Marketing',
    items: [
      { to: '/admin/dm-aptitude', label: 'Aptitude results', icon: Sparkles, section: 'users' },
      { to: '/admin/practice', label: 'Practice', icon: Dumbbell, section: 'users' },
      { to: '/admin/foundation', label: 'Foundation results', icon: ClipboardCheck, section: 'users' },
      { to: '/admin/assessment-questions', label: 'Foundation questions', icon: ClipboardList, section: 'assessment' },
      { to: '/admin/certificates', label: 'Certificates', icon: Award, section: 'certificates' },
      {
        to: '/admin/mentor-reviews',
        search: { programme: 'digital-marketing' },
        label: 'Mentor reviews',
        icon: UserCheck,
        section: 'mentor-reviews',
      },
    ],
  },
  {
    label: 'Career Readiness',
    items: [
      { to: '/admin/cr-aptitude', label: 'Personal aptitude', icon: Sparkles, section: 'users' },
      { to: '/admin/modules', label: 'Modules & answers', icon: BookOpen, section: 'mentor-reviews' },
      {
        to: '/admin/mentor-reviews',
        search: { programme: 'career-readiness' },
        label: 'Mentor reviews',
        icon: UserCheck,
        section: 'mentor-reviews',
      },
    ],
  },
  {
    label: 'Partners',
    items: [
      { to: '/admin/mentors', label: 'Mentors', icon: UserCheck, section: 'mentors' },
      { to: '/admin/institution-partners', label: 'Institutions', icon: GraduationCap, section: 'institution-partners' },
      { to: '/admin/internship-partners', label: 'Internship partners', icon: Briefcase, section: null },
      { to: '/admin/demo-requests', label: 'Demo requests', icon: Building2, section: 'demo-requests' },
      { to: '/admin/cr-leads', label: 'Career Readiness leads', icon: Users, section: null },
    ],
  },
  {
    label: 'Site',
    items: [
      { to: '/admin/blog', label: 'Blog', icon: FileText, section: 'blog' },
      { to: '/admin/ads', label: 'Ads', icon: Megaphone, section: 'ads' },
      { to: '/admin/feedback', label: 'Feedback', icon: MessageSquare, section: 'feedback' },
      { to: '/admin/wellness', label: 'Wellness', icon: HeartHandshake, section: 'wellness' },
    ],
  },
]

function visibleGroups(isAdmin: boolean, sections: StaffSection[]) {
  return GROUPS.map((g) => ({
    ...g,
    items: g.items.filter((t) => (t.section === null ? isAdmin : isAdmin || sections.includes(t.section))),
  })).filter((g) => g.items.length > 0)
}

function isActive(t: NavItem, pathname: string, programme: string | undefined) {
  if (t.search) return pathname === t.to && programme === t.search.programme
  return t.exact ? pathname === t.to : pathname === t.to || pathname.startsWith(`${t.to}/`)
}

function useLocationParts() {
  const pathname = useRouterState({ select: (s) => s.location.pathname })
  const programme = useRouterState({
    select: (s) => (s.location.search as { programme?: string } | undefined)?.programme,
  })
  return { pathname, programme }
}

function NavLinks({ isAdmin, sections, onPick }: { isAdmin: boolean; sections: StaffSection[]; onPick?: () => void }) {
  const { pathname, programme } = useLocationParts()
  return (
    <div className="space-y-5">
      {visibleGroups(isAdmin, sections).map((g) => (
        <div key={g.label}>
          <p className="px-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-ink-400">{g.label}</p>
          <ul className="mt-1.5 space-y-0.5">
            {g.items.map((t) => {
              const { to, search, label, icon: Icon } = t
              // Prefix matching so a sub-page keeps its item lit; Overview has
              // to be exact or it would match every child route.
              const active = isActive(t, pathname, programme)
              return (
                <li key={`${to}-${search?.programme ?? ''}`}>
                  <Link
                    to={to}
                    search={search}
                    onClick={onPick}
                    aria-current={active ? 'page' : undefined}
                    className={`flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-medium transition-colors ${
                      active ? 'bg-brand-50 text-brand-800' : 'text-ink-600 hover:bg-ink-100 hover:text-ink-900'
                    }`}
                  >
                    <Icon size={16} className={active ? 'text-brand-600' : 'text-ink-400'} />
                    {label}
                  </Link>
                </li>
              )
            })}
          </ul>
        </div>
      ))}
    </div>
  )
}

/** A fixed sidebar on wide screens; a collapsible menu above the page on phones. */
function AdminNav({ isAdmin, sections }: { isAdmin: boolean; sections: StaffSection[] }) {
  const [open, setOpen] = useState(false)
  const { pathname, programme } = useLocationParts()
  const current = GROUPS.flatMap((g) => g.items).find((t) => isActive(t, pathname, programme))?.label ?? 'Menu'
  return (
    <>
      <nav aria-label="Admin sections" className="hidden w-56 shrink-0 lg:block">
        <div className="sticky top-24">
          <NavLinks isAdmin={isAdmin} sections={sections} />
        </div>
      </nav>
      <nav aria-label="Admin sections" className="mb-5 lg:hidden">
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
          className="flex w-full items-center justify-between rounded-xl border border-ink-900/[0.08] bg-white px-4 py-2.5 text-sm font-medium text-ink-800 shadow-e1"
        >
          <span className="inline-flex items-center gap-2">
            <Menu size={16} className="text-ink-500" /> {current}
          </span>
          <ChevronDown size={16} className={`text-ink-500 transition-transform ${open ? 'rotate-180' : ''}`} />
        </button>
        {open && (
          <div className="mt-2 rounded-2xl border border-ink-900/[0.08] bg-white p-3 shadow-e2">
            <NavLinks isAdmin={isAdmin} sections={sections} onPick={() => setOpen(false)} />
          </div>
        )}
      </nav>
    </>
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
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
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
      <main className="mx-auto max-w-7xl px-4 pb-10 pt-6 sm:px-6 sm:pt-8 lg:px-8">{children}</main>
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
        <div className="lg:flex lg:gap-8">
          <AdminNav isAdmin={isAdmin} sections={sections} />
          <div className="min-w-0 flex-1">
            <Outlet />
          </div>
        </div>
      </StaffShell>
    </StaffAccessContext.Provider>
  )
}
