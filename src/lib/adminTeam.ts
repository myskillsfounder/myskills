/**
 * The internal team's access to /admin, managed from the admin panel — see
 * docs/supabase-admin-team.sql. Only a full admin can read or change it; the
 * database checks that, and that access only goes to @myskills.org.in accounts.
 */
import { supabase } from './supabase'
import type { StaffSection } from './staffAccess'

export const TEAM_DOMAIN = '@myskills.org.in'

/** Every section a team member can be given, grouped as the sidebar is, with
 *  what it opens in plain words. */
export const SECTION_GROUPS: { label: string; sections: { id: StaffSection; label: string; opens: string }[] }[] = [
  {
    label: 'Home',
    sections: [{ id: 'overview', label: 'Dashboard numbers', opens: 'Scores, trends and programme progress on the Dashboard' }],
  },
  {
    label: 'Team & access',
    sections: [
      { id: 'portal-access', label: 'Portal access & usage', opens: 'Verifying partners and giving them Community portal access' },
    ],
  },
  {
    label: 'Students',
    sections: [
      { id: 'users', label: 'Students', opens: 'All students and their records, aptitude, practice and foundation results' },
      { id: 'verification', label: 'Verification', opens: 'Checking a student’s identity and their verified items' },
    ],
  },
  {
    label: 'Programmes',
    sections: [
      { id: 'mentor-reviews', label: 'Projects & sessions', opens: 'Projects to grade, modules and answers, live sessions' },
      { id: 'certificates', label: 'Certificates', opens: 'Certificates issued' },
      { id: 'assessment', label: 'Foundation questions', opens: 'Editing the foundation assessment' },
      { id: 'leads', label: 'Global Leadership leads', opens: 'People who asked about the Global Leadership Programme' },
    ],
  },
  {
    label: 'Internships',
    sections: [
      {
        id: 'partner-leads',
        label: 'Internships',
        opens: 'Every company, their roles, applications and sign-offs; approving roles and confirming internships',
      },
    ],
  },
  {
    label: 'Mentors',
    sections: [{ id: 'mentors', label: 'Mentors', opens: 'Mentor applications, listings and profiles' }],
  },
  {
    label: 'Institutions',
    sections: [
      { id: 'institution-partners', label: 'Institutions', opens: 'Institution applications and listings' },
      { id: 'demo-requests', label: 'Institution leads', opens: 'Students interested in an institution: calls, visits, enrolment' },
    ],
  },
  {
    label: 'Wellness',
    sections: [{ id: 'wellness', label: 'Wellness & career guidance', opens: 'Students’ private support requests' }],
  },
  {
    label: 'Site',
    sections: [
      { id: 'blog', label: 'Blog', opens: 'Writing and publishing posts' },
      { id: 'ads', label: 'Ads', opens: 'The banners students see' },
      { id: 'feedback', label: 'Feedback', opens: 'What students said about the app' },
    ],
  },
]

export const ALL_SECTIONS: StaffSection[] = SECTION_GROUPS.flatMap((g) => g.sections.map((s) => s.id))

export const sectionLabel = (id: string) =>
  SECTION_GROUPS.flatMap((g) => g.sections).find((s) => s.id === id)?.label ?? id

/** Starting points, so giving access is one click for the usual cases. */
export const PRESETS: { label: string; hint: string; sections: StaffSection[] }[] = [
  {
    label: 'Operations',
    hint: 'Day-to-day: students, verification, partners, internships, leads, blog and feedback',
    sections: ['overview', 'users', 'verification', 'portal-access', 'partner-leads', 'leads', 'demo-requests', 'blog', 'feedback'],
  },
  {
    label: 'Programmes',
    hint: 'Grading and content: students, projects, certificates, foundation questions',
    sections: ['overview', 'users', 'mentor-reviews', 'certificates', 'assessment'],
  },
  {
    label: 'Content',
    hint: 'The site only: blog, ads and feedback',
    sections: ['blog', 'ads', 'feedback'],
  },
  { label: 'Everything', hint: 'Every section (still not a full admin: can’t manage the team)', sections: ALL_SECTIONS },
]

export interface TeamMember {
  user_id: string
  email: string
  full_name: string | null
  is_admin: boolean
  sections: StaffSection[]
  last_sign_in_at: string | null
}

function fail(error: { message?: string }): never {
  throw new Error(error.message?.trim() || 'Something went wrong.')
}

/** Null (not an error) until docs/supabase-admin-team.sql is run. */
export async function fetchTeam(): Promise<TeamMember[] | null> {
  const { data, error } = await supabase.rpc('admin_team')
  if (error) {
    if (error.code === 'PGRST202') return null
    fail(error)
  }
  return (data ?? []) as TeamMember[]
}

/** Replaces what this person can open. An empty list removes their access. */
export async function setStaffAccess(email: string, sections: StaffSection[]): Promise<void> {
  const { error } = await supabase.rpc('admin_set_staff_access', { p_email: email.trim(), p_sections: sections })
  if (error) fail(error)
}

/* -- team members and roles (docs/supabase-team-and-roles.sql) ------------- */

/** A named set of sections, given to team members as one. */
export interface StaffRole {
  id: string
  name: string
  description: string | null
  sections: StaffSection[]
  /** How many team members have it. */
  members: number
}

/** A full admin, or a team member, including an email with no account yet. */
export interface TeamMemberV2 {
  email: string
  user_id: string | null
  full_name: string | null
  is_admin: boolean
  /** False until they sign up with this email; their access starts then. */
  has_account: boolean
  role_id: string | null
  role_name: string | null
  sections: StaffSection[]
  last_sign_in_at: string | null
  added_at: string | null
}

/** Null (not an error) until the SQL is run: the page then works as before. */
export async function fetchTeamMembers(): Promise<TeamMemberV2[] | null> {
  const { data, error } = await supabase.rpc('admin_team_members')
  if (error) {
    if (error.code === 'PGRST202') return null
    fail(error)
  }
  return (data ?? []) as TeamMemberV2[]
}

export async function fetchStaffRoles(): Promise<StaffRole[]> {
  const { data, error } = await supabase.rpc('admin_staff_roles')
  if (error) fail(error)
  return (data ?? []) as StaffRole[]
}

/** Create a role (id null) or change one; everyone with it follows. */
export async function saveStaffRole(id: string | null, name: string, description: string, sections: StaffSection[]): Promise<void> {
  const { error } = await supabase.rpc('admin_save_staff_role', {
    p_id: id,
    p_name: name,
    p_description: description,
    p_sections: sections,
  })
  if (error) fail(error)
}

/** Its members keep exactly what they had, as their own sections. */
export async function deleteStaffRole(id: string): Promise<void> {
  const { error } = await supabase.rpc('admin_delete_staff_role', { p_id: id })
  if (error) fail(error)
}

/** Add someone, or change them: a role, or (roleId null) their own sections. */
export async function setTeamMember(email: string, roleId: string | null, sections: StaffSection[]): Promise<void> {
  const { error } = await supabase.rpc('admin_set_team_member', {
    p_email: email.trim(),
    p_role: roleId,
    p_sections: sections,
  })
  if (error) fail(error)
}

export async function removeTeamMember(email: string): Promise<void> {
  const { error } = await supabase.rpc('admin_remove_team_member', { p_email: email.trim() })
  if (error) fail(error)
}

/* -- the Dashboard's trends ------------------------------------------------ */

export interface DashboardExtra {
  days: { day: string; signups: number; active: number }[] | null
  weeks: { new_this_week: number; new_last_week: number; active_this_week: number; active_last_week: number } | null
  community: {
    mentors_listed: number
    mentors_taking: number
    institutions_listed: number
    partner_accounts: number
    signups_waiting: number
    students_with_mentor: number
    mentor_requests_waiting: number
    students_with_provider: number
    sessions_30d: number
  } | null
  recent: { id: string; name: string | null; created_at: string }[] | null
}

/** Null when the SQL isn't run yet, or the account has no Dashboard numbers. */
export async function fetchDashboardExtra(): Promise<DashboardExtra | null> {
  const { data, error } = await supabase.rpc('admin_dashboard_extra')
  if (error) {
    if (error.code === 'PGRST202') return null
    fail(error)
  }
  return (data as DashboardExtra | null) ?? null
}

export interface DashboardAnalytics {
  users: { students: number; returning: number; returning_30d: number; active_30d: number } | null
  programmes: { dm: number; gl: number } | null
  leads: { institution_total: number; institution_open: number; institution_enrolled: number; gl_total: number } | null
}

/** Returning users and the other Dashboard totals (docs/supabase-admin-analytics.sql); null until that is run. */
export async function fetchDashboardAnalytics(): Promise<DashboardAnalytics | null> {
  const { data, error } = await supabase.rpc('admin_dashboard_analytics')
  if (error) return null
  return (data as DashboardAnalytics | null) ?? null
}
