/**
 * Initial-assessment persistence — normalized tables, NOT a JSONB blob on
 * profiles. See docs/supabase-migration-2026-07-11-normalize-assessment.sql
 * for the tables, and docs/supabase-server-side-grading.sql for how they get
 * written now (grade_initial_assessment, not the client).
 *
 *   initial_assessment_results          — one row per user (overall score)
 *   initial_assessment_category_scores  — one row per user per category
 *
 * profile_id is the primary key on the results table (and (profile_id,
 * category) unique on the category-scores table), so there's structurally
 * nowhere for a second row to go — but the real one-time-only enforcement is
 * the RPC's own already-graded check, since the client has no write access
 * to these tables at all anymore.
 */
import { useCallback, useEffect, useState } from 'react'
import { errorMessage } from '@/lib/errors'
import { supabase } from './supabase'

export interface CategoryResult {
  category: string
  correct: number
  total: number
  percent: number
}

export interface QuizGradeResult {
  correct: number
  total: number
  percent: number
  byCategory: { category: string; correct: number; total: number }[]
  /** question id -> the correct option index + why. Only ever populated
   *  after grading — see grade_initial_assessment in
   *  docs/supabase-server-side-grading.sql. */
  review: Record<string, { correctIndex: number; explanation: string }>
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

/**
 * Grade the initial assessment. This is the ONLY way scores get written —
 * grade_initial_assessment (docs/supabase-server-side-grading.sql) grades
 * server-side against an answer key the client never sees, persists the
 * result and the certificate atomically, and rejects a second attempt.
 * There is no client-facing INSERT policy on any of those tables anymore.
 */
export async function submitInitialAssessment(
  answers: Record<string, number>,
): Promise<QuizGradeResult> {
  const { data, error } = await supabase.rpc('grade_initial_assessment', { answers })
  if (error) throw error
  return data as QuizGradeResult
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
      .catch((e) => active && setError(errorMessage(e)))
      .finally(() => active && setLoading(false))
    return () => {
      active = false
    }
  }, [])

  // Grades + persists server-side. Deliberately does NOT touch the cache —
  // the caller shows the result/review screen first, and only calls commit()
  // once the user dismisses it, so the "quiz already done" view doesn't
  // swap in underneath them before they've seen their score.
  const submit = useCallback((answers: Record<string, number>) => {
    return submitInitialAssessment(answers)
  }, [])

  const commit = useCallback((graded: QuizGradeResult) => {
    const updated: AssessmentResult = {
      overall: {
        correct: graded.correct,
        total: graded.total,
        percent: graded.percent,
        completedAt: new Date().toISOString(),
      },
      categories: graded.byCategory.map((c) => ({
        ...c,
        percent: c.total ? Math.round((c.correct / c.total) * 100) : 0,
      })),
    }
    assessmentCache = { result: updated }
    writeDoneFlag(true)
    setResult(updated)
  }, [])

  return { result, loading, error, submit, commit }
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
