import { useLayoutEffect, useState } from 'react'
import type { ComponentType, ReactNode } from 'react'
import { Link, useRouter, useRouterState } from '@tanstack/react-router'
import {
  BookOpen,
  ChevronRight,
  LayoutDashboard,
  LogOut,
  Menu,
  MessageSquareHeart,
  Plane,
  User,
  Users,
  X,
} from 'lucide-react'
import { signOut } from '@/lib/auth'
import { isPhone } from '@/lib/device'
import { useProfile } from '@/lib/useProfile'
import { useHasStarted } from '@/lib/firstRun'
import { DETAIL_ITEMS, missingDetails } from '@/components/profile/DetailsSection'
import { AdSlider } from './AdSlider'
import { HelpCard } from './HelpCard'

type IconType = ComponentType<{ size?: number; className?: string }>

/**
 * Sidebar + mobile drawer navigation.
 *
 * Prompt Library was retired (feature removed) — its Vocabulary bank was
 * folded into the Practice > Vocabulary Builder first, so nothing was lost.
 * Games is still intentionally absent — only reachable if visited directly.
 * Delete its route, or redirect it the way routes/tests.tsx does, to retire
 * it properly.
 */
const NAV: { to: string; label: string; icon: IconType }[] = [
  { to: '/dashboard', label: 'LaunchPad', icon: LayoutDashboard },
  { to: '/practice', label: 'Practice', icon: BookOpen },
  { to: '/community', label: 'Community', icon: Users },
  // Feedback moved to the sidebar footer (and stays on the LaunchPad).
  { to: '/study-abroad', label: 'Study abroad', icon: Plane },
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
      <div className="flex items-center gap-2.5 px-5 pb-4 pt-5">
        <div className="min-w-0">
          <p className="font-display text-base font-semibold leading-tight tracking-tight text-ink-900">
            MySkills
          </p>
          <p className="text-[11px] font-medium leading-snug text-ink-500">
            Personal &amp; professional development
          </p>
        </div>
      </div>

      <div className="mx-5 border-t border-ink-900/[0.06]" />

      {/* Nav */}
      <nav className="flex-1 space-y-1 px-3 py-4">
        {NAV.map(({ to, label, icon: Icon }) => {
          // A page's own sub-pages keep it lit.
          const active = pathname === to || pathname.startsWith(`${to}/`)
          return (
            <Link
              key={to}
              to={to}
              onClick={onNavigate}
              aria-current={active ? 'page' : undefined}
              className={`group flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm outline-none transition-colors duration-200 focus-visible:ring-2 focus-visible:ring-brand-400 ${
                active ? 'bg-brand-100/70 font-semibold text-brand-800' : 'font-medium text-ink-600 hover:bg-ink-900/[0.05] hover:text-ink-900'
              }`}
            >
              <Icon
                size={18}
                className={`shrink-0 transition-colors duration-200 ${
                  active ? 'fill-brand-200 text-brand-600' : 'text-ink-400 group-hover:text-ink-700'
                }`}
              />
              <span>{label}</span>
            </Link>
          )
        })}
      </nav>

      {/* Footer */}
      <div className="mx-5 border-t border-ink-900/[0.06]" />
      <div className="space-y-2.5 px-4 pb-5 pt-4">
        <HelpCard onNavigate={onNavigate} />
        <AdSlider />

        <ProfileNavCard onNavigate={onNavigate} active={pathname === '/profile'} />

        <Link
          to="/feedback"
          onClick={onNavigate}
          aria-current={pathname === '/feedback' ? 'page' : undefined}
          className="flex items-center gap-2 px-1 text-[12px] font-medium text-ink-500 transition-colors hover:text-ink-900"
        >
          <MessageSquareHeart size={14} /> Send feedback
        </Link>

        <button
          type="button"
          onClick={handleSignOut}
          className="group flex w-full items-center gap-2.5 rounded-xl border border-ink-900/[0.08] bg-white px-3 py-2 text-[13px] font-medium text-ink-800 shadow-e1 transition-all duration-300 hover:-translate-y-0.5 hover:bg-ink-100"
        >
          <LogOut size={15} className="text-ink-600 transition-transform duration-300 group-hover:-translate-x-0.5" />
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
  // The "finish your profile" nag waits for the first step: a student who
  // hasn't taken an aptitude assessment has more important things to do.
  const started = useHasStarted()
  const missing = profile && started === true ? missingDetails(profile) : []
  const incomplete = missing.length > 0
  const percent = profile ? Math.round(((DETAIL_ITEMS.length - missing.length) / DETAIL_ITEMS.length) * 100) : null

  return (
    <Link
      to="/profile"
      onClick={onNavigate}
      className={`group flex flex-col gap-2 rounded-xl border px-3 py-2.5 shadow-e1 transition-all duration-300 hover:-translate-y-0.5 ${
        active ? 'border-ink-900/[0.12] bg-ink-100' : 'border-ink-900/[0.08] bg-white hover:bg-ink-100'
      }`}
    >
      <div className="flex items-center gap-3">
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-ink-200 text-ink-800 transition-transform duration-300 group-hover:scale-110">
          <User size={14} />
        </span>
        <span className="min-w-0 flex-1 text-[13px] font-medium text-ink-900">Profile</span>
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
          <div className="h-1 overflow-hidden rounded-full bg-ink-200">
            <span
              className="block h-full rounded-full bg-amber-500 transition-[width] duration-300"
              style={{ width: `${percent}%` }}
            />
          </div>
          <p className="text-[11px] leading-snug text-ink-600">
            Add {missing[0].label.toLowerCase()}
            {missing.length > 1 ? ` +${missing.length - 1} more` : ''} to finish your profile.
          </p>
        </>
      )}
    </Link>
  )
}

/**
 * The signed-in app is dark, like the public pages and the tests, so the
 * site reads as one (Paul, 28 Oct 2026). The class goes on <html> rather than
 * this div so dialogs and menus rendered outside it, and the page behind an
 * overscroll, are dark too; theme-dark.css gives the light classes their dark
 * values. Before paint, so a page never flashes light.
 */
export function useDarkTheme() {
  useLayoutEffect(() => {
    const html = document.documentElement
    html.classList.add('theme-dark')
    return () => html.classList.remove('theme-dark')
  }, [])
}

export function AppShell({
  children,
  wide = false,
}: {
  children: ReactNode
  wide?: boolean
}) {
  const [open, setOpen] = useState(false)
  // A phone has the LaunchPad, Practice and the Community (lib/device.ts), all in the bottom bar: no menu.
  const phone = isPhone()
  useDarkTheme()

  return (
    <div className="surface-paper min-h-screen">
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 hidden w-64 shadow-[1px_0_16px_rgba(27,24,21,0.05)] lg:block">
        <Sidebar />
      </aside>

      {/* Mobile top bar. Primary navigation lives in the bottom bar
          (components/app/MobileBottomNav.tsx, mounted in __root); this menu
          holds the overflow — Community, Feedback, Sign out. On a phone
          everything, the profile (where signing out is) included, is in the
          bottom bar, so the top bar is just the name. */}
      <div className="surface-paper sticky top-0 z-30 flex h-14 items-center justify-between border-b border-ink-900/[0.06] px-4 backdrop-blur lg:hidden">
        <Link to="/dashboard" className="flex items-center gap-2">
          <span className="font-display text-lg font-semibold tracking-tight text-ink-900">
            MySkills
          </span>
        </Link>
        {!phone && (
          <button
            type="button"
            onClick={() => setOpen(true)}
            aria-label="Open menu"
            className="flex h-10 w-10 items-center justify-center rounded-lg text-ink-600 hover:text-ink-900"
          >
            <Menu size={22} />
          </button>
        )}
      </div>

      {/* Mobile drawer */}
      {open && !phone && (
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
          {children}
        </div>
      </main>
    </div>
  )
}

