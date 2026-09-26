/**
 * Career Readiness Score — the number the LaunchPad dashboard is built around,
 * and the one a company can rely on when choosing interns.
 *
 * It measures only what a student has done INSIDE MySkills, checked by the
 * server or by a person. Education, outside work and projects belong to the
 * profile (and its completion), not to this number. Method v5:
 *
 *   40  Personal development     — the Career Readiness Programme: 2 per module
 *                                   finished (5 = 10), 2 per confirmed live
 *                                   session (5 = 10), 20 for the mentor sign-off
 *   40  Professional development — the Digital Marketing Programme: 1.25 per
 *                                   track scored 60%+ (8 = 10), the Foundation
 *                                   assessment (its % / 10, up to 10), 2 per
 *                                   confirmed live training (5 = 10), 10 for the
 *                                   mentor sign-off
 *   20  Internship               — an internship through MySkills; not open
 *                                   yet, so nobody can earn it today
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
 * by the server; live sessions and sign-offs are confirmed by a person. Module
 * answers are self-reported until a mentor signs the programme off.
 */

/** Bump when the rules change, so a stored score says which rules made it. */
export const METHOD_VERSION = 'v5'

export const PERSONAL_MAX = 40
export const PROFESSIONAL_MAX = 40
export const INTERNSHIP_MAX = 20

/** Personal: modules, live sessions, the Career Readiness sign-off. */
export const POINTS_PER_MODULE = 2
export const PROGRAMME_MODULES = 5
export const POINTS_PER_LIVE_SESSION = 2
export const LIVE_SESSIONS_MAX_POINTS = 10
export const CR_SIGNOFF_POINTS = 20

/** Professional: practice, Foundation, live training, the Digital Marketing sign-off. */
export const PRACTICE_TRACKS = 8
export const TRACK_PASS_PERCENT = 60
export const POINTS_PER_TRACK = 1.25
export const FOUNDATION_MAX_POINTS = 10
export const DM_SIGNOFF_POINTS = 10

/** Where a learner stands in the two programmes. */
export interface ProgrammeStanding {
  /** Career Readiness modules with all four items written. */
  modulesDone: number
  /** Career Readiness live sessions whose attendance was confirmed by whoever ran them. */
  liveSessions: number
  /** Digital Marketing live training sessions, confirmed the same way. */
  dmLiveSessions: number
  crSignedOff: boolean
  dmSignedOff: boolean
  /** Digital Marketing tracks whose score (best of the last 3 attempts) is 60%+. */
  dmTracksPassed: number
  /** All 8 tracks practised — only then can the Digital Marketing review be asked for. */
  dmPracticeDone: boolean
  /** Foundation assessment percent, or null if it hasn't been taken. */
  foundationPercent: number | null
}
export const NO_STANDING: ProgrammeStanding = {
  modulesDone: 0,
  liveSessions: 0,
  dmLiveSessions: 0,
  crSignedOff: false,
  dmSignedOff: false,
  dmTracksPassed: 0,
  dmPracticeDone: false,
  foundationPercent: null,
}

const round1 = (n: number) => Math.round(n * 10) / 10

export function livePoints(sessions: number): number {
  return Math.min(sessions * POINTS_PER_LIVE_SESSION, LIVE_SESSIONS_MAX_POINTS)
}

export function foundationPoints(percent: number | null): number {
  return percent === null ? 0 : round1(Math.min(percent / 10, FOUNDATION_MAX_POINTS))
}

export function practicePoints(tracksPassed: number): number {
  return Math.min(tracksPassed, PRACTICE_TRACKS) * POINTS_PER_TRACK
}

/** The Personal Development points a learner has earned so far. */
export function personalPoints(p: Pick<ProgrammeStanding, 'modulesDone' | 'liveSessions' | 'crSignedOff'>): number {
  return Math.min(
    Math.min(p.modulesDone, PROGRAMME_MODULES) * POINTS_PER_MODULE +
      livePoints(p.liveSessions) +
      (p.crSignedOff ? CR_SIGNOFF_POINTS : 0),
    PERSONAL_MAX,
  )
}

/** The Professional Development points a learner has earned so far. */
export function professionalPoints(
  p: Pick<ProgrammeStanding, 'dmTracksPassed' | 'foundationPercent' | 'dmLiveSessions' | 'dmSignedOff'>,
): number {
  return round1(
    Math.min(
      practicePoints(p.dmTracksPassed) +
        foundationPoints(p.foundationPercent) +
        livePoints(p.dmLiveSessions) +
        (p.dmSignedOff ? DM_SIGNOFF_POINTS : 0),
      PROFESSIONAL_MAX,
    ),
  )
}

export interface ReadinessBand {
  label: string
  note: string
}

// The most that can be earned today is 80 (the internship part isn't open),
// so the bands sit at 80% of the original 80 / 55 / 25 marks. Revisit when
// internships open.
const BANDS: { min: number; band: ReadinessBand }[] = [
  { min: 64, band: { label: 'Standout', note: 'A well-rounded candidate across both programmes.' } },
  { min: 44, band: { label: 'Strong', note: 'A solid record — a mentor sign-off is the next step up.' } },
  { min: 20, band: { label: 'Building', note: 'Real progress. Keep practising and finishing modules.' } },
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
}

const plural = (n: number, one: string, many = `${one}s`) => `${n} ${n === 1 ? one : many}`

export function computeReadiness(standing: ProgrammeStanding = NO_STANDING): Readiness {
  const s = standing
  const modulesDone = Math.min(s.modulesDone, PROGRAMME_MODULES)
  const personalPts = personalPoints(s)
  const professionalPts = professionalPoints(s)
  const score = Math.round(personalPts + professionalPts)

  // -- The next step, in the order of the learning journey — not whatever
  // happens to be worth the most. Learn and practise first, then the
  // assessment, then the steps that need other people: mentor reviews and live
  // sessions last. The first step that still applies is the one shown.
  const journey: (NextAction | null)[] = [
    modulesDone < PROGRAMME_MODULES
      ? { label: 'Finish a Career Readiness module', upTo: POINTS_PER_MODULE, to: '/practice', programme: 2 }
      : null,
    s.dmTracksPassed < PRACTICE_TRACKS && !s.dmSignedOff
      ? { label: 'Score 60% or more on a Digital Marketing track', upTo: POINTS_PER_TRACK, to: '/practice', programme: 1 }
      : null,
    s.foundationPercent === null
      ? { label: 'Take the Foundation assessment', upTo: FOUNDATION_MAX_POINTS, to: '/foundation-assessment' }
      : null,
    modulesDone >= PROGRAMME_MODULES && !s.crSignedOff
      ? { label: 'Get your Career Readiness mentor review', upTo: CR_SIGNOFF_POINTS, to: '/practice', programme: 2 }
      : null,
    s.dmPracticeDone && !s.dmSignedOff
      ? { label: 'Get your Digital Marketing mentor review', upTo: DM_SIGNOFF_POINTS, to: '/practice', programme: 1 }
      : null,
    livePoints(s.dmLiveSessions) < LIVE_SESSIONS_MAX_POINTS
      ? { label: 'Attend a live Digital Marketing training', upTo: POINTS_PER_LIVE_SESSION, to: '/community/institutions' }
      : null,
    livePoints(s.liveSessions) < LIVE_SESSIONS_MAX_POINTS
      ? { label: 'Attend a live session with a mentor', upTo: POINTS_PER_LIVE_SESSION, to: '/community/mentors' }
      : null,
  ]
  const nextAction = journey.find((step): step is NextAction => step !== null) ?? null

  const modulePts = modulesDone * POINTS_PER_MODULE
  return {
    score,
    band: bandFor(score),
    // Once a mentor has signed the programme off they have read the modules,
    // so those points stop being self-reported.
    verifiedPoints: round1(personalPts + professionalPts - (s.crSignedOff ? 0 : modulePts)),
    selfReportedPoints: s.crSignedOff ? 0 : modulePts,
    source: 'estimate',
    personal: {
      points: personalPts,
      max: PERSONAL_MAX,
      detail: [
        `${modulesDone} of ${PROGRAMME_MODULES} modules`,
        plural(s.liveSessions, 'live session'),
        s.crSignedOff ? 'signed off by a mentor' : `mentor sign-off adds ${CR_SIGNOFF_POINTS}`,
      ].join(' · '),
    },
    professional: {
      points: professionalPts,
      max: PROFESSIONAL_MAX,
      detail: [
        `${Math.min(s.dmTracksPassed, PRACTICE_TRACKS)} of ${PRACTICE_TRACKS} tracks at ${TRACK_PASS_PERCENT}%+`,
        s.foundationPercent === null ? 'Foundation not taken' : `Foundation ${s.foundationPercent}%`,
        plural(s.dmLiveSessions, 'live training'),
        s.dmSignedOff ? 'signed off by a mentor' : `mentor sign-off adds ${DM_SIGNOFF_POINTS}`,
      ].join(' · '),
    },
    internship: {
      points: 0,
      max: INTERNSHIP_MAX,
      detail: 'Internships through MySkills open later',
    },
    nextAction,
  }
}
