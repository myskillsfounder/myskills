import { useEffect, useMemo, useState } from 'react'
import { createFileRoute, Link } from '@tanstack/react-router'
import { ArrowRight, Star } from 'lucide-react'
import { requireOnboarded } from '@/lib/guards'
import { useAuthUser, userDisplayName } from '@/lib/useAuth'
import { useProfile } from '@/lib/useProfile'
import { useInitialAssessment } from '@/lib/assessmentResults'
import { useHasFeedback } from '@/lib/feedback'
import { fetchPracticeSummary, type PracticeSummary } from '@/lib/practiceResults'
import { skillTracks } from '@/lib/skillTracks'
import { computeReadiness } from '@/lib/readinessScore'
import { useCareerReadinessProgress } from '@/lib/careerReadinessProgramme'
import { useMyLiveSessions } from '@/lib/liveSessions'
import { refreshMyScore, withServerScore, type ServerScore } from '@/lib/scoreService'
import { anyHistory } from '@/lib/firstRun'
import { careerReadinessProgress, digitalMarketingProgress, type CourseProgress } from '@/lib/programmes'
import { useMyAssessmentResult } from '@/lib/careerReadinessAssessment'
import { useMyAptitudeResult } from '@/lib/dmAptitude'
import { useFoundationUnlock } from '@/lib/foundation'
import { useMyMatch } from '@/lib/mentorMatches'
import { useMentorReview } from '@/lib/mentorReview'
import { AppShell } from '@/components/app/AppShell'
import { PageHeader } from '@/components/app/PageHeader'
import { AiSkillsShowcase } from '@/components/dashboard/AiSkillsShowcase'
import { MentorPromoCard } from '@/components/dashboard/MentorPromoCard'
import { ReadinessScoreCard } from '@/components/dashboard/ReadinessScoreCard'
import { KeyMeasures } from '@/components/dashboard/KeyMeasures'
import { FirstRunPath } from '@/components/dashboard/FirstRunPath'
import { Skeleton } from '@/components/ui'

export const Route = createFileRoute('/dashboard')({
  beforeLoad: requireOnboarded,
  component: DashboardPage,
})

const dayKey = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`

/** Local daily streak (per device). */
function useStreak(userKey: string) {
  const [streak, setStreak] = useState(0)
  useEffect(() => {
    const KEY = `myskills.streak.${userKey}`
    let data: { last: string; count: number }
    try {
      data = JSON.parse(localStorage.getItem(KEY) || 'null') || { last: '', count: 0 }
    } catch {
      data = { last: '', count: 0 }
    }
    const today = dayKey(new Date())
    const yesterday = dayKey(new Date(Date.now() - 86400000))
    if (data.last !== today) {
      data = { last: today, count: data.last === yesterday ? data.count + 1 : 1 }
      try {
        localStorage.setItem(KEY, JSON.stringify(data))
      } catch {
        /* ignore */
      }
    }
    setStreak(data.count)
  }, [userKey])
  return streak
}

/** Distinct days the dashboard has been opened on this device — a proxy for
 *  "logins" since sign-in frequency isn't tracked server-side. Used only to
 *  gate the review nudge so it isn't shown to brand-new users. */
function useVisitCount(userKey: string) {
  const [count, setCount] = useState(0)
  useEffect(() => {
    const KEY = `myskills.visits.${userKey}`
    let data: { lastDay: string; count: number }
    try {
      data = JSON.parse(localStorage.getItem(KEY) || 'null') || { lastDay: '', count: 0 }
    } catch {
      data = { lastDay: '', count: 0 }
    }
    const today = dayKey(new Date())
    if (data.lastDay !== today) {
      data = { lastDay: today, count: data.count + 1 }
      try {
        localStorage.setItem(KEY, JSON.stringify(data))
      } catch {
        /* ignore */
      }
    }
    setCount(data.count)
  }, [userKey])
  return count
}

function greet() {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 17) return 'Good afternoon'
  return 'Good evening'
}

function DashboardPage() {
  const { user } = useAuthUser()
  const raw = userDisplayName(user).split(' ')[0]
  const name = raw.charAt(0).toUpperCase() + raw.slice(1)
  const userKey = user?.id ?? 'guest'
  const { profile, loading: profileLoading } = useProfile()
  const goals = profile?.goals ?? []
  const { result: assessment, loading: assessmentLoading } = useInitialAssessment()
  const hasFeedback = useHasFeedback()
  const streak = useStreak(userKey)
  const visits = useVisitCount(userKey)
  const eligibleForReviewNudge = assessment != null || visits >= 5

  const [practice, setPractice] = useState<PracticeSummary>({})
  const [practiceLoaded, setPracticeLoaded] = useState(false)
  const dmReview = useMentorReview('digital-marketing')
  const crReview = useMentorReview('career-readiness')
  const crAptitude = useMyAssessmentResult()
  const dmAptitude = useMyAptitudeResult()
  const foundationUnlock = useFoundationUnlock()
  const dmMatch = useMyMatch('digital-marketing')
  const crMatch = useMyMatch('career-readiness')
  const { progress: crProgress, loading: crLoading } = useCareerReadinessProgress()
  const { crSessions: liveSessions, dmSessions, loading: liveLoading } = useMyLiveSessions()

  useEffect(() => {
    fetchPracticeSummary()
      .then(setPractice)
      .catch(() => {})
      .finally(() => setPracticeLoaded(true))
  }, [])

  const practicedCount = useMemo(
    () => skillTracks.filter((t) => practice[t.slug]).length,
    [practice],
  )

  // Only what the student has done on MySkills counts (see lib/readinessScore.ts).
  const estimate = useMemo(
    () =>
      computeReadiness({
        modulesDone: crProgress.modulesDone,
        liveSessions: liveSessions.length,
        dmLiveSessions: dmSessions.length,
        crProject: crReview.project,
        dmProject: dmReview.project,
        dmTrackPercents: skillTracks.flatMap((t) => (practice[t.slug] ? [practice[t.slug].percent] : [])),
        dmPracticeDone: practicedCount === skillTracks.length,
        foundationPercent: assessment?.overall.percent ?? null,
        internshipSignedOff: false,
      }),
    [crProgress.modulesDone, liveSessions.length, dmSessions.length, crReview.project, dmReview.project, practice, practicedCount, assessment],
  )
  // The number itself is issued by the server; the estimate above is the guide
  // and the fallback. Re-ask whenever something the score depends on changes.
  const [serverScore, setServerScore] = useState<ServerScore | null>(null)
  useEffect(() => {
    if (crLoading || liveLoading) return
    let active = true
    refreshMyScore().then((s) => active && setServerScore(s))
    return () => {
      active = false
    }
  }, [crLoading, liveLoading, crProgress.modulesDone, liveSessions.length, dmSessions.length, crReview.state, dmReview.state, crReview.project.points, dmReview.project.points, practice, assessment])
  const readiness = useMemo(
    () => (serverScore ? withServerScore(estimate, serverScore) : estimate),
    [estimate, serverScore],
  )

  // A course appears once the student has started it: taken its aptitude
  // assessment, done any work in it, or earned points from it.
  const dmStarted =
    dmAptitude.result != null || assessment != null || practicedCount > 0 || readiness.professional.points > 0
  const crStarted = crAptitude.result != null || crProgress.modulesDone > 0 || readiness.personal.points > 0

  // A brand-new student: nothing done anywhere. Not just "no assessment": an
  // account from before the aptitude assessments existed has a score, practice
  // or mentor history, and keeps its normal LaunchPad. So this needs every
  // signal to be in and every one to be empty — and if the score couldn't be
  // fetched we can't tell, so they get the normal LaunchPad, not the welcome.
  // They see their path instead of a 0/100 score, and nothing that only matters
  // once they're under way (hours, the mentor chat, the skills showcase).
  const dataLoaded =
    practiceLoaded &&
    serverScore !== null &&
    !assessmentLoading &&
    !crAptitude.loading &&
    !dmAptitude.loading &&
    !crLoading &&
    !liveLoading &&
    !dmMatch.loading &&
    !crMatch.loading &&
    !dmReview.loading &&
    !crReview.loading
  // The same rule as everywhere else (lib/firstRun.ts), fed with what this
  // page has already loaded.
  const hasHistory = anyHistory({
    dmAptitude: dmAptitude.result != null,
    crAssessment: crAptitude.result != null,
    foundation: assessment != null,
    practicedTracks: practicedCount,
    moduleAnswers: crProgress.itemsDone,
    liveSessions: liveSessions.length + dmSessions.length,
    mentorMatch: dmMatch.match != null || crMatch.match != null,
    projects: (dmReview.review ? 1 : 0) + (crReview.review ? 1 : 0),
    score: readiness.score,
  })
  const firstRun = dataLoaded && !hasHistory

  return (
    <AppShell wide>
      {/* "LaunchPad" is the page; the greeting stays, but as the subtitle —
          the page is now about where the student stands, not who they are.
          Certificates live in the profile. */}
      <PageHeader eyebrow="LaunchPad" title={<>{greet()}, {name}</>} />

      <div className="space-y-6">
        {/* Order is deliberate: the score (where you stand), then the
            programme (the structured way to raise it), then everything else. */}
        {profileLoading || !readiness ? (
          <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
            <Skeleton className="h-80 lg:col-span-2" />
            <Skeleton className="h-80" />
          </div>
        ) : (
          // Layout note — why a gap can't open up beside the score. The score takes
          // two columns and BOTH rows; the right column stacks the objective (its
          // own height) over hours (the flexible row). The two columns always end
          // together: if the right side is shorter, the hours card takes up the
          // slack (its content is centred, so it just has more room); if it is
          // taller, the score card spreads its sections a little. The two sides are
          // close in height, so neither is ever more than a few dozen pixels.
          <div className="grid grid-cols-1 gap-5 lg:grid-cols-3 lg:grid-rows-[auto_1fr]">
            <div className="lg:col-span-2 lg:col-start-1 lg:row-span-2 lg:row-start-1">
              {firstRun ? (
                <FirstRunPath name={name} goal={goals[0]} />
              ) : (
                <ReadinessScoreCard
                  readiness={readiness}
                  highlights={{
                    certificate: assessment ? 'earned' : foundationUnlock.unlocked ? 'ready' : 'locked',
                    hasMentor: dmMatch.match?.status === 'active' || crMatch.match?.status === 'active',
                    tracksPractised: practicedCount,
                    totalTracks: skillTracks.length,
                    modulesDone: crProgress.modulesDone,
                    totalModules: crProgress.modulesTotal,
                  }}
                />
              )}
            </div>
            <KeyMeasures
              goals={goals}
              streak={streak}
              startHere={firstRun}
              showHours={!firstRun}
              courses={[
                // A course appears once the student has started it — taken its
                // aptitude assessment or done any work — never before, so a new
                // student's objective isn't a row of "Not started".
                dmStarted &&
                  digitalMarketingProgress(
                    assessment != null,
                    practicedCount,
                    skillTracks.length,
                    dmReview.state === 'approved',
                    false,
                    dmAptitude.result != null,
                  ),
                crStarted &&
                  careerReadinessProgress(
                    crAptitude.result != null,
                    crProgress.modulesDone,
                    crProgress.modulesTotal,
                    crReview.state === 'approved',
                  ),
              ].filter((c): c is CourseProgress => c !== false)}
            />
          </div>
        )}

        {/* Talk to a mentor — promoted: a real person, one tap away. Not on day
            one: mentor sessions come after the aptitude assessment. */}
        {!firstRun && <MentorPromoCard />}

        {/* Rate & review — deliberately eye-catching, and only until they leave one */}
        {hasFeedback === false && eligibleForReviewNudge && !firstRun && (
          <Link
            to="/feedback"
            className="attention group flex flex-col gap-3 rounded-2xl border border-gold-200 bg-gradient-to-r from-gold-50 via-gold-50 to-white p-4 shadow-e1 transition-colors hover:border-gold-300 sm:flex-row sm:items-center sm:gap-4 sm:p-5"
          >
            <span className="nudge flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gold-400 text-white shadow-e1">
              <Star size={20} fill="currentColor" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-[15px] font-semibold text-gold-700">Enjoying MySkills?</p>
              <p className="mt-0.5 text-sm text-ink-600">
                Rate the app in 30 seconds — it genuinely shapes what we build next.
              </p>
            </div>
            <span className="press inline-flex h-10 shrink-0 items-center gap-1.5 rounded-xl bg-gold-500 px-4 text-sm font-semibold text-white transition-transform duration-300 group-hover:translate-x-0.5">
              Rate &amp; review
              <ArrowRight size={15} />
            </span>
          </Link>
        )}

        {!firstRun && <AiSkillsShowcase />}
      </div>
    </AppShell>
  )
}
