/**
 * Internship partner leads — companies interested in offering internships
 * through MySkills (Community > Internships, /become-an-internship-partner).
 *
 * Unlike mentors and institution partners, this is an interest queue only —
 * no approve/reject workflow or public listing, since internships themselves
 * aren't live for students yet. See docs/supabase-internship-partner-leads.sql.
 */
import { supabase } from './supabase'

export interface InternshipPartnerLeadInput {
  company: string
  contact_name: string
  role?: string
  email: string
  phone?: string
  city?: string
  roles_offered?: string
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
 * Submit interest. Works signed out — an interested company is an outside
 * party who shouldn't need a learner account first, same reasoning as
 * mentor and institution partner applications.
 *
 * No `.select()` on the way out: the insert policy lets anyone write, but
 * only admins can read the table back, so asking for the inserted row would
 * fail.
 */
export async function submitInternshipPartnerLead(input: InternshipPartnerLeadInput): Promise<void> {
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { error } = await supabase.from('internship_partner_leads').insert({
    user_id: user?.id ?? null,
    company: input.company.trim(),
    contact_name: input.contact_name.trim(),
    role: blankToNull(input.role),
    email: input.email.trim(),
    phone: blankToNull(input.phone),
    city: blankToNull(input.city),
    roles_offered: blankToNull(input.roles_offered),
  })
  if (error) raise(error)
}
