/**
 * Mentor review — stage 2 of completing a programme. See
 * docs/supabase-mentor-reviews.sql. Students only read their own rows;
 * requesting, withdrawing and deciding all go through RPCs so the
 * eligibility rules live on the server.
 */
import { useCallback, useEffect, useState } from 'react'
import { supabase } from './supabase'

export type ReviewProgramme = 'digital-marketing' | 'career-readiness'
export type MentorReviewStatus = 'requested' | 'approved' | 'changes_requested' | 'cancelled'

export interface MentorReview {
  id: string
  created_at: string
  programme: ReviewProgramme
  status: MentorReviewStatus
  student_note: string | null
  reviewer_note: string | null
  reviewed_at: string | null
}

/** Where the student stands with a programme's review, newest first. */
export type ReviewState = 'none' | 'requested' | 'approved' | 'changes_requested'

function fail(error: { message?: string }): never {
  throw new Error(error.message?.trim() || 'Something went wrong.')
}

/** The review that decides the student's state: an approval if there is one
 *  (a programme is signed off once), otherwise the latest non-cancelled row. */
export async function fetchMyMentorReview(programme: ReviewProgramme): Promise<MentorReview | null> {
  const { data, error } = await supabase
    .from('mentor_reviews')
    .select('id, created_at, programme, status, student_note, reviewer_note, reviewed_at')
    .eq('programme', programme)
    .neq('status', 'cancelled')
    .order('created_at', { ascending: false })
  // Before the SQL is run the table doesn't exist — treat that as "no review"
  // so Practice and LaunchPad keep working.
  if (error) return null
  const rows = (data ?? []) as MentorReview[]
  return rows.find((r) => r.status === 'approved') ?? rows[0] ?? null
}

export function reviewState(r: MentorReview | null): ReviewState {
  return r ? (r.status === 'cancelled' ? 'none' : r.status) : 'none'
}

export async function requestMentorReview(programme: ReviewProgramme, note: string): Promise<void> {
  const { error } = await supabase.rpc('request_mentor_review', { p_programme: programme, p_note: note })
  if (error) fail(error)
}

export async function cancelMyMentorReview(programme: ReviewProgramme): Promise<void> {
  const { error } = await supabase.rpc('cancel_my_mentor_review', { p_programme: programme })
  if (error) fail(error)
}

export function useMentorReview(programme: ReviewProgramme) {
  const [review, setReview] = useState<MentorReview | null>(null)
  const [loading, setLoading] = useState(true)

  const reload = useCallback(async () => {
    setReview(await fetchMyMentorReview(programme))
    setLoading(false)
  }, [programme])

  useEffect(() => {
    void reload()
  }, [reload])

  return { review, state: reviewState(review), loading, reload }
}

/* -- staff ---------------------------------------------------------------- */

export interface AdminMentorReview extends MentorReview {
  user_id: string
  full_name: string | null
  email: string | null
  assessment_percent: number | null
  tracks: { track: string; percent: number; attempts: number }[]
}

export async function fetchMentorReviewQueue(): Promise<AdminMentorReview[]> {
  const { data, error } = await supabase.rpc('admin_mentor_review_queue')
  if (error) fail(error)
  return (data ?? []) as AdminMentorReview[]
}

export async function decideMentorReview(
  id: string,
  decision: 'approved' | 'changes_requested',
  note: string,
): Promise<void> {
  const { error } = await supabase.rpc('admin_decide_mentor_review', {
    p_id: id,
    p_decision: decision,
    p_note: note,
  })
  if (error) fail(error)
}
