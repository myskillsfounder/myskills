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
import type { Certificate } from './certificates'

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

/** Same bucket and per-user-folder convention as uploadAdImage/uploadProfileMedia. */
export async function uploadBlogThumbnail(file: File): Promise<string> {
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error('You are not signed in.')

  const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg'
  const path = `${user.id}/blog-${Date.now()}.${ext}`
  const { error } = await supabase.storage
    .from('profile-media')
    .upload(path, file, { upsert: true, cacheControl: '3600' })
  if (error) raise(error)

  const { data } = supabase.storage.from('profile-media').getPublicUrl(path)
  return data.publicUrl
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

/* ========================================================================== */
/* INITIAL ASSESSMENT QUESTIONS                                              */
/* ========================================================================== */

/**
 * The question bank and its answer key are separate tables (see
 * docs/supabase-server-side-grading.sql) so the correct answer never ships to
 * a test-taker's browser. Admin reads/writes both directly under the
 * `is_admin()` policies in docs/supabase-admin-assessment-questions.sql —
 * grading itself still only ever happens through the grade_initial_assessment
 * RPC, this doesn't touch that path.
 */
export interface AdminAssessmentQuestion {
  id: string
  category: string
  question: string
  options: string[]
  sort_order: number
  correct_index: number
  explanation: string
}

/** Two plain selects joined client-side, rather than a PostgREST embed —
 *  the answer key's relationship to the question bank is 1:1 (question_id is
 *  its primary key), and a manual join is one less thing to get wrong than
 *  trusting the embed syntax to resolve that cardinality correctly. */
export async function fetchAllAssessmentQuestions(): Promise<AdminAssessmentQuestion[]> {
  const [questions, keys] = await Promise.all([
    supabase
      .from('initial_assessment_questions')
      .select('id, category, question, options, sort_order')
      .order('sort_order', { ascending: true }),
    supabase.from('initial_assessment_answer_key').select('question_id, correct_index, explanation'),
  ])
  if (questions.error) raise(questions.error)
  if (keys.error) raise(keys.error)

  const keyByQuestionId = new Map((keys.data ?? []).map((k) => [k.question_id, k]))
  return (questions.data ?? []).map((q) => {
    const key = keyByQuestionId.get(q.id)
    return {
      id: q.id,
      category: q.category,
      question: q.question,
      options: q.options,
      sort_order: q.sort_order,
      correct_index: key?.correct_index ?? 0,
      explanation: key?.explanation ?? '',
    }
  })
}

export interface AssessmentQuestionInput {
  /** Present when editing; absent for a new question, which gets a
   *  generated id — the existing bank uses short category-prefixed codes
   *  (MF001, SEO003, ...) purely as a human-readable convention, not
   *  anything the grading RPC parses, so a generated id is fine here. */
  id?: string
  category: string
  question: string
  options: string[]
  sort_order: number
  correct_index: number
  explanation: string
}

function generateQuestionId(category: string): string {
  const prefix = category.replace(/[^a-zA-Z]/g, '').slice(0, 4).toUpperCase() || 'Q'
  return `${prefix}-${Date.now().toString(36).toUpperCase()}`
}

export async function saveAssessmentQuestion(input: AssessmentQuestionInput): Promise<void> {
  const options = input.options.map((o) => o.trim()).filter(Boolean)
  if (options.length < 2) throw new Error('At least 2 options are required.')
  if (input.correct_index < 0 || input.correct_index >= options.length) {
    throw new Error('Pick which option is correct.')
  }

  const id = input.id ?? generateQuestionId(input.category)
  const questionRow = {
    category: input.category.trim(),
    question: input.question.trim(),
    options,
    sort_order: input.sort_order,
  }

  if (input.id) {
    const { error } = await supabase.from('initial_assessment_questions').update(questionRow).eq('id', id)
    if (error) raise(error)
  } else {
    const { error } = await supabase.from('initial_assessment_questions').insert({ id, ...questionRow })
    if (error) raise(error)
  }

  // Upsert regardless of new/edit — every question should always have
  // exactly one answer-key row, and this is the one call that keeps that
  // true whether or not one already existed.
  const { error: keyError } = await supabase
    .from('initial_assessment_answer_key')
    .upsert({ question_id: id, correct_index: input.correct_index, explanation: input.explanation.trim() })
  if (keyError) raise(keyError)
}

/** The answer-key row cascades on delete (see docs/supabase-server-side-grading.sql). */
export async function deleteAssessmentQuestion(id: string): Promise<void> {
  const { error } = await supabase.from('initial_assessment_questions').delete().eq('id', id)
  if (error) raise(error)
}

/* ========================================================================== */
/* PRACTICE QUESTION SETS                                                    */
/* ========================================================================== */

/**
 * Admin-authored MCQ sets, separate from initial_assessment_questions on
 * purpose — see docs/supabase-practice-question-sets.sql. grade_initial_assessment()
 * grades every row in that table as one 35-question exam, so a second quiz's
 * questions can never live there without corrupting that score. This is a
 * fresh bank an admin can create as many of, one set per named quiz.
 */
export interface PracticeQuestionSet {
  id: string
  name: string
  description: string
  sort_order: number
  created_at: string
  question_count: number
}

export async function fetchPracticeQuestionSets(): Promise<PracticeQuestionSet[]> {
  const [sets, questions] = await Promise.all([
    supabase
      .from('practice_question_sets')
      .select('id, name, description, sort_order, created_at')
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: true }),
    supabase.from('practice_set_questions').select('set_id'),
  ])
  if (sets.error) raise(sets.error)
  if (questions.error) raise(questions.error)

  const countBySetId = new Map<string, number>()
  for (const q of questions.data ?? []) {
    countBySetId.set(q.set_id, (countBySetId.get(q.set_id) ?? 0) + 1)
  }
  return (sets.data ?? []).map((s) => ({ ...s, question_count: countBySetId.get(s.id) ?? 0 }))
}

export interface PracticeQuestionSetInput {
  id?: string
  name: string
  description: string
  sort_order: number
}

export async function savePracticeQuestionSet(input: PracticeQuestionSetInput): Promise<string> {
  const row = {
    name: input.name.trim(),
    description: input.description.trim(),
    sort_order: input.sort_order,
  }
  if (input.id) {
    const { error } = await supabase.from('practice_question_sets').update(row).eq('id', input.id)
    if (error) raise(error)
    return input.id
  }
  const { data, error } = await supabase.from('practice_question_sets').insert(row).select('id').single()
  if (error) raise(error)
  return data.id
}

/** Its questions cascade on delete (practice_set_questions.set_id has ON DELETE CASCADE). */
export async function deletePracticeQuestionSet(id: string): Promise<void> {
  const { error } = await supabase.from('practice_question_sets').delete().eq('id', id)
  if (error) raise(error)
}

export interface PracticeSetQuestion {
  id: string
  set_id: string
  category: string
  question: string
  options: string[]
  sort_order: number
  correct_index: number
  explanation: string
}

export async function fetchPracticeSetQuestions(setId: string): Promise<PracticeSetQuestion[]> {
  const { data, error } = await supabase
    .from('practice_set_questions')
    .select('id, set_id, category, question, options, sort_order, correct_index, explanation')
    .eq('set_id', setId)
    .order('sort_order', { ascending: true })
  if (error) raise(error)
  return (data ?? []) as PracticeSetQuestion[]
}

export interface PracticeSetQuestionInput {
  id?: string
  set_id: string
  category: string
  question: string
  options: string[]
  sort_order: number
  correct_index: number
  explanation: string
}

export async function savePracticeSetQuestion(input: PracticeSetQuestionInput): Promise<void> {
  const options = input.options.map((o) => o.trim()).filter(Boolean)
  if (options.length < 2) throw new Error('At least 2 options are required.')
  if (input.correct_index < 0 || input.correct_index >= options.length) {
    throw new Error('Pick which option is correct.')
  }

  const row = {
    set_id: input.set_id,
    category: input.category.trim(),
    question: input.question.trim(),
    options,
    sort_order: input.sort_order,
    correct_index: input.correct_index,
    explanation: input.explanation.trim(),
  }

  const { error } = input.id
    ? await supabase.from('practice_set_questions').update(row).eq('id', input.id)
    : await supabase.from('practice_set_questions').insert(row)
  if (error) raise(error)
}

export async function deletePracticeSetQuestion(id: string): Promise<void> {
  const { error } = await supabase.from('practice_set_questions').delete().eq('id', id)
  if (error) raise(error)
}

/* ========================================================================== */
/* CERTIFICATES                                                               */
/* ========================================================================== */

export interface AdminCertificate extends Certificate {
  profile_id: string
}

/** Read-only — certificates are issued exclusively by grade_initial_assessment()
 *  (see docs/supabase-server-side-grading.sql) and have no client-facing
 *  insert/update policy at all, admin included. This is a view into what's
 *  already been issued, not a way to mint or alter one. */
export async function fetchAllCertificates(): Promise<AdminCertificate[]> {
  const { data, error } = await supabase
    .from('certificates')
    .select('id, profile_id, code, recipient_name, kind, percent, title, issued_at')
    .order('issued_at', { ascending: false })
  if (error) raise(error)
  return (data ?? []) as AdminCertificate[]
}
