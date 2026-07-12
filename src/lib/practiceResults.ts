/**
 * Practice-attempt persistence — normalized, append-only table, NOT a JSONB
 * blob on profiles. See docs/supabase-migration-2026-07-11-normalize-assessment.sql.
 *
 *   practice_attempts     — one row PER ATTEMPT (full history, never overwritten)
 *   practice_best_scores  — a view: best percent + attempt count per track,
 *                           derived from practice_attempts (RLS applies via
 *                           the underlying table, no separate policy needed)
 */
import { supabase } from './supabase'
import type { ScenarioGrade } from './decisionLabs'

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

/** Record one practice attempt (always an insert — history is never
 * overwritten; "best score" is a derived query, not stored state). */
export async function recordPracticeAttempt(
  track: string,
  grade: ScenarioGrade,
): Promise<void> {
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error('You are not signed in.')

  const { error } = await supabase.from('practice_attempts').insert({
    profile_id: user.id,
    track_slug: track,
    correct: grade.correct,
    total: grade.total,
    earned_weight: grade.earnedWeight,
    max_weight: grade.maxWeight,
    percent: grade.percent,
  })
  if (error) throw error
}
