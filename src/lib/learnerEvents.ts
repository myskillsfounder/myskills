/**
 * Everything a student does, in one timeline (docs/supabase-learner-events.sql):
 * step 1 of the learner profile. The team reads it on a student's page; the
 * AI coach (step 2) will learn from the same events. Never part of the score.
 */
import { supabase } from './supabase'

export type LearnerEventKind =
  | 'aptitude'
  | 'practice'
  | 'foundation'
  | 'module_answer'
  | 'project'
  | 'mentor'
  | 'live_session'
  | 'internship'
  | 'certificate'
  | 'goal'
  | 'programme_quiz'
  | 'programme_final'

export interface LearnerEvent {
  at: string
  kind: LearnerEventKind
  summary: string
  data: Record<string, unknown>
}

/** A topic the student has answered questions on, and how many they missed. */
export interface LearnerTopic {
  source: 'practice' | 'foundation'
  track: string | null
  topic: string
  missed: number
  answered: number
}

export const EVENT_KIND: Record<LearnerEventKind, string> = {
  aptitude: 'Aptitude',
  practice: 'Practice',
  foundation: 'Foundation',
  module_answer: 'Module work',
  project: 'Project',
  mentor: 'Mentor',
  live_session: 'Live session',
  internship: 'Internship',
  certificate: 'Certificate',
  goal: 'Goals',
  programme_quiz: 'Programme quiz',
  programme_final: 'Foundation assessment',
}

/** Null until the SQL is run, so the page can say so instead of failing. */
export async function fetchLearnerEvents(studentId: string): Promise<LearnerEvent[] | null> {
  const { data, error } = await supabase.rpc('admin_learner_events', { p_student: studentId, p_limit: 500 })
  if (error) {
    if (error.code === 'PGRST202') return null
    throw new Error(error.message?.trim() || 'Something went wrong.')
  }
  return (data ?? []) as LearnerEvent[]
}

export async function fetchLearnerTopics(studentId: string): Promise<LearnerTopic[] | null> {
  const { data, error } = await supabase.rpc('admin_learner_topics', { p_student: studentId })
  if (error) {
    if (error.code === 'PGRST202') return null
    throw new Error(error.message?.trim() || 'Something went wrong.')
  }
  return (data ?? []) as LearnerTopic[]
}
