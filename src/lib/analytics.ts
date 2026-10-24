/**
 * Google Analytics 4 (gtag.js), and the Meta Pixel for Meta ads.
 *
 * Fully no-ops when VITE_GA_MEASUREMENT_ID is unset, so local/dev builds
 * without an ID stay clean and no network calls are made. The gtag snippet is
 * injected at runtime (nothing hard-coded in index.html), and SPA navigations
 * are reported manually via `trackPageView` because gtag only auto-sends the
 * first page_view in a single-page app.
 */
const MEASUREMENT_ID = import.meta.env.VITE_GA_MEASUREMENT_ID as string | undefined

/**
 * The Meta Pixel follows the same rules: nothing loads when VITE_META_PIXEL_ID
 * is unset, page views are sent on each route change, and only the
 * conversions in META_EVENTS below reach Meta, so ads can optimise toward
 * sign-ups and leads.
 */
const PIXEL_ID = import.meta.env.VITE_META_PIXEL_ID as string | undefined

type Fbq = ((...args: unknown[]) => void) & { callMethod?: (...args: unknown[]) => void; queue: unknown[]; loaded: boolean; version: string; push: Fbq }

declare global {
  interface Window {
    dataLayer: unknown[]
    gtag: (...args: unknown[]) => void
    fbq?: Fbq
    _fbq?: Fbq
  }
}

/**
 * GA4 event -> Meta event. Standard names (CompleteRegistration, Lead) are
 * what Meta's ad sets offer as optimisation goals without a custom
 * conversion; the rest are custom events. Anything not listed stays in GA.
 */
const META_EVENTS: Record<string, { name: string; standard: boolean }> = {
  sign_up: { name: 'CompleteRegistration', standard: true },
  generate_lead: { name: 'Lead', standard: true },
  dm_aptitude_complete: { name: 'AptitudeComplete', standard: false },
  career_assessment_complete: { name: 'AptitudeComplete', standard: false },
  assessment_complete: { name: 'FoundationComplete', standard: false },
}

/** Meta's base snippet, as a function: a queue until fbevents.js loads. */
function initPixel() {
  if (!PIXEL_ID || window.fbq) return
  const fbq = function (...args: unknown[]) {
    if (fbq.callMethod) fbq.callMethod(...args)
    else fbq.queue.push(args)
  } as Fbq
  fbq.push = fbq
  fbq.loaded = true
  fbq.version = '2.0'
  fbq.queue = []
  window.fbq = fbq
  window._fbq = fbq
  const script = document.createElement('script')
  script.async = true
  script.src = 'https://connect.facebook.net/en_US/fbevents.js'
  document.head.appendChild(script)
  fbq('init', PIXEL_ID)
}

/** True when a Measurement ID is configured (handy for conditional UI/logs). */
export const analyticsEnabled = Boolean(MEASUREMENT_ID)

let initialized = false

/** Inject gtag.js and configure GA4. Safe to call multiple times. */
export function initAnalytics() {
  if (initialized || typeof window === 'undefined') return
  initialized = true
  initPixel()
  if (!MEASUREMENT_ID) return

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
  if (typeof window === 'undefined') return
  window.fbq?.('track', 'PageView')
  if (!MEASUREMENT_ID || !window.gtag) return
  window.gtag('event', 'page_view', {
    page_path: path,
    page_location: window.location.href,
    page_title: document.title,
  })
}

/** Report a custom GA4 event. */
export function trackEvent(name: string, params?: Record<string, unknown>) {
  if (typeof window === 'undefined') return
  // A partner application is a lead for the team, not a student: kept apart
  // so student ads don't optimise toward institutes and companies.
  const partner = name === 'generate_lead' && !String(params?.lead_type ?? '').endsWith('_waitlist')
  const meta = partner ? { name: 'PartnerLead', standard: false } : META_EVENTS[name]
  if (meta && window.fbq) window.fbq(meta.standard ? 'track' : 'trackCustom', meta.name, params ?? {})
  if (!MEASUREMENT_ID || !window.gtag) return
  window.gtag('event', name, params ?? {})
}

/*
 * Conversion events. These are what Google Ads optimises toward once they're
 * marked as key events in GA4 and imported, so each one fires only after the
 * server has confirmed the action -- never on a click or a failed request.
 * `sign_up` and `generate_lead` are GA4 recommended event names, which GA4
 * reports on out of the box.
 */

/** A new account finished onboarding -- the one step every signup path
 * (email and Google) passes through exactly once. */
export function trackSignUp(method: string) {
  trackEvent('sign_up', { method })
}

/** The one-attempt Foundation assessment was graded and saved. */
export function trackAssessmentComplete(percent: number) {
  trackEvent('assessment_complete', { score: percent, passed: percent >= 60 })
}

/** The one-attempt Global Leadership assessment was scored and saved. */
export function trackCareerAssessmentComplete() {
  trackEvent('career_assessment_complete')
}

/** The one-attempt Digital Marketing aptitude assessment was scored and saved. */
export function trackAptitudeComplete() {
  trackEvent('dm_aptitude_complete')
}

/** The certificate was saved, shared from the phone share sheet, or sent to
 * print. Print fires on click -- the browser never says whether it finished. */
export function trackCertificateDownload(method: 'download' | 'share' | 'print') {
  trackEvent('certificate_download', { method })
}

/** A mentor or partner-institution application was accepted by the server. */
export function trackLead(
  leadType: 'mentor' | 'institution_partner' | 'internship_partner' | 'career_readiness_waitlist' | 'programme_waitlist',
  params?: Record<string, unknown>,
) {
  trackEvent('generate_lead', { lead_type: leadType, ...params })
}
