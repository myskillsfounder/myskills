/**
 * Onboarding content — edit copy, options, and placeholders here (no JSX changes
 * needed). Kerala + digital-marketing flavored. Consumed by routes/onboarding.tsx.
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
}

/** Step labels shown in the progress header (order defines the flow). */
export const stepLabels = ['Personal details', 'Career stage', 'Your goals'] as const

/* ------------------------------------------------------------------ Step 1 */

export const genderOptions: SelectOption[] = [
  { value: 'female', label: 'Female' },
  { value: 'male', label: 'Male' },
  { value: 'non-binary', label: 'Non-binary' },
  { value: 'prefer-not-to-say', label: 'Prefer not to say' },
]

export const personalDetailsStep = {
  title: 'Personal details',
  subtitle: 'Add the basics we need to personalize your profile.',
  fields: {
    phone: { label: 'Phone number', placeholder: '+91 98470 12345' },
    dob: { label: 'Date of birth' },
    gender: { label: 'Gender', placeholder: 'Select gender' },
    country: { label: 'Country', placeholder: 'India', default: 'India' },
    state: { label: 'State', placeholder: 'Kerala', default: 'Kerala' },
  },
}

/* ------------------------------------------------------------------ Step 2 */

export const careerStageStep = {
  title: 'Career stage',
  subtitle: 'Tell us where you are now so recommendations can match your next move.',
  options: [
    {
      id: 'studying',
      title: 'Currently studying',
      description: 'School, college, university, or an active marketing course.',
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

/* ------------------------------------------------------------------ Step 3 */

export const goalsStep = {
  title: 'Your goals',
  subtitle: 'Choose what you would like to achieve with MySkillz.',
  options: [
    { id: 'job-ready', label: 'Build job-ready digital marketing skills' },
    { id: 'interviews', label: 'Prepare for marketing interviews' },
    { id: 'freelancing', label: 'Start freelancing with marketing services' },
    { id: 'grow-business', label: 'Grow my own business online' },
    { id: 'portfolio', label: 'Build a campaign portfolio' },
    { id: 'seo-content', label: 'Learn SEO and content strategy' },
    { id: 'paid-ads', label: 'Run better paid ad campaigns' },
    { id: 'analytics', label: 'Understand analytics and reporting' },
  ] as GoalOption[],
}
