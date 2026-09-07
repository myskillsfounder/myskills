/**
 * Initial assessment — question content only. Grading and the answer key
 * live in Postgres now (docs/supabase-server-side-grading.sql), not here.
 *
 * This used to be a static array of 35 MCQs that included the correct
 * answer on every question object — which meant the answer key shipped in
 * the client bundle, readable by anyone via devtools, and the client graded
 * itself and wrote whatever score it liked. See the migration file for the
 * full writeup. The question bank (id/category/question/options — nothing
 * that reveals a correct answer) still comes from the same source
 * (content/source-assessment-bank/MySkills_45Plus5_Assessment_Bank.xlsx);
 * regenerate the SQL seed from the xlsx if the source ever changes.
 */
import { supabase } from './supabase'

export interface QuizQuestion {
  id: string
  category: string
  question: string
  options: string[]
}

/** The question bank, in display order. No correct-answer data — see above. */
export async function fetchInitialAssessmentQuestions(): Promise<QuizQuestion[]> {
  const { data, error } = await supabase
    .from('initial_assessment_questions')
    .select('id, category, question, options')
    .order('sort_order', { ascending: true })
  if (error) throw error
  return (data ?? []) as QuizQuestion[]
}

export interface CategoryScore {
  category: string
  correct: number
  total: number
}

export interface AssessmentGrade {
  correct: number
  total: number
  percent: number
  byCategory: CategoryScore[]
}

/** Ordered list of the 7 categories in the bank. Static rather than derived
 *  from question content, so nothing here needs to import answer-bearing
 *  data just to know the category names. */
export const assessmentCategories: string[] = [
  'Marketing Fundamentals',
  'Market Research',
  'Meta Ads',
  'Google Ads',
  'SEO',
  'Analytics',
  'Scenario Based',
]
