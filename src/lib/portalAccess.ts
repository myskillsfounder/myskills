/**
 * Signing up for the Community portal, and the team verifying it — see
 * docs/supabase-portal-signup.sql. An account on its own opens nothing: the
 * email has to be confirmed, then a member of the team approves the request.
 */
import { confirmSignUp, resendCode, signIn, signUp } from './auth'
import { supabase } from './supabase'

export type PortalRole = 'mentor' | 'wellness' | 'guidance' | 'internships' | 'institutions'

export interface PortalRoleInfo {
  value: PortalRole
  /** "A mentor": completes "I am…". */
  label: string
  /** "Mentor": a heading. */
  short: string
  /** One line under the heading on the role card. */
  blurb: string
  /** The name field for a company or institution; absent for a person. */
  organisation?: string
  /** What to put in "about you", for this role. */
  introHint: string
  /** What working with MySkills students looks like, for the side panel. */
  perks: string[]
}

/** What someone can ask to be. Same keys as the portal's sections. */
export const PORTAL_ROLES: PortalRoleInfo[] = [
  {
    value: 'mentor',
    label: 'A mentor',
    short: 'Mentor',
    blurb: 'Guide students one to one and vouch for the skills they earn.',
    introHint: 'Your experience, and a LinkedIn link if you have one. It helps us verify you quickly.',
    perks: [
      'See a student’s aptitude report before you say yes',
      'Sessions on your schedule; pause new requests any time',
      'Award skill badges and verify projects with your name on them',
    ],
  },
  {
    value: 'wellness',
    label: 'A counsellor',
    short: 'Counsellor',
    blurb: 'Support students privately when practice alone can’t fix it.',
    introHint: 'Your qualifications and registration, and how you work with students.',
    perks: [
      'The MySkills team assigns students to you',
      'You log only the date of each session: what you discuss is never recorded',
      'You see a student’s contact details and nothing more',
    ],
  },
  {
    value: 'guidance',
    label: 'A career guide',
    short: 'Career guide',
    blurb: 'Help students work out which track to take and what comes next.',
    introHint: 'Your background in careers or hiring, and a LinkedIn link if you have one.',
    perks: [
      'The MySkills team assigns students to you',
      'See a student’s score, certificates and progress to guide them well',
      'Log each session by date, nothing more',
    ],
  },
  {
    value: 'internships',
    label: 'A company offering internships',
    short: 'Company',
    blurb: 'Offer internships to students who can show what they’ve done.',
    organisation: 'Company name',
    introHint: 'What the company does, the kinds of roles you could offer, and your website.',
    perks: [
      'Meet students who have practised real scenarios and earned a score',
      'See each student’s Career Readiness Score and certificates',
      'A signed-off internship earns the student points in their score',
    ],
  },
  {
    value: 'institutions',
    label: 'A training institution',
    short: 'Institution',
    blurb: 'Be listed for students looking for classroom learning.',
    organisation: 'Institution name',
    introHint: 'The courses you run, your city, and your website or Google listing.',
    perks: [
      'A verified partner listing that students can find',
      'Keep track of the students enrolled with you',
      'Student ratings that build trust with future students',
    ],
  },
]

export const isPortalRole = (v: unknown): v is PortalRole => PORTAL_ROLES.some((r) => r.value === v)

export const roleLabel = (r: PortalRole) => PORTAL_ROLES.find((x) => x.value === r)?.label.replace(/^An? /, '') ?? r

export interface PortalRequestDetails {
  role: PortalRole | ''
  organisation: string
  phone: string
  message: string
}

/** What is wrong with the request fields, in plain words, or null. */
export function requestProblem(d: PortalRequestDetails): string | null {
  if (!d.role) return 'Choose what you do.'
  const org = PORTAL_ROLES.find((r) => r.value === d.role)?.organisation
  if (org && d.organisation.trim().length < 2) return `Add your ${org.toLowerCase()}.`
  if (d.phone.trim() && !/^[0-9+() -]{7,20}$/.test(d.phone.trim())) {
    return 'The phone number can only have digits, spaces, + or -.'
  }
  return null
}

function fail(error: { message?: string; code?: string }): never {
  if (error.code === 'PGRST202') {
    throw new Error('Portal sign-up isn’t set up yet — run docs/supabase-portal-signup.sql in Supabase.')
  }
  throw new Error(error.message?.trim() || 'Something went wrong.')
}

/**
 * Creates the account and emails a 6-digit code. What the person asked for is
 * kept with the account and filed as a request once the email is confirmed and
 * they sign in (it can't be filed before: there is no session yet).
 */
export async function portalSignUp(params: {
  name: string
  email: string
  password: string
  request: PortalRequestDetails
}): Promise<void> {
  await signUp({
    name: params.name,
    email: params.email,
    password: params.password,
    data: {
      portal_request: {
        role: params.request.role,
        organisation: params.request.organisation.trim(),
        phone: params.request.phone.trim(),
        message: params.request.message.trim(),
      },
    },
  })
}

/** Confirms the emailed code and signs them in. */
export async function portalConfirm(email: string, password: string, code: string): Promise<void> {
  await confirmSignUp(email, code)
  await signIn({ email, password })
}

export { resendCode as portalResendCode }

export type RequestStatus = 'pending' | 'approved' | 'rejected'

export interface MyPortalRequest {
  status: RequestStatus
  role: PortalRole
  organisation: string | null
  created_at: string
  note: string | null
}

/**
 * Files the signed-in person's request (from what they typed at sign-up, or the
 * details given) unless they already have one, and returns where it stands.
 */
export async function submitPortalRequest(details?: PortalRequestDetails): Promise<RequestStatus> {
  const { data, error } = await supabase.rpc('submit_portal_request', {
    p_role: details?.role || null,
    p_organisation: details?.organisation || null,
    p_phone: details?.phone || null,
    p_message: details?.message || null,
  })
  if (error) fail(error)
  return data as RequestStatus
}

export async function fetchMyPortalRequest(): Promise<MyPortalRequest | null> {
  const { data, error } = await supabase.rpc('my_portal_request')
  if (error) {
    if (error.code === 'PGRST202') return null
    fail(error)
  }
  return ((data as MyPortalRequest[] | null) ?? [])[0] ?? null
}

/* -- the team -------------------------------------------------------------- */

export interface AdminPortalRequest {
  id: string
  created_at: string
  user_id: string
  full_name: string | null
  email: string
  role: PortalRole
  organisation: string | null
  phone: string | null
  message: string | null
  status: RequestStatus
  note: string | null
  reviewed_at: string | null
  /** An application with the same email: mentor/institution pending|approved|rejected, company new|contacted.
   *  Absent until docs/supabase-portal-signup-links.sql is run. */
  application_status?: string | null
  application_on?: string | null
  /** For a mentor: the listing their approved application created. */
  suggested_mentor?: string | null
}

/** Null (not an error) until the SQL is run. */
export async function fetchPortalRequests(): Promise<AdminPortalRequest[] | null> {
  const { data, error } = await supabase.rpc('admin_portal_requests')
  if (error) {
    if (error.code === 'PGRST202') return null
    fail(error)
  }
  return (data ?? []) as AdminPortalRequest[]
}

export async function reviewPortalRequest(
  id: string,
  decision: 'approved' | 'rejected',
  opts: { mentorId?: string; note?: string } = {},
): Promise<void> {
  const { error } = await supabase.rpc('admin_review_portal_request', {
    p_id: id,
    p_decision: decision,
    p_mentor: opts.mentorId ?? null,
    p_note: opts.note ?? null,
  })
  if (error) fail(error)
}
