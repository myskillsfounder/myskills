import { useEffect, useRef } from 'react'
import {
  Outlet,
  createRootRoute,
  useNavigate,
  useRouterState,
} from '@tanstack/react-router'
import { supabase } from '@/lib/supabase'
import { recordLoginEvent, validateSession } from '@/lib/auth'
import { initAnalytics, setAnalyticsUser, trackPageView } from '@/lib/analytics'
import { siteMode } from '@/lib/siteMode'
import { isPhone } from '@/lib/device'
import { applySeo } from '@/lib/seo'
import { startTimeTracking } from '@/lib/timeTracker'
import { startActivitySync } from '@/lib/activity'
import { MobileBottomNav } from '@/components/app/MobileBottomNav'

export const Route = createRootRoute({
  component: RootComponent,
})

const PUBLIC_AUTH_PATHS = new Set(['/login', '/signup', '/welcome'])

function RootComponent() {
  const navigate = useNavigate()
  const pathname = useRouterState({ select: (s) => s.location.pathname })
  const pathnameRef = useRef(pathname)
  pathnameRef.current = pathname

  useEffect(() => {
    let active = true

    // Authoritatively validate the cached session against the server. Runs on
    // app init AND whenever the tab is refocused (covers a user deleted while
    // the app is open). If invalidated, it's cleared; redirect to login unless
    // we're on a public auth screen. Route guards handle instant nav from cache.
    const check = () =>
      validateSession().then(({ wasInvalidated }) => {
        if (active && wasInvalidated && !PUBLIC_AUTH_PATHS.has(pathnameRef.current)) {
          navigate({ to: '/login' })
        }
      })

    // Refocus checks are throttled: tab-switching between a tutorial and the
    // app used to hit Supabase on every single switch. Five minutes still
    // catches a deleted account quickly; init always checks.
    const REFOCUS_CHECK_MS = 5 * 60 * 1000
    let lastCheck = Date.now()
    check()
    const onVisible = () => {
      if (document.visibilityState !== 'visible') return
      if (Date.now() - lastCheck < REFOCUS_CHECK_MS) return
      lastCheck = Date.now()
      check()
    }
    document.addEventListener('visibilitychange', onVisible)

    return () => {
      active = false
      document.removeEventListener('visibilitychange', onVisible)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // --- Google Analytics 4 ---
  // Load gtag once, then report a page_view on every SPA navigation.
  useEffect(() => {
    initAnalytics()
    // Which way in: the AI guide or the standard site on a computer, or the
    // phone's own front door, so GA4 can compare them (docs/ga4-guide-funnel.md).
    setAnalyticsUser({ site_mode: isPhone() ? 'phone' : siteMode() })
  }, [])

  // Track active time on the app: with the account (lib/activity.ts), and in
  // the browser as before, which the LaunchPad falls back to.
  useEffect(() => startTimeTracking(), [])
  useEffect(() => startActivitySync(), [])

  // Record a login event whenever the user actually signs in (admin analytics).
  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_IN') void recordLoginEvent()
    })
    return () => sub.subscription.unsubscribe()
  }, [])

  useEffect(() => {
    trackPageView(pathname + window.location.search)
  }, [pathname])

  // The document head persists across SPA navigations, so title/description/
  // canonical/OG have to be re-applied per route. Blog posts override this with
  // their own metadata once the post loads (see routes/blog/$slug.tsx).
  useEffect(() => {
    applySeo(pathname)
  }, [pathname])

  return (
    <>
      <Outlet />
      {/* Persistent so the active-tab highlight can animate across navigations. */}
      <MobileBottomNav />
    </>
  )
}
