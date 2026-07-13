/**
 * Google Analytics 4 (gtag.js).
 *
 * Fully no-ops when VITE_GA_MEASUREMENT_ID is unset, so local/dev builds
 * without an ID stay clean and no network calls are made. The gtag snippet is
 * injected at runtime (nothing hard-coded in index.html), and SPA navigations
 * are reported manually via `trackPageView` because gtag only auto-sends the
 * first page_view in a single-page app.
 */
const MEASUREMENT_ID = import.meta.env.VITE_GA_MEASUREMENT_ID as string | undefined

declare global {
  interface Window {
    dataLayer: unknown[]
    gtag: (...args: unknown[]) => void
  }
}

/** True when a Measurement ID is configured (handy for conditional UI/logs). */
export const analyticsEnabled = Boolean(MEASUREMENT_ID)

let initialized = false

/** Inject gtag.js and configure GA4. Safe to call multiple times. */
export function initAnalytics() {
  if (initialized || !MEASUREMENT_ID || typeof window === 'undefined') return
  initialized = true

  const script = document.createElement('script')
  script.async = true
  script.src = `https://www.googletagmanager.com/gtag/js?id=${MEASUREMENT_ID}`
  document.head.appendChild(script)

  window.dataLayer = window.dataLayer || []
  // Standard gtag shim — pushes the raw `arguments` object onto the dataLayer.
  window.gtag = function gtag() {
    // eslint-disable-next-line prefer-rest-params
    window.dataLayer.push(arguments)
  }
  window.gtag('js', new Date())
  // We send page_view ourselves on each route change, so disable the automatic
  // one to avoid a duplicate on the initial load.
  window.gtag('config', MEASUREMENT_ID, { send_page_view: false })
}

/** Report a single-page-app page view for the given path. */
export function trackPageView(path: string) {
  if (!MEASUREMENT_ID || typeof window === 'undefined' || !window.gtag) return
  window.gtag('event', 'page_view', {
    page_path: path,
    page_location: window.location.href,
    page_title: document.title,
  })
}

/** Report a custom GA4 event. */
export function trackEvent(name: string, params?: Record<string, unknown>) {
  if (!MEASUREMENT_ID || typeof window === 'undefined' || !window.gtag) return
  window.gtag('event', name, params ?? {})
}
