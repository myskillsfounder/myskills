/**
 * The course engine (docs/supabase-course-engine.sql): programmes stored as
 * data. Every programme has the same shape, so one editor and (from step 2)
 * one set of student pages work for all of them, and the Course Architect
 * can write drafts in it. A version is edited as a draft, checked, then
 * published; students keep the version they started on.
 */
import { supabase } from './supabase'

export type ProgrammeKind = 'professional' | 'personal'
export type ProgrammeStatus = 'draft' | 'published' | 'archived'
export type VersionStatus = 'draft' | 'published' | 'superseded'
export type Level = 'beginner' | 'intermediate' | 'advanced'
export type ModuleLevel = 'foundation' | 'intermediate' | 'advanced'
export type Difficulty = 'Beginner' | 'Intermediate' | 'Advanced' | 'Expert'

export interface Question {
  id: string
  /** Optional context: the situation the question is set in. */
  scenario: string
  question: string
  options: string[]
  correct_index: number
  /** Why the right answer is right; shown after the attempt. */
  explanation: string
  difficulty: Difficulty
  /** The topic it tests, for Question health and the Learner Coach. */
  topic: string
  weight: number
}

export interface ProgrammeModule {
  id: string
  title: string
  /** The skill it trains (a skill id). */
  skill: string
  level: ModuleLevel
  outcome: string
  minutes: number
  learn: { title: string; body: string }[]
  tasks: { id: string; title: string; prompt: string; hint: string }[]
  reflection: { prompt: string; hint: string }
  quiz: Question[]
}

export interface ProgrammeContent {
  overview: { summary: string; audience: string; outcomes: string[]; level: Level; hours: number }
  skills: { id: string; name: string; description: string }[]
  aptitude: { items: { id: string; skill: string; statement: string; reverse: boolean }[] }
  modules: ProgrammeModule[]
  final: { minutes: number; pass_percent: number; questions: Question[] }
  project: { brief: string; deliverables: string[]; rubric: { id: string; name: string; description: string }[] }
}

export interface ProgrammeSummary {
  id: string
  slug: string
  title: string
  kind: ProgrammeKind
  status: ProgrammeStatus
  current_version: number | null
  draft_version: number | null
  updated_at: string
  published_at: string | null
  modules: number
  questions: number
  /** What the version being edited still needs before it can be published. */
  problems: number
}

export interface ProgrammeVersion {
  version: number
  status: VersionStatus
  note: string | null
  published_at: string | null
  updated_at: string
}

export interface ProgrammeForEditing {
  id: string
  slug: string
  title: string
  kind: ProgrammeKind
  status: ProgrammeStatus
  current_version: number | null
  editing_version: number
  editing_status: VersionStatus
  content: ProgrammeContent
  updated_at: string
  problems: string[]
  versions: ProgrammeVersion[]
}

function fail(error: { message?: string }): never {
  throw new Error(error.message?.trim() || 'Something went wrong.')
}

/** Null until the SQL is run. */
export async function fetchProgrammes(): Promise<ProgrammeSummary[] | null> {
  const { data, error } = await supabase.rpc('admin_programmes')
  if (error) {
    if (error.code === 'PGRST202') return null
    fail(error)
  }
  return (data ?? []) as ProgrammeSummary[]
}

export async function fetchProgramme(slug: string): Promise<ProgrammeForEditing | null> {
  const { data, error } = await supabase.rpc('admin_programme', { p_slug: slug })
  if (error) fail(error)
  if (!data) return null
  const p = data as ProgrammeForEditing
  // Older or hand-made drafts may miss a part: fill it from a blank programme.
  return { ...p, content: withDefaults(p.content) }
}

export async function createProgramme(slug: string, title: string, kind: ProgrammeKind): Promise<string> {
  const { data, error } = await supabase.rpc('admin_create_programme', { p_slug: slug, p_title: title, p_kind: kind })
  if (error) fail(error)
  return data as string
}

export async function updateProgramme(id: string, title: string, kind: ProgrammeKind): Promise<void> {
  const { error } = await supabase.rpc('admin_update_programme', { p_id: id, p_title: title, p_kind: kind })
  if (error) fail(error)
}

/** Saves the draft; returns what is still missing before it can be published. */
export async function saveProgrammeDraft(id: string, content: ProgrammeContent): Promise<string[]> {
  const { data, error } = await supabase.rpc('admin_save_programme_draft', { p_id: id, p_content: content })
  if (error) fail(error)
  return (data ?? []) as string[]
}

export async function publishProgramme(id: string, note: string): Promise<number> {
  const { data, error } = await supabase.rpc('admin_publish_programme', { p_id: id, p_note: note || null })
  if (error) fail(error)
  return data as number
}

export async function discardProgrammeDraft(id: string): Promise<void> {
  const { error } = await supabase.rpc('admin_discard_programme_draft', { p_id: id })
  if (error) fail(error)
}

export async function archiveProgramme(id: string, archived: boolean): Promise<void> {
  const { error } = await supabase.rpc('admin_archive_programme', { p_id: id, p_archived: archived })
  if (error) fail(error)
}

/* ------------------------------------------------------------ building */

/** "Data Analytics" -> "data-analytics". */
export const slugify = (s: string) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40)

/** A short id that stays the same when the item is renamed or moved. */
export const newId = (prefix: string) => `${prefix}-${Math.random().toString(36).slice(2, 8)}`

export const blankQuestion = (): Question => ({
  id: newId('q'),
  scenario: '',
  question: '',
  options: ['', '', '', ''],
  correct_index: 0,
  explanation: '',
  difficulty: 'Intermediate',
  topic: '',
  weight: 10,
})

export const blankModule = (skill = ''): ProgrammeModule => ({
  id: newId('m'),
  title: 'New module',
  skill,
  level: 'foundation',
  outcome: '',
  minutes: 45,
  learn: [{ title: '', body: '' }],
  tasks: [{ id: 't1', title: '', prompt: '', hint: '' }],
  reflection: { prompt: '', hint: '' },
  quiz: [],
})

const BLANK: ProgrammeContent = {
  overview: { summary: '', audience: '', outcomes: [], level: 'beginner', hours: 0 },
  skills: [],
  aptitude: { items: [] },
  modules: [],
  final: { minutes: 30, pass_percent: 60, questions: [] },
  project: { brief: '', deliverables: [], rubric: [] },
}

export function withDefaults(c: Partial<ProgrammeContent> | null | undefined): ProgrammeContent {
  const x = c ?? {}
  return {
    overview: { ...BLANK.overview, ...(x.overview ?? {}) },
    skills: x.skills ?? [],
    aptitude: { items: x.aptitude?.items ?? [] },
    modules: (x.modules ?? []).map((m) => ({ ...blankModule(), ...m, quiz: (m.quiz ?? []).map((q) => ({ ...blankQuestion(), ...q })) })),
    final: { ...BLANK.final, ...(x.final ?? {}), questions: (x.final?.questions ?? []).map((q) => ({ ...blankQuestion(), ...q })) },
    project: { ...BLANK.project, ...(x.project ?? {}) },
  }
}

export const LEVELS: Level[] = ['beginner', 'intermediate', 'advanced']
export const MODULE_LEVELS: ModuleLevel[] = ['foundation', 'intermediate', 'advanced']
export const DIFFICULTIES: Difficulty[] = ['Beginner', 'Intermediate', 'Advanced', 'Expert']
