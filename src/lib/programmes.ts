/**
 * Programmes — structured courses, starting with the Career Readiness
 * Programme. Interest is captured as a row in programme_interest (docs/
 * supabase-programme-interest.sql) rather than an enrolment: there's no
 * price, schedule or cohort yet, so the landing page collects intent instead
 * of promising either.
 */
import { supabase } from './supabase'

export const CAREER_READINESS = {
  // Stored value in programme_interest.programme — kept from the working
  // name "Career LaunchPad" (the dashboard took that name instead), since
  // the table's check constraint may already be live. Display name and URL
  // are free to change; this isn't.
  slug: 'career-launchpad',
  name: 'Career Readiness Programme',
  subtitle: 'Powered by AI · Reviewed by people',
  path: '/career-readiness',
} as const

export interface ProgrammeInterest {
  id: string
  created_at: string
}

export async function fetchMyProgrammeInterest(programme: string): Promise<ProgrammeInterest | null> {
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return null
  const { data, error } = await supabase
    .from('programme_interest')
    .select('id, created_at')
    .eq('user_id', user.id)
    .eq('programme', programme)
    .maybeSingle()
  if (error) return null
  return (data as ProgrammeInterest) ?? null
}

export async function registerProgrammeInterest(
  programme: string,
  contact: { full_name: string; email: string },
): Promise<void> {
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error('You are not signed in.')

  const { error } = await supabase.from('programme_interest').insert({
    user_id: user.id,
    programme,
    full_name: contact.full_name.trim() || 'MySkills learner',
    email: contact.email.trim(),
  })
  // 23505 = already registered. Treat as success: the button's job is to get
  // them on the list, and they already are.
  if (error && error.code !== '23505') {
    throw new Error(error.message?.trim() || 'Something went wrong.')
  }
}
