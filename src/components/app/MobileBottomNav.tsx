import { Link, useRouterState } from '@tanstack/react-router'
import { Dumbbell, LayoutGrid, Star, User, Users } from 'lucide-react'

const TABS = [
  { to: '/dashboard', label: 'Home', icon: LayoutGrid },
  { to: '/practice', label: 'Practice', icon: Dumbbell },
  { to: '/community', label: 'Community', icon: Users },
  { to: '/feedback', label: 'Review', icon: Star },
  { to: '/profile', label: 'Profile', icon: User },
] as const

/**
 * The bar is part of the app layout, so it shows EVERYWHERE by default and we
 * only name the exceptions. (It used to be an allow-list of sections, which
 * silently omitted every page added afterwards.)
 *
 * Hidden on: public/marketing pages, the auth + onboarding funnel, the
 * assessment player (a focused, one-shot flow where a nav bar invites
 * accidental exits) and the certificate page (it's printed).
 */
const HIDE_EXACT = new Set(['/', '/login', '/signup', '/onboarding', '/assessment', '/certificate'])
const HIDE_PREFIX = ['/blog']

/** Row height in px. Labels + icon, comfortably above the 44px touch minimum. */
export const BOTTOM_NAV_H = 58

/**
 * How far up a page must push its own bottom-pinned controls so they don't
 * collide with this bar (bar height + the device safe area + a small gap).
 *
 * Usage: `style={{ bottom: BOTTOM_NAV_CLEARANCE }}` on a `fixed` element.
 */
export const BOTTOM_NAV_CLEARANCE = `calc(${BOTTOM_NAV_H + 12}px + env(safe-area-inset-bottom))`

/**
 * Standard mobile bottom navigation: edge-to-edge, anchored to the bottom,
 * icon + label, one active state.
 *
 * Deliberately CSS-only. The previous version measured tab widths at runtime to
 * slide a pill between them, which mis-positioned on first paint and on resize;
 * here each tab owns its own indicator, so alignment is correct at any width.
 */
export function MobileBottomNav() {
  const pathname = useRouterState({ select: (s) => s.location.pathname })

  const hidden = HIDE_EXACT.has(pathname) || HIDE_PREFIX.some((p) => pathname.startsWith(p))
  if (hidden) return null

  return (
    <nav
      aria-label="Primary"
      className="no-print surface-paper fixed inset-x-0 bottom-0 z-40 border-t border-ink-200 shadow-[0_-6px_24px_-12px_rgba(61,40,23,0.25)] backdrop-blur-lg lg:hidden"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <ul className="mx-auto flex max-w-lg items-stretch">
        {TABS.map(({ to, label, icon: Icon }) => {
          const active = pathname === to || pathname.startsWith(`${to}/`)
          return (
            <li key={to} className="flex-1">
              <Link
                to={to}
                aria-label={label}
                aria-current={active ? 'page' : undefined}
                className="relative flex select-none flex-col items-center justify-center gap-0.5 outline-none transition-transform duration-100 active:scale-95"
                style={{ height: BOTTOM_NAV_H, WebkitTapHighlightColor: 'transparent' }}
              >
                {/* active marker on the top edge */}
                <span
                  className={`absolute top-0 h-[3px] rounded-b-full bg-brand-600 transition-all duration-300 ${
                    active ? 'w-9 opacity-100' : 'w-0 opacity-0'
                  }`}
                />
                {/* icon pill */}
                <span
                  className={`flex h-7 w-14 items-center justify-center rounded-full transition-all duration-300 ${
                    active ? 'scale-105 bg-brand-50' : 'bg-transparent'
                  }`}
                >
                  <Icon
                    size={21}
                    className={`transition-colors duration-200 ${active ? 'text-brand-700' : 'text-ink-500'}`}
                  />
                </span>
                <span
                  className={`text-[10px] leading-none tracking-tight transition-colors duration-200 ${
                    active ? 'font-semibold text-brand-700' : 'font-medium text-ink-500'
                  }`}
                >
                  {label}
                </span>
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
