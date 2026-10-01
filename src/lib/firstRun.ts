import { useEffect, useState } from 'react'
import { fetchMyAptitudeResult } from './dmAptitude'
import { fetchMyAssessmentResult } from './careerReadinessAssessment'
import { fetchInitialAssessment } from './assessmentResults'
import { fetchPracticeSummary } from './practiceResults'
import { fetchMyLiveSessions } from './liveSessions'
import { fetchMyResponses } from './careerReadinessProgramme'
import { fetchMyMatch } from './mentorMatches'
import { fetchMyMentorReview } from './mentorReview'
import { startedVersion } from './startedCache'

/**
 * Has this account started yet? ONE definition, used by every screen so an
 * account is never "new" on one page and "under way" on another: the LaunchPad
 * (first-run welcome vs. the full view), Practice (start choice vs. progress),
 * the sidebar and Profile (the nags that wait for a first step).
 *
 * An account has started if it has done ANYTHING: taken either aptitude or the
 * Foundation assessment, practised a track, written a module answer, had a
 * live session, been matched with (or asked for) a mentor, or submitted a
 * project. Accounts from before the aptitude assessments existed have usually
 * done some of those without ever taking one, so an assessment alone can't be
 * the test.
 *
 * `anyHistory` is the rule. The LaunchPad calls it with data it has already
 * loaded; everywhere else uses `useHasStarted`, which looks the same things up
 * once per 20 seconds instead of on every page.
 */
export interface StartSignals {
  dmAptitude: boolean
  crAssessment: boolean
  foundation: boolean
  practicedTracks: number
  /** Module answers written (any, not only finished modules). */
  moduleAnswers: number
  liveSessions: number
  /** Asked for, or has, a mentor on either programme. */
  mentorMatch: boolean
  /** A project submitted on either programme. */
  projects: number
  /** The server's score, when known. */
  score?: number
}

export function anyHistory(s: StartSignals): boolean {
  return (
    s.dmAptitude ||
    s.crAssessment ||
    s.foundation ||
    s.practicedTracks > 0 ||
    s.moduleAnswers > 0 ||
    s.liveSessions > 0 ||
    s.mentorMatch ||
    s.projects > 0 ||
    (s.score ?? 0) > 0
  )
}

let cache: { at: number; version: number; result: Promise<boolean> } | null = null

export function hasStarted(): Promise<boolean> {
  if (cache && cache.version === startedVersion() && Date.now() - cache.at < 20_000) return cache.result
  const result = Promise.all([
    fetchMyAptitudeResult(),
    fetchMyAssessmentResult(),
    fetchInitialAssessment(),
    fetchPracticeSummary(),
    fetchMyLiveSessions(),
    fetchMyResponses(),
    fetchMyMatch('digital-marketing'),
    fetchMyMatch('career-readiness'),
    fetchMyMentorReview('digital-marketing'),
    fetchMyMentorReview('career-readiness'),
  ])
    .then(([dm, cr, foundation, practice, live, answers, dmMatch, crMatch, dmReview, crReview]) =>
      anyHistory({
        dmAptitude: dm != null,
        crAssessment: cr != null,
        foundation: foundation != null,
        practicedTracks: Object.keys(practice).length,
        moduleAnswers: Object.keys(answers).length,
        liveSessions: live.length,
        mentorMatch: dmMatch != null || crMatch != null,
        projects: (dmReview.review ? 1 : 0) + (crReview.review ? 1 : 0),
      }),
    )
    // If we can't tell, say "started": better to show a nag than hide something.
    .catch(() => true)
  cache = { at: Date.now(), version: startedVersion(), result }
  return result
}

/** `null` while unknown, then true / false. */
export function useHasStarted(): boolean | null {
  const [started, setStarted] = useState<boolean | null>(null)
  useEffect(() => {
    let active = true
    void hasStarted().then((s) => active && setStarted(s))
    return () => {
      active = false
    }
  }, [])
  return started
}
