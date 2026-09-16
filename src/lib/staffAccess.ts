/**
 * Per-section /admin access — see docs/supabase-staff-permissions.sql. A
 * full admin (`is_admin()`) passes every check; everyone else needs an
 * individual `staff_permissions` grant per section they can reach.
 */
import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from './supabase'
import { isAdmin } from './mentors'

export const STAFF_SECTIONS = [
  'users',
  'assessment',
  'certificates',
  'feedback',
  'mentors',
  'institution-partners',
  'demo-requests',
  'blog',
  'ads',
] as const

export type StaffSection = (typeof STAFF_SECTIONS)[number]

export async function myStaffSections(): Promise<StaffSection[]> {
  const { data, error } = await supabase.rpc('my_staff_sections')
  if (error) return []
  return (data ?? []) as StaffSection[]
}

export interface StaffAccess {
  /** `null` while unknown, then the real value. */
  isAdmin: boolean | null
  /** `null` while unknown, then the caller's granted sections (all 9 for an admin). */
  sections: StaffSection[] | null
}

/** `{ isAdmin: null, sections: null }` while unknown. Two RPCs, once per
 *  /admin page load — kept separate on purpose: `my_staff_sections()`
 *  returns every slug for an admin, but Overview isn't a grantable section
 *  at all (admin-only by design), so "granted all 9" must never be read as
 *  "is admin, show Overview" — that's a real distinction, not a shortcut.
 *
 * Re-checks on every auth state change, not just on mount: signing in at
 * /admin/login immediately navigates to /admin, and this layout can mount
 * before the Supabase client's session has fully settled — a check fired
 * only once on mount can win that race and land on stale/empty results with
 * no way to recover short of a manual reload. Subscribing to
 * onAuthStateChange re-runs the check once SIGNED_IN actually lands. */
export function useStaffAccess(): StaffAccess {
  const [admin, setAdmin] = useState<boolean | null>(null)
  const [sections, setSections] = useState<StaffSection[] | null>(null)

  useEffect(() => {
    let active = true
    const load = () => {
      void isAdmin().then((a) => active && setAdmin(a))
      void myStaffSections().then((s) => active && setSections(s))
    }
    load()
    const { data: sub } = supabase.auth.onAuthStateChange(() => load())
    return () => {
      active = false
      sub.subscription.unsubscribe()
    }
  }, [])

  return { isAdmin: admin, sections }
}

export const StaffAccessContext = createContext<StaffAccess>({ isAdmin: null, sections: null })

export function useStaffAccessContext(): StaffAccess {
  return useContext(StaffAccessContext)
}
