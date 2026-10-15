/**
 * Life Readiness starting assessment: since 2026-10 the Life Skills Profile,
 * WHO's ten life skills (lib/lifeSkills.ts, docs/supabase-life-skills.sql).
 * Students who took the earlier version keep that result, five skills of the
 * programme's own, until they take the profile; both kinds of result are read
 * here, told apart by their keys (skillsFor).
 *
 * The earlier version, as it was:
 *
 * Not a test: 20 statements, each rated Never / Sometimes / Often / Always
 * (1-4). One statement per skill is worded negatively and scored in reverse.
 * Scoring happens in Postgres (submit_career_readiness_assessment), so the
 * client only ever reads results back. A skill scores 4-16 and maps to a
 * level below. It is NOT part of the 30-point Personal Development score,
 * which is earned through the programme.
 */
import { useEffect, useState } from 'react'
import { supabase } from './supabase'
import { shared } from './shared'
import { sessionUser } from './sessionUser'
import { forgetStarted } from './startedCache'
import { ensureProfile } from './profile'
import { PERSONAL_DEVELOPMENT_MODULES } from './programmes'
import { LIFE_READOUT, LIFE_SKILLS, LIFE_SKILL_MAX, LIFE_SKILL_MIN, PROGRAMME_SKILLS, type LifeSkillKey } from './lifeSkills'

/** The earlier version's five skills. */
export type LegacySkillKey = 'communication' | 'goal-setting' | 'growth-mindset' | 'leadership' | 'agile'
export type SkillKey = LegacySkillKey | LifeSkillKey

/** In the order the assessment cycles through them. `module` is the title in
 *  PERSONAL_DEVELOPMENT_MODULES (lib/programmes.ts) that trains the skill. */
export const SKILLS: { key: LegacySkillKey; name: string; module: string }[] = [
  { key: 'communication', name: 'Communication', module: 'Communication' },
  { key: 'goal-setting', name: 'Goal setting', module: 'Goal Setting' },
  { key: 'growth-mindset', name: 'Growth mindset', module: 'Growth Mindset' },
  { key: 'leadership', name: 'Leadership', module: 'Leadership' },
  { key: 'agile', name: 'Agile working', module: 'Agile Methodology' },
]

/** Four statements per skill, 1-4 each. */
export const SKILL_MIN = 4
export const SKILL_MAX = 16

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
  /** Per skill: the ten life skills, or the earlier version's five. */
  scores: Partial<Record<SkillKey, number>>
  reflection: string | null
  completedAt: string | null
}

export type Level = 'Emerging' | 'Developing' | 'Established' | 'Standout'

export const LEVELS: Level[] = ['Emerging', 'Developing', 'Established', 'Standout']

/** The level for a score on a scale up to `max` (16 for the earlier version's
 *  four statements, 12 for the profile's three): the same shares of the scale
 *  as the earlier 14 / 11 / 8 out of 16. */
export function levelFor(score: number, max = SKILL_MAX): Level {
  const share = score / max
  if (share >= 14 / 16) return 'Standout'
  if (share >= 11 / 16) return 'Established'
  if (share >= 8 / 16) return 'Developing'
  return 'Emerging'
}

/** Pill colours for each level, on a dark surface. */
export const LEVEL_TONE_DARK: Record<Level, string> = {
  Emerging: 'bg-white/10 text-white/70',
  Developing: 'bg-amber-400/15 text-amber-200',
  Established: 'bg-brand-400/20 text-brand-100',
  Standout: 'bg-emerald-400/15 text-emerald-300',
}

/** Pill colours for each level, on a light surface (the mentor review card). */
export const LEVEL_TONE: Record<Level, string> = {
  Emerging: 'bg-ink-100 text-ink-700',
  Developing: 'bg-amber-50 text-amber-700',
  Established: 'bg-brand-50 text-brand-700',
  Standout: 'bg-emerald-50 text-emerald-700',
}

/** Is this a Life Skills Profile (as opposed to the earlier version)? */
export const isLifeSkills = (scores: Partial<Record<string, number>>) => 'self-awareness' in scores

/** The range a skill is scored on, for this kind of result. */
export const scaleFor = (scores: Partial<Record<string, number>>) =>
  isLifeSkills(scores) ? { min: LIFE_SKILL_MIN, max: LIFE_SKILL_MAX } : { min: SKILL_MIN, max: SKILL_MAX }

/** Module titles by slug, for "built in" and "where to start". */
const MODULE_TITLE: Record<string, string> = Object.fromEntries(
  PERSONAL_DEVELOPMENT_MODULES.map((m) => [m.slug, m.title]),
)

/**
 * Each skill in a result, in the order it's shown, with its score, level and
 * read-out, and the module(s) that build it. Works for both kinds of result.
 */
export function skillsFor(scores: Partial<Record<SkillKey, number>>) {
  const { max } = scaleFor(scores)
  if (isLifeSkills(scores)) {
    const who = LIFE_SKILLS.map((s) => {
      const score = scores[s.key] ?? 0
      const level = levelFor(score, max)
      return { key: s.key as SkillKey, name: s.name, score, level, max, readout: LIFE_READOUT[s.key][level], modules: s.modules.map((m) => MODULE_TITLE[m]) }
    })
    // The programme's own four, when the result has them (a profile taken
    // before they were added has the ten only).
    const own = PROGRAMME_SKILLS.filter((s) => s.key in scores).map((s) => {
      const score = scores[s.key] ?? 0
      const level = levelFor(score, max)
      return { key: s.key as SkillKey, name: s.name, score, level, max, readout: READOUT[s.key][level], modules: [MODULE_TITLE[s.module]] }
    })
    return [...who, ...own]
  }
  return SKILLS.map((s) => {
    const score = scores[s.key] ?? 0
    const level = levelFor(score, max)
    return { key: s.key as SkillKey, name: s.name, score, level, max, readout: READOUT[s.key][level], modules: [s.module] }
  })
}

/** Where to start: the module that builds the lowest-scoring skill (ties go to
 *  the skill shown first). */
export function suggestedStart(scores: Partial<Record<SkillKey, number>>) {
  const skills = skillsFor(scores)
  const low = skills.reduce((a, b) => (b.score < a.score ? b : a), skills[0])
  return { skill: low.name, module: low.modules[0] }
}

/** Plain-language read-out for each of the earlier version's skills at each level. */
export const READOUT: Record<LegacySkillKey, Record<Level, string>> = {
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

/**
 * The statements to ask, in order: the Life Skills Profile's (version 2).
 * Before docs/supabase-life-skills.sql is run there is no version to choose
 * by, so the earlier statements are asked and `lifeSkills` is false.
 */
export async function fetchAssessmentQuestions(): Promise<{ questions: AssessmentQuestion[]; lifeSkills: boolean }> {
  const v2 = await supabase
    .from('career_readiness_assessment_questions')
    .select('id, skill, statement')
    .eq('version', 2)
    .order('sort_order', { ascending: true })
  if (!v2.error && (v2.data ?? []).length > 0) return { questions: v2.data as AssessmentQuestion[], lifeSkills: true }
  const all = await supabase
    .from('career_readiness_assessment_questions')
    .select('id, skill, statement')
    .order('sort_order', { ascending: true })
  if (all.error) fail(all.error)
  return { questions: (all.data ?? []) as AssessmentQuestion[], lifeSkills: false }
}

/** The signed-in learner's result, or null if they haven't taken it. Before
 *  the SQL is run the table doesn't exist — that reads as "not taken" so
 *  Practice keeps working, the same way mentorReview does. */
export function fetchMyAssessmentResult(): Promise<AssessmentResult | null> {
  return shared('fetchMyAssessmentResult', fetchMyAssessmentResultOnce)
}

async function fetchMyAssessmentResultOnce(): Promise<AssessmentResult | null> {
  const user = await sessionUser()
  if (!user) return null
  const { data, error } = await supabase
    .from('career_readiness_assessment_results')
    .select('scores, reflection, completed_at')
    .eq('profile_id', user.id)
    .maybeSingle()
  if (error || !data) return null
  return {
    scores: data.scores as Partial<Record<SkillKey, number>>,
    reflection: data.reflection ?? null,
    completedAt: data.completed_at ?? null,
  }
}

/** Scores and saves server-side; rejects a second attempt (someone with only
 *  the earlier version's result may take the Life Skills Profile once). */
export async function submitAssessment(
  answers: Record<string, number>,
  reflection: string,
): Promise<AssessmentResult> {
  await ensureProfile()
  const { data, error } = await supabase.rpc('submit_career_readiness_assessment', {
    p_answers: answers,
    p_reflection: reflection.trim() || null,
  })
  if (error) fail(error)
  forgetStarted()
  const r = data as { scores: Partial<Record<SkillKey, number>>; reflection: string | null }
  return { scores: r.scores, reflection: r.reflection ?? null, completedAt: null }
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

