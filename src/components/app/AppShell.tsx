import { useState } from 'react'
import type { ComponentType, ReactNode } from 'react'
import { Link, useRouter, useRouterState } from '@tanstack/react-router'
import {
  ArrowRight,
  BarChart3,
  ChevronRight,
  ClipboardCheck,
  Dumbbell,
  LayoutGrid,
  LogOut,
  Menu,
  MessageCircle,
  MessageSquare,
  User,
  X,
} from 'lucide-react'
import { signOut } from '@/lib/auth'
import { useAssessmentDone } from '@/lib/assessmentResults'
import { useProfile } from '@/lib/useProfile'
import { DETAIL_ITEMS, missingDetails } from '@/components/profile/DetailsSection'
import { AdSlider } from './AdSlider'

type IconType = ComponentType<{ size?: number; className?: string }>

/**
 * Sidebar + mobile drawer navigation.
 *
 * Prompt Library and Games are intentionally absent from nav — Prompt Library
 * is still reachable from the dashboard's own prompt widgets, and Games only
 * if visited directly. Delete their routes, or redirect them the way
 * routes/tests.tsx does, to retire either feature properly.
 */
const NAV: { to: string; label: string; icon: IconType }[] = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutGrid },
  { to: '/practice', label: 'Practice', icon: Dumbbell },
  { to: '/community', label: 'Community', icon: MessageCircle },
  { to: '/feedback', label: 'Feedback', icon: MessageSquare },
]


function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  const router = useRouter()
  const pathname = useRouterState({ select: (s) => s.location.pathname })

  async function handleSignOut() {
    await signOut()
    router.navigate({ to: '/' })
  }

  return (
    <div className="surface-wood flex h-full flex-col">
      {/* Brand */}
      <div className="flex items-center gap-3 px-5 pb-5 pt-6">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-ink-800 to-ink-900 text-white shadow-e1">
          <BarChart3 size={20} />
        </span>
        <div className="min-w-0">
          <p className="font-display text-[17px] font-semibold leading-tight tracking-tight text-ink-900">
            MySkills
          </p>
          <p className="truncate text-xs font-medium text-ink-500">
            Self-learning platform
          </p>
        </div>
      </div>

      <div className="mx-5 border-t border-ink-900/[0.06]" />

      {/* Nav */}
      <nav className="flex-1 space-y-1 px-3 py-5">
        {NAV.map(({ to, label, icon: Icon }) => {
          const active = pathname === to
          return (
            <Link
              key={to}
              to={to}
              onClick={onNavigate}
              aria-current={active ? 'page' : undefined}
              className={`group relative flex items-center gap-3.5 overflow-hidden rounded-xl py-2.5 pl-3.5 pr-3 text-sm outline-none backdrop-blur-md transition-all duration-200 focus-visible:ring-2 focus-visible:ring-brand-400 ${
                active
                  ? 'bg-gradient-to-br from-brand-400/85 via-brand-500/80 to-brand-600/85 font-semibold text-white shadow-[0_6px_16px_-4px_rgba(91,75,214,0.4),inset_0_1px_0_rgba(255,255,255,0.4),inset_0_0_0_1px_rgba(255,255,255,0.25)]'
                  : 'text-ink-600 hover:bg-ink-900/[0.05] hover:text-ink-900'
              }`}
            >
              {active && (
                <span
                  aria-hidden
                  className="pointer-events-none absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/35 to-transparent"
                />
              )}
              <Icon
                size={19}
                className={`relative shrink-0 transition-transform duration-200 ${
                  active ? 'text-white' : 'text-ink-400 group-hover:translate-x-0.5 group-hover:text-ink-800'
                }`}
              />
              <span className="relative">{label}</span>
              {active && (
                <span className="relative ml-auto h-1.5 w-1.5 shrink-0 rounded-full bg-white/80" />
              )}
            </Link>
          )
        })}
      </nav>

      {/* Footer */}
      <div className="mx-5 border-t border-ink-900/[0.06]" />
      <div className="space-y-3 px-4 pb-6 pt-4">
        <AdSlider />

        <ProfileNavCard onNavigate={onNavigate} active={pathname === '/profile'} />

        <button
          type="button"
          onClick={handleSignOut}
          className="group flex w-full items-center gap-2.5 rounded-2xl border border-ink-900/[0.08] bg-white px-3.5 py-2.5 text-sm font-medium text-ink-800 shadow-e1 transition-all duration-300 hover:-translate-y-0.5 hover:bg-ink-100"
        >
          <LogOut size={17} className="text-ink-600 transition-transform duration-300 group-hover:-translate-x-0.5" />
          Sign Out
        </button>
      </div>
    </div>
  )
}

/**
 * Profile entry in the sidebar footer. When personal details are still
 * incomplete, it doubles as a nudge — a slim progress bar and a nagging-but-
 * not-annoying reminder, right where someone is already looking for their
 * account. Disappears once the profile is complete.
 */
function ProfileNavCard({ onNavigate, active }: { onNavigate?: () => void; active: boolean }) {
  const { profile } = useProfile()
  const missing = profile ? missingDetails(profile) : []
  const incomplete = missing.length > 0
  const percent = profile ? Math.round(((DETAIL_ITEMS.length - missing.length) / DETAIL_ITEMS.length) * 100) : null

  return (
    <Link
      to="/profile"
      onClick={onNavigate}
      className={`group flex flex-col gap-2.5 rounded-2xl border px-3.5 py-3 shadow-e1 transition-all duration-300 hover:-translate-y-0.5 ${
        active ? 'border-ink-900/[0.12] bg-ink-100' : 'border-ink-900/[0.08] bg-white hover:bg-ink-100'
      }`}
    >
      <div className="flex items-center gap-3">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-ink-200 text-ink-800 transition-transform duration-300 group-hover:scale-110">
          <User size={16} />
        </span>
        <span className="min-w-0 flex-1 text-sm font-medium text-ink-900">Profile</span>
        {incomplete ? (
          <span className="shrink-0 rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-semibold text-amber-800">
            {percent}%
          </span>
        ) : (
          <ChevronRight size={15} className="shrink-0 text-ink-400 transition-transform duration-300 group-hover:translate-x-0.5" />
        )}
      </div>

      {incomplete && (
        <>
          <div className="h-1.5 overflow-hidden rounded-full bg-ink-200">
            <span
              className="block h-full rounded-full bg-amber-500 transition-[width] duration-300"
              style={{ width: `${percent}%` }}
            />
          </div>
          <p className="text-xs leading-snug text-ink-600">
            Add {missing[0].label.toLowerCase()}
            {missing.length > 1 ? ` +${missing.length - 1} more` : ''} to finish your profile.
          </p>
        </>
      )}
    </Link>
  )
}

/** Card prompt shown at the top of every page until the one-time initial
 * assessment is done. Hidden on /practice (where it's taken). */
function AssessmentCard() {
  return (
    <div className="mb-5 flex flex-col gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-5 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-700">
          <ClipboardCheck size={20} />
        </span>
        <div>
          <p className="text-sm font-semibold text-amber-900">Complete your initial assessment</p>
          <p className="mt-0.5 text-xs leading-relaxed text-amber-700">
            Take the one-time assessment to unlock your skill tracks and start tracking progress.
          </p>
        </div>
      </div>
      <Link
        to="/practice"
        className="inline-flex shrink-0 items-center justify-center gap-1.5 rounded-full bg-amber-600 px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-amber-700"
      >
        Start assessment
        <ArrowRight size={13} />
      </Link>
    </div>
  )
}

export function AppShell({
  children,
  wide = false,
}: {
  children: ReactNode
  wide?: boolean
}) {
  const [open, setOpen] = useState(false)
  const assessmentDone = useAssessmentDone()
  const pathname = useRouterState({ select: (s) => s.location.pathname })
  const showNudge = assessmentDone === false && pathname !== '/practice'

  return (
    <div className="surface-paper min-h-screen">
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 hidden w-64 shadow-[1px_0_16px_rgba(27,24,21,0.05)] lg:block">
        <Sidebar />
      </aside>

      {/* Mobile top bar. Primary navigation lives in the bottom bar
          (components/app/MobileBottomNav.tsx, mounted in __root); this menu
          holds the overflow — Community, Feedback, Sign out. */}
      <div className="surface-paper sticky top-0 z-30 flex h-14 items-center justify-between border-b border-ink-900/[0.06] px-4 backdrop-blur lg:hidden">
        <div className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-ink-900 text-white">
            <BarChart3 size={16} />
          </span>
          <span className="font-display text-lg font-semibold tracking-tight text-ink-900">
            MySkills
          </span>
        </div>
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label="Open menu"
          className="flex h-10 w-10 items-center justify-center rounded-lg text-ink-600 hover:text-ink-900"
        >
          <Menu size={22} />
        </button>
      </div>

      {/* Mobile drawer */}
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label="Menu">
          <div className="fade-in absolute inset-0 bg-ink-900/50 backdrop-blur-sm" onClick={() => setOpen(false)} />
          <aside className="slide-in-right absolute inset-y-0 right-0 w-72 shadow-2xl">
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Close menu"
              className="press absolute left-2 top-3 z-10 rounded-xl p-2 text-ink-600 transition-colors hover:bg-ink-100 hover:text-ink-900"
            >
              <X size={20} />
            </button>
            <Sidebar onNavigate={() => setOpen(false)} />
          </aside>
        </div>
      )}

      <a href="#main" className="skip-link">
        Skip to content
      </a>

      {/* bottom padding clears the mobile nav bar; desktop has no bar */}
      <main id="main" className="lg:pl-64">
        <div
          className={`mx-auto px-4 pb-[calc(1.5rem+58px+env(safe-area-inset-bottom))] pt-6 sm:px-6 sm:pt-8 lg:px-8 lg:pb-10 ${
            wide ? 'max-w-6xl' : 'max-w-4xl'
          }`}
        >
          {showNudge && <AssessmentCard />}
          {children}
        </div>
      </main>
    </div>
  )
}

/** Simple placeholder for sections that aren't built yet. */
export function PagePlaceholder({
  title,
  description,
  icon: Icon,
}: {
  title: string
  description: string
  icon: IconType
}) {
  return (
    <div className="card px-6 py-14 text-center">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-ink-100 text-ink-500">
        <Icon size={26} />
      </div>
      <h1 className="mt-4 font-display text-2xl font-semibold text-ink-900">{title}</h1>
      <p className="mx-auto mt-1.5 max-w-sm text-sm text-ink-600">{description}</p>
      <span className="mt-5 inline-block rounded-full border border-ink-300 bg-ink-100 px-3 py-1 text-xs font-medium text-ink-600">
        Coming soon
      </span>
    </div>
  )
}
