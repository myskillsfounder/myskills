/**
 * Mentor review — stage 2 of completing a programme: the capstone project. See
 * docs/supabase-mentor-reviews.sql and docs/supabase-programme-projects.sql.
 * Students only read their own rows; submitting, withdrawing and grading all
 * go through RPCs so the eligibility rules live on the server.
 */
import { useCallback, useEffect, useMemo, useState } from 'react'
import { supabase } from './supabase'
import { shared } from './shared'
import { forgetStarted } from './startedCache'
import type { SkillKey } from './careerReadinessAssessment'
import { PROJECT_SUBMISSIONS, type ProjectStanding } from './readinessScore'

export type ReviewProgramme = 'digital-marketing' | 'career-readiness'
export type MentorReviewStatus = 'requested' | 'approved' | 'changes_requested' | 'cancelled'

/** A mentor scores each of four criteria 0-5; the total (0-20) is the project's points. */
export interface Rubric {
  relevance: number
  quality: number
  application: number
  presentation: number
}

export const RUBRIC_CRITERIA: { key: keyof Rubric; label: string; hint: string }[] = [
  { key: 'relevance', label: 'Relevance', hint: 'Does it serve the student’s stated goal?' },
  { key: 'quality', label: 'Quality and depth', hint: 'Is the work thorough and correct?' },
  { key: 'application', label: 'Applying the skills', hint: 'Does it use what the programme taught, with real decisions?' },
  { key: 'presentation', label: 'Presentation and reflection', hint: 'Is it clear, and does it say what they learned?' },
]

export interface MentorReview {
  id: string
  created_at: string
  programme: ReviewProgramme
  status: MentorReviewStatus
  student_note: string | null
  reviewer_note: string | null
  reviewed_at: string | null
  project_title: string | null
  project_summary: string | null
  project_links: string | null
  rubric: Rubric | null
  project_points: number | null
  /** Which submission this is: 1, 2 or 3. */
  attempt: number
}

/** Where the student stands with a programme's review, newest first. */
export type ReviewState = 'none' | 'requested' | 'approved' | 'changes_requested'

function fail(error: { message?: string }): never {
  throw new Error(error.message?.trim() || 'Something went wrong.')
}

/** Where a student stands with a programme's project, across all their submissions. */
export interface MentorReviewSet {
  /** The review that decides the state: the one that passed if there is one, otherwise the latest. */
  review: MentorReview | null
  /** The best grade across submissions, 0-20. */
  bestPoints: number
  /** Submissions that were graded, which is what the three-submission limit counts. */
  used: number
}

export function fetchMyMentorReview(programme: ReviewProgramme): Promise<MentorReviewSet> {
  return shared(`fetchMyMentorReview:${programme}`, () => fetchMyMentorReviewOnce(programme))
}

async function fetchMyMentorReviewOnce(programme: ReviewProgramme): Promise<MentorReviewSet> {
  const { data, error } = await supabase
    .from('mentor_reviews')
    .select(
      'id, created_at, programme, status, student_note, reviewer_note, reviewed_at, project_title, project_summary, project_links, rubric, project_points, attempt',
    )
    .eq('programme', programme)
    .neq('status', 'cancelled')
    .order('created_at', { ascending: false })
  // Before the SQL is run the columns don't exist — treat that as "no review"
  // so Practice and LaunchPad keep working.
  if (error) return { review: null, bestPoints: 0, used: 0 }
  const rows = (data ?? []) as MentorReview[]
  return {
    review: rows.find((r) => r.status === 'approved') ?? rows[0] ?? null,
    bestPoints: rows.reduce((best, r) => Math.max(best, r.project_points ?? 0), 0),
    used: rows.filter((r) => r.status === 'approved' || r.status === 'changes_requested').length,
  }
}

export function reviewState(r: MentorReview | null): ReviewState {
  return r ? (r.status === 'cancelled' ? 'none' : r.status) : 'none'
}

export interface ProjectSubmission {
  title: string
  summary: string
  links: string
  note: string
}

/** Submit the programme's project for grading (this is how a review is requested). */
export async function submitProject(programme: ReviewProgramme, p: ProjectSubmission): Promise<void> {
  const { error } = await supabase.rpc('submit_programme_project', {
    p_programme: programme,
    p_title: p.title,
    p_summary: p.summary,
    p_links: p.links,
    p_note: p.note,
  })
  if (error) fail(error)
  forgetStarted()
}

export async function cancelMyMentorReview(programme: ReviewProgramme): Promise<void> {
  const { error } = await supabase.rpc('cancel_my_mentor_review', { p_programme: programme })
  if (error) fail(error)
}

export function useMentorReview(programme: ReviewProgramme) {
  const [set, setSet] = useState<MentorReviewSet>({ review: null, bestPoints: 0, used: 0 })
  const [loading, setLoading] = useState(true)

  const reload = useCallback(async () => {
    setSet(await fetchMyMentorReview(programme))
    setLoading(false)
  }, [programme])

  useEffect(() => {
    void reload()
  }, [reload])

  const state = reviewState(set.review)
  const project = useMemo<ProjectStanding>(() => ({ status: state, points: set.bestPoints }), [state, set.bestPoints])
  return {
    review: set.review,
    state,
    /** For the score: the state and the best grade. */
    project,
    /** Submissions still available, counting graded ones. */
    submissionsLeft: Math.max(0, PROJECT_SUBMISSIONS - set.used),
    loading,
    reload,
  }
}

/* -- staff ---------------------------------------------------------------- */

export interface AdminMentorReview extends MentorReview {
  user_id: string
  full_name: string | null
  email: string | null
  assessment_percent: number | null
  tracks: { track: string; percent: number; attempts: number }[]
  /** The learner's Career Readiness assessment, or null if not taken yet. */
  career_readiness: {
    scores: Record<SkillKey, number>
    reflection: string | null
    completed_at: string
  } | null
}

export async function fetchMentorReviewQueue(): Promise<AdminMentorReview[]> {
  const { data, error } = await supabase.rpc('admin_mentor_review_queue')
  if (error) fail(error)
  return (data ?? []) as AdminMentorReview[]
}

/** Grade a project. The server derives the decision: 8 or more of 20 passes. */
export async function gradeMentorReview(id: string, rubric: Rubric, note: string): Promise<void> {
  const { error } = await supabase.rpc('admin_grade_mentor_review', {
    p_id: id,
    p_relevance: rubric.relevance,
    p_quality: rubric.quality,
    p_application: rubric.application,
    p_presentation: rubric.presentation,
    p_note: note,
  })
  if (error) fail(error)
}
