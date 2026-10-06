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
    label: 'Students',
    sections: [
      { id: 'users', label: 'Students', opens: 'All students, their records, aptitude, practice and foundation results' },
      { id: 'verification', label: 'Verification', opens: 'Checking a student’s identity and their verified items' },
    ],
  },
  {
    label: 'Programmes',
    sections: [
      { id: 'mentor-reviews', label: 'Projects & sessions', opens: 'Projects to grade, modules and answers, live sessions' },
      { id: 'certificates', label: 'Certificates', opens: 'Certificates issued' },
      { id: 'assessment', label: 'Foundation questions', opens: 'Editing the foundation assessment' },
    ],
  },
  {
    label: 'Community',
    sections: [
      { id: 'mentors', label: 'Mentors', opens: 'Mentor applications, listings and profiles' },
      { id: 'wellness', label: 'Wellness & career guidance', opens: 'Students’ private support requests' },
      { id: 'institution-partners', label: 'Institutions', opens: 'Institution applications and listings' },
      { id: 'portal-access', label: 'Portal access & usage', opens: 'Verifying partners and giving them Community portal access' },
    ],
  },
  {
    label: 'Leads',
    sections: [
      { id: 'demo-requests', label: 'Demo requests', opens: 'Institutions asking for a demo' },
      { id: 'partner-leads', label: 'Partner leads', opens: 'Internship companies and Career Readiness leads' },
    ],
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
    hint: 'Day-to-day: students, verification, partners, leads, blog and feedback',
    sections: ['overview', 'users', 'verification', 'portal-access', 'partner-leads', 'demo-requests', 'blog', 'feedback'],
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
