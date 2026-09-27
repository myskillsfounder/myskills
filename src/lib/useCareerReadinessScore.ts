/**
 * Everything computeReadiness() needs, fetched and combined the one way —
 * shared by every page that shows the Career Readiness Score. Dashboard.tsx
 * predates this and still assembles its own copy inline; new call sites
 * (Profile) use this instead so the logic exists in one place.
 */
import { useEffect, useMemo, useState } from 'react'
import { useInitialAssessment } from './assessmentResults'
import { fetchPracticeSummary, type PracticeSummary } from './practiceResults'
import { skillTracks } from './skillTracks'
import { computeReadiness, TRACK_PASS_PERCENT, type Readiness } from './readinessScore'
import { useCareerReadinessProgress } from './careerReadinessProgramme'
import { useMyLiveSessions } from './liveSessions'
import { refreshMyScore, withServerScore, type ServerScore } from './scoreService'
import { useMentorReview } from './mentorReview'

export function useCareerReadinessScore() {
  const [practice, setPractice] = useState<PracticeSummary>({})
  const [practiceLoading, setPracticeLoading] = useState(true)
  useEffect(() => {
    let active = true
    fetchPracticeSummary()
      .then((p) => active && setPractice(p))
      .catch(() => {})
      .finally(() => active && setPracticeLoading(false))
    return () => {
      active = false
    }
  }, [])

  const { result: assessment, loading: assessmentLoading } = useInitialAssessment()
  const dmReview = useMentorReview('digital-marketing')
  const crReview = useMentorReview('career-readiness')
  const { progress: crProgress, loading: crLoading } = useCareerReadinessProgress()
  const { crSessions: liveSessions, dmSessions, loading: liveLoading } = useMyLiveSessions()

  const practicedCount = useMemo(() => skillTracks.filter((t) => practice[t.slug]).length, [practice])
  const tracksPassed = useMemo(
    () => skillTracks.filter((t) => (practice[t.slug]?.percent ?? 0) >= TRACK_PASS_PERCENT).length,
    [practice],
  )

  const estimate = useMemo(
    () =>
      computeReadiness({
        modulesDone: crProgress.modulesDone,
        liveSessions: liveSessions.length,
        dmLiveSessions: dmSessions.length,
        crSignedOff: crReview.state === 'approved',
        dmSignedOff: dmReview.state === 'approved',
        dmTracksPassed: tracksPassed,
        dmPracticeDone: practicedCount === skillTracks.length,
        foundationPercent: assessment?.overall.percent ?? null,
      }),
    [
      crProgress.modulesDone,
      liveSessions.length,
      dmSessions.length,
      crReview.state,
      dmReview.state,
      tracksPassed,
      practicedCount,
      assessment,
    ],
  )

  const loading = practiceLoading || assessmentLoading || crLoading || liveLoading

  // The number itself is issued by the server; the estimate above is the
  // fallback while that hasn't resolved (or the SQL hasn't been run).
  const [serverScore, setServerScore] = useState<ServerScore | null>(null)
  useEffect(() => {
    if (loading) return
    let active = true
    refreshMyScore().then((s) => active && setServerScore(s))
    return () => {
      active = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, crProgress.modulesDone, liveSessions.length, dmSessions.length, crReview.state, dmReview.state, tracksPassed])

  const readiness: Readiness | null = loading ? null : serverScore ? withServerScore(estimate, serverScore) : estimate

  return {
    readiness,
    loading,
    practice,
    practicedCount,
    tracksPassed,
    crProgress,
  }
}
