/**
 * Admin v2 data: the overview, the student list and one student's page — see
 * docs/supabase-admin-v2.sql. Every Career Readiness Score here is recomputed
 * by the server when asked, so it's today's number.
 */
import { supabase } from './supabase'
import type { ServerScore } from './scoreService'
import type { AptitudeKey } from './dmAptitude'
import type { SkillKey } from './careerReadinessAssessment'
import type { SessionProgramme } from './liveSessions'
import type { MentorReviewStatus, ReviewProgramme } from './mentorReview'

function raise(error: { message?: string } | null): never {
  throw new Error(error?.message?.trim() || 'Something went wrong.')
}

/* -- overview ------------------------------------------------------------- */

export interface AdminOverviewV2 {
  needs_action: {
    mentor_reviews: number
    verification: number
    mentor_applications: number
    institution_applications: number
    demo_requests: number
    wellness: number
    internship_leads: number
    career_readiness_leads: number
  }
  score: {
    students: number
    average: number | null
    standout: number
    strong: number
    building: number
    getting_started: number
    verified_share: number
  }
  digital_marketing: {
    aptitude: number
    practising: number
    all_tracks: number
    foundation: number
    review_asked: number
    signed_off: number
  }
  career_readiness: {
    aptitude: number
    started: number
    all_modules: number
    review_asked: number
    signed_off: number
  }
  activity: {
    total_users: number
    new_this_week: number
    active_today: number
    active_this_week: number
    practice_this_week: number
    live_sessions_this_month: number
    certificates: number
    avg_rating: number | null
  }
}

export async function fetchOverviewV2(): Promise<AdminOverviewV2> {
  const { data, error } = await supabase.rpc('admin_overview_v2')
  if (error) raise(error)
  if (!data) throw new Error('Not authorized.')
  return data as AdminOverviewV2
}

/* -- student list --------------------------------------------------------- */

export interface AdminStudent {
  id: string
  email: string
  full_name: string | null
  is_mentor: boolean
  created_at: string
  last_login: string | null
  score: number
  verified_points: number
  identity_verified: boolean
  dm_tracks: number
  /** Foundation assessment percent, or null if not taken. */
  dm_foundation: number | null
  dm_signed_off: boolean
  cr_modules: number
  cr_signed_off: boolean
}

export async function fetchStudents(search?: string): Promise<AdminStudent[]> {
  const { data, error } = await supabase.rpc('admin_students', {
    p_search: search?.trim() || null,
    p_max_rows: 200,
  })
  if (error) raise(error)
  return (data ?? []) as AdminStudent[]
}

/* -- one student ---------------------------------------------------------- */

interface AptitudeRow<K extends string> {
  scores: Record<K, number>
  reflection: string | null
  completed_at: string
}

export interface StudentDetail {
  profile: {
    id: string
    full_name: string | null
    email: string
    phone: string | null
    headline: string | null
    location: string | null
    career_stage: string | null
    is_mentor: boolean
    created_at: string
    last_login: string | null
  }
  score: (ServerScore & { identity_verified: boolean }) | null
  digital_marketing: {
    aptitude: AptitudeRow<AptitudeKey> | null
    foundation: { percent: number; correct: number; total: number; completed_at: string } | null
    certificate: { code: string; kind: string; issued_at: string } | null
    tracks: { track: string; best: number; attempts: number; last: string }[]
  }
  career_readiness: {
    aptitude: AptitudeRow<SkillKey> | null
    /** Items written per module (0-4). */
    modules: Record<string, number>
  }
  live_sessions: {
    programme: SessionProgramme
    title: string
    host_name: string
    host_kind: string
    held_on: string
  }[]
  mentor_reviews: {
    programme: ReviewProgramme
    status: MentorReviewStatus
    created_at: string
    reviewed_at: string | null
    reviewer_note: string | null
  }[]
  verification: {
    request: { status: string; created_at: string; scheduled_at: string | null } | null
    items: number
  }
}

export async function fetchStudentDetail(id: string): Promise<StudentDetail | null> {
  const { data, error } = await supabase.rpc('admin_student_detail', { p_user: id })
  if (error) raise(error)
  return (data as StudentDetail | null) ?? null
}
