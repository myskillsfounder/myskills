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
import careerContent from '@/content/career-readiness.json'

export type ModuleSlug = 'goal-setting' | 'communication' | 'leadership' | 'agile' | 'growth-mindset'

export interface ProgrammeModule {
  /** Stored with a learner's responses (docs/supabase-career-readiness-programme.sql). */
  slug: ModuleSlug
  icon: ComponentType<{ size?: number; className?: string }>
  title: string
  body: string
  /** How AI is used in this module specifically. */
  ai: string
}

const MODULE_ICONS: Record<ModuleSlug, ProgrammeModule['icon']> = {
  'goal-setting': Target,
  communication: MessageSquare,
  leadership: Users,
  agile: Workflow,
  'growth-mindset': Sprout,
}

/**
 * The Career Readiness Programme's curriculum — personal development, the
 * programme's foundation. One list, read by both the landing page
 * (/career-readiness) and the Practice page, so they always promise the same
 * five modules.
 *
 * The words live in src/content/career-readiness.json, which the build-time
 * prerender (scripts/generate-seo.mjs) also reads — so the text search
 * engines index is the text learners see. Only the icons are chosen here.
 */
export const PERSONAL_DEVELOPMENT_MODULES: ProgrammeModule[] = careerContent.modules.map((m) => ({
  ...m,
  slug: m.slug as ModuleSlug,
  icon: MODULE_ICONS[m.slug as ModuleSlug],
}))

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
 * programmes existed — the Foundation assessment, the 8 skill
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
  /** Which Practice tab the link opens on. */
  programme?: 1 | 2
  /** 0–100 */
  percent: number
  status: 'Not started' | 'In progress' | 'Complete'
  detail: string
}

/**
 * Completing a programme takes three stages, in order: self-paced practice,
 * live sessions with a mentor (which end in the mentor signing the student
 * off), and an internship done through MySkills. Practice alone can raise the
 * score but never finishes the programme — the proof has to come from a person
 * and from real work.
 *
 * Platform internships don't exist yet, so every caller passes false and
 * nothing can reach "Complete".
 */
export type StageState = 'done' | 'active' | 'todo' | 'locked'

export interface ProgrammeStage {
  key: 'practice' | 'mentoring' | 'internship'
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
  /** Where the programme's mentor review stands (src/lib/mentorReview.ts);
   *  'approved' is the mentor's sign-off, which completes the mentoring stage. */
  mentorReview: 'none' | 'requested' | 'approved' | 'changes_requested'
  /** Live mentor sessions (src/lib/mentorMatches.ts). */
  mentoring: {
    /** The aptitude assessment opens this stage — it's where the mentor starts. */
    aptitudeDone: boolean
    status: 'requested' | 'active' | 'declined' | 'ended' | 'cancelled' | null
    mentorName: string | null
    sessions: number
  }
  internshipDone: boolean
}

export function completionStages(c: CompletionInput): ProgrammeStage[] {
  // Mentoring opens with the aptitude report and finishes with the mentor's
  // sign-off; the internship comes after that.
  const reviewed = c.mentorReview === 'approved'
  const m = c.mentoring
  const mentor = m.mentorName ?? 'your mentor'
  const sessions = `${m.sessions} ${m.sessions === 1 ? 'session' : 'sessions'}`
  return [
    {
      key: 'practice',
      title: 'Practice',
      detail: c.practiceDetail,
      state: c.practiceDone ? 'done' : c.practiceStarted ? 'active' : 'todo',
    },
    {
      key: 'mentoring',
      title: 'Live mentor sessions',
      detail: reviewed
        ? 'Signed off by your mentor'
        : !m.aptitudeDone
          ? 'Opens after the aptitude assessment'
          : m.status === 'active'
            ? `With ${mentor} · ${sessions}${c.practiceDone ? ' · ask for your sign-off' : ''}`
            : m.status === 'requested'
              ? `Waiting for ${mentor} to accept`
              : 'Ready — choose a mentor',
      state: reviewed ? 'done' : m.aptitudeDone ? 'active' : 'locked',
    },
    {
      key: 'internship',
      title: 'Internship through MySkills',
      detail: c.internshipDone
        ? 'Completed and verified'
        : reviewed
          ? 'Coming soon — real briefs with partner companies'
          : 'Opens after your mentor signs you off',
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
    programme: 1,
    percent,
    status: done === 0 ? 'Not started' : done >= steps ? 'Complete' : 'In progress',
    detail: !assessmentDone
      ? 'Start with the aptitude assessment, then practise'
      : !practiceDone
        ? `Foundation done · ${practicedTracks} of ${totalTracks} tracks practised`
        : !mentorReviewed
          ? 'Practice done · mentor review next'
          : !internshipDone
            ? 'Mentor-reviewed · internship next'
            : 'Complete',
  }
}

/**
 * Progress toward finishing the Career Readiness Programme, built the same way
 * as digitalMarketingProgress: one step for the personal aptitude assessment,
 * one per module finished, plus the mentor review and the internship.
 */
export function careerReadinessProgress(
  aptitudeDone: boolean,
  modulesDone: number,
  totalModules: number,
  mentorReviewed = false,
  internshipDone = false,
): CourseProgress {
  const steps = 1 + totalModules + 2
  const done =
    (aptitudeDone ? 1 : 0) + Math.min(modulesDone, totalModules) + (mentorReviewed ? 1 : 0) + (internshipDone ? 1 : 0)
  return {
    name: CAREER_READINESS.name,
    path: '/practice',
    programme: 2,
    percent: Math.round((done / steps) * 100),
    status: done === 0 ? 'Not started' : done >= steps ? 'Complete' : 'In progress',
    detail:
      modulesDone < totalModules
        ? `${aptitudeDone ? 'Aptitude done · ' : ''}${modulesDone} of ${totalModules} modules finished`
        : !mentorReviewed
          ? 'Modules done · mentor review next'
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

export interface CareerReadinessLead {
  full_name: string
  phone: string
  email: string
}

/**
 * The Career Readiness waitlist form — name, phone and email, no account
 * needed. Distinct from registerProgrammeInterest above: that one is the
 * signed-in waitlist join further down the page, tied to the learner's
 * account and reachable by email. This is the above-the-fold form for a
 * visitor who hasn't signed up (or may never), captured by phone since
 * that's how the follow-up call actually happens. Table:
 * docs/supabase-career-readiness-leads.sql.
 */
export async function submitCareerReadinessLead(lead: CareerReadinessLead): Promise<void> {
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { error } = await supabase.from('career_readiness_leads').insert({
    user_id: user?.id ?? null,
    full_name: lead.full_name.trim(),
    phone: lead.phone.trim(),
    email: lead.email.trim(),
  })
  if (error) {
    throw new Error(error.message?.trim() || 'Something went wrong.')
  }
}
