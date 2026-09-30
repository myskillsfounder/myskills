/**
 * Has this student started yet? A new student hasn't taken any aptitude
 * assessment (marketing, personal, or the older Foundation one) and hasn't
 * practised or had a live session, so the things
 * that only make sense once they're under way — profile nags, the verification
 * checklist — wait for that first step.
 *
 * The LaunchPad works this out from data it already loads. Everywhere else
 * (the sidebar, the Profile page) uses this hook, which shares one lookup per
 * 20 seconds instead of querying on every page.
 */
import { useEffect, useState } from 'react'
import { fetchMyAptitudeResult } from './dmAptitude'
import { fetchMyAssessmentResult } from './careerReadinessAssessment'
import { fetchInitialAssessment } from './assessmentResults'
import { fetchPracticeSummary } from './practiceResults'
import { fetchMyLiveSessions } from './liveSessions'
import { startedVersion } from './startedCache'

let cache: { at: number; version: number; result: Promise<boolean> } | null = null

export function hasStarted(): Promise<boolean> {
  if (cache && cache.version === startedVersion() && Date.now() - cache.at < 20_000) return cache.result
  // An assessment, or any practice or live session: an account from before the
  // aptitude assessments existed has done things without taking one.
  const result = Promise.all([
    fetchMyAptitudeResult(),
    fetchMyAssessmentResult(),
    fetchInitialAssessment(),
    fetchPracticeSummary().then((p) => (Object.keys(p).length > 0 ? p : null)),
    fetchMyLiveSessions().then((l) => (l.length > 0 ? l : null)),
  ])
    .then((rows) => rows.some((r) => r != null))
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
