/**
 * Profile verification ("KYC") — see docs/supabase-profile-verification.sql.
 *
 * A student requests a video call; staff check identity and each credential
 * live and record what they saw proof for in verified_items, which students
 * can read but never write. Each verified row carries a SNAPSHOT of the
 * entry's key fields as checked. An entry is "verified" only while its live
 * fields still match that snapshot, so editing a verified degree or role
 * visibly lapses it until it's re-checked.
 */
import { supabase } from './supabase'
import type { Education, Experience, Profile, Project } from './profile'
import { educationLevelOf } from './careerProfile'

export type VerifiableType = 'identity' | 'education' | 'experience' | 'project'
export type EntryStatus = 'verified' | 'changed' | 'unverified'
export type RequestStatus = 'requested' | 'scheduled' | 'completed' | 'cancelled'

export interface VerifiedItem {
  item_type: VerifiableType
  item_id: string
  snapshot: Record<string, unknown>
}

export interface VerificationRequest {
  id: string
  created_at: string
  status: RequestStatus
  preferred_times: string | null
  phone: string | null
  scheduled_at: string | null
  meeting_link: string | null
  note_to_student: string | null
  completed_at: string | null
}

/* -- snapshots ------------------------------------------------------------ */

// Only the fields that matter to the score or to what was proven. A typo fix
// in a description shouldn't cost anyone their verification.
const clean = (v: unknown) => (typeof v === 'string' ? v.trim() : v ?? '')

export function identitySnapshot(p: Pick<Profile, 'full_name' | 'date_of_birth'>) {
  return { full_name: clean(p.full_name), date_of_birth: clean(p.date_of_birth) }
}
export function educationSnapshot(e: Education) {
  return {
    school: clean(e.school),
    level: educationLevelOf(e) ?? '',
    degree: clean(e.degree),
    field: clean(e.field),
    startYear: clean(e.startYear),
    endYear: clean(e.endYear),
  }
}
export function experienceSnapshot(x: Experience) {
  return {
    title: clean(x.title),
    company: clean(x.company),
    employmentType: clean(x.employmentType),
    startDate: clean(x.startDate),
    endDate: x.current ? '' : clean(x.endDate),
    current: Boolean(x.current),
  }
}
export function projectSnapshot(p: Project) {
  return { title: clean(p.title), link: clean(p.link), year: clean(p.year) }
}

function stable(o: unknown): string {
  if (o === null || typeof o !== 'object') return JSON.stringify(o)
  const obj = o as Record<string, unknown>
  return `{${Object.keys(obj)
    .sort()
    .map((k) => `${JSON.stringify(k)}:${stable(obj[k])}`)
    .join(',')}}`
}

/* -- evaluating a profile against its verified items ---------------------- */

export interface VerificationView {
  identity: EntryStatus
  status(type: Exclude<VerifiableType, 'identity'>, entry: Education | Experience | Project): EntryStatus
}

export function buildVerificationView(
  profile: Pick<Profile, 'full_name' | 'date_of_birth'>,
  items: VerifiedItem[],
): VerificationView {
  const byKey = new Map(items.map((i) => [`${i.item_type}:${i.item_id}`, i]))
  const check = (type: VerifiableType, id: string, current: object): EntryStatus => {
    const row = byKey.get(`${type}:${id}`)
    if (!row) return 'unverified'
    return stable(row.snapshot) === stable(current) ? 'verified' : 'changed'
  }
  return {
    identity: check('identity', 'self', identitySnapshot(profile)),
    status(type, entry) {
      const snap =
        type === 'education'
          ? educationSnapshot(entry as Education)
          : type === 'experience'
            ? experienceSnapshot(entry as Experience)
            : projectSnapshot(entry as Project)
      return check(type, entry.id, snap)
    },
  }
}

/** Nothing verified — the view every profile starts with. */
export const NO_VERIFICATION: VerificationView = {
  identity: 'unverified',
  status: () => 'unverified',
}

/* -- student API ---------------------------------------------------------- */

export async function fetchMyVerification(): Promise<{
  request: VerificationRequest | null
  items: VerifiedItem[]
}> {
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { request: null, items: [] }

  const [req, items] = await Promise.all([
    supabase
      .from('verification_requests')
      .select('id, created_at, status, preferred_times, phone, scheduled_at, meeting_link, note_to_student, completed_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase.from('verified_items').select('item_type, item_id, snapshot').eq('user_id', user.id),
  ])
  // Tolerate the tables not existing yet (SQL not run): the profile and score
  // should keep working, just with nothing verified.
  return {
    request: req.error ? null : ((req.data as VerificationRequest) ?? null),
    items: items.error ? [] : ((items.data as VerifiedItem[]) ?? []),
  }
}

export async function requestVerification(input: { preferred_times: string; phone: string }): Promise<void> {
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error('You are not signed in.')
  const { error } = await supabase.from('verification_requests').insert({
    user_id: user.id,
    preferred_times: input.preferred_times.trim() || null,
    phone: input.phone.trim() || null,
    consent_at: new Date().toISOString(),
  })
  if (error) {
    if (error.code === '23505') throw new Error('You already have a verification request open.')
    throw new Error(error.message?.trim() || 'Something went wrong.')
  }
}

export async function cancelMyVerificationRequest(): Promise<void> {
  const { error } = await supabase.rpc('cancel_my_verification_request')
  if (error) throw new Error(error.message?.trim() || 'Something went wrong.')
}

/* -- staff API ------------------------------------------------------------ */

export interface QueueRow extends VerificationRequest {
  user_id: string
  full_name: string | null
  email: string
}

export interface Candidate {
  full_name: string | null
  email: string
  date_of_birth: string | null
  education: Education[]
  experience: Experience[]
  projects: Project[]
  verified: (VerifiedItem & { verified_at: string })[]
}

export async function fetchVerificationQueue(): Promise<QueueRow[]> {
  const { data, error } = await supabase.rpc('admin_verification_queue')
  if (error) throw new Error(error.message)
  return (data ?? []) as QueueRow[]
}

export async function fetchCandidate(userId: string): Promise<Candidate | null> {
  const { data, error } = await supabase.rpc('admin_verification_candidate', { p_user: userId })
  if (error) throw new Error(error.message)
  const row = (data as Candidate[] | null)?.[0]
  if (!row) return null
  return {
    ...row,
    education: row.education ?? [],
    experience: row.experience ?? [],
    projects: row.projects ?? [],
    verified: row.verified ?? [],
  }
}

export async function scheduleVerification(id: string, scheduledAt: string, meetingLink: string): Promise<void> {
  const { error } = await supabase
    .from('verification_requests')
    .update({ status: 'scheduled', scheduled_at: scheduledAt, meeting_link: meetingLink.trim() })
    .eq('id', id)
  if (error) throw new Error(error.message)
}

export async function completeVerification(id: string, items: VerifiedItem[], note: string): Promise<void> {
  const { error } = await supabase.rpc('admin_complete_verification', {
    p_request: id,
    p_items: items,
    p_note: note,
  })
  if (error) throw new Error(error.message)
}
