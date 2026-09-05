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

export interface MentorApplicationInput {
  full_name: string
  headline: string
  bio: string
  location?: string
  expertise: string[]
  linkedin_url?: string
  email: string
  phone?: string
  motivation?: string
}

const blankToNull = (v: string | undefined) => {
  const t = (v ?? '').trim()
  return t === '' ? null : t
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
 * Submit an application. Works signed out — mentors are outside parties who
 * shouldn't need a learner account first.
 *
 * No `.select()` on the way out: the insert policy lets anyone write, but only
 * admins can read the table back, so asking for the inserted row would fail.
 */
export async function submitMentorApplication(input: MentorApplicationInput): Promise<void> {
  const { error } = await supabase.from('mentor_applications').insert({
    full_name: input.full_name.trim(),
    headline: input.headline.trim(),
    bio: input.bio.trim(),
    location: blankToNull(input.location),
    expertise: input.expertise.map((e) => e.trim()).filter(Boolean).slice(0, 10),
    linkedin_url: blankToNull(input.linkedin_url),
    email: input.email.trim(),
    phone: blankToNull(input.phone),
    motivation: blankToNull(input.motivation),
  })
  if (error) raise(error)
}

export async function fetchMentors(): Promise<Mentor[]> {
  const { data, error } = await supabase
    .from('mentors')
    .select('id, full_name, headline, bio, location, expertise, linkedin_url, avatar_url, profile_id')
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: true })
  if (error) raise(error)
  return (data ?? []) as Mentor[]
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

/** Flips the status and publishes the listing in one transaction. */
export async function approveMentorApplication(id: string): Promise<void> {
  const { error } = await supabase.rpc('approve_mentor_application', { app_id: id })
  if (error) raise(error)
}

/** Also unpublishes, so reversing an approval is a single action. */
export async function rejectMentorApplication(id: string, note?: string): Promise<void> {
  const { error } = await supabase.rpc('reject_mentor_application', {
    app_id: id,
    note: blankToNull(note),
  })
  if (error) raise(error)
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
