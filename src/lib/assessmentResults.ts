/**
 * Initial-assessment persistence — normalized tables, NOT a JSONB blob on
 * profiles. See docs/supabase-migration-2026-07-11-normalize-assessment.sql.
 *
 *   initial_assessment_results          — one row per user (overall score)
 *   initial_assessment_category_scores  — one row per user per category
 *
 * The one-time-only rule is enforced structurally: profile_id is the primary
 * key on the results table, and (profile_id, category) is unique on the
 * category-scores table, so there is nowhere for a second attempt to go.
 */
import { useCallback, useEffect, useState } from 'react'
import { supabase } from './supabase'
import type { AssessmentGrade } from './initialAssessment'

export interface CategoryResult {
  category: string
  correct: number
  total: number
  percent: number
}

export interface AssessmentResult {
  overall: { correct: number; total: number; percent: number; completedAt: string }
  categories: CategoryResult[]
}

/** Read the signed-in user's assessment result, or null if not taken yet. */
export async function fetchInitialAssessment(): Promise<AssessmentResult | null> {
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return null

  const [overallRes, categoriesRes] = await Promise.all([
    supabase
      .from('initial_assessment_results')
      .select('correct, total, percent, completed_at')
      .eq('profile_id', user.id)
      .maybeSingle(),
    supabase
      .from('initial_assessment_category_scores')
      .select('category, correct, total, percent')
      .eq('profile_id', user.id),
  ])
  if (overallRes.error) throw overallRes.error
  if (categoriesRes.error) throw categoriesRes.error
  if (!overallRes.data) return null

  return {
    overall: {
      correct: overallRes.data.correct,
      total: overallRes.data.total,
      percent: overallRes.data.percent,
      completedAt: overallRes.data.completed_at,
    },
    categories: categoriesRes.data ?? [],
  }
}

/** Save the graded initial assessment — inserts the overall row + one row per
 * category. Called exactly once per user in practice (the UI never shows the
 * quiz again once this succeeds), but is idempotent via upsert either way. */
export async function saveInitialAssessment(grade: AssessmentGrade): Promise<AssessmentResult> {
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error('You are not signed in.')

  const completedAt = new Date().toISOString()
  const categories: CategoryResult[] = grade.byCategory.map((c) => ({
    category: c.category,
    correct: c.correct,
    total: c.total,
    percent: c.total ? Math.round((c.correct / c.total) * 100) : 0,
  }))

  const { error: overallError } = await supabase.from('initial_assessment_results').upsert({
    profile_id: user.id,
    correct: grade.correct,
    total: grade.total,
    percent: grade.percent,
    completed_at: completedAt,
  })
  if (overallError) throw overallError

  const { error: categoriesError } = await supabase
    .from('initial_assessment_category_scores')
    .upsert(
      categories.map((c) => ({
        profile_id: user.id,
        category: c.category,
        correct: c.correct,
        total: c.total,
        percent: c.percent,
      })),
      { onConflict: 'profile_id,category' },
    )
  if (categoriesError) throw categoriesError

  return {
    overall: { correct: grade.correct, total: grade.total, percent: grade.percent, completedAt },
    categories,
  }
}

/**
 * Cross-navigation + cross-reload cache so consumers (AppShell's prompt, the
 * practice and profile pages) don't each wait on a Supabase round-trip. The
 * module cache makes in-app navigation instant; the localStorage "done" flag
 * makes the very first paint after a reload instant too. A background fetch
 * always runs to keep both fresh.
 */
let assessmentCache: { result: AssessmentResult | null } | null = null
let inFlight: Promise<AssessmentResult | null> | null = null

const DONE_KEY = 'myskills.assessmentDone'

function readDoneFlag(): boolean | null {
  try {
    const v = localStorage.getItem(DONE_KEY)
    return v === null ? null : v === 'true'
  } catch {
    return null
  }
}

function writeDoneFlag(done: boolean) {
  try {
    localStorage.setItem(DONE_KEY, done ? 'true' : 'false')
  } catch {
    /* ignore (private mode, storage disabled, etc.) */
  }
}

/** Fetch once even if several hooks mount together; refreshes both caches. */
function loadAssessment(): Promise<AssessmentResult | null> {
  if (!inFlight) {
    inFlight = fetchInitialAssessment()
      .then((r) => {
        assessmentCache = { result: r }
        writeDoneFlag(r != null)
        return r
      })
      .finally(() => {
        inFlight = null
      })
  }
  return inFlight
}

/** Clear caches on sign-out so the next user does not inherit this state. */
export function clearAssessmentCache() {
  assessmentCache = null
  try {
    localStorage.removeItem(DONE_KEY)
  } catch {
    /* ignore */
  }
}

export function useInitialAssessment() {
  const [result, setResult] = useState<AssessmentResult | null>(() => assessmentCache?.result ?? null)
  const [loading, setLoading] = useState(() => assessmentCache === null)
  const [error, setError] = useState<string>()

  useEffect(() => {
    let active = true
    loadAssessment()
      .then((r) => active && setResult(r))
      .catch((e) => active && setError(e instanceof Error ? e.message : String(e)))
      .finally(() => active && setLoading(false))
    return () => {
      active = false
    }
  }, [])

  const save = useCallback(async (grade: AssessmentGrade) => {
    const updated = await saveInitialAssessment(grade)
    assessmentCache = { result: updated }
    writeDoneFlag(true)
    setResult(updated)
    return updated
  }, [])

  return { result, loading, error, save }
}

/**
 * Lightweight status for the "complete your assessment" prompt. Seeded
 * synchronously from the module cache or the persisted flag (so there is no
 * delay on navigation or reload); `null` only while the very first fetch of
 * the session is still resolving.
 */
export function useAssessmentDone(): boolean | null {
  const seed = assessmentCache ? assessmentCache.result != null : readDoneFlag()
  const [done, setDone] = useState<boolean | null>(seed)

  useEffect(() => {
    let active = true
    loadAssessment()
      .then((r) => active && setDone(r != null))
      .catch(() => {})
    return () => {
      active = false
    }
  }, [])

  return done
}
