/**
 * Setting up and editing a mentor's profile from Admin — see
 * docs/supabase-admin-mentor-profiles.sql. For mentors the team lists before
 * (or without) the mentor having a MySkills account; a linked mentor keeps
 * managing their own profile in the Community portal.
 */
import { supabase } from './supabase'

export interface MentorDetails {
  id: string
  full_name: string
  headline: string
  bio: string
  location: string | null
  expertise: string[]
  linkedin_url: string | null
  avatar_url: string | null
  /** Private: shown to staff and the mentor, never to students. */
  phone: string | null
  linked: boolean
}

export interface MentorFormInput {
  full_name: string
  headline: string
  bio: string
  location: string
  /** Comma-separated, as typed. */
  expertise: string
  linkedin: string
  phone: string
  avatar: string
}

export const BIO_MIN = 20
export const BIO_MAX = 1200

function fail(error: { message?: string; code?: string }): never {
  // PGRST202: the function isn't there — the SQL hasn't been run yet.
  if (error.code === 'PGRST202') {
    throw new Error('Run docs/supabase-admin-mentor-profiles.sql in Supabase to edit mentors from here.')
  }
  throw new Error(error.message?.trim() || 'Something went wrong.')
}

export async function fetchMentorDetails(id: string): Promise<MentorDetails | null> {
  const { data, error } = await supabase.rpc('admin_mentor_details', { p_mentor: id })
  if (error) fail(error)
  return ((data as MentorDetails[] | null) ?? [])[0] ?? null
}

/** The skills field as a list: split on commas, trimmed, no blanks or repeats. */
export function parseExpertise(text: string): string[] {
  const seen = new Set<string>()
  const out: string[] = []
  for (const part of text.split(',')) {
    const t = part.trim()
    if (t && !seen.has(t.toLowerCase())) {
      seen.add(t.toLowerCase())
      out.push(t)
    }
  }
  return out
}

/** What is wrong with the form, in plain words, or null when it can be saved. */
export function mentorFormProblem(f: MentorFormInput): string | null {
  if (f.full_name.trim().length < 2) return 'Add the mentor’s name.'
  if (f.headline.trim().length < 2) return 'Add a title, like “SEO Lead”.'
  const bio = f.bio.trim().length
  if (bio < BIO_MIN) return `The bio needs at least ${BIO_MIN} characters (${bio} so far).`
  if (bio > BIO_MAX) return `The bio is over ${BIO_MAX} characters.`
  const skills = parseExpertise(f.expertise)
  if (skills.length > 10) return 'List at most 10 skills.'
  if (skills.some((s) => s.length > 40)) return 'Each skill should be under 40 characters.'
  if (f.linkedin.trim() && !/^https:\/\/([a-z]+\.)?linkedin\.com\//i.test(f.linkedin.trim())) {
    return 'The LinkedIn link should start with https://www.linkedin.com/in/'
  }
  if (f.phone.trim() && !/^[0-9+() -]{7,20}$/.test(f.phone.trim())) {
    return 'The phone number can only have digits, spaces, + or -.'
  }
  return null
}

/** Creates a listing (no id) or updates one. Returns the mentor's id. */
export async function saveMentor(id: string | null, f: MentorFormInput): Promise<string> {
  const { data, error } = await supabase.rpc('admin_save_mentor', {
    p_mentor: id,
    p_full_name: f.full_name,
    p_headline: f.headline,
    p_bio: f.bio,
    p_location: f.location,
    p_expertise: parseExpertise(f.expertise),
    p_linkedin: f.linkedin,
    p_phone: f.phone,
    p_avatar: f.avatar,
  })
  if (error) fail(error)
  return data as string
}

/**
 * Uploads a mentor's photo and returns its public link. Stored under the
 * signed-in staff member's own folder (the bucket only allows that shape);
 * the link, not the folder, is what the listing keeps.
 */
export async function uploadMentorPhoto(file: File): Promise<string> {
  if (!file.type.startsWith('image/')) throw new Error('Choose an image file.')
  if (file.size > 5 * 1024 * 1024) throw new Error('Choose an image under 5 MB.')
  const {
    data: { session },
  } = await supabase.auth.getSession()
  if (!session) throw new Error('You are not signed in.')

  const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg'
  const path = `${session.user.id}/mentor-${Date.now()}.${ext}`
  const { error } = await supabase.storage
    .from('profile-media')
    .upload(path, file, { upsert: true, cacheControl: '3600' })
  if (error) throw new Error(error.message?.trim() || 'Couldn’t upload the photo.')
  return supabase.storage.from('profile-media').getPublicUrl(path).data.publicUrl
}
