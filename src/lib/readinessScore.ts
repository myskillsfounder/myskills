/**
 * Career Readiness Score — the number the LaunchPad dashboard is built around,
 * and the one a company can rely on when choosing interns.
 *
 * A standard, market-facing measure of where a student stands as a candidate,
 * built only from evidence somebody checked. Method v3:
 *
 *   30  Personal development     — the Career Readiness Programme: 4 points per
 *                                   module finished (5 modules = 20) and 10
 *                                   when a mentor signs the programme off
 *   20  Professional             — verified education (max 10) and 10 when a
 *                                   mentor signs off the Digital Marketing
 *                                   practice
 *   30  Experience               — verified internships, work and projects
 *   20  Reserved                 — not scored yet; will carry practice results
 *                                   and mentor-confirmed hours (see RESERVED_POINTS)
 *
 * Mentor endorsement is worth 20 of the 80 that can be earned today (10 per
 * programme). Skills a student lists are shown on their profile but earn no
 * points: nobody has checked them.
 *
 * Age is never scored: it isn't a skill, and scoring it penalises students for
 * something they can't change. Education is scored by level completed, never
 * by institution — the score measures readiness, not prestige.
 *
 * Every rule is a named constant below so the method can be published and
 * adjusted without hunting through logic.
 *
 * WHO ISSUES THE NUMBER: the server does (docs/supabase-career-readiness-
 * score.sql, called through lib/scoreService.ts): it works the score out from
 * verified records and stores it with a date and a method version. This file
 * is the same method in the browser — it still drives the "what next" guide
 * and the pending-points figure, and stands in if the server score isn't
 * available. Keep the two in step; the dashboard warns in the console if they
 * ever disagree.
 *
 * VERIFIED vs SELF-REPORTED: education, experience, projects and the mentor
 * sign-offs are checked by a person. Module completions (written, not yet read
 * by a mentor) are self-reported until the Career Readiness sign-off. Both are counted, and reported separately,
 * so nobody has to guess how much of a number was checked.
 */
import type { Education, Experience, Profile, Project } from './profile'
import { NO_VERIFICATION, type VerificationView } from './verification'
import {
  educationLevelOf,
  isEducationComplete,
  isInternship,
  monthsInRole,
  EDUCATION_LEVELS,
} from './careerProfile'
import type { EducationLevel } from './profile'

/** Bump when the rules change, so a stored score says which rules made it. */
export const METHOD_VERSION = 'v3'

export const SCORE_TOTAL = 100
/** Held back for practice results and mentor-confirmed hours, decided later. */
export const RESERVED_POINTS = 20

export const PERSONAL_MAX = 30
export const PROFESSIONAL_MAX = 20
export const EXPERIENCE_MAX = 30

/** Personal: 5 modules x 4 = 20, plus the Career Readiness sign-off. */
export const POINTS_PER_MODULE = 4
export const PROGRAMME_MODULES = 5
export const CR_SIGNOFF_POINTS = 10
/** Professional: the Digital Marketing sign-off (education is the other 10). */
export const DM_SIGNOFF_POINTS = 10

const EDUCATION_POINTS: Record<EducationLevel, number> = {
  'class-10': 2,
  'class-12': 4,
  diploma: 6,
  bachelors: 8,
  masters: 9,
  doctorate: 10,
}
/** A level still in progress earns this share of its points. */
const IN_PROGRESS_SHARE = 0.75
const EDUCATION_MAX = 10

const POINTS_PER_INTERNSHIP = 5
const INTERNSHIPS_MAX = 15
const POINTS_PER_WORK_MONTH = 1
const WORK_MAX = 5
const POINTS_PER_PROJECT = 2.5
const PROJECTS_MAX = 10

/** Where a learner stands in the two programmes. */
export interface ProgrammeStanding {
  /** Career Readiness modules with all four items written. */
  modulesDone: number
  crSignedOff: boolean
  dmSignedOff: boolean
}
export const NO_STANDING: ProgrammeStanding = { modulesDone: 0, crSignedOff: false, dmSignedOff: false }

/** The Personal Development points a learner has earned so far. */
export function personalPoints(p: Pick<ProgrammeStanding, 'modulesDone' | 'crSignedOff'>): number {
  return Math.min(
    Math.min(p.modulesDone, PROGRAMME_MODULES) * POINTS_PER_MODULE + (p.crSignedOff ? CR_SIGNOFF_POINTS : 0),
    PERSONAL_MAX,
  )
}

export interface ReadinessBand {
  label: string
  note: string
}

// The most that can be earned today is 80 (RESERVED_POINTS are held back), so
// the bands sit at 80% of their old marks. Revisit when the reserved points
// are allocated.
const BANDS: { min: number; band: ReadinessBand }[] = [
  { min: 64, band: { label: 'Standout', note: 'A well-rounded candidate across every dimension.' } },
  { min: 44, band: { label: 'Strong', note: 'A solid profile — mentor sign-off is the next step up.' } },
  { min: 20, band: { label: 'Building', note: 'Real foundations. Verified experience moves you fastest from here.' } },
  { min: 0, band: { label: 'Getting started', note: 'Every module, qualification, internship and project adds to this.' } },
]

export function bandFor(score: number): ReadinessBand {
  return BANDS.find((b) => score >= b.min)!.band
}

export interface ReadinessComponent {
  points: number
  max: number
  /** Short human summary of what was counted. */
  detail: string
}

export interface NextAction {
  label: string
  upTo: number
  to: string
  /** Which Practice tab the link should open on, when `to` is /practice. */
  programme?: 1 | 2
}

export interface Readiness {
  score: number
  band: ReadinessBand
  /** Points already on the profile that verification would unlock. */
  pendingPoints: number
  /** Points a person has checked (verified profile entries, mentor sign-offs). */
  verifiedPoints: number
  /** Points that count but nobody has checked yet (finished modules). */
  selfReportedPoints: number
  /** Where the number came from: the server's stored calculation, or this browser's. */
  source: 'server' | 'estimate'
  /** When the server worked it out. */
  computedAt?: string
  personal: ReadinessComponent
  professional: ReadinessComponent
  experience: ReadinessComponent
  nextAction: NextAction | null
}

const levelLabel = (l: EducationLevel) => EDUCATION_LEVELS.find((x) => x.value === l)?.label ?? l
const round1 = (n: number) => Math.round(n * 10) / 10
const plural = (n: number, one: string, many = `${one}s`) => `${n} ${n === 1 ? one : many}`

interface Tally {
  education: number
  experience: number
  bestEduLabel: string
  unleveledEducation: boolean
  internships: number
  workMonths: number
  projects: number
  internshipPts: number
  projectPts: number
}

/** Score whatever subset of the profile the caller says may count. */
function tally(
  profile: Profile,
  counts: (type: 'education' | 'experience' | 'project', entry: Education | Experience | Project) => boolean,
): Tally {
  let bestEdu = 0
  let bestEduLabel = ''
  let unleveledEducation = false
  for (const e of profile.education) {
    const level = educationLevelOf(e)
    if (!level) {
      unleveledEducation = true
      continue
    }
    if (!counts('education', e)) continue
    const complete = isEducationComplete(e)
    const pts = EDUCATION_POINTS[level] * (complete ? 1 : IN_PROGRESS_SHARE)
    if (pts > bestEdu) {
      bestEdu = pts
      bestEduLabel = `${levelLabel(level)}${complete ? '' : ' (in progress)'}`
    }
  }

  const exp = profile.experience.filter((x) => counts('experience', x))
  const internships = exp.filter(isInternship)
  const workMonths = exp.filter((x) => !isInternship(x)).reduce((s, x) => s + monthsInRole(x), 0)
  const projects = profile.projects.filter((p) => counts('project', p)).length
  const internshipPts = Math.min(internships.length * POINTS_PER_INTERNSHIP, INTERNSHIPS_MAX)
  const workPts = Math.min(workMonths * POINTS_PER_WORK_MONTH, WORK_MAX)
  const projectPts = Math.min(projects * POINTS_PER_PROJECT, PROJECTS_MAX)

  return {
    education: bestEdu,
    experience: internshipPts + workPts + projectPts,
    bestEduLabel,
    unleveledEducation,
    internships: internships.length,
    workMonths,
    projects,
    internshipPts,
    projectPts,
  }
}

/**
 * Education, experience and projects count only once the MySkills team has
 * verified them on a video call (lib/verification.ts) — and only while
 * identity is verified too, since a credential proves nothing about a person
 * whose identity wasn't checked.
 */
export function computeReadiness(
  profile: Profile,
  verification: VerificationView = NO_VERIFICATION,
  hasOpenRequest = false,
  standing: ProgrammeStanding = NO_STANDING,
): Readiness {
  const counts = (type: 'education' | 'experience' | 'project', entry: Education | Experience | Project) =>
    verification.identity === 'verified' && verification.status(type, entry) === 'verified'

  const t = tally(profile, counts)
  const potential = tally(profile, () => true)

  const modulesDone = Math.min(standing.modulesDone, PROGRAMME_MODULES)
  const personalPts = personalPoints(standing)
  const professionalPts = t.education + (standing.dmSignedOff ? DM_SIGNOFF_POINTS : 0)
  const score = Math.round(personalPts + professionalPts + t.experience)
  const pendingPoints = round1(potential.education + potential.experience - (t.education + t.experience))

  // -- The single biggest gain the student can act on right now.
  const candidates: NextAction[] = []
  if (modulesDone < PROGRAMME_MODULES) {
    candidates.push({ label: 'Finish a Career Readiness module', upTo: POINTS_PER_MODULE, to: '/practice', programme: 2 })
  } else if (!standing.crSignedOff) {
    candidates.push({
      label: 'Get your Career Readiness mentor review',
      upTo: CR_SIGNOFF_POINTS,
      to: '/practice',
      programme: 2,
    })
  }
  if (!standing.dmSignedOff) {
    candidates.push({
      label: 'Get your Digital Marketing mentor review',
      upTo: DM_SIGNOFF_POINTS,
      to: '/practice',
      programme: 1,
    })
  }
  if (pendingPoints >= 0.5 && !hasOpenRequest) {
    candidates.push({ label: 'Get your profile verified', upTo: pendingPoints, to: '/profile' })
  }
  if (profile.education.length === 0) {
    candidates.push({ label: 'Add and verify your education', upTo: EDUCATION_MAX, to: '/profile' })
  } else if (potential.unleveledEducation && potential.education === 0) {
    candidates.push({ label: 'Set your education level', upTo: EDUCATION_MAX, to: '/profile' })
  }
  if (potential.internshipPts < INTERNSHIPS_MAX) {
    candidates.push({ label: 'Add and verify an internship', upTo: POINTS_PER_INTERNSHIP, to: '/profile' })
  }
  if (potential.projectPts < PROJECTS_MAX) {
    candidates.push({ label: 'Add and verify a project', upTo: POINTS_PER_PROJECT, to: '/profile' })
  }
  const nextAction = candidates.filter((c) => c.upTo >= 0.5).sort((a, b) => b.upTo - a.upTo)[0] ?? null

  return {
    score,
    band: bandFor(score),
    pendingPoints,
    // Once a mentor has signed the programme off they have read the modules,
    // so those points stop being self-reported.
    verifiedPoints: round1(
      t.education +
        t.experience +
        (standing.crSignedOff ? CR_SIGNOFF_POINTS + modulesDone * POINTS_PER_MODULE : 0) +
        (standing.dmSignedOff ? DM_SIGNOFF_POINTS : 0),
    ),
    selfReportedPoints: standing.crSignedOff ? 0 : round1(modulesDone * POINTS_PER_MODULE),
    source: 'estimate',
    personal: {
      points: personalPts,
      max: PERSONAL_MAX,
      detail: [
        `${modulesDone} of ${PROGRAMME_MODULES} modules`,
        standing.crSignedOff ? 'signed off by a mentor' : `mentor sign-off adds ${CR_SIGNOFF_POINTS}`,
      ].join(' · '),
    },
    professional: {
      points: round1(professionalPts),
      max: PROFESSIONAL_MAX,
      detail: [
        t.bestEduLabel || (profile.education.length ? 'No verified education yet' : 'No education added'),
        standing.dmSignedOff ? 'marketing practice signed off' : `mentor sign-off adds ${DM_SIGNOFF_POINTS}`,
      ].join(' · '),
    },
    experience: {
      points: round1(t.experience),
      max: EXPERIENCE_MAX,
      detail: [
        `${plural(t.internships, 'internship')}`,
        `${plural(t.workMonths, 'month')} of work`,
        plural(t.projects, 'project'),
      ].join(' · ') + ' verified',
    },
    nextAction,
  }
}
