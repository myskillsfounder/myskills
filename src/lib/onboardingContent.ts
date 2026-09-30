/**
 * Onboarding content — edit copy, options, and placeholders here (no JSX changes
 * needed). Covers both programmes: Digital Marketing and Career Readiness.
 *
 * Consumed by routes/onboarding.tsx (career stage + goals) and by the profile
 * "complete your profile" flow (personal details). Personal details are NOT
 * asked during onboarding any more — sign-up stays short and people fill them
 * in later from /profile.
 */

export interface SelectOption {
  value: string
  label: string
}

export interface OptionCard {
  id: string
  title: string
  description: string
}

export interface GoalOption {
  id: string
  label: string
  /** Which programme this goal points toward — used to suggest where to start. */
  group: 'personal' | 'marketing'
}

/** Step labels shown in the progress header (order defines the flow). */
export const stepLabels = ['Your goal', 'About you', 'Get started'] as const

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

/* ------------------------------------------------------------------ Step 1 */

export const careerStageStep = {
  title: 'Where are you right now?',
  subtitle: 'So we can match what you practise to your next move.',
  options: [
    {
      id: 'studying',
      title: 'Currently studying',
      description: 'School, college, university or a course.',
    },
    {
      id: 'graduated',
      title: 'Graduated',
      description: 'Completed formal education and planning next steps.',
    },
    {
      id: 'freelancer',
      title: 'Freelancer',
      description: 'Working independently with clients or projects.',
    },
    {
      id: 'professional',
      title: 'Working professional',
      description: 'Employed, interning, or building career experience.',
    },
    {
      id: 'exploring',
      title: 'Exploring options',
      description: 'Still figuring out the best career direction.',
    },
  ] as OptionCard[],
}

/* ------------------------------------------------------------------ Step 2 */

/** Which aptitude assessment a goal points toward (see recommendStart). */
type StartSuggestion = 'marketing' | 'personal' | null

export interface PrimaryGoal {
  id: string
  title: string
  description: string
  /** A lucide icon name, resolved in the onboarding page. */
  icon: 'briefcase' | 'rocket' | 'sparkles' | 'trending-up' | 'laptop' | 'users'
  start: StartSuggestion
}

/**
 * The one goal a student is working towards — asked first, because everything
 * after it (what to start with, what the LaunchPad calls their objective) is
 * built on it. One answer, not a list: a single clear aim.
 */
export const goalStep = {
  title: 'What’s the one goal you want to work towards?',
  subtitle: 'Pick the one that matters most right now.',
  options: [
    { id: 'job', title: 'Find a new job', description: 'Land a role, or your first internship.', icon: 'briefcase', start: 'personal' },
    { id: 'business', title: 'Start your own business', description: 'Turn an idea into something real.', icon: 'rocket', start: 'marketing' },
    { id: 'skill', title: 'Learn a new skill', description: 'Build something you can show for it.', icon: 'sparkles', start: null },
    { id: 'grow', title: 'Grow in my current career', description: 'Move up, or take on more.', icon: 'trending-up', start: 'personal' },
    { id: 'freelance', title: 'Become a freelancer', description: 'Earn from your skills, on your terms.', icon: 'laptop', start: 'marketing' },
    { id: 'confidence', title: 'Build confidence and leadership', description: 'Communicate, lead and back yourself.', icon: 'users', start: 'personal' },
  ] as PrimaryGoal[],
}

/** Goals chosen under the earlier multi-select onboarding. They stay on those
 *  accounts, so their labels stay resolvable (the LaunchPad objective shows one). */
const LEGACY_GOAL_LABELS: Record<string, string> = {
  'job-ready': 'Build job-ready digital marketing skills',
  interviews: 'Prepare for marketing interviews',
  freelancing: 'Start freelancing with marketing services',
  'grow-business': 'Grow my own business online',
  portfolio: 'Build a campaign portfolio',
  'seo-content': 'Learn SEO and content strategy',
  'paid-ads': 'Run better paid ad campaigns',
  analytics: 'Understand analytics and reporting',
  'first-job': 'Land my first job or internship',
  confidence: 'Communicate and present with confidence',
  'career-plan': 'Set clear career goals and a plan to reach them',
  leadership: 'Build leadership experience',
  habits: 'Build habits that keep me growing',
}

/** The label for a saved goal, current or earlier; unknown ids are shown as-is. */
export function goalLabel(id: string): string {
  return goalStep.options.find((o) => o.id === id)?.title ?? LEGACY_GOAL_LABELS[id] ?? id
}

/** Which aptitude assessment to suggest first, from the goal: business and
 *  freelancing point at marketing; a job, growing or confidence at the
 *  personal skills; "learn a new skill" is open, so neither is suggested. */
export function recommendStart(goal: string | undefined): StartSuggestion {
  return goalStep.options.find((o) => o.id === goal)?.start ?? null
}

/* ------------------------------------------------------------------ Step 3 */

export const startStep = {
  title: 'Where would you like to start?',
  subtitle:
    'Pick an aptitude assessment — 20 statements, about five minutes, no right answers. You can take the other one any time.',
  goalPrefix: 'Your goal',
  skip: 'I’ll look around first',
}
