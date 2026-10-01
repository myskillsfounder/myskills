/**
 * Live mentor sessions — see docs/supabase-mentor-matches.sql. A student asks a
 * mentor to work with them on one programme; the mentor sees the student's
 * aptitude report, accepts or declines, and logs each session they hold
 * (arranged outside the app). Logged sessions count as confirmed live
 * sessions in the Career Readiness Score.
 */
import { useCallback, useEffect, useState } from 'react'
import { supabase } from './supabase'
import { forgetStarted } from './startedCache'
import type { Mentor } from './mentors'

export type MatchProgramme = 'digital-marketing' | 'career-readiness'
export type MatchStatus = 'requested' | 'active' | 'declined' | 'ended' | 'cancelled'

function fail(error: { message?: string }): never {
  throw new Error(error.message?.trim() || 'Something went wrong.')
}

/* -- student -------------------------------------------------------------- */

export interface StudentMatch {
  id: string
  created_at: string
  programme: MatchProgramme
  status: MatchStatus
  student_note: string | null
  mentor_note: string | null
  mentor: Pick<Mentor, 'id' | 'full_name' | 'headline' | 'avatar_url'> | null
}

/** The student's latest request or match for a programme, or null. Tolerates
 *  the table not existing yet (SQL not run). */
export async function fetchMyMatch(programme: MatchProgramme): Promise<StudentMatch | null> {
  const { data, error } = await supabase
    .from('mentor_matches')
    .select('id, created_at, programme, status, student_note, mentor_note, mentor:mentors(id, full_name, headline, avatar_url)')
    .eq('programme', programme)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()
  if (error) return null
  return (data as unknown as StudentMatch) ?? null
}

export function useMyMatch(programme: MatchProgramme) {
  const [match, setMatch] = useState<StudentMatch | null>(null)
  const [loading, setLoading] = useState(true)
  const reload = useCallback(async () => {
    setMatch(await fetchMyMatch(programme))
    setLoading(false)
  }, [programme])
  useEffect(() => {
    void reload()
  }, [reload])
  return { match, loading, reload }
}

/** Mentors a student can ask — linked to an account, with a finished profile,
 *  and taking new students (docs/supabase-mentor-portal.sql). */
export async function fetchMatchableMentors(): Promise<Mentor[]> {
  const cols = 'id, full_name, headline, bio, location, expertise, linkedin_url, avatar_url, profile_id'
  const { data, error } = await supabase
    .from('mentors')
    .select(cols)
    .not('profile_id', 'is', null)
    .eq('ready', true)
    .eq('accepting', true)
    .order('sort_order', { ascending: true })
  if (!error) return (data ?? []) as Mentor[]

  // 42703: the portal SQL isn't run yet, so there's no ready/accepting column.
  // Fall back to every linked mentor rather than showing students nobody.
  if (error.code !== '42703') fail(error)
  const legacy = await supabase
    .from('mentors')
    .select(cols)
    .not('profile_id', 'is', null)
    .order('sort_order', { ascending: true })
  if (legacy.error) fail(legacy.error)
  return (legacy.data ?? []) as Mentor[]
}

export async function requestMentor(programme: MatchProgramme, mentorId: string, note: string): Promise<void> {
  const { error } = await supabase.rpc('request_mentor', { p_programme: programme, p_mentor_id: mentorId, p_note: note })
  if (error) fail(error)
  forgetStarted()
}

/** Withdraw a waiting request, or end an active match (either side). */
export async function leaveMatch(matchId: string): Promise<void> {
  const { error } = await supabase.rpc('leave_mentor_match', { p_match: matchId })
  if (error) fail(error)
}

/* -- mentor --------------------------------------------------------------- */

export interface MentorSideMatch {
  id: string
  created_at: string
  programme: MatchProgramme
  status: MatchStatus
  student_id: string
  student_name: string | null
  student_email: string
  student_note: string | null
  mentor_note: string | null
  aptitude: { scores: Record<string, number>; reflection: string | null; completed_at: string } | null
  sessions: number
}

export async function fetchMyMentees(): Promise<MentorSideMatch[]> {
  const { data, error } = await supabase.rpc('my_mentor_matches')
  if (error) fail(error)
  return (data ?? []) as MentorSideMatch[]
}

export async function decideRequest(matchId: string, accept: boolean, note: string): Promise<void> {
  const { error } = await supabase.rpc('decide_mentor_request', { p_match: matchId, p_accept: accept, p_note: note })
  if (error) fail(error)
}

export async function logSession(matchId: string, title: string, heldOn: string): Promise<void> {
  const { error } = await supabase.rpc('log_mentor_session', { p_match: matchId, p_title: title, p_held_on: heldOn })
  if (error) fail(error)
}
