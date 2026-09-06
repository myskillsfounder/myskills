/**
 * Admin panel data layer. See docs/supabase-admin.sql (which itself depends on
 * docs/supabase-mentor-onboarding.sql for public.admins and is_admin()).
 *
 * Everything here is enforced in Postgres, not in the client: the tables carry
 * `using (public.is_admin())` policies and the two functions re-check it
 * internally. Hiding the routes is only about not showing dead UI.
 */
import { supabase } from './supabase'
import type { BlogPost } from './blog'

function raise(error: { message?: string; hint?: string | null } | null): never {
  const message = error?.message?.trim()
  throw new Error(
    message ? (error?.hint ? `${message} (${error.hint})` : message) : 'Something went wrong.',
  )
}

/* ========================================================================== */
/* OVERVIEW                                                                   */
/* ========================================================================== */

export interface AdminOverview {
  total_users: number
  active_today: number
  new_this_week: number
  total_logins: number
  assessments_done: number
  practice_attempts: number
  avg_rating: number | null
  feedback_count: number
  blog_posts: number
  blog_published: number
  certificates: number
  mentor_applications_pending: number
}

/** Aggregated server-side — the browser has no business pulling 235 profile
 *  rows just to render the number 235. */
export async function fetchOverview(): Promise<AdminOverview> {
  const { data, error } = await supabase.rpc('admin_overview')
  if (error) raise(error)
  if (!data) throw new Error('Not authorized.')
  return data as AdminOverview
}

/* ========================================================================== */
/* USERS                                                                      */
/* ========================================================================== */

export interface AdminUser {
  id: string
  email: string
  full_name: string | null
  headline: string | null
  is_mentor: boolean
  created_at: string
  last_login: string | null
  assessment_percent: number | null
}

export async function fetchUsers(search?: string): Promise<AdminUser[]> {
  const { data, error } = await supabase.rpc('admin_users', {
    search: search?.trim() || null,
    max_rows: 200,
  })
  if (error) raise(error)
  return (data ?? []) as AdminUser[]
}

/** Grants or revokes support-chat mentor powers (profiles.is_mentor), which is
 *  separate from being listed publicly in Community.
 *
 *  Goes through admin_set_mentor_flag rather than a plain `.update()` —
 *  is_mentor is locked down at the database level (a trigger reverts it for
 *  everyone except this security-definer function; see
 *  docs/supabase-fix-mentor-self-escalation.sql) so a user can't grant
 *  themselves mentor powers, which also grant access to other users'
 *  pending support chats. */
export async function setMentorFlag(profileId: string, isMentor: boolean): Promise<void> {
  const { error } = await supabase.rpc('admin_set_mentor_flag', {
    target_id: profileId,
    flag: isMentor,
  })
  if (error) raise(error)
}

/* ========================================================================== */
/* FEEDBACK                                                                   */
/* ========================================================================== */

export interface AdminFeedback {
  id: string
  profile_id: string
  rating: number | null
  suggestion: string
  review: string
  created_at: string
}

export async function fetchAllFeedback(): Promise<AdminFeedback[]> {
  const { data, error } = await supabase
    .from('feedback')
    .select('id, profile_id, rating, suggestion, review, created_at')
    .order('created_at', { ascending: false })
    .limit(300)
  if (error) raise(error)
  return (data ?? []) as AdminFeedback[]
}

/* ========================================================================== */
/* BLOG                                                                       */
/* ========================================================================== */

export interface BlogPostInput {
  id?: string
  title: string
  slug: string
  description: string
  content: string
  thumbnail_url: string | null
  status: 'draft' | 'published'
}

/** Drafts included — the public read policy only exposes published posts. */
export async function fetchAllPosts(): Promise<BlogPost[]> {
  const { data, error } = await supabase
    .from('blog_posts')
    .select('*')
    .order('created_at', { ascending: false })
  if (error) raise(error)
  return (data ?? []) as BlogPost[]
}

export const slugify = (title: string) =>
  title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 80)

export async function savePost(input: BlogPostInput): Promise<void> {
  const row = {
    title: input.title.trim(),
    slug: input.slug.trim(),
    description: input.description.trim(),
    content: input.content,
    thumbnail_url: input.thumbnail_url?.trim() || null,
    status: input.status,
    updated_at: new Date().toISOString(),
    // Stamped on first publish and left alone afterwards, so re-editing a live
    // post doesn't reorder the blog or restart its age for SEO.
    ...(input.status === 'published' ? { published_at: new Date().toISOString() } : {}),
  }

  if (input.id) {
    const existing = await supabase
      .from('blog_posts')
      .select('published_at')
      .eq('id', input.id)
      .maybeSingle()
    if (existing.data?.published_at) delete (row as { published_at?: string }).published_at

    const { error } = await supabase.from('blog_posts').update(row).eq('id', input.id)
    if (error) raise(error)
  } else {
    const { error } = await supabase.from('blog_posts').insert(row)
    if (error) raise(error)
  }
}

export async function deletePost(id: string): Promise<void> {
  const { error } = await supabase.from('blog_posts').delete().eq('id', id)
  if (error) raise(error)
}

/* ========================================================================== */
/* ADS                                                                        */
/* ========================================================================== */

export interface AdminAd {
  id: string
  title: string | null
  image_url: string
  image_path: string
  link_url: string | null
  active: boolean
  sort_order: number
  created_at: string
}

export async function fetchAllAds(): Promise<AdminAd[]> {
  const { data, error } = await supabase
    .from('ads')
    .select('id, title, image_url, image_path, link_url, active, sort_order, created_at')
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: true })
  if (error) raise(error)
  return (data ?? []) as AdminAd[]
}

/**
 * Uploaded under the admin's own user folder, matching the path convention
 * uploadProfileMedia already uses — the bucket's policies are written around
 * that shape, so an `ads/` top-level prefix would be rejected.
 */
export async function uploadAdImage(file: File): Promise<{ url: string; path: string }> {
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error('You are not signed in.')

  const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg'
  const path = `${user.id}/ad-${Date.now()}.${ext}`
  const { error } = await supabase.storage
    .from('profile-media')
    .upload(path, file, { upsert: true, cacheControl: '3600' })
  if (error) raise(error)

  const { data } = supabase.storage.from('profile-media').getPublicUrl(path)
  return { url: data.publicUrl, path }
}

export interface AdInput {
  id?: string
  title: string
  image_url: string
  image_path: string
  link_url: string
  active: boolean
  sort_order: number
}

export async function saveAd(input: AdInput): Promise<void> {
  const row = {
    title: input.title.trim() || null,
    image_url: input.image_url.trim(),
    image_path: input.image_path.trim(),
    link_url: input.link_url.trim() || null,
    active: input.active,
    sort_order: input.sort_order,
    updated_at: new Date().toISOString(),
  }

  const { error } = input.id
    ? await supabase.from('ads').update(row).eq('id', input.id)
    : await supabase.from('ads').insert(row)
  if (error) raise(error)
}

export async function deleteAd(id: string): Promise<void> {
  const { error } = await supabase.from('ads').delete().eq('id', id)
  if (error) raise(error)
}

/* ========================================================================== */
/* INSTITUTION DEMO REQUESTS                                                  */
/* ========================================================================== */

export type DemoRequestStatus = 'pending' | 'contacted' | 'scheduled' | 'closed'

export interface AdminDemoRequest {
  id: string
  created_at: string
  status: DemoRequestStatus
  partner: string
  full_name: string
  role: string | null
  institution: string | null
  city: string | null
  student_count: number | null
  email: string
  phone: string | null
  message: string | null
}

export async function fetchDemoRequests(): Promise<AdminDemoRequest[]> {
  const { data, error } = await supabase
    .from('institution_demo_requests')
    .select(
      'id, created_at, status, partner, full_name, role, institution, city, student_count, email, phone, message',
    )
    .order('created_at', { ascending: false })
  if (error) raise(error)
  return (data ?? []) as AdminDemoRequest[]
}

export async function setDemoRequestStatus(id: string, status: DemoRequestStatus): Promise<void> {
  const patch: Record<string, unknown> = { status }
  if (status !== 'pending') {
    patch.contacted_at = new Date().toISOString()
    const { data: auth } = await supabase.auth.getUser()
    patch.contacted_by = auth.user?.id ?? null
  }
  const { error } = await supabase.from('institution_demo_requests').update(patch).eq('id', id)
  if (error) raise(error)
}
