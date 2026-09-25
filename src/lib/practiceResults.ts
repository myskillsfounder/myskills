/**
 * Practice-attempt persistence — normalized, append-only table, NOT a JSONB
 * blob on profiles. See docs/supabase-migration-2026-07-11-normalize-assessment.sql.
 *
 *   practice_attempts     — one row PER ATTEMPT (full history, never overwritten),
 *                           written only by submit_practice_attempt()
 *   practice_best_scores  — a view: a track's score is the best of the last 3
 *                           attempts, plus the all-time attempt count (RLS
 *                           applies via the underlying table)
 */
import { supabase } from './supabase'
import type { ScenarioGrade, ScenarioReview } from './decisionLabs'

export interface PracticeTrackBest {
  track_slug: string
  percent: number
  attempts: number
  last_attempt_at: string
}

/** keyed by skill-track slug (see lib/skillTracks.ts) */
export type PracticeSummary = Record<string, PracticeTrackBest>

/** Best score + attempt count per track for the signed-in user. */
export async function fetchPracticeSummary(): Promise<PracticeSummary> {
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return {}

  const { data, error } = await supabase
    .from('practice_best_scores')
    .select('track_slug, percent, attempts, last_attempt_at')
    .eq('profile_id', user.id)
  if (error) throw error

  const summary: PracticeSummary = {}
  for (const row of data ?? []) summary[row.track_slug] = row
  return summary
}

/** What the server sends back for an attempt: the grade, and per-question
 *  explanations (including the correct answers — revealed only now, after the
 *  attempt is recorded). */
export interface PracticeResult {
  grade: ScenarioGrade
  review: Record<string, ScenarioReview>
}

/**
 * Submit one practice attempt. The server grades it (answer key: docs/
 * supabase-practice-server-grading.sql), records it and returns the result —
 * the browser can no longer write a score. `answers` maps each question id to
 * the option chosen, and must cover the whole track.
 */
export async function submitPracticeAttempt(
  track: string,
  answers: Record<string, number>,
): Promise<PracticeResult> {
  const { data, error } = await supabase.rpc('submit_practice_attempt', {
    p_track: track,
    p_answers: answers,
  })
  if (error) throw new Error(error.message?.trim() || 'Something went wrong.')
  return data as PracticeResult
}
