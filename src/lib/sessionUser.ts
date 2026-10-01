import { supabase } from './supabase'

/**
 * The signed-in user, read from the session already held in the browser.
 *
 * `supabase.auth.getUser()` asks the auth server on every call — one more
 * network round trip each time. A page like the LaunchPad reads a dozen things
 * about the student, and each read used to start with one of those, so a slow
 * connection paid for them all before any real data arrived. The session is
 * the same identity (it refreshes itself when the token expires), and the
 * database checks it again on every query, so nothing here is trusted on its
 * own. A deleted or disabled account is caught separately, on app start and
 * when the tab regains focus (validateSession in lib/auth.ts).
 */
export async function sessionUser() {
  const {
    data: { session },
  } = await supabase.auth.getSession()
  return session?.user ?? null
}
