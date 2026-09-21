/**
 * Career Readiness Score — the number the LaunchPad dashboard is built around.
 *
 * Only server-backed signals go in: the initial assessment and practice best
 * scores. Hours spent and vocabulary progress are deliberately excluded even
 * though they're shown alongside — both live in localStorage, so a score built
 * on them would drop the moment a student switched phone for laptop.
 *
 *   score = 40% assessment + 60% practice mastery
 *
 * Practice mastery averages the best score across ALL tracks, counting an
 * unpractised track as 0 — so both breadth (more tracks) and depth (better
 * scores) move it, and each track is worth a fixed, explainable slice.
 */
import type { PracticeSummary } from './practiceResults'
import type { SkillTrack } from './skillTracks'

export const ASSESSMENT_WEIGHT = 40
export const PRACTICE_WEIGHT = 60

export interface ReadinessBand {
  label: string
  /** One line on what this band means for the student. */
  note: string
}

// Calibrated so a student at 80% on the assessment and 80% on every track
// lands at exactly 80 — "Standout". Assessment + a few tracks practised is
// "Building", not "Getting started", which read as discouraging.
const BANDS: { min: number; band: ReadinessBand }[] = [
  { min: 80, band: { label: 'Standout', note: 'Your scores would stand out in most interview rooms.' } },
  { min: 60, band: { label: 'Strong', note: 'Solid across the board — polish your weakest tracks.' } },
  { min: 25, band: { label: 'Building', note: 'Real progress. Breadth across tracks moves you fastest now.' } },
  { min: 0, band: { label: 'Getting started', note: 'Every assessment and practice run adds to this.' } },
]

export interface NextAction {
  label: string
  /** Most points this action could add. */
  upTo: number
  to: string
}

export interface Readiness {
  score: number
  band: ReadinessBand
  assessmentPoints: number
  practicePoints: number
  practicedTracks: number
  nextAction: NextAction | null
}

export function computeReadiness(
  assessmentPercent: number | null,
  practice: PracticeSummary,
  tracks: SkillTrack[],
): Readiness {
  const assessmentPoints = ((assessmentPercent ?? 0) / 100) * ASSESSMENT_WEIGHT

  const perTrack = PRACTICE_WEIGHT / tracks.length
  const trackPoints = tracks.map((t) => ({
    track: t,
    points: ((practice[t.slug]?.percent ?? 0) / 100) * perTrack,
    practiced: Boolean(practice[t.slug]),
  }))
  const practicePoints = trackPoints.reduce((s, t) => s + t.points, 0)
  const score = Math.round(assessmentPoints + practicePoints)

  // The single biggest lever: the assessment if not taken, then an untouched
  // track, then whichever practised track has the most headroom left.
  let nextAction: NextAction | null = null
  if (assessmentPercent == null) {
    nextAction = { label: 'Take your initial assessment', upTo: ASSESSMENT_WEIGHT, to: '/practice' }
  } else {
    const untouched = trackPoints.find((t) => !t.practiced)
    const weakest = [...trackPoints].sort((a, b) => a.points - b.points)[0]
    const pick = untouched ?? weakest
    const headroom = perTrack - pick.points
    if (headroom >= 0.5) {
      nextAction = {
        label: `${untouched ? 'Practice' : 'Improve'} ${pick.track.name}`,
        upTo: Math.round(headroom * 10) / 10,
        to: '/practice',
      }
    }
  }

  return {
    score,
    band: BANDS.find((b) => score >= b.min)!.band,
    assessmentPoints,
    practicePoints,
    practicedTracks: trackPoints.filter((t) => t.practiced).length,
    nextAction,
  }
}
