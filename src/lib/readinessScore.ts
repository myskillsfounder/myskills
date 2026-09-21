/**
 * Career Readiness Score — the number the LaunchPad dashboard is built around.
 *
 * A standard, market-facing measure of where a student stands as a candidate,
 * built from their profile — deliberately NOT from MySkills' own assessment or
 * practice scores, which measure progress inside the app, not readiness for
 * the job market.
 *
 *   30  Personal development      — earned only through the Career
 *                                    Readiness Programme (locked until it runs)
 *   30  Professional development  — education level + skills
 *   40  Experience                — internships + work + projects
 *
 * Age is never scored: it isn't a skill, and scoring it penalises students for
 * something they can't change. Education is scored by level completed, never
 * by institution — the score measures readiness, not prestige.
 *
 * Every rule is a named constant below so the method can be published and
 * adjusted without hunting through logic.
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

export const PERSONAL_MAX = 30
export const PROFESSIONAL_MAX = 30
export const EXPERIENCE_MAX = 40

const EDUCATION_POINTS: Record<EducationLevel, number> = {
  'class-10': 4,
  'class-12': 8,
  diploma: 12,
  bachelors: 16,
  masters: 20,
  doctorate: 22,
}
/** A level still in progress earns this share of its points. */
const IN_PROGRESS_SHARE = 0.75
const EDUCATION_MAX = 22
const POINTS_PER_SKILL = 1
const SKILLS_MAX = 8

const POINTS_PER_INTERNSHIP = 5
const INTERNSHIPS_MAX = 15
const POINTS_PER_WORK_MONTH = 1
const WORK_MAX = 15
const POINTS_PER_PROJECT = 2.5
const PROJECTS_MAX = 10

export interface ReadinessBand {
  label: string
  note: string
}

// Personal development is locked for everyone until the programme runs, so
// the realistic ceiling today is 70. "Standout" deliberately needs it.
const BANDS: { min: number; band: ReadinessBand }[] = [
  { min: 80, band: { label: 'Standout', note: 'A well-rounded candidate across every dimension.' } },
  { min: 55, band: { label: 'Strong', note: 'A solid profile — personal development is your next frontier.' } },
  { min: 25, band: { label: 'Building', note: 'Real foundations. Experience moves you fastest from here.' } },
  { min: 0, band: { label: 'Getting started', note: 'Every qualification, internship and project adds to this.' } },
]

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
}

export interface Readiness {
  score: number
  band: ReadinessBand
  /** Points already on the profile that verification would unlock. */
  pendingPoints: number
  personal: ReadinessComponent & { locked: boolean }
  professional: ReadinessComponent
  experience: ReadinessComponent
  nextAction: NextAction | null
}

const levelLabel = (l: EducationLevel) => EDUCATION_LEVELS.find((x) => x.value === l)?.label ?? l
const round1 = (n: number) => Math.round(n * 10) / 10
const plural = (n: number, one: string, many = `${one}s`) => `${n} ${n === 1 ? one : many}`

interface Tally {
  professional: number
  experience: number
  bestEduLabel: string
  unleveledEducation: boolean
  internships: number
  workMonths: number
  projects: number
  internshipPts: number
  projectPts: number
  skillsPts: number
  bestEdu: number
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
  // Skills are self-declared — there's nothing to show on a call for them.
  const skillsPts = Math.min(profile.skills.length * POINTS_PER_SKILL, SKILLS_MAX)
  const professional = Math.min(bestEdu + skillsPts, PROFESSIONAL_MAX)

  const exp = profile.experience.filter((x) => counts('experience', x))
  const internships = exp.filter(isInternship)
  const workMonths = exp.filter((x) => !isInternship(x)).reduce((s, x) => s + monthsInRole(x), 0)
  const projects = profile.projects.filter((p) => counts('project', p)).length
  const internshipPts = Math.min(internships.length * POINTS_PER_INTERNSHIP, INTERNSHIPS_MAX)
  const workPts = Math.min(workMonths * POINTS_PER_WORK_MONTH, WORK_MAX)
  const projectPts = Math.min(projects * POINTS_PER_PROJECT, PROJECTS_MAX)

  return {
    professional,
    experience: internshipPts + workPts + projectPts,
    bestEduLabel,
    unleveledEducation,
    internships: internships.length,
    workMonths,
    projects,
    internshipPts,
    projectPts,
    skillsPts,
    bestEdu,
  }
}

/**
 * Education, experience and projects count only once the MySkills team has
 * verified them on a video call (lib/verification.ts) — and only while
 * identity is verified too, since a credential proves nothing about a person
 * whose identity wasn't checked. Skills are self-declared and always count.
 */
export function computeReadiness(
  profile: Profile,
  verification: VerificationView = NO_VERIFICATION,
  hasOpenRequest = false,
): Readiness {
  const counts = (type: 'education' | 'experience' | 'project', entry: Education | Experience | Project) =>
    verification.identity === 'verified' && verification.status(type, entry) === 'verified'

  const t = tally(profile, counts)
  const potential = tally(profile, () => true)

  const personalPts = 0 // programme not live — see header
  const score = Math.round(personalPts + t.professional + t.experience)
  const pendingPoints = round1(potential.professional + potential.experience - (t.professional + t.experience))

  // -- The single biggest gain the student can act on right now. Personal
  // development is excluded: it can't be earned until the programme runs,
  // and it has its own call to action on the card.
  const candidates: NextAction[] = []
  if (pendingPoints >= 0.5 && !hasOpenRequest) {
    candidates.push({ label: 'Get your profile verified', upTo: pendingPoints, to: '/profile' })
  }
  if (profile.education.length === 0) {
    candidates.push({ label: 'Add and verify your education', upTo: EDUCATION_MAX, to: '/profile' })
  } else if (potential.unleveledEducation && potential.bestEdu === 0) {
    candidates.push({ label: 'Set your education level', upTo: EDUCATION_MAX, to: '/profile' })
  }
  if (potential.internshipPts < INTERNSHIPS_MAX) {
    candidates.push({ label: 'Add and verify an internship', upTo: POINTS_PER_INTERNSHIP, to: '/profile' })
  }
  if (potential.projectPts < PROJECTS_MAX) {
    candidates.push({ label: 'Add and verify a project', upTo: POINTS_PER_PROJECT, to: '/profile' })
  }
  if (t.skillsPts < SKILLS_MAX) {
    candidates.push({
      label: 'Add your skills',
      upTo: Math.min(SKILLS_MAX - t.skillsPts, PROFESSIONAL_MAX - t.professional),
      to: '/profile',
    })
  }
  const nextAction = candidates.filter((c) => c.upTo >= 0.5).sort((a, b) => b.upTo - a.upTo)[0] ?? null

  return {
    score,
    band: BANDS.find((b) => score >= b.min)!.band,
    pendingPoints,
    personal: {
      points: personalPts,
      max: PERSONAL_MAX,
      locked: true,
      detail: 'Earned by completing the Career Readiness Programme — practice, a mentor review and an internship through MySkills.',
    },
    professional: {
      points: round1(t.professional),
      max: PROFESSIONAL_MAX,
      detail: [
        t.bestEduLabel || (profile.education.length ? 'No verified education yet' : 'No education added'),
        plural(profile.skills.length, 'skill'),
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
