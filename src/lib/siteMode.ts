/**
 * Two ways into MySkills on a computer (Paul, 25 Oct 2026): the AI guide, a
 * conversation that onboards a visitor before they sign up (routes/start.tsx),
 * and the standard website. The guide is the default; a visitor who switches
 * to the standard site stays there until they switch back.
 *
 * Search engines always get the standard site: it is what should be indexed.
 */
export type SiteMode = 'ai' | 'standard'

import { setAnalyticsUser } from './analytics'

const KEY = 'myskills.siteMode'

export function siteMode(): SiteMode {
  try {
    return localStorage.getItem(KEY) === 'standard' ? 'standard' : 'ai'
  } catch {
    return 'ai'
  }
}

export function setSiteMode(mode: SiteMode): void {
  try {
    localStorage.setItem(KEY, mode)
  } catch {
    // Storage blocked: the choice lasts this page only.
  }
  setAnalyticsUser({ site_mode: mode })
}

/** A crawler or an automated browser, which should see the standard site. */
export function isBot(): boolean {
  if (typeof navigator === 'undefined') return true
  return /bot|crawl|spider|slurp|bingpreview|lighthouse|headless/i.test(navigator.userAgent)
}
