/**
 * Test-attempt persistence — append-only history + a best-score view, exactly
 * like practiceResults. See docs/supabase-tests.sql.
 */
import { supabase } from './supabase'
import type { TestGrade } from './tests'

export interface TestTrackBest {
  track_slug: string
  percent: number
  passed: boolean
  attempts: number
  last_attempt_at: string
}

/** keyed by skill-track slug */
export type TestSummary = Record<string, TestTrackBest>

export async function fetchTestSummary(): Promise<TestSummary> {
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return {}

  const { data, error } = await supabase
    .from('test_best_scores')
    .select('track_slug, percent, passed, attempts, last_attempt_at')
    .eq('profile_id', user.id)
  if (error) throw error

  const summary: TestSummary = {}
  for (const row of data ?? []) summary[row.track_slug] = row
  return summary
}

/** Record one test attempt (always an insert — history is never overwritten). */
export async function recordTestAttempt(track: string, grade: TestGrade): Promise<void> {
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error('You are not signed in.')

  const { error } = await supabase.from('test_attempts').insert({
    profile_id: user.id,
    track_slug: track,
    correct: grade.correct,
    total: grade.total,
    percent: grade.percent,
    passed: grade.passed,
  })
  if (error) throw error
}
