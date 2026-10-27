/**
 * A student taking a programme on the course engine
 * (docs/supabase-course-engine-students.sql). The server grades everything
 * and never sends answers before an attempt; staff can preview a draft, which
 * does include the answers, and nothing is saved in preview.
 */
import { supabase } from './supabase'
import type { CertificateKind } from './certificates'
import type { ProgrammeContent, ProgrammeModule, Question } from './programmeEngine'

export type SkillLevel = 'starting' | 'developing' | 'strong'
export type SkillScores = Record<string, { percent: number; level: SkillLevel }>

export interface QuizState {
  best: number
  attempts: number
  last_at: string
  next_at: string
}

/** The Foundation assessment (the engine's `final`): one attempt, banded like
 *  every Foundation certificate. */
export interface FinalState {
  percent: number
  correct: number
  total: number
  completed_at: string
  kind: CertificateKind
  /** Null only if the certificate couldn't be issued. */
  certificate_code: string | null
}

/** The programme as one student sees it. In preview the content has the answers. */
export interface MyProgramme {
  slug: string
  title: string
  kind: 'professional' | 'personal'
  /** 'built-in': Global Leadership or Digital Marketing, whose pages live elsewhere. */
  source?: 'engine' | 'built-in'
  version: number
  latest_version: number
  enrolled: boolean
  started_at: string | null
  content: ProgrammeContent
  aptitude: { scores: SkillScores; completed_at: string } | null
  /** module id -> item ('t1', 'reflect') -> text */
  responses: Record<string, Record<string, string>>
  quizzes: Record<string, QuizState>
  final: FinalState | null
  /** The foundation modules are done (every module, when none is marked foundation). */
  foundation_unlocked: boolean
  /** When the Foundation assessment was finished. */
  final_passed_at: string | null
  /** Staff trying a draft: nothing is saved. */
  preview?: { status: string }
}

export interface CatalogueEntry {
  slug: string
  title: string
  kind: 'professional' | 'personal'
  version: number
  summary: string | null
  audience: string | null
  level: string | null
  hours: number | null
  skills: string[]
  modules: number
}

export interface QuizResult {
  grade: { correct: number; total: number; earnedWeight: number; maxWeight: number; percent: number }
  review: Record<string, { correctIndex: number; explanation: string; whyWrong?: string; learningOutcome?: string }>
  /** The Foundation assessment's certificate, issued with the result. */
  certificate?: { code: string; kind: CertificateKind; percent: number; title: string }
}

/** A quiz is passed at this %, and a module needs it. */
export const QUIZ_PASS = 60
export const MIN_TASK = 40
export const MIN_REFLECTION = 60

function fail(error: { message?: string }): never {
  throw new Error(error.message?.trim() || 'Something went wrong.')
}

/** A course-engine programme the student has joined, for Practice's cards. */
export interface MyEnrolment {
  slug: string
  title: string
  kind: 'professional' | 'personal'
  started_at: string
  modules_total: number
  modules_done: number
  aptitude_done: boolean
  final_passed: boolean
}

/** Empty, not an error, before docs/supabase-my-programmes.sql is run. */
export async function fetchMyProgrammes(): Promise<MyEnrolment[]> {
  const { data, error } = await supabase.rpc('my_programmes')
  if (error) return []
  return (data ?? []) as MyEnrolment[]
}

/** Null until the SQL is run. */
export async function fetchCatalogue(): Promise<CatalogueEntry[] | null> {
  const { data, error } = await supabase.rpc('list_programmes')
  if (error) {
    if (error.code === 'PGRST202') return null
    fail(error)
  }
  return (data ?? []) as CatalogueEntry[]
}

export async function fetchMyProgramme(slug: string, preview = false): Promise<MyProgramme> {
  if (preview) {
    const { data, error } = await supabase.rpc('preview_programme', { p_slug: slug })
    if (error) fail(error)
    const p = data as { slug: string; title: string; kind: 'professional' | 'personal'; version: number; status: string; content: ProgrammeContent }
    return {
      ...p,
      latest_version: p.version,
      enrolled: true,
      started_at: null,
      aptitude: null,
      responses: {},
      quizzes: {},
      final: null,
      foundation_unlocked: true,
      final_passed_at: null,
      preview: { status: p.status },
    }
  }
  const { data, error } = await supabase.rpc('get_my_programme', { p_slug: slug })
  if (error) fail(error)
  return data as MyProgramme
}

/** A published programme's aptitude test for a visitor who hasn't signed up:
 *  the statements and skill names only (docs/supabase-programme-guest-aptitude.sql).
 *  Null when the programme isn't published, or before that SQL is run. */
export interface GuestAptitude {
  slug: string
  title: string
  skills: { id: string; name: string }[]
  items: { id: string; skill: string; statement: string; reverse: boolean }[]
}

export async function fetchGuestAptitude(slug: string): Promise<GuestAptitude | null> {
  const { data, error } = await supabase.rpc('programme_guest_aptitude', { p_slug: slug })
  if (error || !data) return null
  const g = data as GuestAptitude
  return g.items?.length ? g : null
}

export async function enrol(slug: string): Promise<void> {
  const { error } = await supabase.rpc('enrol_programme', { p_slug: slug })
  if (error) fail(error)
}

export async function submitAptitude(slug: string, answers: Record<string, number>): Promise<SkillScores> {
  const { data, error } = await supabase.rpc('submit_programme_aptitude', { p_slug: slug, p_answers: answers })
  if (error) fail(error)
  return data as SkillScores
}

export async function saveResponse(slug: string, module: string, item: string, text: string): Promise<void> {
  const { error } = await supabase.rpc('save_programme_response', { p_slug: slug, p_module: module, p_item: item, p_response: text })
  if (error) fail(error)
}

export async function submitQuiz(slug: string, module: string, answers: Record<string, number>): Promise<QuizResult> {
  const { data, error } = await supabase.rpc('submit_programme_quiz', { p_slug: slug, p_module: module, p_answers: answers })
  if (error) fail(error)
  return data as QuizResult
}

/** The Foundation assessment: once, and it issues the programme's Foundation certificate. */
export async function submitFinal(slug: string, answers: Record<string, number>): Promise<QuizResult> {
  const { data, error } = await supabase.rpc('submit_programme_final', { p_slug: slug, p_answers: answers })
  if (error) fail(error)
  return data as QuizResult
}

/** Grades in the browser, for staff previewing a draft (its content carries the answers). */
export function gradeLocally(questions: Question[], answers: Record<string, number>): QuizResult {
  let earned = 0
  let max = 0
  let correct = 0
  const review: QuizResult['review'] = {}
  for (const q of questions) {
    const w = Math.max(q.weight || 1, 1)
    max += w
    if (answers[q.id] === q.correct_index) {
      earned += w
      correct += 1
    }
    review[q.id] = { correctIndex: q.correct_index, explanation: q.explanation, whyWrong: q.why_wrong, learningOutcome: q.learning_outcome }
  }
  return { grade: { correct, total: questions.length, earnedWeight: earned, maxWeight: max, percent: max ? Math.round((earned / max) * 100) : 0 }, review }
}

/* ------------------------------------------------------------ progress */

/** What a module asks the student to write: its tasks, and the reflection when it has tasks. */
export function itemsToWrite(m: ProgrammeModule): number {
  return m.tasks.length ? m.tasks.length + 1 : 0
}

export function itemsDone(p: MyProgramme, m: ProgrammeModule): number {
  const r = p.responses[m.id] ?? {}
  return m.tasks.filter((t) => r[t.id]).length + (m.tasks.length && r.reflect ? 1 : 0)
}

/** Everything written, and the quiz passed when the module has one. */
export function moduleDone(p: MyProgramme, m: ProgrammeModule): boolean {
  return itemsDone(p, m) === itemsToWrite(m) && (m.quiz.length === 0 || (p.quizzes[m.id]?.best ?? 0) >= QUIZ_PASS)
}

export function moduleStarted(p: MyProgramme, m: ProgrammeModule): boolean {
  return itemsDone(p, m) > 0 || Boolean(p.quizzes[m.id])
}

const LEVEL_ORDER = { foundation: 0, intermediate: 1, advanced: 2 } as const

/**
 * The order to take the modules in: weakest skill first (from the aptitude
 * test), and within a skill from foundation to advanced. Before the aptitude
 * test, the order the programme lists them in.
 */
export function suggestedOrder(p: MyProgramme): ProgrammeModule[] {
  const scores = p.aptitude?.scores
  const listed = p.content.modules.map((m, i) => ({ m, i }))
  if (!scores) return p.content.modules
  return listed
    .sort((a, b) => {
      const sa = scores[a.m.skill]?.percent ?? 100
      const sb = scores[b.m.skill]?.percent ?? 100
      return sa - sb || LEVEL_ORDER[a.m.level] - LEVEL_ORDER[b.m.level] || a.i - b.i
    })
    .map((x) => x.m)
}

export const LEVEL_LABEL: Record<SkillLevel, string> = { starting: 'Starting out', developing: 'Developing', strong: 'Strong' }
