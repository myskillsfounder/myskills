/**
 * Admin v2, part 2: per-programme results — see docs/supabase-admin-v2-
 * programmes.sql — and the two lead lists, which admins read and update
 * straight from their tables (their RLS already allows it).
 */
import { supabase } from './supabase'
import type { ItemKey } from './careerReadinessContent'

function raise(error: { message?: string } | null): never {
  throw new Error(error?.message?.trim() || 'Something went wrong.')
}

export interface AptitudeRow {
  user_id: string
  full_name: string | null
  email: string
  completed_at: string
  scores: Record<string, number>
  reflection: string | null
}

export async function fetchAptitudeResults(programme: 'digital-marketing' | 'career-readiness'): Promise<AptitudeRow[]> {
  const { data, error } = await supabase.rpc('admin_aptitude_results', { p_programme: programme })
  if (error) raise(error)
  return (data ?? []) as AptitudeRow[]
}

export interface PracticeTrackRow {
  track_slug: string
  students: number
  avg_best: number
  attempts: number
  server_graded: number
  legacy: number
}

export async function fetchPracticeTracks(): Promise<PracticeTrackRow[]> {
  const { data, error } = await supabase.rpc('admin_practice_tracks')
  if (error) raise(error)
  return (data ?? []) as PracticeTrackRow[]
}

export interface TrackStudentRow {
  user_id: string
  full_name: string | null
  email: string
  best: number
  attempts: number
  last_attempt_at: string
  server_graded: number
}

export async function fetchTrackStudents(track: string): Promise<TrackStudentRow[]> {
  const { data, error } = await supabase.rpc('admin_practice_track_students', { p_track: track })
  if (error) raise(error)
  return (data ?? []) as TrackStudentRow[]
}

export interface FoundationRow {
  user_id: string
  full_name: string | null
  email: string
  percent: number
  correct: number
  total: number
  completed_at: string
  certificate_code: string | null
  certificate_kind: string | null
}

export async function fetchFoundationResults(): Promise<FoundationRow[]> {
  const { data, error } = await supabase.rpc('admin_foundation_results')
  if (error) raise(error)
  return (data ?? []) as FoundationRow[]
}

export async function fetchFoundationCategories(): Promise<{ category: string; students: number; avg_percent: number }[]> {
  const { data, error } = await supabase.rpc('admin_foundation_categories')
  if (error) raise(error)
  return (data ?? []) as { category: string; students: number; avg_percent: number }[]
}

export async function fetchCrModules(): Promise<{ module: string; started: number; finished: number }[]> {
  const { data, error } = await supabase.rpc('admin_cr_modules')
  if (error) raise(error)
  return (data ?? []) as { module: string; started: number; finished: number }[]
}

export interface ModuleAnswerRow {
  user_id: string
  full_name: string | null
  email: string
  item: ItemKey
  response: string
  updated_at: string
}

export async function fetchModuleAnswers(module: string): Promise<ModuleAnswerRow[]> {
  const { data, error } = await supabase.rpc('admin_cr_module_answers', { p_module: module })
  if (error) raise(error)
  return (data ?? []) as ModuleAnswerRow[]
}

/* -- leads ---------------------------------------------------------------- */

export interface InternshipLead {
  id: string
  created_at: string
  company: string
  contact_name: string
  role: string | null
  email: string
  phone: string | null
  city: string | null
  roles_offered: string | null
  contacted: boolean
  contacted_at: string | null
}

export async function fetchInternshipLeads(): Promise<InternshipLead[]> {
  const { data, error } = await supabase
    .from('internship_partner_leads')
    .select('id, created_at, company, contact_name, role, email, phone, city, roles_offered, contacted, contacted_at')
    .order('created_at', { ascending: false })
  if (error) raise(error)
  return (data ?? []) as InternshipLead[]
}

export interface CareerReadinessLead {
  id: string
  created_at: string
  full_name: string
  phone: string
  email: string | null
  city: string | null
  contacted: boolean
  contacted_at: string | null
}

export async function fetchCareerReadinessLeads(): Promise<CareerReadinessLead[]> {
  const { data, error } = await supabase
    .from('career_readiness_leads')
    .select('id, created_at, full_name, phone, email, city, contacted, contacted_at')
    .order('created_at', { ascending: false })
  if (error) raise(error)
  return (data ?? []) as CareerReadinessLead[]
}

/** Tick a lead as contacted (or untick it). Admins only, by RLS. */
export async function setLeadContacted(
  table: 'internship_partner_leads' | 'career_readiness_leads',
  id: string,
  contacted: boolean,
): Promise<void> {
  const {
    data: { user },
  } = await supabase.auth.getUser()
  const { error } = await supabase
    .from(table)
    .update({
      contacted,
      contacted_at: contacted ? new Date().toISOString() : null,
      contacted_by: contacted ? (user?.id ?? null) : null,
    })
    .eq('id', id)
  if (error) raise(error)
}
