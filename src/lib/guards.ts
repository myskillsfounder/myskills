import { redirect } from '@tanstack/react-router'
import { supabase } from './supabase'
import { homePath, inPhoneApp, isPhone } from './device'
import { pendingAptitudeRoute } from './pendingAptitude'
import { isBot, siteMode } from './siteMode'
import { ensureLiveContent } from './liveContent'

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

type Session = NonNullable<Awaited<ReturnType<typeof currentSession>>>

/**
 * An account made through the Community portal's sign-up (a mentor, counsellor,
 * career guide, company or institution), which has never done the student
 * onboarding. It belongs in the portal: wherever it lands in the student app
 * (the confirm link sent to the site's address, the student sign-in, a link
 * to /community), it is taken there, never to "find your starting point".
 */
const isPartnerAccount = (s: Session) =>
  s.user.user_metadata?.onboarded !== true && Boolean(s.user.user_metadata?.portal_request)

/** Where a signed-in account that hasn't onboarded is sent: the portal for a partner, onboarding for a student. */
const notOnboardedPath = (s: Session): '/community-portal' | '/onboarding' | '/welcome' =>
  isPartnerAccount(s) ? '/community-portal' : onboardingPath()

/** Signed-in required (/onboarding). A phone has its own onboarding instead. */
export async function requireSession(): Promise<void> {
  const session = await currentSession()
  if (!session) throw redirect({ to: '/login' })
  if (isPartnerAccount(session)) throw redirect({ to: '/community-portal' })
  if (isPhone()) throw redirect({ to: '/welcome' })
}

/**
 * Signed-in AND onboarded (/profile, app pages).
 *
 * A new account is onboarded first: on a computer by the sentence and the
 * plan, on a phone by its own three taps. After that, a phone has the
 * Community, the LaunchPad and Practice (see lib/device.ts); any other app
 * page sends them home, to the LaunchPad.
 */
export async function requireOnboarded(ctx?: GuardContext): Promise<void> {
  const session = await currentSession()
  if (!session) throw redirect({ to: '/login' })
  if (session.user.user_metadata?.onboarded !== true) {
    throw redirect({ to: notOnboardedPath(session) })
  }
  if (isPhone() && ctx && !inPhoneApp(ctx.location.pathname)) throw redirect({ to: homePath() })
  // A test answered before signing up is scored first: signing in (email or
  // Google) lands on the LaunchPad, which sends them back to it.
  const waiting = ctx?.location.pathname === '/dashboard' ? pendingAptitudeRoute() : null
  if (waiting) throw redirect({ to: waiting })
  // The programmes' published wording from the course engine (lib/liveContent.ts).
  await ensureLiveContent()
}

/**
 * An aptitude test: open to a visitor who hasn't signed up, so they can try
 * the programme before making an account (the result waits for one, lib/
 * pendingAptitude.ts). Signed in, it is like any page: onboarding first.
 */
export async function guestOrOnboarded(): Promise<void> {
  const session = await currentSession()
  if (session && session.user.user_metadata?.onboarded !== true) {
    throw redirect({ to: notOnboardedPath(session) })
  }
  await ensureLiveContent()
}

/**
 * The phone's onboarding (/welcome): the three questions for a new account,
 * answered already when they came through the AI guide. Someone signed out
 * goes to the guide; a computer has no use for it, and an account that has
 * already answered goes home.
 */
export async function requirePhoneWelcome(): Promise<void> {
  const session = await currentSession()
  if (session && isPartnerAccount(session)) throw redirect({ to: '/community-portal' })
  if (!isPhone()) throw redirect({ to: session ? '/dashboard' : '/' })
  if (!session) throw redirect({ to: '/start' })
  if (session && session.user.user_metadata?.onboarded === true) throw redirect({ to: homePath() })
}

/**
 * The site's address, '/'. On a phone it is the app's front door, not the
 * website's: someone signed in is taken to their LaunchPad, the way opening an
 * app takes you to the app, and someone signed out to the AI guide (/start).
 * On a computer a visitor meets the guide too, unless they chose the standard
 * website (lib/siteMode.ts); search engines always get the home page.
 */
export async function homeEntry(): Promise<void> {
  // A partner's confirm link can land here (the site's own address): on into the portal.
  const session = await currentSession()
  if (session && isPartnerAccount(session)) throw redirect({ to: '/community-portal' })
  // A phone has no standard website: a visitor there always meets the guide.
  if (isPhone()) throw redirect({ to: session ? homePath() : '/start' })
  if (!session && siteMode() === 'ai' && !isBot()) throw redirect({ to: '/start' })
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
    throw redirect({ to: notOnboardedPath(session) })
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
  await ensureLiveContent()
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
