/**
 * Career Readiness initial assessment — a self-awareness baseline for the five
 * programme modules. See docs/supabase-career-readiness-assessment.sql.
 *
 * Not a test: 25 statements, each rated Never / Sometimes / Often / Always
 * (1-4). One statement per skill is worded negatively and scored in reverse.
 * Scoring happens in Postgres (submit_career_readiness_assessment), so the
 * client only ever reads results back. A skill scores 5-20 and maps to a
 * level below. It is NOT part of the 30-point Personal Development score,
 * which is earned through the programme.
 */
import { useEffect, useState } from 'react'
import { supabase } from './supabase'

export type SkillKey = 'communication' | 'goal-setting' | 'growth-mindset' | 'leadership' | 'agile'

/** In the order the assessment cycles through them. `module` is the title in
 *  PERSONAL_DEVELOPMENT_MODULES (lib/programmes.ts) that trains the skill. */
export const SKILLS: { key: SkillKey; name: string; module: string }[] = [
  { key: 'communication', name: 'Communication', module: 'Communication' },
  { key: 'goal-setting', name: 'Goal setting', module: 'Goal Setting' },
  { key: 'growth-mindset', name: 'Growth mindset', module: 'Growth Mindset' },
  { key: 'leadership', name: 'Leadership', module: 'Leadership' },
  { key: 'agile', name: 'Agile working', module: 'Agile Methodology' },
]

/** Five statements per skill, 1-4 each. */
export const SKILL_MIN = 5
export const SKILL_MAX = 20

export const FREQUENCY = [
  { value: 1, label: 'Never' },
  { value: 2, label: 'Sometimes' },
  { value: 3, label: 'Often' },
  { value: 4, label: 'Always' },
] as const

export interface AssessmentQuestion {
  id: string
  skill: SkillKey
  statement: string
}

export interface AssessmentResult {
  scores: Record<SkillKey, number>
  reflection: string | null
  completedAt: string | null
}

export type Level = 'Emerging' | 'Developing' | 'Established' | 'Standout'

export const LEVELS: Level[] = ['Emerging', 'Developing', 'Established', 'Standout']

export function levelFor(score: number): Level {
  if (score >= 18) return 'Standout'
  if (score >= 14) return 'Established'
  if (score >= 10) return 'Developing'
  return 'Emerging'
}

/** Pill colours for each level, on a light surface. */
export const LEVEL_TONE: Record<Level, string> = {
  Emerging: 'bg-ink-100 text-ink-700',
  Developing: 'bg-amber-50 text-amber-700',
  Established: 'bg-brand-50 text-brand-700',
  Standout: 'bg-emerald-50 text-emerald-700',
}

/** Where to start: the lowest-scoring skill, ties broken by SKILLS order. */
export function suggestedStart(scores: Record<SkillKey, number>) {
  return SKILLS.reduce((low, s) => ((scores[s.key] ?? 0) < (scores[low.key] ?? 0) ? s : low), SKILLS[0])
}

/** Plain-language read-out for each skill at each level. */
export const READOUT: Record<SkillKey, Record<Level, string>> = {
  communication: {
    Emerging:
      'You don’t yet spend much time noticing or practising how you communicate. That’s a normal starting point — small habits, like watching how good speakers structure what they say, move this quickly.',
    Developing:
      'You’re aware of good communication and try things now and then. The next step is making it a habit: checking people understood, and listening fully before you reply.',
    Established:
      'You notice good communication and work on your own. Keep stretching with harder conversations — presenting, giving feedback, disagreeing well.',
    Standout:
      'Communication is a real strength: you observe it, practise it and adapt to the person in front of you. Look for chances to coach others.',
  },
  'goal-setting': {
    Emerging:
      'Your goals mostly live in your head, or fade quickly. Writing one specific goal with a date, and checking it every week, is the biggest single upgrade available.',
    Developing:
      'You set goals and sometimes follow through. Making them specific, breaking them into weekly steps and reviewing them will make them stick.',
    Established:
      'You set clear goals and mostly keep going. Sharpen it by reviewing on a fixed day each week and dropping goals that no longer matter.',
    Standout:
      'You set clear goals, break them down and keep going on low-motivation days. You’re ready to set stretch goals and help others plan theirs.',
  },
  'growth-mindset': {
    Emerging:
      'Setbacks and criticism can feel like verdicts on who you are. Treating them as information — “what can I learn from this?” — is the shift that unlocks everything else.',
    Developing:
      'You sometimes learn from setbacks and try new things. Asking for feedback on purpose, and practising regularly, will make growth a habit.',
    Established:
      'You learn from mistakes and seek feedback. Push further by choosing challenges you might fail at.',
    Standout:
      'You treat effort and feedback as the route to getting better, and you look for hard things. Share how you work with others.',
  },
  leadership: {
    Emerging:
      'You tend to wait for someone else to lead and organise. Start small: take one task in your next group project and own it from start to finish.',
    Developing:
      'You step up sometimes and help when asked. Noticing who is struggling or quiet before anyone asks is the next level.',
    Established:
      'You take responsibility, involve others and organise. Practise leading through disagreement, and persuading without pushing.',
    Standout:
      'You lead without needing a title: you own outcomes, bring quieter voices in and persuade well. Look for a bigger project to lead.',
  },
  agile: {
    Emerging:
      'You tend to plan big and finish late, or get stuck when plans change. Try splitting one task into steps that take an hour each, and finishing one before starting the next.',
    Developing:
      'You break work down sometimes and adapt when you have to. Shipping something small early, and reviewing after each task, will speed you up.',
    Established:
      'You work in small steps, adapt and reflect. Try a short review after every task — what went well, what to change.',
    Standout:
      'You work in short cycles, get feedback early and adapt calmly when things change. This is how modern teams work.',
  },
}

function fail(error: { message?: string }): never {
  throw new Error(error.message?.trim() || 'Something went wrong.')
}

/** The 25 statements, in the order they're asked. */
export async function fetchAssessmentQuestions(): Promise<AssessmentQuestion[]> {
  const { data, error } = await supabase
    .from('career_readiness_assessment_questions')
    .select('id, skill, statement')
    .order('sort_order', { ascending: true })
  if (error) fail(error)
  return (data ?? []) as AssessmentQuestion[]
}

/** The signed-in learner's result, or null if they haven't taken it. Before
 *  the SQL is run the table doesn't exist — that reads as "not taken" so
 *  Practice keeps working, the same way mentorReview does. */
export async function fetchMyAssessmentResult(): Promise<AssessmentResult | null> {
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return null
  const { data, error } = await supabase
    .from('career_readiness_assessment_results')
    .select('scores, reflection, completed_at')
    .eq('profile_id', user.id)
    .maybeSingle()
  if (error || !data) return null
  return {
    scores: data.scores as Record<SkillKey, number>,
    reflection: data.reflection ?? null,
    completedAt: data.completed_at ?? null,
  }
}

/** Scores and saves server-side; rejects a second attempt. */
export async function submitAssessment(
  answers: Record<string, number>,
  reflection: string,
): Promise<AssessmentResult> {
  const { data, error } = await supabase.rpc('submit_career_readiness_assessment', {
    p_answers: answers,
    p_reflection: reflection.trim() || null,
  })
  if (error) fail(error)
  const r = data as { scores: Record<SkillKey, number>; reflection: string | null }
  return { scores: r.scores, reflection: r.reflection ?? null, completedAt: null }
}

/** Each skill with its score and level, in the order they were asked. */
export function orderedSkills(scores: Record<SkillKey, number>) {
  return SKILLS.map((s) => ({
    ...s,
    score: scores[s.key] ?? 0,
    level: levelFor(scores[s.key] ?? 0),
  }))
}

/** Has the learner taken it? null while loading. */
export function useMyAssessmentResult() {
  const [result, setResult] = useState<AssessmentResult | null>(null)
  const [loading, setLoading] = useState(true)
  useEffect(() => {
    let active = true
    fetchMyAssessmentResult()
      .then((r) => active && setResult(r))
      .finally(() => active && setLoading(false))
    return () => {
      active = false
    }
  }, [])
  return { result, loading, setResult }
}
