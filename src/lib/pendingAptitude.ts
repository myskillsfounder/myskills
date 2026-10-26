/**
 * An aptitude test answered before signing up.
 *
 * A visitor can take a programme's aptitude test first and sign up to see the
 * result (Paul, 25 Oct 2026): the experience before the account. The answers
 * wait here until there is an account to score them against; the test's page
 * then submits them and shows the result.
 *
 * localStorage, not sessionStorage: confirming an email address opens a new
 * tab, and the answers have to survive it. A week later they're stale, and
 * the test can simply be taken again.
 */
export type TestRoute = '/aptitude-assessment' | '/career-readiness-assessment' | EngineTestRoute

/** A course-engine programme's aptitude test, e.g. /programmes/ai-powered-entrepreneurship/aptitude. */
export type EngineTestRoute = `/programmes/${string}/aptitude`

const ENGINE_TEST = /^\/programmes\/[a-z0-9-]+\/aptitude$/

export const isEngineTest = (route: string): route is EngineTestRoute => ENGINE_TEST.test(route)

/** Only the tests we know: the two built-in ones, or an engine programme's. */
export const isTestRoute = (route: string): route is TestRoute =>
  route === '/aptitude-assessment' || route === '/career-readiness-assessment' || isEngineTest(route)

interface Pending {
  route: TestRoute
  answers: Record<string, number>
  reflection: string
  /** Their strongest skill, shown before sign-up as a taste of the result. */
  strongest?: string
  at: number
}

const KEY = 'myskills.pendingAptitude'
const WEEK = 7 * 24 * 60 * 60 * 1000

function read(): Pending | null {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return null
    const p = JSON.parse(raw) as Pending
    if (!isTestRoute(p.route) || typeof p.answers !== 'object' || Date.now() - p.at > WEEK) return null
    return p
  } catch {
    return null
  }
}

export function savePendingAptitude(
  route: TestRoute,
  answers: Record<string, number>,
  reflection: string,
  strongest?: string,
): void {
  try {
    localStorage.setItem(KEY, JSON.stringify({ route, answers, reflection, strongest, at: Date.now() } satisfies Pending))
  } catch {
    // Storage blocked: they'll take the test again after signing up.
  }
}

/** The answers waiting for this test, if any. */
export function pendingAptitudeFor(route: TestRoute): Pending | null {
  const p = read()
  return p?.route === route ? p : null
}

/** The test whose answers are waiting, so signing in can lead back to it. */
export function pendingAptitudeRoute(): TestRoute | null {
  return read()?.route ?? null
}

export function clearPendingAptitude(): void {
  try {
    localStorage.removeItem(KEY)
  } catch {
    /* nothing to clear */
  }
}
