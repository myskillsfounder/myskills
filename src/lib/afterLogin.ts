/**
 * Where a student goes straight after signing in, when they came from a home
 * page card other than the courses (Paul, 26 Oct 2026): Mentorship, Career,
 * Wellness open the Community, Study Abroad opens Study Abroad. Only these
 * addresses are accepted, so a link can't send anyone off the site.
 *
 * Email sign-in goes there directly. Google sign-in comes back through
 * /dashboard (its allowed return address), so the place is kept for the tab
 * and the dashboard's guard sends them on.
 */
const KEY = 'myskills.afterLogin'
const ALLOWED = /^\/(community|study-abroad)(\?category=[a-z-]+)?$/

export const isAfterLoginPath = (path: unknown): path is string => typeof path === 'string' && ALLOWED.test(path)

export function saveAfterLogin(path: string): void {
  try {
    if (isAfterLoginPath(path)) sessionStorage.setItem(KEY, path)
  } catch {
    // Storage blocked: Google sign-in lands on the dashboard, as before.
  }
}

/** The kept place, removed so it is used once. */
export function takeAfterLogin(): string | null {
  try {
    const path = sessionStorage.getItem(KEY)
    sessionStorage.removeItem(KEY)
    return isAfterLoginPath(path) ? path : null
  } catch {
    return null
  }
}
