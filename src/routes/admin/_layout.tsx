import { useEffect, useState, type ReactNode } from 'react'
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
  Crown,
  Dumbbell,
  ExternalLink,
  FileText,
  GraduationCap,
  HeartHandshake,
  Inbox,
  KeyRound,
  LogOut,
  Menu,
  MessageSquare,
  Megaphone,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  UserCheck,
  UserCog,
  Users,
} from 'lucide-react'
import { signOut } from '@/lib/auth'
import { useAuthUser } from '@/lib/useAuth'
import { fetchMyCommunityAccess } from '@/lib/communityPortal'
import { fetchMyMentorProfile } from '@/lib/mentorPortal'
import { useInboxCount } from '@/lib/adminInbox'
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
  /** 'any' = every staff member (the Inbox lists only what their sections allow);
   *  null = full admins only. */
  section: StaffSection | null | 'any'
}

// Grouped the way the work is: the students and their score, the two
// programmes, the people and organisations MySkills works with, and the site
// itself. A section is something an admin grants one person at a time; `null`
// means full admins only (see src/lib/staffAccess.ts).
const GROUPS: { label: string; items: NavItem[] }[] = [
  {
    label: 'Home',
    items: [
      // Everyone starts on the Dashboard; its numbers need the 'overview' section.
      { to: '/admin', label: 'Dashboard', icon: BarChart3, exact: true, section: 'any' },
      { to: '/admin/inbox', label: 'Inbox', icon: Inbox, section: 'any' },
    ],
  },
  {
    label: 'Students',
    items: [
      { to: '/admin/users', label: 'All students', icon: Users, section: 'users' },
      { to: '/admin/verification', label: 'Verification', icon: ShieldCheck, section: 'verification' },
    ],
  },
  // Both programmes together: the results, the projects mentors grade, and the
  // content. (Digital Marketing and Career Readiness were two groups of mostly
  // the same pages.)
  {
    label: 'Programmes',
    items: [
      { to: '/admin/aptitude', label: 'Aptitude results', icon: Sparkles, section: 'users' },
      { to: '/admin/practice', label: 'Practice (Marketing)', icon: Dumbbell, section: 'users' },
      { to: '/admin/foundation', label: 'Foundation results', icon: ClipboardCheck, section: 'users' },
      { to: '/admin/modules', label: 'Modules & answers', icon: BookOpen, section: 'mentor-reviews' },
      { to: '/admin/mentor-reviews', label: 'Projects to grade', icon: UserCheck, section: 'mentor-reviews' },
      { to: '/admin/certificates', label: 'Certificates', icon: Award, section: 'certificates' },
      { to: '/admin/assessment-questions', label: 'Foundation questions', icon: ClipboardList, section: 'assessment' },
    ],
  },
  // Everything a student sees on the Community page, in the same order as its
  // category tiles. The day-to-day work with these people happens in the
  // Community portal; this is where they are approved, given access and overseen.
  {
    label: 'Community',
    items: [
      { to: '/admin/mentors', label: 'Mentors', icon: UserCheck, section: 'mentors' },
      { to: '/admin/live-sessions', label: 'Live sessions', icon: CalendarCheck, section: 'mentor-reviews' },
      { to: '/admin/wellness', label: 'Wellness & career guidance', icon: HeartHandshake, section: 'wellness' },
      { to: '/admin/internship-partners', label: 'Internships', icon: Briefcase, section: 'partner-leads' },
      { to: '/admin/institution-partners', label: 'Institutions', icon: GraduationCap, section: 'institution-partners' },
      { to: '/admin/community-portal', label: 'Portal access & usage', icon: KeyRound, section: 'portal-access' },
    ],
  },
  {
    label: 'Leads',
    items: [
      { to: '/admin/demo-requests', label: 'Demo requests', icon: Building2, section: 'demo-requests' },
      { to: '/admin/cr-leads', label: 'Career Readiness leads', icon: Users, section: 'partner-leads' },
    ],
  },
  {
    label: 'Site',
    items: [
      { to: '/admin/blog', label: 'Blog', icon: FileText, section: 'blog' },
      { to: '/admin/ads', label: 'Ads', icon: Megaphone, section: 'ads' },
      { to: '/admin/feedback', label: 'Feedback', icon: MessageSquare, section: 'feedback' },
    ],
  },
  // Who on the internal team can open this panel. Full admins only.
  {
    label: 'Team',
    items: [{ to: '/admin/team', label: 'Team & access', icon: UserCog, section: null }],
  },
]

function visibleGroups(isAdmin: boolean, sections: StaffSection[]) {
  return GROUPS.map((g) => ({
    ...g,
    items: g.items.filter((t) =>
      t.section === 'any' ? true : t.section === null ? isAdmin : isAdmin || sections.includes(t.section),
    ),
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

function NavLinks({
  isAdmin,
  sections,
  onPick,
  badges = {},
}: {
  isAdmin: boolean
  sections: StaffSection[]
  onPick?: () => void
  /** A count to show beside an item, keyed by its address. */
  badges?: Record<string, number>
}) {
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
                    <span className="min-w-0 flex-1 truncate">{label}</span>
                    {(badges[to] ?? 0) > 0 && (
                      <span className="rounded-full bg-amber-500 px-1.5 py-0.5 text-[11px] font-bold leading-none text-white">
                        {badges[to]}
                      </span>
                    )}
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
  // What is waiting, shown beside the Inbox so it is visible from every page.
  const inbox = useInboxCount()
  const badges = { '/admin/inbox': inbox ?? 0 }
  const current = GROUPS.flatMap((g) => g.items).find((t) => isActive(t, pathname, programme))?.label ?? 'Menu'
  return (
    <>
      <nav aria-label="Admin sections" className="hidden w-56 shrink-0 lg:block">
        <div className="sticky top-24">
          <NavLinks isAdmin={isAdmin} sections={sections} badges={badges} />
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
            <NavLinks isAdmin={isAdmin} sections={sections} badges={badges} onPick={() => setOpen(false)} />
          </div>
        )}
      </nav>
    </>
  )
}

/** Whether this account can also open the Community portal (a mentor, or
 *  someone given a section of it), so the header can offer the way across.
 *  Quietly false if anything fails: it only decides whether a link shows. */
function usePortalAccess(enabled: boolean): boolean {
  const [has, setHas] = useState(false)
  useEffect(() => {
    if (!enabled) return
    let active = true
    Promise.all([fetchMyMentorProfile().catch(() => null), fetchMyCommunityAccess().catch(() => null)]).then(
      ([mentor, access]) => active && setHas(Boolean(mentor) || (access ?? []).length > 0),
    )
    return () => {
      active = false
    }
  }, [enabled])
  return has
}

/**
 * Its own shell, deliberately NOT the shared AppShell — this is a staff tool,
 * not a student surface. The bar is dark and says "Admin · Internal team" so
 * it can't be mistaken for the Community portal (a white sidebar, for
 * partners) at a glance; it also says who is signed in and with what access,
 * because one person can hold several sign-ins.
 */
function StaffShell({ children, isAdmin }: { children: ReactNode; isAdmin?: boolean | null }) {
  const router = useRouter()
  const { user } = useAuthUser()
  const known = isAdmin !== undefined && isAdmin !== null
  const portal = usePortalAccess(known)

  async function handleSignOut() {
    await signOut()
    router.navigate({ to: '/admin/login' })
  }

  return (
    <div className="surface-paper min-h-screen">
      <header className="sticky top-0 z-30 bg-ink-900 text-white">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-3 px-4 sm:px-6 lg:px-8">
          <Link to="/admin" className="flex min-w-0 items-center gap-2.5">
            <img src="/logo-mark.png" alt="" className="h-8 w-8 shrink-0" />
            <span className="font-display text-lg font-semibold tracking-tight">MySkills Admin</span>
            <span className="hidden rounded-full bg-white/10 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-white/80 sm:inline">
              Internal team
            </span>
          </Link>
          <div className="flex shrink-0 items-center gap-2 sm:gap-3">
            {known && (
              <div className="hidden text-right leading-tight md:block">
                <p className="max-w-[16rem] truncate text-xs text-white/70">{user?.email}</p>
                <p className={`inline-flex items-center gap-1 text-[11px] font-semibold ${isAdmin ? 'text-gold-300' : 'text-brand-200'}`}>
                  {isAdmin && <Crown size={11} />}
                  {isAdmin ? 'Full admin' : 'Team member'}
                </p>
              </div>
            )}
            {portal && (
              <Link
                to="/community-portal"
                className="hidden items-center gap-1.5 rounded-xl bg-white/10 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-white/20 sm:inline-flex"
              >
                Community portal <ExternalLink size={13} />
              </Link>
            )}
            <button
              type="button"
              onClick={() => void handleSignOut()}
              className="group flex items-center gap-2 rounded-xl bg-white px-3.5 py-2 text-sm font-medium text-ink-900 transition-colors hover:bg-ink-100"
            >
              <LogOut size={15} className="text-ink-500 transition-transform duration-300 group-hover:-translate-x-0.5" />
              Sign out
            </button>
          </div>
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
      <StaffShell isAdmin={isAdmin}>
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
