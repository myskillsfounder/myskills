import { useEffect, useState } from 'react'
import type { Session, User } from '@supabase/supabase-js'
import { supabase } from './supabase'

/** Reactive Supabase session. `user` is null when signed out; `loading` is true
 * until the initial session check resolves. */
export function useAuthUser(): {
  session: Session | null
  user: User | null
  loading: boolean
} {
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      setLoading(false)
    })
    const { data: sub } = supabase.auth.onAuthStateChange((_event, next) => {
      setSession(next)
      setLoading(false)
    })
    return () => sub.subscription.unsubscribe()
  }, [])

  return { session, user: session?.user ?? null, loading }
}

/** Display name from a Supabase user's metadata, falling back to the email. */
export function userDisplayName(user: User | null): string {
  const name = user?.user_metadata?.name
  if (typeof name === 'string' && name.trim()) return name
  return user?.email?.split('@')[0] ?? 'there'
}
