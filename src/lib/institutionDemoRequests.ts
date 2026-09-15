/**
 * Admission-interest leads for an offline partner's course (currently just
 * INTERVAL) — writes into institution_demo_requests
 * (docs/supabase-institution-demo-requests.sql), which already existed and
 * kept working the whole time; only the page that fed it (the old
 * /community/institutions "book a demo" form, since replaced by the
 * institution_partners directory + application flow) was removed.
 *
 * A student expressing interest in a discounted course isn't the same shape
 * as an institution booking a cohort demo, so role/institution/student_count
 * are simply left null here — the table already allows that.
 */
import { supabase } from './supabase'

function raise(error: { message?: string } | null): never {
  throw new Error(error?.message?.trim() || 'Something went wrong.')
}

export interface InstitutionLeadInput {
  full_name: string
  email: string
  phone: string
  city: string
  message: string
}

export async function submitInstitutionLead(
  userId: string,
  partner: string,
  input: InstitutionLeadInput,
): Promise<void> {
  const { error } = await supabase.from('institution_demo_requests').insert({
    requested_by: userId,
    partner,
    full_name: input.full_name.trim(),
    email: input.email.trim(),
    phone: input.phone.trim() || null,
    city: input.city.trim() || null,
    message: input.message.trim() || null,
  })
  if (error) raise(error)
}
