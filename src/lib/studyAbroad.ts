/**
 * Study abroad (docs/supabase-study-abroad.sql): programmes to study in
 * another country, added by the team by country, and students' applications.
 */
import { supabase } from './supabase'

export type StudyStatus = 'draft' | 'open' | 'closed'
export type ApplicationStatus = 'applied' | 'in_review' | 'shortlisted' | 'offered' | 'enrolled' | 'not_selected' | 'withdrawn'

export type StudyTheme = 'violet' | 'orange' | 'teal' | 'pink' | 'blue' | 'amber'

export interface StudyProgramme {
  id: string
  slug: string
  title: string
  country: string
  /** Two letters, for the flag (docs/supabase-study-abroad-v2.sql). */
  country_code?: string | null
  /** The partner university. */
  university?: string | null
  /** Short chips on the card. */
  tags?: string[]
  /** An optional ribbon: "Most popular", "New". */
  badge?: string | null
  /** One line at the foot of the card: "Low fees". */
  highlight?: string | null
  /** Shown large at the top. */
  featured?: boolean
  theme?: StudyTheme
  field: string | null
  level: string | null
  summary: string | null
  duration: string | null
  language: string | null
  intake: string | null
  fees: string | null
  apply_by: string | null
  status: StudyStatus
  my_status?: ApplicationStatus | null
}

export interface MyStudyApplication {
  id: string
  status: ApplicationStatus
  created_at: string
  phone: string | null
  education: string | null
  english_level: string | null
  intake: string | null
  note: string | null
}

export interface StudyProgrammeFull extends StudyProgramme {
  details: string | null
  my_application: MyStudyApplication | null
}

export interface AdminStudyProgramme extends StudyProgrammeFull {
  created_at: string
  updated_at: string
  applications: number
  new: number
}

export interface AdminStudyApplication {
  id: string
  created_at: string
  updated_at: string
  status: ApplicationStatus
  programme_id: string
  programme: string
  country: string
  student_id: string
  name: string
  email: string
  phone: string | null
  education: string | null
  english_level: string | null
  intake: string | null
  note: string | null
  team_note: string | null
  reviewed_at: string | null
}

export const APPLICATION_STATUS: Record<ApplicationStatus, { label: string; tone: 'neutral' | 'brand' | 'success' | 'warning' | 'danger' }> = {
  applied: { label: 'Applied', tone: 'brand' },
  in_review: { label: 'In review', tone: 'warning' },
  shortlisted: { label: 'Shortlisted', tone: 'warning' },
  offered: { label: 'Offer', tone: 'success' },
  enrolled: { label: 'Enrolled', tone: 'success' },
  not_selected: { label: 'Not selected', tone: 'neutral' },
  withdrawn: { label: 'Withdrawn', tone: 'neutral' },
}

/** What each step means for the student. */
export const APPLICATION_NEXT: Record<ApplicationStatus, string> = {
  applied: 'We have your application. The MySkills team will contact you within a few working days.',
  in_review: 'The team is reviewing your documents and eligibility.',
  shortlisted: 'You’re shortlisted. Your mentor will help you prepare the university application and admission test.',
  offered: 'You have an offer. Next: pre-enrolment, then your study visa.',
  enrolled: 'You’re enrolled. Congratulations!',
  not_selected: 'This time it didn’t work out. Talk to a mentor about other options.',
  withdrawn: 'You withdrew this application. You can apply again while the programme is open.',
}

function fail(error: { message?: string }): never {
  throw new Error(error.message?.trim() || 'Something went wrong.')
}

/** Null until the SQL is run. */
export async function fetchStudyProgrammes(): Promise<StudyProgramme[] | null> {
  const { data, error } = await supabase.rpc('study_abroad_programmes')
  if (error) {
    if (error.code === 'PGRST202') return null
    fail(error)
  }
  return (data ?? []) as StudyProgramme[]
}

export async function fetchStudyProgramme(slug: string): Promise<StudyProgrammeFull | null> {
  const { data, error } = await supabase.rpc('study_abroad_programme', { p_slug: slug })
  if (error) {
    if (error.code === 'PGRST202') return null
    fail(error)
  }
  return (data as StudyProgrammeFull | null) ?? null
}

export interface StudyApplicationForm {
  phone: string
  education: string
  english: string
  intake: string
  note: string
}

export async function applyStudyAbroad(programmeId: string, f: StudyApplicationForm): Promise<void> {
  const { error } = await supabase.rpc('apply_study_abroad', {
    p_programme: programmeId,
    p_phone: f.phone,
    p_education: f.education,
    p_english: f.english,
    p_intake: f.intake,
    p_note: f.note,
  })
  if (error) fail(error)
}

export async function withdrawStudyAbroad(programmeId: string): Promise<void> {
  const { error } = await supabase.rpc('withdraw_study_abroad', { p_programme: programmeId })
  if (error) fail(error)
}

/* ------------------------------------------------------------ the team */

/** Null until the SQL is run. */
export async function fetchAdminStudyAbroad(): Promise<{ programmes: AdminStudyProgramme[]; applications: AdminStudyApplication[] } | null> {
  const { data, error } = await supabase.rpc('admin_study_abroad')
  if (error) {
    if (error.code === 'PGRST202') return null
    fail(error)
  }
  return data as { programmes: AdminStudyProgramme[]; applications: AdminStudyApplication[] }
}

export type StudyProgrammeDraft = Omit<StudyProgrammeFull, 'id' | 'my_application' | 'my_status'> & { id: string | null }

export async function saveStudyProgramme(p: StudyProgrammeDraft): Promise<string> {
  const { data, error } = await supabase.rpc('admin_save_study_abroad_programme', { p })
  if (error) fail(error)
  return data as string
}

export async function setStudyApplication(id: string, status: Exclude<ApplicationStatus, 'withdrawn'>, note: string): Promise<void> {
  const { error } = await supabase.rpc('admin_set_study_abroad_application', { p_id: id, p_status: status, p_note: note })
  if (error) fail(error)
}

export const dateText = (d: string | null) =>
  d ? new Date(`${d.length === 10 ? `${d}T00:00:00` : d}`).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' }) : ''
