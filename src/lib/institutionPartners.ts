/**
 * Institution partner onboarding: public applications, admin review, public
 * listing. Mirrors src/lib/mentors.ts — see docs/supabase-institution-partner-onboarding.sql.
 *
 * Applications and the published listing are separate tables on purpose —
 * applications carry an email and phone number, and RLS can only filter rows,
 * not columns, so anything readable by the public would expose those too.
 */
import { supabase } from './supabase'

/** A published, approved institution partner. Everything here is
 *  world-readable by design. */
export interface InstitutionPartner {
  id: string
  legal_name: string
  courses_offered: string[]
  years_in_education: number
  city: string | null
  google_profile_url: string | null
  google_rating: number | null
  website_url: string | null
  logo_url: string | null
}

export type InstitutionApplicationStatus = 'pending' | 'approved' | 'rejected'

/** An application, as an admin sees it — includes the private contact fields. */
export interface InstitutionPartnerApplication {
  id: string
  created_at: string
  status: InstitutionApplicationStatus
  reviewed_at: string | null
  review_note: string | null
  legal_name: string
  courses_offered: string[]
  years_in_education: number
  city: string | null
  google_profile_url: string | null
  google_rating: number | null
  website_url: string | null
  contact_name: string
  contact_role: string | null
  email: string
  phone: string | null
  additional_info: string | null
}

export interface InstitutionPartnerApplicationInput {
  legal_name: string
  courses_offered: string[]
  years_in_education: number
  city?: string
  google_profile_url?: string
  google_rating?: number
  website_url?: string
  contact_name: string
  contact_role?: string
  email: string
  phone?: string
  additional_info?: string
}

const blankToNull = (v: string | undefined) => {
  const t = (v ?? '').trim()
  return t === '' ? null : t
}

/** Supabase rejects with a plain `{ message, details, hint, code }` object,
 *  not an Error — normalise here so every caller gets a readable message. */
function raise(error: { message?: string; hint?: string | null } | null): never {
  const message = error?.message?.trim()
  throw new Error(
    message ? (error?.hint ? `${message} (${error.hint})` : message) : 'Something went wrong.',
  )
}

/**
 * Submit an application. Works signed out — an applying institution is an
 * outside party who shouldn't need a learner account first.
 *
 * No `.select()` on the way out: the insert policy lets anyone write, but only
 * admins can read the table back, so asking for the inserted row would fail.
 */
export async function submitInstitutionPartnerApplication(
  input: InstitutionPartnerApplicationInput,
): Promise<void> {
  const { error } = await supabase.from('institution_partner_applications').insert({
    legal_name: input.legal_name.trim(),
    courses_offered: input.courses_offered.map((c) => c.trim()).filter(Boolean).slice(0, 15),
    years_in_education: input.years_in_education,
    city: blankToNull(input.city),
    google_profile_url: blankToNull(input.google_profile_url),
    google_rating: input.google_rating ?? null,
    website_url: blankToNull(input.website_url),
    contact_name: input.contact_name.trim(),
    contact_role: blankToNull(input.contact_role),
    email: input.email.trim(),
    phone: blankToNull(input.phone),
    additional_info: blankToNull(input.additional_info),
  })
  if (error) raise(error)
}

export async function fetchInstitutionPartners(): Promise<InstitutionPartner[]> {
  const { data, error } = await supabase
    .from('institution_partners')
    .select(
      'id, legal_name, courses_offered, years_in_education, city, google_profile_url, google_rating, website_url, logo_url',
    )
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: true })
  if (error) raise(error)
  return (data ?? []) as InstitutionPartner[]
}

/** Admin only — returns nothing for everyone else, since RLS filters the rows. */
export async function fetchInstitutionPartnerApplications(
  status?: InstitutionApplicationStatus,
): Promise<InstitutionPartnerApplication[]> {
  let query = supabase
    .from('institution_partner_applications')
    .select(
      'id, created_at, status, reviewed_at, review_note, legal_name, courses_offered, years_in_education, city, google_profile_url, google_rating, website_url, contact_name, contact_role, email, phone, additional_info',
    )
    .order('created_at', { ascending: false })
  if (status) query = query.eq('status', status)

  const { data, error } = await query
  if (error) raise(error)
  return (data ?? []) as InstitutionPartnerApplication[]
}

/** Flips the status and publishes the listing in one transaction. */
export async function approveInstitutionPartnerApplication(id: string): Promise<void> {
  const { error } = await supabase.rpc('approve_institution_partner_application', { app_id: id })
  if (error) raise(error)
}

/** Also unpublishes, so reversing an approval is a single action. */
export async function rejectInstitutionPartnerApplication(id: string, note?: string): Promise<void> {
  const { error } = await supabase.rpc('reject_institution_partner_application', {
    app_id: id,
    note: blankToNull(note),
  })
  if (error) raise(error)
}
