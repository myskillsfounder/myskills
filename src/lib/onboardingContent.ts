/**
 * Onboarding content — edit copy, options, and placeholders here (no JSX changes
 * needed). Covers both programmes: Digital Marketing and Career Readiness.
 *
 * Consumed by routes/onboarding.tsx (the sentence: stage, goal and where to
 * start, then the plan built from them) and by the profile
 * "complete your profile" flow (personal details). Personal details are NOT
 * asked during onboarding any more — sign-up stays short and people fill them
 * in later from /profile.
 */

export interface SelectOption {
  value: string
  label: string
}

/* --------------------------------------------- Personal details (/profile) */

export const genderOptions: SelectOption[] = [
  { value: 'female', label: 'Female' },
  { value: 'male', label: 'Male' },
  { value: 'non-binary', label: 'Non-binary' },
  { value: 'prefer-not-to-say', label: 'Prefer not to say' },
]

/**
 * Collected on the profile page (profile completion), not during onboarding.
 */
export const personalDetailsForm = {
  title: 'Personal details',
  subtitle: 'Add the basics we need to personalize your profile.',
  fields: {
    phone: { label: 'Phone number', placeholder: '+91 98470 12345' },
    dob: { label: 'Date of birth' },
    gender: { label: 'Gender', placeholder: 'Select gender' },
    country: { label: 'Country', placeholder: 'India', default: 'India' },
    state: { label: 'State', placeholder: 'Your state', default: '' },
  },
}

/* ---------------------------------------------------------- The sentence */

/*
 * Onboarding is one sentence, completed with three dropdowns:
 *
 *   "I'm [a student] and I want to [find a new job], starting with [digital marketing]."
 *
 * and then MySkills answers with a plan built from those three choices. Each
 * option carries the words that go into the sentence (`chip`) as well as the
 * label and description shown in its dropdown.
 */

export interface SentenceOption {
  id: string
  label: string
  description: string
  /** The words that fill the blank in the sentence. */
  chip: string
}

export interface StageOption extends SentenceOption {
  /** How the answer refers to them: "As a student…", "As someone returning…". */
  who: string
}

export const careerStageStep = {
  title: 'Where are you right now?',
  subtitle: 'So we can match what you practise to your next move.',
  options: [
    { id: 'student', label: 'Student', description: 'In school, college or university.', chip: 'a student', who: 'a student' },
    { id: 'final-year', label: 'Final-year student', description: 'Close to finishing, with internships and a first job ahead.', chip: 'a final-year student', who: 'a final-year student' },
    { id: 'graduate', label: 'Recent graduate', description: 'Finished studying and looking for a first role.', chip: 'a recent graduate', who: 'a recent graduate' },
    { id: 'professional', label: 'Working professional', description: 'Employed and looking to grow or change direction.', chip: 'a working professional', who: 'a working professional' },
    { id: 'freelancer', label: 'Freelancer or business owner', description: 'Working for yourself, with clients or your own venture.', chip: 'a freelancer or business owner', who: 'a freelancer or business owner' },
    { id: 'returning', label: 'Returning after a break', description: 'Getting back to work after time away.', chip: 'returning after a break', who: 'someone returning after a break' },
    { id: 'exploring', label: 'Still exploring', description: 'Not sure yet which direction suits you.', chip: 'still exploring', who: 'someone still exploring' },
  ] as StageOption[],
}

/** Answers saved before the list was rewritten. They stay valid: an account
 *  that chose "studying" or "graduated" still shows a sensible label. */
const LEGACY_CAREER_STAGES: Record<string, string> = {
  studying: 'Student',
  graduated: 'Recent graduate',
}

/** The label for a saved career stage, old or new; unknown ids are shown as-is. */
export function careerStageLabel(id: string): string {
  return careerStageStep.options.find((o) => o.id === id)?.label ?? LEGACY_CAREER_STAGES[id] ?? id
}

export type StartKey = 'marketing' | 'personal'

export interface PrimaryGoal extends SentenceOption {
  /** The same goal as the answer says it, speaking to them: "start your own business". */
  you: string
  /** A lucide icon name, resolved where it's drawn. */
  icon: 'briefcase' | 'rocket' | 'sparkles' | 'trending-up' | 'laptop' | 'users' | 'message-circle' | 'dumbbell' | 'gauge'
  /** The programme this goal most naturally starts in. */
  lean: StartKey
}

/**
 * The one goal a student is working towards. One answer, not a list: a single
 * clear aim that the plan, and the LaunchPad's objective, are built on.
 */
export const goalStep = {
  title: 'What’s the one goal you want to work towards?',
  subtitle: 'Pick the one that matters most right now.',
  options: [
    { id: 'job', label: 'Find a new job', description: 'Land a role, or your first internship.', chip: 'find a new job', you: 'find a new job', icon: 'briefcase', lean: 'personal' },
    { id: 'business', label: 'Start your own business', description: 'Turn an idea into something real.', chip: 'start my own business', you: 'start your own business', icon: 'rocket', lean: 'marketing' },
    { id: 'skill', label: 'Learn a new skill', description: 'Build something you can show for it.', chip: 'learn a new skill', you: 'learn a new skill', icon: 'sparkles', lean: 'marketing' },
    { id: 'grow', label: 'Grow in my current career', description: 'Move up, or take on more.', chip: 'grow in my current career', you: 'grow in your current career', icon: 'trending-up', lean: 'personal' },
    { id: 'freelance', label: 'Become a freelancer', description: 'Earn from your skills, on your terms.', chip: 'become a freelancer', you: 'become a freelancer', icon: 'laptop', lean: 'marketing' },
    { id: 'confidence', label: 'Build confidence and leadership', description: 'Communicate, lead and back yourself.', chip: 'build confidence and leadership', you: 'build confidence and leadership', icon: 'users', lean: 'personal' },
    { id: 'mentor', label: 'Connect with a mentor', description: 'Get guidance from someone who has done it.', chip: 'connect with a mentor', you: 'connect with a mentor', icon: 'message-circle', lean: 'marketing' },
    { id: 'practise', label: 'Practise a skill', description: 'Sharpen it on real scenarios with an AI coach.', chip: 'practise a skill', you: 'practise a skill', icon: 'dumbbell', lean: 'marketing' },
    { id: 'assess', label: 'Assess my skill level', description: 'See where you stand today.', chip: 'assess my skill level', you: 'assess your skill level', icon: 'gauge', lean: 'marketing' },
  ] as PrimaryGoal[],
}

/**
 * Which goals each career stage is offered, so nobody scrolls past options that
 * don't fit them: a freelancer isn't asked to "find a new job", a student isn't
 * asked to "grow in my current career". Order is the order they're shown in.
 * A stage not listed (or an unknown one) is offered every goal.
 */
const GOALS_BY_STAGE: Record<string, string[]> = {
  student: ['skill', 'practise', 'assess', 'mentor', 'job', 'business', 'freelance', 'confidence'],
  'final-year': ['job', 'skill', 'practise', 'assess', 'mentor', 'business', 'freelance', 'confidence'],
  graduate: ['job', 'skill', 'practise', 'assess', 'mentor', 'business', 'freelance', 'confidence'],
  professional: ['grow', 'skill', 'practise', 'assess', 'mentor', 'job', 'business', 'confidence'],
  freelancer: ['mentor', 'skill', 'practise', 'assess'],
  returning: ['job', 'skill', 'practise', 'assess', 'mentor', 'confidence'],
  exploring: ['assess', 'skill', 'mentor', 'confidence', 'job'],
}

/** The goals to offer someone at this career stage. */
export function goalsFor(stageId: string): PrimaryGoal[] {
  const ids = GOALS_BY_STAGE[stageId]
  if (!ids) return goalStep.options
  return ids.map((id) => goalStep.options.find((o) => o.id === id)).filter((o): o is PrimaryGoal => Boolean(o))
}

/**
 * Goals chosen under the earlier multi-select onboarding. They stay saved on
 * those accounts, but the list no longer offers them, so each one is shown as
 * the current goal closest to it (an old "Prepare for marketing interviews"
 * reads "Find a new job"). Ids shared with today's list (confidence) need no
 * entry.
 */
const LEGACY_GOALS: Record<string, string> = {
  'job-ready': 'job',
  interviews: 'job',
  'first-job': 'job',
  freelancing: 'freelance',
  'grow-business': 'business',
  portfolio: 'skill',
  'seo-content': 'skill',
  'paid-ads': 'skill',
  analytics: 'skill',
  'career-plan': 'grow',
  leadership: 'confidence',
  habits: 'confidence',
}

/** A saved goal as today's goal: itself, or the current one closest to an old id. */
export function resolveGoal(id: string | undefined): PrimaryGoal | undefined {
  if (!id) return undefined
  const current = goalStep.options.find((o) => o.id === id)
  if (current) return current
  const mapped = LEGACY_GOALS[id]
  return mapped ? goalStep.options.find((o) => o.id === mapped) : undefined
}

/** The label for a saved goal, current or earlier; unknown ids are shown as-is. */
export function goalLabel(id: string): string {
  return resolveGoal(id)?.label ?? id
}

/** What to start with: "digital marketing", "career and personal skills", or
 *  "whatever you suggest" (then the goal decides). */
export const focusStep = {
  title: 'Where would you like to start?',
  options: [
    { id: 'marketing', label: 'Digital marketing', description: 'Eight skill tracks: SEO, ads, analytics and more.', chip: 'digital marketing' },
    { id: 'personal', label: 'Career & personal skills', description: 'Goal setting, communication, leadership and more.', chip: 'career and personal skills' },
    { id: 'unsure', label: 'Not sure yet', description: 'We’ll suggest one from your goal.', chip: 'whatever you suggest' },
  ] as SentenceOption[],
}

/** Where each assessment lives. */
export const ASSESSMENT_ROUTE: Record<StartKey, '/aptitude-assessment' | '/career-readiness-assessment'> = {
  marketing: '/aptitude-assessment',
  personal: '/career-readiness-assessment',
}

export const START_LABEL: Record<StartKey, string> = {
  marketing: 'Marketing aptitude',
  personal: 'Personal aptitude',
}

/* ------------------------------------------------------------------ The answer */

export interface Plan {
  start: StartKey
  other: StartKey
  /** "Based on": the three choices, in words. */
  basedOn: string[]
  /** One sentence: what to start with, and why. */
  headline: string
  /** Three steps, in order. */
  steps: { title: string; body: string }[]
}

const STEPS: Record<StartKey, Plan['steps']> = {
  marketing: [
    {
      title: 'Take the Marketing aptitude',
      body: '20 statements, about five minutes. It shows how marketing already shows up in your life, and opens Practice.',
    },
    {
      title: 'Practise eight skill tracks',
      body: 'Real scenarios with an AI coach — SEO, Google Ads, Meta Ads, analytics and more — then the Foundation assessment for your certificate.',
    },
    {
      title: 'Work with a mentor',
      body: 'Ask a mentor to work with you. They see your results, run sessions and award skill badges when you’ve earned them.',
    },
  ],
  personal: [
    {
      title: 'Take the Personal aptitude',
      body: '20 statements, about five minutes. It shows your starting point in goal setting, communication, leadership, agile and growth mindset.',
    },
    {
      title: 'Work through five modules',
      body: 'Practise each one in writing with an AI coach, at your own pace.',
    },
    {
      title: 'Get a mentor’s feedback',
      body: 'A mentor reviews your progress and helps you build proof of it.',
    },
  ],
}

/**
 * The answer to the sentence. The start comes from what they said they'd like
 * to start with; "not sure" lets the goal decide. Deterministic on purpose —
 * the same three choices always give the same plan.
 */
export function planFor(stageId: string, goalId: string, focusId: string): Plan {
  const stage = careerStageStep.options.find((o) => o.id === stageId)
  const goal = goalStep.options.find((o) => o.id === goalId)
  const focus = focusStep.options.find((o) => o.id === focusId)

  const start: StartKey = focusId === 'marketing' || focusId === 'personal' ? focusId : (goal?.lean ?? 'personal')
  const other: StartKey = start === 'marketing' ? 'personal' : 'marketing'

  const because = focusId === 'marketing' || focusId === 'personal' ? '' : ' — it’s the closest fit to your goal'
  return {
    start,
    other,
    basedOn: [stage?.label, goal?.label, focus?.label].filter((x): x is string => Boolean(x)),
    headline: `As ${stage?.who ?? 'you'}, working to ${goal?.you ?? 'reach your goal'}, I’d start with the ${START_LABEL[start]}${because}.`,
    steps: STEPS[start],
  }
}
