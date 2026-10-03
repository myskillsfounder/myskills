/**
 * The Community portal's resources and who may use them — see
 * docs/supabase-community-portal.sql. One sign-in for everyone who serves
 * students in Community; each person sees only the resources they were given.
 *
 * Mentors keep their own tables and screens (lib/mentorPortal.ts,
 * lib/mentorMatches.ts). The other four share one shape: a student is "with"
 * a provider, and for counsellors and career guides each session is logged as
 * a date. Nothing about what was discussed is ever stored.
 */
import { supabase } from './supabase'

export type CommunityResource = 'mentors' | 'wellness' | 'guidance' | 'internships' | 'institutions'
/** The four that work through community_access (mentors come from a mentor listing). */
export type GrantedResource = Exclude<CommunityResource, 'mentors'>

export const RESOURCE_LABEL: Record<CommunityResource, string> = {
  mentors: 'Mentors',
  wellness: 'Wellness',
  guidance: 'Career Guidance',
  internships: 'Internships',
  institutions: 'Institutions',
}

export const GRANTED_RESOURCES: GrantedResource[] = ['wellness', 'guidance', 'internships', 'institutions']

/** People log sessions with each student; organisations keep a list of who is with them. */
export const LOGS_SESSIONS: Record<GrantedResource, boolean> = {
  wellness: true,
  guidance: true,
  internships: false,
  institutions: false,
}

export const isGrantedResource = (v: unknown): v is GrantedResource =>
  typeof v === 'string' && (GRANTED_RESOURCES as string[]).includes(v)

export interface CommunityAccess {
  resource: CommunityResource
  /** The company or institution this account acts for, when it is one. */
  organisation: string | null
  /** An overview grant: every student in this resource, whoever they are with
   *  (read-only). Absent until docs/supabase-community-portal-overview.sql is run. */
  sees_all?: boolean
}

function fail(error: { message?: string }): never {
  throw new Error(error.message?.trim() || 'Something went wrong.')
}

/**
 * What the signed-in account may use. Returns null when the SQL hasn't been
 * run yet, so the portal can fall back to how it worked before (mentors only)
 * instead of locking everyone out.
 */
export async function fetchMyCommunityAccess(): Promise<CommunityAccess[] | null> {
  const { data, error } = await supabase.rpc('my_community_access')
  if (error) {
    if (error.code === 'PGRST202') return null
    fail(error)
  }
  return (data ?? []) as CommunityAccess[]
}

export interface CommunityStudent {
  id: string
  status: 'active' | 'ended'
  started_on: string
  ended_on: string | null
  student_id: string
  student_name: string | null
  student_email: string
  sessions: number
  last_session: string | null
  /** Who the student is with: shown in an overview. */
  provider_name?: string | null
  /** False when this is someone else's student, seen through an overview. */
  mine?: boolean
}

/** A student working with, or waiting on, a mentor: the Mentors overview. */
export interface MentorStudent {
  id: string
  status: 'requested' | 'active' | 'ended'
  programme: 'digital-marketing' | 'career-readiness'
  started_on: string
  student_id: string
  student_name: string | null
  student_email: string
  mentor_name: string
  sessions: number
  last_session: string | null
}

export async function fetchCommunityMentorStudents(): Promise<MentorStudent[]> {
  const { data, error } = await supabase.rpc('community_mentor_students')
  if (error) fail(error)
  return (data ?? []) as MentorStudent[]
}

export async function fetchMyCommunityStudents(resource: GrantedResource): Promise<CommunityStudent[]> {
  const { data, error } = await supabase.rpc('my_community_students', { p_resource: resource })
  if (error) fail(error)
  return (data ?? []) as CommunityStudent[]
}

export async function logCommunitySession(engagementId: string, heldOn: string): Promise<void> {
  const { error } = await supabase.rpc('log_community_session', { p_engagement: engagementId, p_held_on: heldOn })
  if (error) fail(error)
}

export async function addCommunityStudent(resource: GrantedResource, email: string): Promise<void> {
  const { error } = await supabase.rpc('add_community_student', { p_resource: resource, p_email: email })
  if (error) fail(error)
}

export async function endCommunityEngagement(engagementId: string): Promise<void> {
  const { error } = await supabase.rpc('end_community_engagement', { p_engagement: engagementId })
  if (error) fail(error)
}

/* -- admin ---------------------------------------------------------------- */

export interface AdminCommunityAccess {
  user_id: string
  email: string | null
  full_name: string | null
  resource: CommunityResource
  organisation: string | null
  created_at: string
  /** Students currently with them. */
  active: number
  sessions: number
  sees_all?: boolean
}

export async function fetchAdminCommunityAccess(): Promise<AdminCommunityAccess[]> {
  const { data, error } = await supabase.rpc('admin_community_access')
  if (error) {
    if (error.code === 'PGRST202') {
      throw new Error('The Community portal isn’t set up yet — run docs/supabase-community-portal.sql in Supabase.')
    }
    fail(error)
  }
  return (data ?? []) as AdminCommunityAccess[]
}

/** `seesAll` grants an overview: every student in the resource, read-only. */
export async function grantCommunityAccess(
  email: string,
  resource: CommunityResource,
  organisation: string,
  seesAll: boolean,
): Promise<void> {
  const { error } = await supabase.rpc('admin_grant_community_access', {
    p_email: email,
    p_resource: resource,
    p_organisation: organisation,
    p_sees_all: seesAll,
  })
  if (error) {
    if (error.code === 'PGRST202') {
      throw new Error('Run docs/supabase-community-portal-overview.sql in Supabase to grant access from here.')
    }
    fail(error)
  }
}

export async function revokeCommunityAccess(userId: string, resource: CommunityResource): Promise<void> {
  const { error } = await supabase.rpc('admin_revoke_community_access', { p_user: userId, p_resource: resource })
  if (error) fail(error)
}

/** A counsellor or career guide a request can be handed to. */
export interface SupportProvider {
  user_id: string
  full_name: string | null
  email: string | null
  resource: 'wellness' | 'guidance'
  /** Students currently with them. */
  active: number
}

/** Empty (not an error) until the SQL is run, so the requests page keeps working. */
export async function fetchSupportProviders(): Promise<SupportProvider[]> {
  const { data, error } = await supabase.rpc('support_providers')
  if (error) return []
  return (data ?? []) as SupportProvider[]
}

/** request id -> the person it was assigned to. */
export async function fetchRequestAssignments(): Promise<Record<string, string>> {
  const { data, error } = await supabase.rpc('support_request_assignments')
  if (error) return {}
  const out: Record<string, string> = {}
  for (const r of (data ?? []) as { request_id: string; provider_name: string | null }[]) {
    out[r.request_id] = r.provider_name ?? 'Assigned'
  }
  return out
}

/** Hand a counselling or career-guidance request to one person. */
export async function assignSupportRequest(requestId: string, providerId: string): Promise<void> {
  const { error } = await supabase.rpc('admin_assign_support_request', { p_request: requestId, p_provider: providerId })
  if (error) fail(error)
}

/** Which Community resources one student is using: names and counts, never content. */
export interface CommunityUsage {
  student_id: string
  full_name: string | null
  email: string | null
  mentors: string | null
  mentor_sessions: number
  wellness_active: boolean
  wellness_sessions: number
  guidance_active: boolean
  guidance_sessions: number
  internship: string | null
  institution: string | null
}

export async function fetchCommunityUsage(): Promise<CommunityUsage[]> {
  const { data, error } = await supabase.rpc('admin_community_usage')
  if (error) fail(error)
  return (data ?? []) as CommunityUsage[]
}

/* -- one student's record -------------------------------------------------- */

/** What the signed-in account may see of a student, set by how they work with
 *  them (docs/supabase-community-portal-record.sql): a mentor or career guide
 *  sees everything below; a company or institution sees contact, progress and
 *  certificates; a counsellor sees contact and their own session dates. */
export type RecordLevel = 'full' | 'progress' | 'contact'

export interface RecordRelationship {
  resource: CommunityResource
  provider: string | null
  status: 'requested' | 'active' | 'ended'
  programme: 'digital-marketing' | 'career-readiness' | null
  started_on: string
  ended_on: string | null
  /** Whether it is the signed-in account's own student (an overview sees others'). */
  mine: boolean
  sessions: number
  last_session: string | null
}

export interface StudentRecord {
  level: RecordLevel
  student: {
    id: string
    full_name: string | null
    email: string
    phone: string | null
    location: string | null
    headline: string | null
    avatar_url: string | null
    career_stage: string | null
    joined_on: string
  }
  relationships: RecordRelationship[]
  /** The Career Readiness Score as stored, with its parts. Null below 'progress' or before the student has one. */
  progress: {
    score: number
    computed_at: string
    method_version?: string
    personal?: { points: number; max: number; modules_done?: number; held?: number; project_points?: number; project_status?: string | null }
    professional?: {
      points: number
      max: number
      tracks_passed?: number
      foundation_percent?: number | null
      held?: number
      project_points?: number
      project_status?: string | null
    }
    internship?: { points: number; max: number }
  } | null
  certificates: { title: string; kind: 'gold' | 'silver' | 'bronze'; percent: number; issued_at: string }[]
  assessments: { digital_marketing: boolean; career_readiness: boolean; foundation_percent: number | null } | null
  sessions: { date: string; resource: CommunityResource; provider: string | null; title: string | null }[]
}

export async function fetchStudentRecord(studentId: string): Promise<StudentRecord> {
  const { data, error } = await supabase.rpc('community_student_record', { p_student: studentId })
  if (error) {
    if (error.code === 'PGRST202') {
      throw new Error('Student records aren’t available yet — run docs/supabase-community-portal-record.sql in Supabase.')
    }
    fail(error)
  }
  return data as StudentRecord
}

/* -- overview: the people and organisations behind each section ------------ */

/** A mentor listing with its status and how many students are active with them. */
export interface CommunityMentor {
  id: string
  full_name: string
  headline: string
  expertise: string[]
  avatar_url: string | null
  /** An account is linked, so they can sign in to the portal. */
  linked: boolean
  /** Profile complete, so students are offered them. */
  ready: boolean
  accepting: boolean
  active: number
  waiting: number
  ended: number
  sessions: number
}

/** Null (not an error) until docs/supabase-community-portal-providers.sql is run. */
export async function fetchCommunityMentors(): Promise<CommunityMentor[] | null> {
  const { data, error } = await supabase.rpc('community_mentors')
  if (error) {
    if (error.code === 'PGRST202') return null
    fail(error)
  }
  return (data ?? []) as CommunityMentor[]
}

/** A counsellor, career guide, company or institution that has portal access. */
export interface CommunityProvider {
  user_id: string
  full_name: string | null
  email: string | null
  organisation: string | null
  since: string
  active: number
  ended: number
  sessions: number
  last_session: string | null
}

export async function fetchCommunityProviders(resource: GrantedResource): Promise<CommunityProvider[] | null> {
  const { data, error } = await supabase.rpc('community_providers', { p_resource: resource })
  if (error) {
    if (error.code === 'PGRST202') return null
    fail(error)
  }
  return (data ?? []) as CommunityProvider[]
}
