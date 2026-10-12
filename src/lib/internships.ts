import { useEffect, useState } from 'react'
import { supabase } from './supabase'

/**
 * Internships through MySkills (docs/supabase-internships.sql).
 *
 * A verified company posts a role; the team approves it; a student applies;
 * the company shortlists and offers; the student accepts; when it ends the
 * company signs it off and the team confirms. Only that last step reaches the
 * Career Readiness Score. Every rule is enforced on the server: these are the
 * calls, and the words for each state.
 */

function fail(error: { message?: string }): never {
  throw new Error(error.message?.trim() || 'Something went wrong.')
}

export type RoleMode = 'remote' | 'onsite' | 'hybrid'
export const MODE_LABEL: Record<RoleMode, string> = { remote: 'Remote', onsite: 'On-site', hybrid: 'Hybrid' }

export type RoleStatus = 'pending' | 'live' | 'rejected' | 'closed'
export type ApplicationStatus =
  | 'applied'
  | 'shortlisted'
  | 'offered'
  | 'accepted'
  | 'signoff_pending'
  | 'completed'
  | 'rejected'
  | 'withdrawn'

/** What every view of a role shares. */
export interface RoleDetails {
  title: string
  description: string
  skills: string[]
  mode: RoleMode
  location: string | null
  duration_weeks: number
  stipend: string | null
  openings: number
  apply_by: string | null
}

/** "Remote · 8 weeks · Rs 5,000 a month" — the line under a role's title. */
export function roleFacts(r: Pick<RoleDetails, 'mode' | 'location' | 'duration_weeks' | 'stipend'>): string {
  const where = r.mode === 'remote' ? 'Remote' : `${MODE_LABEL[r.mode]}${r.location ? `, ${r.location}` : ''}`
  const weeks = `${r.duration_weeks} ${r.duration_weeks === 1 ? 'week' : 'weeks'}`
  return [where, weeks, r.stipend || 'Unpaid'].join(' · ')
}

export const day = (iso: string) =>
  new Date(`${iso.slice(0, 10)}T00:00:00`).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })

/* -- the student ---------------------------------------------------------- */

export interface OpenRole extends RoleDetails {
  id: string
  posted_on: string
  organisation: string
  my_application: string | null
  my_status: ApplicationStatus | null
}

/** How a student's own application reads, to them. */
export const MY_STATUS: Record<ApplicationStatus, { label: string; tone: 'neutral' | 'brand' | 'success' | 'warning' }> = {
  applied: { label: 'Applied', tone: 'brand' },
  shortlisted: { label: 'Shortlisted', tone: 'brand' },
  offered: { label: 'Offer waiting', tone: 'warning' },
  accepted: { label: 'Interning now', tone: 'success' },
  signoff_pending: { label: 'Being confirmed', tone: 'success' },
  completed: { label: 'Completed', tone: 'success' },
  rejected: { label: 'Not selected', tone: 'neutral' },
  withdrawn: { label: 'Withdrawn', tone: 'neutral' },
}

/** Empty, not an error, before the SQL is in: the Community page must still load. */
export async function fetchOpenRoles(): Promise<OpenRole[]> {
  const { data, error } = await supabase.rpc('open_internship_roles')
  if (error) return []
  return (data ?? []) as OpenRole[]
}

export interface MyApplication {
  id: string
  role_id: string
  title: string
  organisation: string
  status: ApplicationStatus
  applied_on: string
  started_on: string | null
  ended_on: string | null
  mode: RoleMode
  location: string | null
  duration_weeks: number
  stipend: string | null
}

export async function fetchMyApplications(): Promise<MyApplication[]> {
  const { data, error } = await supabase.rpc('my_internship_applications')
  if (error) return []
  return (data ?? []) as MyApplication[]
}

export async function applyForInternship(roleId: string, note: string): Promise<void> {
  const { error } = await supabase.rpc('apply_for_internship', { p_role: roleId, p_note: note })
  if (error) fail(error)
}

export async function withdrawApplication(applicationId: string): Promise<void> {
  const { error } = await supabase.rpc('withdraw_internship_application', { p_application: applicationId })
  if (error) fail(error)
}

export async function respondToOffer(applicationId: string, accept: boolean): Promise<void> {
  const { error } = await supabase.rpc('respond_internship_offer', { p_application: applicationId, p_accept: accept })
  if (error) fail(error)
}

/**
 * Has an internship of this student's been signed off and confirmed? That is
 * what completes a programme and earns the score's internship points. Read
 * from the student's own rows; false until it is known, and if the table isn't
 * there yet.
 */
export function useInternshipDone(): boolean {
  const [done, setDone] = useState(false)
  useEffect(() => {
    let active = true
    void supabase
      .from('internship_signoffs')
      .select('id', { count: 'exact', head: true })
      .then(({ count, error }) => {
        if (active && !error) setDone((count ?? 0) > 0)
      })
    return () => {
      active = false
    }
  }, [])
  return done
}

/* -- the company ---------------------------------------------------------- */

export interface CompanyRole extends RoleDetails {
  id: string
  created_at: string
  status: RoleStatus
  review_note: string | null
  applicants: number
  /** Applied, and not yet looked at. */
  waiting: number
  interning: number
}

export const ROLE_STATUS: Record<RoleStatus, { label: string; tone: 'neutral' | 'success' | 'warning' | 'danger' }> = {
  pending: { label: 'Waiting for MySkills', tone: 'warning' },
  live: { label: 'Live', tone: 'success' },
  rejected: { label: 'Needs a change', tone: 'danger' },
  closed: { label: 'Closed', tone: 'neutral' },
}

export async function fetchMyRoles(): Promise<CompanyRole[]> {
  const { data, error } = await supabase.rpc('my_internship_roles')
  if (error) fail(error)
  return (data ?? []) as CompanyRole[]
}

export interface RoleDraft extends RoleDetails {
  id: string | null
}

export async function saveRole(d: RoleDraft): Promise<void> {
  const { error } = await supabase.rpc('save_internship_role', {
    p_id: d.id,
    p_title: d.title,
    p_description: d.description,
    p_skills: d.skills,
    p_mode: d.mode,
    p_location: d.location,
    p_duration_weeks: d.duration_weeks,
    p_stipend: d.stipend,
    p_openings: d.openings,
    p_apply_by: d.apply_by,
  })
  if (error) fail(error)
}

export async function closeRole(id: string): Promise<void> {
  const { error } = await supabase.rpc('close_internship_role', { p_id: id })
  if (error) fail(error)
}

export interface Applicant {
  id: string
  status: Exclude<ApplicationStatus, 'withdrawn'>
  applied_on: string
  note: string | null
  student_id: string
  student_name: string | null
  headline: string | null
  location: string | null
  /** Null when the student has no score yet. */
  score: number | null
  certificates: string[]
  /** Shown from "shortlisted" on. */
  email: string | null
  phone: string | null
  started_on: string | null
  ended_on: string | null
  supervisor_name: string | null
  /** The team's note when a sign-off was sent back. */
  signoff_note: string | null
}

export async function fetchApplicants(roleId: string): Promise<Applicant[]> {
  const { data, error } = await supabase.rpc('internship_applicants', { p_role: roleId })
  if (error) fail(error)
  return (data ?? []) as Applicant[]
}

export async function decideApplication(applicationId: string, action: 'shortlist' | 'offer' | 'reject'): Promise<void> {
  const { error } = await supabase.rpc('decide_internship_application', { p_application: applicationId, p_action: action })
  if (error) fail(error)
}

export async function requestSignoff(applicationId: string, supervisor: string, endedOn: string): Promise<void> {
  const { error } = await supabase.rpc('request_internship_signoff', {
    p_application: applicationId,
    p_supervisor: supervisor,
    p_ended_on: endedOn,
  })
  if (error) fail(error)
}

/* -- the team -------------------------------------------------------------- */

export interface AdminRole extends RoleDetails {
  id: string
  created_at: string
  organisation: string
  company_email: string | null
  status: RoleStatus
  review_note: string | null
  applicants: number
  interning: number
}

export async function fetchAdminRoles(): Promise<AdminRole[]> {
  const { data, error } = await supabase.rpc('admin_internship_roles')
  if (error) fail(error)
  return (data ?? []) as AdminRole[]
}

export async function reviewRole(id: string, decision: 'live' | 'rejected' | 'closed', note?: string): Promise<void> {
  const { error } = await supabase.rpc('admin_review_internship_role', { p_id: id, p_decision: decision, p_note: note ?? null })
  if (error) fail(error)
}

export interface AdminSignoff {
  id: string
  status: 'signoff_pending' | 'completed'
  organisation: string
  title: string
  student_id: string
  student_name: string | null
  student_email: string | null
  supervisor_name: string | null
  started_on: string | null
  ended_on: string | null
  requested_at: string
  first_internship: boolean
}

export async function fetchAdminSignoffs(): Promise<AdminSignoff[]> {
  const { data, error } = await supabase.rpc('admin_internship_signoffs')
  if (error) fail(error)
  return (data ?? []) as AdminSignoff[]
}

export async function confirmSignoff(applicationId: string, confirm: boolean, note?: string): Promise<void> {
  const { error } = await supabase.rpc('admin_confirm_internship_signoff', {
    p_application: applicationId,
    p_confirm: confirm,
    p_note: note ?? null,
  })
  if (error) fail(error)
}
