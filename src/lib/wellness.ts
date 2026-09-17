/**
 * Wellness & career-guidance requests. See docs/supabase-wellness-requests.sql.
 *
 * A request queue, not live chat — nobody is tagged as a psychologist or
 * career mentor yet, so there's no one to claim a real-time session the way
 * support.ts's mentor chat works. A student submits a request, staff follow
 * up directly once real people are onboarded (see the admin Wellness queue).
 */
import { supabase } from './supabase'

export type WellnessRequestType = 'psychologist' | 'career_mentor'
export type WellnessRequestStatus = 'pending' | 'contacted' | 'closed'

export interface WellnessRequest {
  id: string
  created_at: string
  type: WellnessRequestType
  status: WellnessRequestStatus
  full_name: string
  email: string
  phone: string | null
  message: string | null
}

function raise(error: { message?: string } | null): never {
  throw new Error(error?.message?.trim() || 'Something went wrong.')
}

export interface WellnessRequestInput {
  full_name: string
  email: string
  phone: string
  message: string
}

export async function submitWellnessRequest(
  type: WellnessRequestType,
  input: WellnessRequestInput,
): Promise<void> {
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error('You are not signed in.')

  const { error } = await supabase.from('wellness_requests').insert({
    requested_by: user.id,
    type,
    full_name: input.full_name.trim(),
    email: input.email.trim(),
    phone: input.phone.trim() || null,
    message: input.message.trim() || null,
  })
  if (error) raise(error)
}

/** The caller's own request of this type, if one is still open (pending or
 *  contacted) — lets the page show "we're on it" instead of a blank form and
 *  stops someone from stacking duplicate requests. */
export async function fetchMyOpenWellnessRequest(
  type: WellnessRequestType,
): Promise<WellnessRequest | null> {
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return null
  const { data, error } = await supabase
    .from('wellness_requests')
    .select('id, created_at, type, status, full_name, email, phone, message')
    .eq('requested_by', user.id)
    .eq('type', type)
    .in('status', ['pending', 'contacted'])
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()
  if (error) return null
  return (data as WellnessRequest) ?? null
}
