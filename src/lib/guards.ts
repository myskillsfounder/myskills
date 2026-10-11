import { redirect } from '@tanstack/react-router'
import { supabase } from './supabase'
import { homePath, inPhoneApp, isPhone } from './device'

/** What a route guard is handed: enough to know which page is being opened. */
type GuardContext = { location: { pathname: string } }

/**
 * Fast auth check from the cached session — NO server round-trip, so in-app
 * navigation is instant. Authoritative deleted/invalid-user validation happens
 * on app init and tab refocus in `__root.tsx` (`validateSession`), which is the
 * scope the requirement asked for (refresh / application initialization).
 *
 * `getSession()` transparently refreshes an expired access token when the
 * refresh token is still valid, so this stays correct without hitting /user.
 */
async function currentSession() {
  const { data } = await supabase.auth.getSession()
  return data.session
}

/** Guest-only routes (/login, /signup): send signed-in users home (the
 *  LaunchPad, or the marketplace on a phone). */
export async function requireGuest(): Promise<void> {
  if (await currentSession()) throw redirect({ to: homePath() })
}

/** Where a signed-in account that hasn't onboarded yet is sent: the computer's
 *  onboarding, or the phone's own (routes/welcome.tsx). */
const onboardingPath = (): '/onboarding' | '/welcome' => (isPhone() ? '/welcome' : '/onboarding')

/** Signed-in required (/onboarding). A phone has its own onboarding instead. */
export async function requireSession(): Promise<void> {
  if (!(await currentSession())) throw redirect({ to: '/login' })
  if (isPhone()) throw redirect({ to: '/welcome' })
}

/**
 * Signed-in AND onboarded (/profile, app pages).
 *
 * A new account is onboarded first: on a computer by the sentence and the
 * plan, on a phone by its own three taps. After that, on a phone the app is
 * the marketplace only (see lib/device.ts), so any other app page sends them
 * there.
 */
export async function requireOnboarded(ctx?: GuardContext): Promise<void> {
  const session = await currentSession()
  if (!session) throw redirect({ to: '/login' })
  if (session.user.user_metadata?.onboarded !== true) {
    throw redirect({ to: onboardingPath() })
  }
  if (isPhone() && ctx && !inPhoneApp(ctx.location.pathname)) throw redirect({ to: '/community' })
}

/**
 * The phone's front door (/welcome): the welcome for someone signed out, the
 * three questions for a new account. A computer has no use for it, and an
 * account that has already answered goes to the marketplace.
 */
export async function requirePhoneWelcome(): Promise<void> {
  const session = await currentSession()
  if (!isPhone()) throw redirect({ to: session ? '/dashboard' : '/' })
  if (session && session.user.user_metadata?.onboarded === true) throw redirect({ to: '/community' })
}

/**
 * The home page on a phone is the app's front door, not the website's: someone
 * signed in is taken to the marketplace, the way opening an app takes you to
 * the app, and someone signed out to the phone's own welcome. On a computer
 * the home page is the home page.
 */
export async function phoneHome(): Promise<void> {
  if (!isPhone()) return
  throw redirect({ to: (await currentSession()) ? '/community' : '/welcome' })
}

/**
 * For routes that are dual-purpose: a public marketing page for signed-out
 * visitors, and the authenticated in-app experience for onboarded users
 * (currently just /community — public "become a mentor" content vs. the
 * signed-in Community hub). Unlike requireOnboarded, a missing session is
 * allowed through; only a signed-in-but-not-onboarded user gets sent to
 * finish onboarding, matching what they'd hit anywhere else in the app.
 */
export async function requireOnboardedIfSignedIn(): Promise<void> {
  const session = await currentSession()
  if (session && session.user.user_metadata?.onboarded !== true) {
    throw redirect({ to: onboardingPath() })
  }
}

/**
 * Signed-in required for /admin specifically — redirects to its own login
 * page, not the main site's /login, and doesn't require the student
 * onboarding flag the way requireOnboarded does. A staff-only account
 * (internal team, not a student) never touches /login or /onboarding at all.
 */
export async function requireStaffSession(): Promise<void> {
  if (!(await currentSession())) throw redirect({ to: '/admin/login' })
}

/** Guest-only for /admin/login: someone already signed in (an admin or a
 *  staff member with at least one section grant) skips straight to /admin —
 *  /admin itself decides which sections, if any, they actually see. */
export async function requireGuestForStaff(): Promise<void> {
  if (await currentSession()) throw redirect({ to: '/admin' })
}

/**
 * The mentor portal (/community-portal) is its own sign-in, like /admin: a mentor
 * never needs the student sign-up, Google OAuth or onboarding wizard. Whether
 * the signed-in account is actually a linked mentor is decided by the portal
 * itself, which shows a clear message if it isn't.
 */
export async function requireMentorSession(): Promise<void> {
  if (!(await currentSession())) throw redirect({ to: '/community-portal/login' })
}

/** Guest-only for /community-portal/login: someone already signed in goes straight in. */
export async function requireGuestForMentor(): Promise<void> {
  if (await currentSession()) throw redirect({ to: '/community-portal' })
}
