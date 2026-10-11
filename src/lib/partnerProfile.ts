/**
 * A profile for the partners who aren't mentors — counsellors, career guides,
 * companies and institutions — see docs/supabase-partner-profiles.sql. They
 * fill it in themselves in the Community portal; the MySkills team reads it to
 * introduce a student to the right person. Students don't browse these
 * partners, so none of it is published.
 */
import { supabase } from './supabase'

export interface PartnerProfile {
  /** The person, or the company or institution. */
  display_name: string | null
  /** For an organisation: who the team talks to. */
  contact_name: string | null
  title: string | null
  about: string | null
  city: string | null
  website: string | null
  /** Private: only the team sees it. */
  phone: string | null
  photo_url: string | null
  /** The sign-in email. */
  email: string
  /** False until they have saved it once. */
  saved: boolean
}

export interface PartnerProfileInput {
  display_name: string
  contact_name: string
  title: string
  about: string
  city: string
  website: string
  phone: string
  photo_url: string | null
}

function fail(error: { message?: string }): never {
  throw new Error(error.message?.trim() || 'Something went wrong.')
}

/** Null (not an error) until the SQL is run. */
export async function fetchMyPartnerProfile(): Promise<PartnerProfile | null> {
  const { data, error } = await supabase.rpc('my_partner_profile')
  if (error) {
    if (error.code === 'PGRST202') return null
    fail(error)
  }
  return ((data as PartnerProfile[] | null) ?? [])[0] ?? null
}

export async function saveMyPartnerProfile(p: PartnerProfileInput): Promise<void> {
  const { error } = await supabase.rpc('save_my_partner_profile', {
    p_display_name: p.display_name,
    p_contact_name: p.contact_name,
    p_title: p.title,
    p_about: p.about,
    p_city: p.city,
    p_website: p.website,
    p_phone: p.phone,
    p_photo: p.photo_url ?? '',
  })
  if (error) fail(error)
}

/** What a partner has told us, as the team sees it. */
export interface AdminPartnerProfile {
  user_id: string
  display_name: string | null
  contact_name: string | null
  title: string | null
  about: string | null
  city: string | null
  website: string | null
  phone: string | null
  photo_url: string | null
  updated_at: string
}

/** Every partner's profile by account, or an empty map when it isn't available. */
export async function fetchPartnerProfiles(): Promise<Record<string, AdminPartnerProfile>> {
  const { data, error } = await supabase.rpc('admin_partner_profiles')
  if (error) return {}
  const out: Record<string, AdminPartnerProfile> = {}
  for (const r of (data ?? []) as AdminPartnerProfile[]) out[r.user_id] = r
  return out
}
