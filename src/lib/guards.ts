import { redirect } from '@tanstack/react-router'
import { supabase } from './supabase'

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

/** Guest-only routes (/login, /signup): send signed-in users to their profile. */
export async function requireGuest(): Promise<void> {
  if (await currentSession()) throw redirect({ to: '/profile' })
}

/** Signed-in required (/onboarding). */
export async function requireSession(): Promise<void> {
  if (!(await currentSession())) throw redirect({ to: '/login' })
}

/** Signed-in AND onboarded (/profile, app pages). */
export async function requireOnboarded(): Promise<void> {
  const session = await currentSession()
  if (!session) throw redirect({ to: '/login' })
  if (session.user.user_metadata?.onboarded !== true) {
    throw redirect({ to: '/onboarding' })
  }
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
    throw redirect({ to: '/onboarding' })
  }
}
