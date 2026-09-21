/**
 * Programmes — structured courses, starting with the Career Readiness
 * Programme. Interest is captured as a row in programme_interest (docs/
 * supabase-programme-interest.sql) rather than an enrolment: there's no
 * price, schedule or cohort yet, so the landing page collects intent instead
 * of promising either.
 */
import type { ComponentType } from 'react'
import { MessageSquare, Sprout, Target, Users, Workflow } from 'lucide-react'
import { supabase } from './supabase'

export interface ProgrammeModule {
  icon: ComponentType<{ size?: number; className?: string }>
  title: string
  body: string
  /** How AI is used in this module specifically. */
  ai: string
}

/**
 * The Career Readiness Programme's curriculum — personal development, the
 * programme's foundation. One list, read by both the landing page
 * (/career-readiness) and the Practice page, so they always promise the same
 * five modules.
 */
export const PERSONAL_DEVELOPMENT_MODULES: ProgrammeModule[] = [
  {
    icon: Target,
    title: 'Goal Setting',
    body: 'Turn “I want a good job” into specific, measurable goals — and a weekly plan that actually gets you there.',
    ai: 'Break big goals into milestones with AI, then check in on your progress every week.',
  },
  {
    icon: MessageSquare,
    title: 'Communication',
    body: 'Write and speak clearly — emails, presentations, and explaining your work to a client or an interviewer.',
    ai: 'Rehearse pitches and presentations and get instant AI feedback on clarity, structure and tone.',
  },
  {
    icon: Users,
    title: 'Leadership',
    body: 'Lead without a title: take ownership, run a small project, and bring people with you.',
    ai: 'Role-play difficult conversations and team decisions with AI before they happen for real.',
  },
  {
    icon: Workflow,
    title: 'Agile Methodology',
    body: 'Work the way modern teams do — sprints, stand-ups, backlogs and short feedback loops.',
    ai: 'Plan sprints and run retrospectives with AI as your scrum assistant.',
  },
  {
    icon: Sprout,
    title: 'Growth Mindset',
    body: 'Treat setbacks as information, and build the habits that keep you learning when things get hard.',
    ai: 'Reflect on wins and setbacks with an AI coach, and spot the patterns in how you grow.',
  },
]

export const CAREER_READINESS = {
  // Stored value in programme_interest.programme — kept from the working
  // name "Career LaunchPad" (the dashboard took that name instead), since
  // the table's check constraint may already be live. Display name and URL
  // are free to change; this isn't.
  slug: 'career-launchpad',
  name: 'Career Readiness Programme',
  subtitle: 'Powered by AI · Reviewed by people',
  path: '/career-readiness',
} as const

/**
 * The Digital Marketing Programme is everything MySkills already had before
 * programmes existed — the Digital Marketing Initial Assessment, the 8 skill
 * tracks and their Decision Labs, the Vocabulary Builder and the certificate.
 * It's live, so there's no interest list: progress comes from real results.
 */
export const DIGITAL_MARKETING = {
  name: 'Digital Marketing Programme',
  path: '/practice',
} as const

export interface CourseProgress {
  name: string
  path: string
  /** 0–100 */
  percent: number
  status: 'Not started' | 'In progress' | 'Complete'
  detail: string
}

/**
 * Completing a programme takes three stages, in order: practice, a mentor's
 * review, and an internship done through MySkills. Practice alone can raise
 * the score but never finishes the programme — the proof has to come from a
 * person and from real work.
 *
 * Neither the mentor review nor platform internships exist yet, so every
 * caller passes false for both today and nothing can reach "Complete". When
 * those flows land, this is the one place that learns about them.
 */
export type StageState = 'done' | 'active' | 'todo' | 'locked'

export interface ProgrammeStage {
  key: 'practice' | 'mentor-review' | 'internship'
  title: string
  detail: string
  state: StageState
}

export interface CompletionInput {
  /** Has practice itself been finished (all tracks / all modules)? */
  practiceDone: boolean
  /** Has any practice started? */
  practiceStarted: boolean
  practiceDetail: string
  /** Where the programme's mentor review stands (src/lib/mentorReview.ts). */
  mentorReview: 'none' | 'requested' | 'approved' | 'changes_requested'
  internshipDone: boolean
}

export function completionStages(c: CompletionInput): ProgrammeStage[] {
  // Stages open in order: a mentor reviews finished practice, and the
  // internship comes after the review.
  const reviewed = c.mentorReview === 'approved'
  return [
    {
      key: 'practice',
      title: 'Practice',
      detail: c.practiceDetail,
      state: c.practiceDone ? 'done' : c.practiceStarted ? 'active' : 'todo',
    },
    {
      key: 'mentor-review',
      title: 'Mentor review',
      detail: reviewed
        ? 'Signed off by a mentor'
        : !c.practiceDone
          ? 'Opens once practice is finished'
          : c.mentorReview === 'requested'
            ? 'Requested — a mentor is reviewing your work'
            : c.mentorReview === 'changes_requested'
              ? 'Your mentor left notes — work on them, then ask again'
              : 'Ready — ask a mentor to review your work',
      state: reviewed ? 'done' : c.practiceDone ? 'active' : 'locked',
    },
    {
      key: 'internship',
      title: 'Internship through MySkills',
      detail: c.internshipDone
        ? 'Completed and verified'
        : reviewed
          ? 'Coming soon — real briefs with partner companies'
          : 'Opens after your mentor review',
      state: c.internshipDone ? 'done' : 'locked',
    },
  ]
}

export function isProgrammeComplete(stages: ProgrammeStage[]): boolean {
  return stages.every((s) => s.state === 'done')
}

/**
 * Progress toward finishing the Digital Marketing Programme: one step for the
 * assessment, one per skill track practised, plus the mentor review and the
 * internship — so practice alone tops out short of 100%.
 */
export function digitalMarketingProgress(
  assessmentDone: boolean,
  practicedTracks: number,
  totalTracks: number,
  mentorReviewed = false,
  internshipDone = false,
): CourseProgress {
  const steps = 1 + totalTracks + 2
  const done =
    (assessmentDone ? 1 : 0) + practicedTracks + (mentorReviewed ? 1 : 0) + (internshipDone ? 1 : 0)
  const percent = Math.round((done / steps) * 100)
  const practiceDone = assessmentDone && practicedTracks >= totalTracks
  return {
    name: DIGITAL_MARKETING.name,
    path: DIGITAL_MARKETING.path,
    percent,
    status: done === 0 ? 'Not started' : done >= steps ? 'Complete' : 'In progress',
    detail: !assessmentDone
      ? 'Start with the Digital Marketing Initial Assessment'
      : !practiceDone
        ? `Assessment done · ${practicedTracks} of ${totalTracks} tracks practised`
        : !mentorReviewed
          ? 'Practice done · mentor review next'
          : !internshipDone
            ? 'Mentor-reviewed · internship next'
            : 'Complete',
  }
}

export interface ProgrammeInterest {
  id: string
  created_at: string
}

export async function fetchMyProgrammeInterest(programme: string): Promise<ProgrammeInterest | null> {
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return null
  const { data, error } = await supabase
    .from('programme_interest')
    .select('id, created_at')
    .eq('user_id', user.id)
    .eq('programme', programme)
    .maybeSingle()
  if (error) return null
  return (data as ProgrammeInterest) ?? null
}

export async function registerProgrammeInterest(
  programme: string,
  contact: { full_name: string; email: string },
): Promise<void> {
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error('You are not signed in.')

  const { error } = await supabase.from('programme_interest').insert({
    user_id: user.id,
    programme,
    full_name: contact.full_name.trim() || 'MySkills learner',
    email: contact.email.trim(),
  })
  // 23505 = already registered. Treat as success: the button's job is to get
  // them on the list, and they already are.
  if (error && error.code !== '23505') {
    throw new Error(error.message?.trim() || 'Something went wrong.')
  }
}
