/**
 * The mentor portal — see docs/supabase-mentor-portal.sql. A mentor linked to
 * their account completes their own listing (the public card students see)
 * and a private phone number, and chooses whether they're taking students.
 */
import { supabase } from './supabase'

function fail(error: { message?: string }): never {
  throw new Error(error.message?.trim() || 'Something went wrong.')
}

export interface MyMentorProfile {
  id: string
  full_name: string
  headline: string
  bio: string
  location: string | null
  expertise: string[]
  linkedin_url: string | null
  avatar_url: string | null
  /** Private — only this mentor and staff can read it. */
  phone: string | null
  /** The sign-in email. Never shown publicly. */
  email: string
  accepting: boolean
  /** Profile complete: students are only offered mentors who are. */
  ready: boolean
  /** Required fields still empty: 'bio' | 'expertise' | 'linkedin' | 'phone'. */
  missing: string[]
}

/** The signed-in user's mentor profile, or null if they aren't a linked mentor. */
export async function fetchMyMentorProfile(): Promise<MyMentorProfile | null> {
  const { data, error } = await supabase.rpc('my_mentor_profile')
  if (error) {
    // PGRST202: the function isn't there — the SQL hasn't been run yet.
    if (error.code === 'PGRST202') {
      throw new Error('The mentor portal isn’t set up yet — run docs/supabase-mentor-portal.sql in Supabase.')
    }
    fail(error)
  }
  const row = (data as MyMentorProfile[] | null)?.[0]
  return row ?? null
}

/**
 * If the team reserved this account's email on a mentor listing, link the two
 * now — see docs/supabase-mentor-invite.sql. True when it did. Never throws:
 * it runs as the portal opens, and "nothing to claim" is the usual answer.
 */
export async function claimMentorInvite(): Promise<boolean> {
  const { data, error } = await supabase.rpc('claim_mentor_invite')
  return !error && data === true
}

export interface MentorProfileInput {
  headline: string
  bio: string
  location: string
  expertise: string[]
  linkedin_url: string
  phone: string
  avatar_url: string | null
}

export async function saveMyMentorProfile(p: MentorProfileInput): Promise<void> {
  const { error } = await supabase.rpc('update_my_mentor_profile', {
    p_headline: p.headline,
    p_bio: p.bio,
    p_location: p.location,
    p_expertise: p.expertise,
    p_linkedin: p.linkedin_url,
    p_phone: p.phone,
    p_avatar: p.avatar_url ?? '',
  })
  if (error) fail(error)
}

export async function setAccepting(on: boolean): Promise<void> {
  const { error } = await supabase.rpc('set_my_mentor_accepting', { p_on: on })
  if (error) fail(error)
}
