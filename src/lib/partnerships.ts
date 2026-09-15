/**
 * Access check for the /partnerships portal — a second, narrower role than
 * full admin (see docs/supabase-partnerships-portal.sql). A full admin
 * passes this too, via has_partnerships_access() OR-ing is_admin() on the
 * server; this file only asks the one combined question.
 */
import { useEffect, useState } from 'react'
import { supabase } from './supabase'

export async function hasPartnershipsAccess(): Promise<boolean> {
  const { data, error } = await supabase.rpc('has_partnerships_access')
  if (error) return false
  return data === true
}

/** `null` while unknown, then true/false. Guards the portal's chrome — the
 *  real enforcement is RLS, this only decides what to render. */
export function useHasPartnershipsAccess(): boolean | null {
  const [access, setAccess] = useState<boolean | null>(null)

  useEffect(() => {
    let active = true
    void hasPartnershipsAccess().then((a) => active && setAccess(a))
    return () => {
      active = false
    }
  }, [])

  return access
}
