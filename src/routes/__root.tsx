import { useEffect, useRef } from 'react'
import {
  Outlet,
  createRootRoute,
  useNavigate,
  useRouterState,
} from '@tanstack/react-router'
import { validateSession } from '@/lib/auth'
import { initAnalytics, trackPageView } from '@/lib/analytics'
import { MobileBottomNav } from '@/components/app/MobileBottomNav'

export const Route = createRootRoute({
  component: RootComponent,
})

const PUBLIC_AUTH_PATHS = new Set(['/login', '/signup'])

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

    check()
    const onVisible = () => {
      if (document.visibilityState === 'visible') check()
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
  }, [])

  useEffect(() => {
    trackPageView(pathname + window.location.search)
  }, [pathname])

  return (
    <>
      <Outlet />
      {/* Persistent so the active-tab highlight can animate across navigations. */}
      <MobileBottomNav />
    </>
  )
}
