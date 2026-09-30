/**
 * The mentor portal — see docs/supabase-mentor-portal.sql. A mentor linked to
 * their account completes their own listing (the public card students see)
 * and a private phone number, and chooses whether they're taking students.
 */
import { useEffect, useState } from 'react'
import { useRouterState } from '@tanstack/react-router'
import { supabase } from './supabase'
import { fetchMyMentees } from './mentorMatches'

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

type MentorNav = { isMentor: boolean; waiting: number }
const NOT_MENTOR: MentorNav = { isMentor: false, waiting: 0 }

// The sidebar, the page shell and the bottom bar all ask the same question on
// every page — share one lookup between them rather than making three.
let shared: { key: string; at: number; result: Promise<MentorNav> } | null = null

async function lookupMentorNav(userId: string, key: string): Promise<MentorNav> {
  if (shared && shared.key === key && Date.now() - shared.at < 3000) return shared.result
  const result = (async (): Promise<MentorNav> => {
    const { data } = await supabase.from('mentors').select('id').eq('profile_id', userId).limit(1)
    if (!data?.length) return NOT_MENTOR
    let waiting = 0
    try {
      waiting = (await fetchMyMentees()).filter((m) => m.status === 'requested').length
    } catch {
      /* the badge is a nicety — the page itself shows the error */
    }
    return { isMentor: true, waiting }
  })()
  shared = { key, at: Date.now(), result }
  return result
}

/** What the signed-in user's navigation needs to know: are they a mentor, and
 *  how many student requests are waiting on them. Refreshes on every page
 *  change, so the count is current when they come back to the app. */
export function useMentorNav(): MentorNav {
  const pathname = useRouterState({ select: (s) => s.location.pathname })
  const [state, setState] = useState<MentorNav>(NOT_MENTOR)

  useEffect(() => {
    let active = true
    void (async () => {
      // The cached session — no server round trip, unlike getUser().
      const {
        data: { session },
      } = await supabase.auth.getSession()
      if (!session) return
      const next = await lookupMentorNav(session.user.id, `${session.user.id}:${pathname}`)
      if (active) setState(next)
    })()
    return () => {
      active = false
    }
  }, [pathname])

  return state
}
