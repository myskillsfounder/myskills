/**
 * Auth service — thin, idiomatic wrapper over @supabase/supabase-js v2.
 *
 * Components read the session via `useAuthUser()` (native Session/User). This
 * module only exposes the imperative auth actions the screens call, mapping
 * Supabase errors to form-friendly `AuthError`s (field to highlight + a flag
 * for the "email not confirmed" case).
 */
import type { AuthError as SupabaseAuthError, User } from '@supabase/supabase-js'
import { supabase } from './supabase'
import { clearAssessmentCache } from './assessmentResults'
import { clearFeedbackCache } from './feedback'

/** Error the auth screens can act on: `field` highlights an input, and
 * `needsConfirmation` marks the "verify your email first" case. */
export class AuthError extends Error {
  field?: 'email' | 'password' | 'name' | 'code'
  needsConfirmation: boolean

  constructor(message: string, field?: AuthError['field'], needsConfirmation = false) {
    super(message)
    this.name = 'AuthError'
    this.field = field
    this.needsConfirmation = needsConfirmation
  }
}

function mapAuthError(error: SupabaseAuthError): AuthError {
  const code = 'code' in error ? (error.code ?? '') : ''
  switch (code) {
    case 'user_already_exists':
    case 'email_exists':
      return new AuthError('An account with this email already exists.', 'email')
    case 'invalid_credentials':
      return new AuthError('Incorrect email or password.', 'password')
    case 'email_not_confirmed':
      return new AuthError('Please verify your email to finish signing in.', undefined, true)
    case 'otp_expired':
    case 'otp_disabled':
      return new AuthError('That code has expired or is invalid. Request a new one.', 'code')
    case 'weak_password':
      return new AuthError(
        'Password must be at least 8 characters and include upper- and lower-case letters, a number, and a special character.',
        'password',
      )
    case 'over_email_send_rate_limit':
    case 'over_request_rate_limit':
      return new AuthError('Too many attempts. Please wait a moment and try again.')
    default:
      // Fallback for gotrue versions that don't set `code`.
      if (/already registered/i.test(error.message)) {
        return new AuthError('An account with this email already exists.', 'email')
      }
      if (/invalid login credentials/i.test(error.message)) {
        return new AuthError('Incorrect email or password.', 'password')
      }
      if (/token has expired or is invalid/i.test(error.message)) {
        return new AuthError('That code has expired or is invalid. Request a new one.', 'code')
      }
      return new AuthError(error.message || 'Something went wrong. Please try again.')
  }
}

export async function signUp(params: {
  name: string
  email: string
  password: string
}): Promise<void> {
  const { error } = await supabase.auth.signUp({
    email: params.email,
    password: params.password,
    options: { data: { name: params.name } },
  })
  if (error) throw mapAuthError(error)
}

/** Confirm a new account with the emailed 6-digit code. */
export async function confirmSignUp(email: string, token: string): Promise<void> {
  const { error } = await supabase.auth.verifyOtp({ email, token, type: 'signup' })
  if (error) throw mapAuthError(error)
}

/** Resend the signup confirmation code. */
export async function resendCode(email: string): Promise<void> {
  const { error } = await supabase.auth.resend({ type: 'signup', email })
  if (error) throw mapAuthError(error)
}

export async function signIn(params: { email: string; password: string }): Promise<void> {
  const { error } = await supabase.auth.signInWithPassword(params)
  if (error) throw mapAuthError(error)
}

/** Google OAuth. Requires the Google provider configured in Supabase. */
export async function signInWithGoogle(): Promise<void> {
  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${window.location.origin}/profile`,
      // Always show Google's account chooser instead of silently reusing the
      // browser's active Google session. Use 'consent select_account' to also
      // re-prompt for permissions.
      queryParams: { prompt: 'select_account' },
    },
  })
  if (error) throw mapAuthError(error)
}

/** Record a sign-in for admin analytics (best-effort; ignores failures). */
export async function recordLoginEvent(): Promise<void> {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return
    await supabase.from('login_events').insert({ profile_id: user.id })
  } catch {
    /* ignore — run docs/supabase-login-events.sql to enable login tracking */
  }
}

export async function signOut(): Promise<void> {
  clearAssessmentCache()
  clearFeedbackCache()
  await supabase.auth.signOut()
}

/** Current access token (Supabase JWT) for authenticated API calls, or null. */
export async function getAccessToken(): Promise<string | null> {
  const { data } = await supabase.auth.getSession()
  return data.session?.access_token ?? null
}

export interface OnboardingProfile {
  phone: string
  date_of_birth: string
  gender: string
  country: string
  state: string
  career_stage: string
  goals: string[]
}

/** Persist the onboarding profile and mark the user onboarded (stored in
 * Supabase user metadata for now — move to a `profiles` table later). */
export async function completeOnboarding(profile: OnboardingProfile): Promise<void> {
  const { error } = await supabase.auth.updateUser({
    data: { onboarded: true, profile },
  })
  if (error) throw mapAuthError(error)
}


export interface SessionValidation {
  /** The server-validated user, or null when signed out / invalidated. */
  user: User | null
  /** True when a cached session existed but the server rejected it (e.g. the
   * user was deleted in the Supabase dashboard, or the token was revoked). */
  wasInvalidated: boolean
}

/**
 * Authoritatively validate the current session against the Supabase server.
 *
 * `getSession()` alone only reads the locally cached token and never detects a
 * deleted/disabled user. This calls `getUser()` (a server round-trip) whenever a
 * cached session exists; if that fails, the stale session is cleared locally so
 * the app can't keep treating a deleted user as signed in.
 *
 * Genuine guests (no cached session) return immediately without a network call.
 */
export async function validateSession(): Promise<SessionValidation> {
  const {
    data: { session },
  } = await supabase.auth.getSession()
  if (!session) return { user: null, wasInvalidated: false }

  const { data, error } = await supabase.auth.getUser()
  if (error || !data.user) {
    // Cached session is no longer valid — clear it locally (no server call,
    // which would fail for an already-deleted user).
    await supabase.auth.signOut({ scope: 'local' })
    return { user: null, wasInvalidated: true }
  }
  return { user: data.user, wasInvalidated: false }
}
