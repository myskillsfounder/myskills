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
export const stepLabels = ['About you', 'Your goals', 'Get started'] as const

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

/** The two groups, in the order the goals are shown. */
export const goalGroups: { id: GoalOption['group']; label: string }[] = [
  { id: 'personal', label: 'Career & personal skills' },
  { id: 'marketing', label: 'Digital marketing' },
]

export const goalsStep = {
  title: 'What brings you here?',
  subtitle: 'Pick everything that fits — it helps us suggest where to start.',
  // Existing ids are kept: a student who onboarded earlier still sees their
  // goals, with the same labels, on the LaunchPad.
  options: [
    { id: 'first-job', label: 'Land my first job or internship', group: 'personal' },
    { id: 'confidence', label: 'Communicate and present with confidence', group: 'personal' },
    { id: 'career-plan', label: 'Set clear career goals and a plan to reach them', group: 'personal' },
    { id: 'leadership', label: 'Build leadership experience', group: 'personal' },
    { id: 'habits', label: 'Build habits that keep me growing', group: 'personal' },
    { id: 'job-ready', label: 'Build job-ready digital marketing skills', group: 'marketing' },
    { id: 'interviews', label: 'Prepare for marketing interviews', group: 'marketing' },
    { id: 'freelancing', label: 'Start freelancing with marketing services', group: 'marketing' },
    { id: 'grow-business', label: 'Grow my own business online', group: 'marketing' },
    { id: 'portfolio', label: 'Build a campaign portfolio', group: 'marketing' },
    { id: 'seo-content', label: 'Learn SEO and content strategy', group: 'marketing' },
    { id: 'paid-ads', label: 'Run better paid ad campaigns', group: 'marketing' },
    { id: 'analytics', label: 'Understand analytics and reporting', group: 'marketing' },
  ] as GoalOption[],
}

/** Which aptitude assessment to suggest first, from the goals picked: the
 *  programme with more goals wins; a tie (or nothing picked) suggests neither,
 *  and both are shown equally. */
export function recommendStart(goals: string[]): 'marketing' | 'personal' | null {
  let personal = 0
  let marketing = 0
  for (const id of goals) {
    const g = goalsStep.options.find((o) => o.id === id)?.group
    if (g === 'personal') personal++
    else if (g === 'marketing') marketing++
  }
  if (personal === marketing) return null
  return personal > marketing ? 'personal' : 'marketing'
}

/* ------------------------------------------------------------------ Step 3 */

export const startStep = {
  title: 'Where would you like to start?',
  subtitle:
    'Pick an aptitude assessment — 20 statements, about five minutes, no right answers. You can take the other one any time.',
  skip: 'I’ll look around first',
}
