/**
 * Where a new student was heading before sign-up got in the way. A visitor
 * who taps "Take the aptitude test" on the home page has to sign up and
 * onboard first; without this they'd land on the LaunchPad and have to find
 * the test again.
 *
 * sessionStorage, not localStorage: it survives the Google sign-in redirect
 * (same tab) but not a visit days later, when the intent is stale.
 */
const KEY = 'myskills.afterOnboarding'

/** Only in-app paths we expect — never an arbitrary URL from storage. */
const ALLOWED = new Set(['/aptitude-assessment'])

export function setAfterOnboarding(path: string): void {
  try {
    sessionStorage.setItem(KEY, path)
  } catch {
    // Storage blocked (private mode) — they'll land on the LaunchPad instead.
  }
}

/** Reads and clears it, so it only applies once. */
export function takeAfterOnboarding(): string | null {
  try {
    const path = sessionStorage.getItem(KEY)
    sessionStorage.removeItem(KEY)
    return path && ALLOWED.has(path) ? path : null
  } catch {
    return null
  }
}
