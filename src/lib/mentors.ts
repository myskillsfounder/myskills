/**
 * Mentor onboarding: public applications, admin review, public listing.
 * See docs/supabase-mentor-onboarding.sql.
 *
 * Applications and the published listing are separate tables on purpose —
 * applications carry an email and phone number, and RLS can only filter rows,
 * not columns, so anything readable by the public would expose those too.
 */
import { useEffect, useState } from 'react'
import { supabase } from './supabase'

/** A published mentor. Everything here is world-readable by design. */
export interface Mentor {
  id: string
  full_name: string
  headline: string
  bio: string
  location: string | null
  expertise: string[]
  linkedin_url: string | null
  avatar_url: string | null
  profile_id: string | null
}

export type ApplicationStatus = 'pending' | 'approved' | 'rejected'

/** An application, as an admin sees it — includes the private contact fields. */
export interface MentorApplication extends Omit<Mentor, 'id' | 'profile_id' | 'avatar_url'> {
  id: string
  created_at: string
  status: ApplicationStatus
  reviewed_at: string | null
  review_note: string | null
  email: string
  phone: string | null
  motivation: string | null
}

/**
 * Supabase rejects with a plain `{ message, details, hint, code }` object, not
 * an Error. Callers that do the usual `e instanceof Error ? e.message : String(e)`
 * would render "[object Object]", so normalise here and every caller gets a
 * readable message.
 */
function raise(error: { message?: string; hint?: string | null } | null): never {
  const message = error?.message?.trim()
  throw new Error(
    message ? (error?.hint ? `${message} (${error.hint})` : message) : 'Something went wrong.',
  )
}

/**
 * The mentors students (and the public pages) are shown: an account behind
 * the listing, and a profile the mentor has finished. A mentor the team has
 * just verified isn't shown until they've written their profile in the portal.
 */
export async function fetchMentors(): Promise<Mentor[]> {
  const cols = 'id, full_name, headline, bio, location, expertise, linkedin_url, avatar_url, profile_id'
  const { data, error } = await supabase
    .from('mentors')
    .select(cols)
    .not('profile_id', 'is', null)
    .eq('ready', true)
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: true })
  if (!error) return (data ?? []) as Mentor[]

  // 42703: no `ready` column yet (the portal SQL isn't run). Fall back to
  // every mentor with an account rather than showing nobody.
  if (error.code !== '42703') raise(error)
  const legacy = await supabase
    .from('mentors')
    .select(cols)
    .not('profile_id', 'is', null)
    .order('sort_order', { ascending: true })
  if (legacy.error) raise(legacy.error)
  return (legacy.data ?? []) as Mentor[]
}

/** Admin only — returns nothing for everyone else, since RLS filters the rows. */
export async function fetchMentorApplications(
  status?: ApplicationStatus,
): Promise<MentorApplication[]> {
  let query = supabase
    .from('mentor_applications')
    .select(
      'id, created_at, status, reviewed_at, review_note, full_name, headline, bio, location, expertise, linkedin_url, email, phone, motivation',
    )
    .order('created_at', { ascending: false })
  if (status) query = query.eq('status', status)

  const { data, error } = await query
  if (error) raise(error)
  return (data ?? []) as MentorApplication[]
}

/** A mentor, as staff see them: the account behind them, and whether their
 *  profile is finished (students only see them once it is). */
export interface ListedMentor {
  id: string
  full_name: string
  headline: string
  expertise: string[]
  created_at: string
  linked: boolean
  account_email: string | null
  account_name: string | null
  /** From docs/supabase-mentor-portal.sql — absent until that's run. */
  ready?: boolean
  accepting?: boolean
  /** Required profile items still empty: 'bio' | 'expertise' | 'linkedin' | 'phone'. */
  missing?: string[]
}

/** Staff with the Mentors section only. See docs/supabase-mentor-link.sql. */
export async function fetchListedMentors(): Promise<ListedMentor[]> {
  const { data, error } = await supabase.rpc('admin_listed_mentors')
  if (error) {
    // PGRST202: the function isn't there — the SQL hasn't been run yet.
    if (error.code === 'PGRST202') {
      throw new Error('Linking isn’t set up yet — run docs/supabase-mentor-link.sql in Supabase.')
    }
    raise(error)
  }
  return (data ?? []) as ListedMentor[]
}

/** Removes the listing and the account's mentor section. Refused while they have students. */
export async function removeMentor(mentorId: string): Promise<void> {
  const { error } = await supabase.rpc('admin_remove_mentor', { p_mentor: mentorId })
  if (error) {
    if (error.code === 'PGRST202') {
      throw new Error('Run docs/supabase-mentors-verified-only.sql in Supabase to remove mentors from here.')
    }
    raise(error)
  }
}

export async function isAdmin(): Promise<boolean> {
  const { data, error } = await supabase.rpc('is_admin')
  if (error) return false
  return data === true
}

/** `null` while unknown, then true/false. Guards the review screen's chrome —
 *  the real enforcement is RLS, this only decides what to render. */
export function useIsAdmin(): boolean | null {
  const [admin, setAdmin] = useState<boolean | null>(null)

  useEffect(() => {
    let active = true
    void isAdmin().then((a) => active && setAdmin(a))
    return () => {
      active = false
    }
  }, [])

  return admin
}
