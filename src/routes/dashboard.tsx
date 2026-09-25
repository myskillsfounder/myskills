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
import { useVerification } from '@/lib/useVerification'
import { digitalMarketingProgress } from '@/lib/programmes'
import { useMentorReview } from '@/lib/mentorReview'
import { AppShell } from '@/components/app/AppShell'
import { PageHeader } from '@/components/app/PageHeader'
import { AiSkillsShowcase } from '@/components/dashboard/AiSkillsShowcase'
import { MentorPromoCard } from '@/components/dashboard/MentorPromoCard'
import { ProgrammePromoCard } from '@/components/dashboard/ProgrammePromoCard'
import { ReadinessScoreCard } from '@/components/dashboard/ReadinessScoreCard'
import { KeyMeasures } from '@/components/dashboard/KeyMeasures'
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
  const verification = useVerification(profile)
  const goals = profile?.goals ?? []
  const { result: assessment } = useInitialAssessment()
  const hasFeedback = useHasFeedback()
  const streak = useStreak(userKey)
  const visits = useVisitCount(userKey)
  const eligibleForReviewNudge = assessment != null || visits >= 5

  const [practice, setPractice] = useState<PracticeSummary>({})
  const dmReview = useMentorReview('digital-marketing')
  const crReview = useMentorReview('career-readiness')
  const { progress: crProgress, loading: crLoading } = useCareerReadinessProgress()
  const { crSessions: liveSessions, dmSessions, loading: liveLoading } = useMyLiveSessions()

  useEffect(() => {
    fetchPracticeSummary()
      .then(setPractice)
      .catch(() => {})
  }, [])

  const practicedCount = useMemo(
    () => skillTracks.filter((t) => practice[t.slug]).length,
    [practice],
  )

  // The score comes from the profile alone (see lib/readinessScore.ts);
  // practice results still feed the course progress in KeyMeasures.
  const estimate = useMemo(
    () =>
      profile
        ? computeReadiness(profile, verification.view, verification.hasOpenRequest, {
            modulesDone: crProgress.modulesDone,
            liveSessions: liveSessions.length,
            dmLiveSessions: dmSessions.length,
            crSignedOff: crReview.state === 'approved',
            dmSignedOff: dmReview.state === 'approved',
            dmPracticeDone: practicedCount === skillTracks.length,
          })
        : null,
    [profile, verification.view, verification.hasOpenRequest, crProgress.modulesDone, liveSessions.length, dmSessions.length, crReview.state, dmReview.state, practicedCount],
  )
  // The number itself is issued by the server; the estimate above is the guide
  // and the fallback. Re-ask whenever something the score depends on changes.
  const [serverScore, setServerScore] = useState<ServerScore | null>(null)
  useEffect(() => {
    if (profileLoading || verification.loading || crLoading || liveLoading) return
    let active = true
    refreshMyScore().then((s) => active && setServerScore(s))
    return () => {
      active = false
    }
  }, [profileLoading, verification.loading, crLoading, liveLoading, verification.view, crProgress.modulesDone, liveSessions.length, dmSessions.length, crReview.state, dmReview.state])
  const readiness = useMemo(
    () => (estimate && serverScore ? withServerScore(estimate, serverScore) : estimate),
    [estimate, serverScore],
  )

  return (
    <AppShell wide>
      {/* "LaunchPad" is the page; the greeting stays, but as the subtitle —
          the page is now about where the student stands, not who they are.
          Certificates live in the profile. */}
      <PageHeader eyebrow="LaunchPad" title={<>{greet()}, {name}</>} />

      <div className="space-y-6">
        {/* Order is deliberate: the score (where you stand), then the
            programme (the structured way to raise it), then everything else. */}
        {profileLoading || verification.loading || !readiness ? (
          <div className="grid gap-5 lg:grid-cols-3">
            <Skeleton className="h-80 lg:col-span-2" />
            <Skeleton className="h-80" />
          </div>
        ) : (
          <div className="grid items-stretch gap-5 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <ReadinessScoreCard readiness={readiness} />
            </div>
            <KeyMeasures
              goals={goals}
              streak={streak}
              courses={[digitalMarketingProgress(
                  assessment != null,
                  practicedCount,
                  skillTracks.length,
                  dmReview.state === 'approved',
                )]}
            />
          </div>
        )}

        <ProgrammePromoCard />

        {/* Talk to a mentor — promoted: a real person, one tap away */}
        <MentorPromoCard />

        {/* Rate & review — deliberately eye-catching, and only until they leave one */}
        {hasFeedback === false && eligibleForReviewNudge && (
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

        <AiSkillsShowcase />
      </div>
    </AppShell>
  )
}
