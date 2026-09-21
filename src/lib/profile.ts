/**
 * Profile data layer — reads/writes the Supabase `profiles` table (RLS: own row
 * only) and uploads avatar/banner images to the `profile-media` storage bucket.
 * See docs/supabase-profile-setup.sql for the schema.
 *
 * NOTE: assessment + practice results are NOT stored here anymore — they live
 * in their own normalized tables (initial_assessment_results,
 * initial_assessment_category_scores, practice_attempts). See
 * lib/assessmentResults.ts, lib/practiceResults.ts, and
 * docs/supabase-migration-2026-07-11-normalize-assessment.sql.
 */
import { supabase } from './supabase'

export interface Experience {
  id: string
  title: string
  company: string
  employmentType?: string
  location?: string
  startDate?: string
  endDate?: string
  current?: boolean
  description?: string
}

export type EducationLevel = 'class-10' | 'class-12' | 'diploma' | 'bachelors' | 'masters' | 'doctorate'

export interface Education {
  id: string
  school: string
  /** Structured level, scored by the Career Readiness Score. Older entries
   *  lack it; lib/careerProfile.ts infers one from `degree` for those. */
  level?: EducationLevel
  degree?: string
  field?: string
  startYear?: string
  endYear?: string
  description?: string
}

export interface Project {
  id: string
  title: string
  description?: string
  link?: string
  year?: string
}

export interface Profile {
  id: string
  full_name: string
  headline: string
  location: string
  avatar_url: string | null
  banner_url: string | null
  phone: string
  /** ISO date (yyyy-mm-dd) or '' — collected on the profile page, not at sign-up. */
  date_of_birth: string
  gender: string
  country: string
  state: string
  career_stage: string
  goals: string[]
  skills: string[]
  experience: Experience[]
  education: Education[]
  projects: Project[]
}

/** `date_of_birth` accepts null so clearing it writes SQL NULL, not ''. */
export type ProfilePatch = Partial<Omit<Profile, 'id' | 'date_of_birth'>> & {
  date_of_birth?: string | null
}

const COLUMNS =
  'id, full_name, headline, location, avatar_url, banner_url, phone, date_of_birth, gender, country, state, career_stage, goals, skills, experience, education'

/**
 * `projects` is read in its own query, not in COLUMNS: selecting a column that
 * doesn't exist fails the whole query, so if the page shipped before
 * docs/supabase-profile-projects.sql ran, every profile would stop loading.
 * This way a missing column costs only the projects list.
 */
async function fetchProjects(userId: string): Promise<Project[]> {
  const { data, error } = await supabase.from('profiles').select('projects').eq('id', userId).maybeSingle()
  if (error) return []
  return ((data as { projects?: Project[] } | null)?.projects as Project[]) ?? []
}

function normalize(row: Record<string, unknown>, projects: Project[] = []): Profile {
  return {
    id: String(row.id ?? ''),
    full_name: (row.full_name as string) ?? '',
    headline: (row.headline as string) ?? '',
    location: (row.location as string) ?? '',
    avatar_url: (row.avatar_url as string) ?? null,
    banner_url: (row.banner_url as string) ?? null,
    phone: (row.phone as string) ?? '',
    date_of_birth: (row.date_of_birth as string) ?? '',
    gender: (row.gender as string) ?? '',
    country: (row.country as string) ?? '',
    state: (row.state as string) ?? '',
    career_stage: (row.career_stage as string) ?? '',
    goals: (row.goals as string[]) ?? [],
    skills: (row.skills as string[]) ?? [],
    experience: (row.experience as Experience[]) ?? [],
    education: (row.education as Education[]) ?? [],
    projects,
  }
}

/** Fetch the signed-in user's profile, seeding a row from their auth metadata
 * (name + onboarding answers) on first visit. */
export async function fetchMyProfile(): Promise<Profile> {
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error('You are not signed in.')

  const { data, error } = await supabase
    .from('profiles')
    .select(COLUMNS)
    .eq('id', user.id)
    .maybeSingle()
  if (error) throw error
  if (data) return normalize(data, await fetchProjects(user.id))

  // Seed from onboarding metadata on first load. Onboarding only asks for
  // career stage + goals now; the personal-details keys are still read so
  // accounts created before that change keep their answers.
  const meta = (user.user_metadata ?? {}) as Record<string, unknown>
  const ob = (meta.profile ?? {}) as Record<string, unknown>
  const location = [ob.state, ob.country].filter(Boolean).join(', ')
  const seed = {
    id: user.id,
    full_name: (meta.name as string) ?? user.email?.split('@')[0] ?? '',
    location: location || null,
    phone: (ob.phone as string) ?? null,
    date_of_birth: (ob.date_of_birth as string) || null,
    gender: (ob.gender as string) ?? null,
    country: (ob.country as string) ?? null,
    state: (ob.state as string) ?? null,
    career_stage: (ob.career_stage as string) ?? null,
    goals: (ob.goals as string[]) ?? [],
  }
  const { data: inserted, error: insErr } = await supabase
    .from('profiles')
    .upsert(seed)
    .select(COLUMNS)
    .single()
  if (insErr) throw insErr
  return normalize(inserted)
}

export async function saveMyProfile(patch: ProfilePatch): Promise<Profile> {
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error('You are not signed in.')

  const { data, error } = await supabase
    .from('profiles')
    .update(patch)
    .eq('id', user.id)
    .select(COLUMNS)
    .single()
  if (error) {
    if (patch.projects && /projects/.test(error.message ?? '')) {
      throw new Error('Projects aren’t available yet — ask an admin to run the profile projects update.')
    }
    throw error
  }
  return normalize(data, patch.projects ?? (await fetchProjects(user.id)))
}

/** Upload an avatar/banner image to storage and return its public URL. */
export async function uploadProfileMedia(
  file: File,
  kind: 'avatar' | 'banner',
): Promise<string> {
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error('You are not signed in.')

  const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg'
  const path = `${user.id}/${kind}-${Date.now()}.${ext}`
  const { error } = await supabase.storage
    .from('profile-media')
    .upload(path, file, { upsert: true, cacheControl: '3600' })
  if (error) throw error

  const { data } = supabase.storage.from('profile-media').getPublicUrl(path)
  return data.publicUrl
}

/** Small id generator for experience/education rows. */
export function newId(): string {
  return Math.random().toString(36).slice(2, 10)
}
