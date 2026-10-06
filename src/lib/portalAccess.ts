/**
 * Signing up for the Community portal, and the team verifying it — see
 * docs/supabase-portal-signup.sql. An account on its own opens nothing: the
 * email has to be confirmed, then a member of the team approves the request.
 */
import { confirmSignUp, resendCode, signIn, signUp } from './auth'
import { supabase } from './supabase'

export type PortalRole = 'mentor' | 'wellness' | 'guidance' | 'internships' | 'institutions'

/** What someone can ask to be. Same keys as the portal's sections. */
export const PORTAL_ROLES: { value: PortalRole; label: string; organisation?: string }[] = [
  { value: 'mentor', label: 'A mentor' },
  { value: 'wellness', label: 'A counsellor' },
  { value: 'guidance', label: 'A career guide' },
  { value: 'internships', label: 'A company offering internships', organisation: 'Company name' },
  { value: 'institutions', label: 'A training institution', organisation: 'Institution name' },
]

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
