/**
 * How every practice and Foundation question performs
 * (docs/supabase-question-health.sql): step 1 of the Assessment Agent. The
 * flags below are the standard checks used on any test; they only mean
 * something once enough students have answered (MIN_ANSWERS).
 */
import { supabase } from './supabase'

export interface QuestionStats {
  bank: 'practice' | 'foundation'
  question_id: string
  /** The practice track, or the Foundation category. */
  grp: string
  topic: string | null
  difficulty: string | null
  /** Practice: the scenario's title. The question text is in src/lib/decisionLabs.ts. */
  title: string | null
  /** Foundation only: the question and its options, from the database. */
  question: string | null
  options: string[] | null
  correct_index: number | null
  /** Students answering for the first time. */
  answered: number
  /** Every answer kept, retakes included. */
  answers: number
  correct_pct: number | null
  option_counts: number[]
  /** % right in the top third minus the bottom third; null until each has 5 answers. */
  separation: number | null
  upper_n: number
  lower_n: number
}

/** Fewer answers than this and the numbers are noise. */
export const MIN_ANSWERS = 30

export type QuestionFlag = 'too-easy' | 'too-hard' | 'check-key' | 'unused-option' | 'no-separation' | 'reversed'

export const FLAG: Record<QuestionFlag, { label: string; tone: 'warning' | 'danger' | 'neutral'; means: string }> = {
  reversed: {
    label: 'Strong students miss it',
    tone: 'danger',
    means: 'Students who do well overall get this wrong more often than students who do badly. The question is usually ambiguous, or the answer key is wrong.',
  },
  'check-key': {
    label: 'Check the answer',
    tone: 'danger',
    means: 'A wrong option is picked more often than the right one. Check the answer key, then whether that option is also defensible.',
  },
  'no-separation': {
    label: 'Doesn’t separate',
    tone: 'warning',
    means: 'Strong and weak students get it right about equally often, so it doesn’t tell them apart. Make the scenario sharper or the wrong options more plausible.',
  },
  'too-hard': {
    label: 'Too hard',
    tone: 'warning',
    means: 'A quarter or fewer get it right. Fine for an Expert question; otherwise check the wording, or move it up a level.',
  },
  'too-easy': {
    label: 'Too easy',
    tone: 'neutral',
    means: 'Nine in ten or more get it right, so it adds little. Make it harder, or keep it as a confidence builder.',
  },
  'unused-option': {
    label: 'Option nobody picks',
    tone: 'neutral',
    means: 'At least one wrong option is picked by fewer than 1 in 20. Replace it with a more tempting mistake.',
  },
}

export function flagsFor(q: QuestionStats): QuestionFlag[] {
  if (q.answered < MIN_ANSWERS || q.correct_pct === null || q.correct_index === null) return []
  const out: QuestionFlag[] = []
  if (q.separation !== null && q.separation < 0) out.push('reversed')
  const right = q.option_counts[q.correct_index] ?? 0
  if (q.option_counts.some((n, i) => i !== q.correct_index && n > right)) out.push('check-key')
  if (q.separation !== null && q.separation >= 0 && q.separation < 10) out.push('no-separation')
  if (q.correct_pct <= 25) out.push('too-hard')
  if (q.correct_pct >= 90) out.push('too-easy')
  const total = q.option_counts.reduce((a, b) => a + b, 0)
  const optionCount = q.options?.length ?? 4
  if (total > 0 && q.option_counts.slice(0, optionCount).some((n, i) => i !== q.correct_index && n / total < 0.05)) {
    out.push('unused-option')
  }
  return out
}

/** Null until the SQL is run. */
export async function fetchQuestionHealth(): Promise<QuestionStats[] | null> {
  const { data, error } = await supabase.rpc('admin_question_health')
  if (error) {
    if (error.code === 'PGRST202') return null
    throw new Error(error.message?.trim() || 'Something went wrong.')
  }
  return ((data ?? []) as QuestionStats[]).map((q) => ({
    ...q,
    correct_pct: q.correct_pct === null ? null : Number(q.correct_pct),
    separation: q.separation === null ? null : Number(q.separation),
  }))
}
