/**
 * Career Readiness Score — the number the LaunchPad dashboard is built around,
 * and the one a company can rely on when choosing interns.
 *
 * It measures only what a student has done INSIDE MySkills, checked by the
 * server or by a person. Education, outside work and aptitude assessments
 * belong to the profile (and its completion), not to this number. Method v7:
 *
 * Each programme is worth 40: a project graded by a mentor and the student's
 * own activity.
 *
 *   40  Personal development     — the Life Readiness Programme
 *         activity 25  its fourteen modules share 25 points (about 1.8 each).
 *                      Live sessions are on the record, not scored.
 *         project  15  the mentor's rubric total, 0-20, counted as 0-15
 *   40  Professional development — the Digital Marketing Programme
 *         activity 20  per track (best of the last 3 attempts): 0 below 60%,
 *                      0.25 at 60% rising to 1.25 at 100% (8 tracks = 10);
 *                      the Foundation assessment, its % / 20 (up to 5);
 *                      1 per confirmed live training (5 = 5)
 *         project  20  the mentor's rubric total, 0-20
 *   20  Internship               — the FIRST internship signed off by its host
 *                      organisation. Later ones are badges, no points. Not open
 *                      yet, so nobody can earn it today.
 *
 * THE HOLD: until a programme's project has passed (8 of 20 or more), only the
 * first 8 of its activity points count. The rest are held and released when
 * the project passes. A project's own points always count as graded. A
 * mentor's signature on its own is worth nothing: they release work the student
 * has already done, and grade the project.
 *
 * Every rule is a named constant below so the method can be published and
 * adjusted without hunting through logic.
 *
 * WHO ISSUES THE NUMBER: the server does (docs/supabase-career-readiness-
 * score.sql, called through lib/scoreService.ts) and stores it with a date and
 * the method version. This file is the same method in the browser — it drives
 * "your next step" and stands in if the server score isn't available. Keep
 * the two in step; the dashboard warns in the console if they disagree. (One
 * known difference: the server counts only server-graded practice attempts.)
 *
 * VERIFIED vs SELF-REPORTED: practice and the Foundation assessment are graded
 * by the server; live sessions and project grades are confirmed by a person.
 * Module answers are self-reported until the Life Readiness project passes.
 */

/** Bump when the rules change, so a stored score says which rules made it. */
export const METHOD_VERSION = 'v7'

export const PERSONAL_MAX = 40
export const PROFESSIONAL_MAX = 40
export const INTERNSHIP_MAX = 20

/** The project each programme ends with, graded by a mentor on four criteria. */
export const PROJECT_MAX = 20
export const PROJECT_CRITERIA_MAX = 5
/** 8 of 20 passes: the project is accepted and the held activity points are released. */
export const PROJECT_PASS = 8
/** Submissions per programme: the first, and two resubmissions. */
export const PROJECT_SUBMISSIONS = 3
/** Activity points that count before the project has passed. */
export const ACTIVITY_HELD_CAP = 8
export const ACTIVITY_MAX = 20

/** Personal activity: the modules share 25 points (method v7). */
export const PROGRAMME_MODULES = 14
export const MODULES_MAX_POINTS = 25
export const POINTS_PER_MODULE = MODULES_MAX_POINTS / PROGRAMME_MODULES
/** The Life Readiness project: graded out of PROJECT_MAX, worth this many points. */
export const PERSONAL_PROJECT_POINTS = 15
export const POINTS_PER_LIVE_SESSION = 1
export const LIVE_SESSIONS_MAX_POINTS = 5

/** Professional activity: practice tracks, the Foundation assessment, live training. */
export const PRACTICE_TRACKS = 8
export const TRACK_PASS_PERCENT = 60
export const TRACK_POINTS_MIN = 0.25
export const TRACK_POINTS_MAX = 1.25
export const PRACTICE_MAX_POINTS = 10
export const FOUNDATION_MAX_POINTS = 5

/** Where a project stands with its mentor. */
export type ProjectStatus = 'none' | 'requested' | 'approved' | 'changes_requested'

export interface ProjectStanding {
  status: ProjectStatus
  /** The best grade across submissions, 0-20 (0 until one is graded). */
  points: number
}
export const NO_PROJECT: ProjectStanding = { status: 'none', points: 0 }

/** Where a learner stands in the two programmes. */
export interface ProgrammeStanding {
  /** Life Readiness modules with all four items written. */
  modulesDone: number
  /** The five core modules are done: the Life Readiness project can be submitted. */
  crCoreDone: boolean
  /** Life Readiness live sessions whose attendance was confirmed by whoever ran them. */
  liveSessions: number
  /** Digital Marketing live training sessions, confirmed the same way. */
  dmLiveSessions: number
  crProject: ProjectStanding
  dmProject: ProjectStanding
  /** The best score on each Digital Marketing track the learner has practised (any order). */
  dmTrackPercents: number[]
  /** All 8 tracks practised — only then can the Digital Marketing project be submitted. */
  dmPracticeDone: boolean
  /** Foundation assessment percent, or null if it hasn't been taken. */
  foundationPercent: number | null
  /** An internship signed off by its host organisation. */
  internshipSignedOff: boolean
}
export const NO_STANDING: ProgrammeStanding = {
  modulesDone: 0,
  crCoreDone: false,
  liveSessions: 0,
  dmLiveSessions: 0,
  crProject: NO_PROJECT,
  dmProject: NO_PROJECT,
  dmTrackPercents: [],
  dmPracticeDone: false,
  foundationPercent: null,
  internshipSignedOff: false,
}

const round1 = (n: number) => Math.round(n * 10) / 10
const round2 = (n: number) => Math.round(n * 100) / 100

export function livePoints(sessions: number): number {
  return Math.min(sessions * POINTS_PER_LIVE_SESSION, LIVE_SESSIONS_MAX_POINTS)
}

/** The Foundation assessment: its percent / 20, so 5 at 100%; nothing if not taken. */
export function foundationPoints(percent: number | null): number {
  return percent === null ? 0 : round1(Math.min(percent, 100) / (100 / FOUNDATION_MAX_POINTS))
}

/** One track: nothing below 60%, then 0.25 at 60% rising in a line to 1.25 at 100%. */
export function trackPoints(percent: number): number {
  if (percent < TRACK_PASS_PERCENT) return 0
  const span = 100 - TRACK_PASS_PERCENT
  return TRACK_POINTS_MIN + ((Math.min(percent, 100) - TRACK_PASS_PERCENT) / span) * (TRACK_POINTS_MAX - TRACK_POINTS_MIN)
}

export function practicePoints(percents: number[]): number {
  return Math.min(
    percents.slice(0, PRACTICE_TRACKS).reduce((sum, p) => sum + trackPoints(p), 0),
    PRACTICE_MAX_POINTS,
  )
}

/** Life Readiness activity before the hold: the modules. Out of 25. */
export function personalActivity(p: Pick<ProgrammeStanding, 'modulesDone'>): number {
  return Math.min(p.modulesDone, PROGRAMME_MODULES) * POINTS_PER_MODULE
}

/** A Life Readiness project's points: its grade out of 20, counted out of 15. */
export function personalProjectPoints(grade: number): number {
  return (Math.min(grade, PROJECT_MAX) * PERSONAL_PROJECT_POINTS) / PROJECT_MAX
}

/** Digital Marketing activity before the hold: tracks, Foundation, live training. Out of 20. */
export function professionalActivity(
  p: Pick<ProgrammeStanding, 'dmTrackPercents' | 'foundationPercent' | 'dmLiveSessions'>,
): number {
  return practicePoints(p.dmTrackPercents) + foundationPoints(p.foundationPercent) + livePoints(p.dmLiveSessions)
}

/** What of a programme's activity counts: all of it once the project has passed, otherwise the first few points. */
export function countedActivity(activity: number, project: ProjectStanding): number {
  return project.status === 'approved' ? activity : Math.min(activity, ACTIVITY_HELD_CAP)
}

/** The Personal Development points a learner has earned so far. */
export function personalPoints(
  p: Pick<ProgrammeStanding, 'modulesDone' | 'crProject'>,
): number {
  return round2(
    Math.min(countedActivity(personalActivity(p), p.crProject) + personalProjectPoints(p.crProject.points), PERSONAL_MAX),
  )
}

/** The Professional Development points a learner has earned so far. */
export function professionalPoints(
  p: Pick<ProgrammeStanding, 'dmTrackPercents' | 'foundationPercent' | 'dmLiveSessions' | 'dmProject'>,
): number {
  return round2(
    Math.min(
      countedActivity(professionalActivity(p), p.dmProject) + Math.min(p.dmProject.points, PROJECT_MAX),
      PROFESSIONAL_MAX,
    ),
  )
}

export interface ReadinessBand {
  label: string
  note: string
}

// The most that can be earned today is 80 (the internship part isn't open).
// Activity alone, held at 8 per programme, tops out at 16, so Strong and
// Standout need a graded project. Revisit when internships open.
const BANDS: { min: number; band: ReadinessBand }[] = [
  { min: 60, band: { label: 'Standout', note: 'A well-rounded candidate across both programmes.' } },
  { min: 30, band: { label: 'Strong', note: 'A graded project behind the work — a second one lifts it further.' } },
  { min: 10, band: { label: 'Building', note: 'Real progress. Finish the work, then submit your project.' } },
  { min: 0, band: { label: 'Getting started', note: 'Every module, track and session adds to this.' } },
]

export function bandFor(score: number): ReadinessBand {
  return BANDS.find((b) => score >= b.min)!.band
}

export interface ReadinessComponent {
  points: number
  max: number
  /** Short human summary of what was counted. */
  detail: string
  /** Activity points earned but held until the project passes. */
  held?: number
  /** The project's grade so far, out of `projectMax`. */
  projectPoints?: number
  projectMax?: number
  projectStatus?: ProjectStatus
}

export interface NextAction {
  label: string
  /** Points the step adds; 0 for a step that only opens the next one. */
  upTo: number
  to: string
  /** Which Practice tab the link should open on, when `to` is /practice. */
  programme?: 1 | 2
}

export interface Readiness {
  score: number
  band: ReadinessBand
  /** Points graded by the server or confirmed by a person. */
  verifiedPoints: number
  /** Points that count but nobody has checked yet (finished modules). */
  selfReportedPoints: number
  /** Where the number came from: the server's stored calculation, or this browser's. */
  source: 'server' | 'estimate'
  /** When the server worked it out. */
  computedAt?: string
  personal: ReadinessComponent
  professional: ReadinessComponent
  internship: ReadinessComponent
  nextAction: NextAction | null
  /** Every step that still applies, in journey order (nextAction is the first). */
  nextActions: NextAction[]
}

const plural = (n: number, one: string, many = `${one}s`) => `${n} ${n === 1 ? one : many}`

/** What a programme's project is up to, in a few words (its points out of `worth`). */
function projectDetail(p: ProjectStanding, points = p.points, worth = PROJECT_MAX): string {
  if (p.status === 'approved') return `project passed (${round1(points)} of ${worth})`
  if (p.status === 'requested') return 'project with a mentor'
  if (p.status === 'changes_requested') return `project needs changes (${round1(points)} of ${worth} so far)`
  return `project worth ${worth}`
}

export function computeReadiness(standing: ProgrammeStanding = NO_STANDING): Readiness {
  const s = standing
  const modulesDone = Math.min(s.modulesDone, PROGRAMME_MODULES)
  const personalPts = personalPoints(s)
  const professionalPts = professionalPoints(s)
  const internshipPts = s.internshipSignedOff ? INTERNSHIP_MAX : 0
  const score = Math.round(personalPts + professionalPts + internshipPts)

  const crActivity = personalActivity(s)
  const dmActivity = professionalActivity(s)
  const crHeld = round2(crActivity - countedActivity(crActivity, s.crProject))
  const dmHeld = round2(dmActivity - countedActivity(dmActivity, s.dmProject))
  const tracksPassed = s.dmTrackPercents.filter((p) => p >= TRACK_PASS_PERCENT).length

  // -- The next step, in the order of the learning journey — not whatever
  // happens to be worth the most. Learn and practise first, then the
  // assessment, then the project, and live sessions last. The first step
  // that still applies is the one shown.
  // The project opens once the five core modules are done.
  const canSubmitCr = s.crCoreDone && s.crProject.status !== 'approved' && s.crProject.status !== 'requested'
  const canSubmitDm = s.dmPracticeDone && s.dmProject.status !== 'approved' && s.dmProject.status !== 'requested'
  const journey: (NextAction | null)[] = [
    modulesDone < PROGRAMME_MODULES
      ? { label: 'Finish a Life Readiness module', upTo: round1(POINTS_PER_MODULE), to: '/practice', programme: 2 }
      : null,
    tracksPassed < PRACTICE_TRACKS
      ? { label: 'Score 60% or more on a Digital Marketing track', upTo: TRACK_POINTS_MAX, to: '/practice', programme: 1 }
      : null,
    s.foundationPercent === null
      ? { label: 'Take the Foundation assessment', upTo: FOUNDATION_MAX_POINTS, to: '/foundation-assessment' }
      : null,
    canSubmitCr
      ? { label: 'Submit your Life Readiness project', upTo: PERSONAL_PROJECT_POINTS, to: '/practice', programme: 2 }
      : null,
    canSubmitDm
      ? { label: 'Submit your Digital Marketing project', upTo: PROJECT_MAX, to: '/practice', programme: 1 }
      : null,
    livePoints(s.dmLiveSessions) < LIVE_SESSIONS_MAX_POINTS
      ? { label: 'Work with a mentor on Digital Marketing', upTo: POINTS_PER_LIVE_SESSION, to: '/practice', programme: 1 }
      : null,
  ]
  const nextActions = journey.filter((step): step is NextAction => step !== null)
  const nextAction = nextActions[0] ?? null

  const modulePts = modulesDone * POINTS_PER_MODULE
  const crCounted = countedActivity(crActivity, s.crProject)
  // Once the Life Readiness project has passed a mentor has read the modules,
  // so those points stop being self-reported.
  const selfReported = s.crProject.status === 'approved' ? 0 : Math.min(modulePts, crCounted)
  return {
    score,
    band: bandFor(score),
    verifiedPoints: round1(personalPts + professionalPts + internshipPts - selfReported),
    selfReportedPoints: round1(selfReported),
    source: 'estimate',
    personal: {
      points: personalPts,
      max: PERSONAL_MAX,
      detail: [
        `${modulesDone} of ${PROGRAMME_MODULES} modules`,
        projectDetail(s.crProject, personalProjectPoints(s.crProject.points), PERSONAL_PROJECT_POINTS),
      ].join(' · '),
      held: crHeld,
      projectPoints: round2(personalProjectPoints(s.crProject.points)),
      projectMax: PERSONAL_PROJECT_POINTS,
      projectStatus: s.crProject.status,
    },
    professional: {
      points: professionalPts,
      max: PROFESSIONAL_MAX,
      detail: [
        `${tracksPassed} of ${PRACTICE_TRACKS} tracks at ${TRACK_PASS_PERCENT}%+`,
        s.foundationPercent === null ? 'Foundation not taken' : `Foundation ${s.foundationPercent}%`,
        plural(s.dmLiveSessions, 'live training'),
        projectDetail(s.dmProject),
      ].join(' · '),
      held: dmHeld,
      projectPoints: s.dmProject.points,
      projectMax: PROJECT_MAX,
      projectStatus: s.dmProject.status,
    },
    internship: {
      points: internshipPts,
      max: INTERNSHIP_MAX,
      detail: 'Your first signed-off internship earns these points; later ones are badges',
    },
    nextAction,
    nextActions,
  }
}
