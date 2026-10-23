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
import { ReadinessScoreCard } from '@/components/dashboard/ReadinessScoreCard'
import { SkillBalanceCard } from '@/components/dashboard/SkillBalanceCard'
import { InsightsPanel, SkillsGrowthPanel, buildInsights } from '@/components/dashboard/GrowthCards'
import { aptitudeBalance, progressBalance } from '@/lib/skillBalance'
import { fetchScoreTrend, type ScoreTrend } from '@/lib/scoreTrend'
import { ExplorePanel, MentorsForYou, StatsStrip } from '@/components/dashboard/LaunchPadBottom'
import { earnedBadges } from '@/lib/badges'
import { suggestMentors } from '@/lib/mentorMatch'
import { BALANCE_AREAS } from '@/lib/skillBalance'
import { fetchMentors, type Mentor } from '@/lib/mentors'
import { fetchOpenRoles } from '@/lib/internships'
import { fetchInstitutionPartners } from '@/lib/institutionPartners'
import { supabase } from '@/lib/supabase'
import { sessionUser } from '@/lib/sessionUser'
import { KeyMeasures } from '@/components/dashboard/KeyMeasures'
import { FirstRunPath } from '@/components/dashboard/FirstRunPath'
import { FindMentorCard } from '@/components/dashboard/FindMentorCard'
import { PhoneLaunchPad } from '@/components/dashboard/PhoneLaunchPad'
import { PartnerRequests } from '@/components/community/PartnerRequests'
import { isPhone } from '@/lib/device'
import { useInternshipDone } from '@/lib/internships'
import { useActivity } from '@/lib/activity'
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
  // The account's streak, visits and hours, the same on every device; the
  // browser's own until the account has them (lib/activity.ts).
  const activity = useActivity()
  const localStreak = useStreak(userKey)
  const localVisits = useVisitCount(userKey)
  const streak = activity?.streak ?? localStreak
  const visits = activity?.visits ?? localVisits
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
  const internshipDone = useInternshipDone()

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
        crCoreDone: crProgress.coreComplete,
        liveSessions: liveSessions.length,
        dmLiveSessions: dmSessions.length,
        crProject: crReview.project,
        dmProject: dmReview.project,
        dmTrackPercents: skillTracks.flatMap((t) => (practice[t.slug] ? [practice[t.slug].percent] : [])),
        dmPracticeDone: practicedCount === skillTracks.length,
        foundationPercent: assessment?.overall.percent ?? null,
        internshipSignedOff: internshipDone,
      }),
    [crProgress.modulesDone, liveSessions.length, dmSessions.length, crReview.project, dmReview.project, practice, practicedCount, assessment, internshipDone],
  )
  // The number itself is issued by the server; the estimate above is the guide
  // and the fallback. Re-ask whenever something the score depends on changes —
  // but only once everything has loaded. The server works the score out from its
  // own records, not from what this page holds, so asking while the practice
  // results, assessment or reviews are still arriving only repeats the same
  // (fairly heavy) calculation as each piece lands.
  const [serverScore, setServerScore] = useState<ServerScore | null>(null)
  const scoreInputsLoaded =
    !crLoading && !liveLoading && practiceLoaded && !assessmentLoading && !dmReview.loading && !crReview.loading
  useEffect(() => {
    if (!scoreInputsLoaded) return
    let active = true
    refreshMyScore().then((s) => active && setServerScore(s))
    return () => {
      active = false
    }
  }, [scoreInputsLoaded, crProgress.modulesDone, liveSessions.length, dmSessions.length, crReview.state, dmReview.state, crReview.project.points, dmReview.project.points, practice, assessment])
  const readiness = useMemo(
    () => (serverScore ? withServerScore(estimate, serverScore) : estimate),
    [estimate, serverScore],
  )

  // How the score moved: asked once the server has stored today's score.
  const [trend, setTrend] = useState<ScoreTrend | null>(null)
  useEffect(() => {
    if (!serverScore) return
    let active = true
    void fetchScoreTrend(serverScore.score).then((t) => active && setTrend(t))
    return () => {
      active = false
    }
  }, [serverScore])

  // The practised tracks with their best score, for the growth card and the radar.
  const practisedTracks = useMemo(
    () => skillTracks.flatMap((t) => (practice[t.slug] ? [{ name: t.name, percent: practice[t.slug].percent }] : [])),
    [practice],
  )
  const balance = useMemo(
    () => ({
      aptitude: aptitudeBalance(dmAptitude.result?.scores ?? null, crAptitude.result?.scores ?? null),
      progress: progressBalance(practisedTracks.map((t) => t.percent), skillTracks.length, crProgress.modules),
    }),
    [dmAptitude.result, crAptitude.result, practisedTracks, crProgress.modules],
  )
  const bestTrack = practisedTracks.length ? [...practisedTracks].sort((a, b) => b.percent - a.percent)[0] : null

  // The foot of the LaunchPad (computer only): mentors to suggest, what there
  // is to explore, and the student's numbers. Each loads on its own; a part
  // that can't be read just shows less.
  const [mentors, setMentors] = useState<Mentor[]>([])
  const [openRoles, setOpenRoles] = useState<number | null>(null)
  const [institutions, setInstitutions] = useState<number | null>(null)
  const [certificates, setCertificates] = useState<number | null>(null)
  useEffect(() => {
    if (isPhone()) return
    let active = true
    fetchMentors().then((m) => active && setMentors(m), () => {})
    fetchOpenRoles().then((r) => active && setOpenRoles(r.length), () => {})
    fetchInstitutionPartners().then((r) => active && setInstitutions(r.length), () => {})
    void sessionUser().then(async (u) => {
      if (!u) return
      const { count, error } = await supabase
        .from('certificates')
        .select('id', { count: 'exact', head: true })
        .eq('profile_id', u.id)
      if (active && !error) setCertificates(count ?? 0)
    })
    return () => {
      active = false
    }
  }, [])

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

  // A mentor is asked for per programme. The "Find a mentor" card stays until
  // both have one (working with them, or asked and waiting), and waits for the
  // first step like the rest: a new student is asked to begin elsewhere.
  const withMentor = [dmMatch.match, crMatch.match].filter((m) => m && (m.status === 'active' || m.status === 'requested')).length
  const findMentor = !firstRun && !dmMatch.loading && !crMatch.loading && withMentor < 2 ? <FindMentorCard hasOne={withMentor === 1} /> : null

  const highlights = {
    certificate: assessment ? ('earned' as const) : foundationUnlock.unlocked ? ('ready' as const) : ('locked' as const),
    hasMentor: dmMatch.match?.status === 'active' || crMatch.match?.status === 'active',
    tracksPractised: practicedCount,
    totalTracks: skillTracks.length,
    modulesDone: crProgress.modulesDone,
    totalModules: crProgress.modulesTotal,
  }
  // A course appears once the student has started it — taken its aptitude
  // assessment or done any work — never before, so a new student's objective
  // isn't a row of "Not started".
  const courses = [
    dmStarted &&
      digitalMarketingProgress(
        assessment != null,
        practicedCount,
        skillTracks.length,
        dmReview.state === 'approved',
        internshipDone,
        dmAptitude.result != null,
      ),
    crStarted &&
      careerReadinessProgress(
        crAptitude.result != null,
        crProgress.modulesDone,
        crProgress.modulesTotal,
        crReview.state === 'approved',
        internshipDone,
      ),
  ].filter((c): c is CourseProgress => c !== false)

  // The radar's lowest area, once anything has been done: what a mentor could help grow.
  const weakestArea = BALANCE_AREAS.some((a) => (balance.progress[a.key] ?? 0) > 0)
    ? [...BALANCE_AREAS].sort((a, b) => (balance.progress[a.key] ?? 0) - (balance.progress[b.key] ?? 0))[0].label
    : null
  const mentorSuggestions = suggestMentors({
    mentors,
    profile,
    practisedTracks: practisedTracks.map((t) => t.name),
    dmStarted,
    crStarted,
    weakestArea,
    exclude: [dmMatch.match?.mentor?.id, crMatch.match?.mentor?.id].filter((x): x is string => Boolean(x)),
  })

  // A phone gets its own LaunchPad (components/dashboard/PhoneLaunchPad.tsx):
  // the same score and the same next steps, in one column, without the parts
  // that lead to pages a phone doesn't have.
  if (isPhone()) {
    return (
      <AppShell wide>
        <PartnerRequests pendingOnly className="mb-5" />
        <PhoneLaunchPad
          greeting={`${greet()}, ${name}`}
          // Wait for the first-run answer too: a new account would otherwise
          // see a 0 score for a moment before its path replaces it.
          loading={profileLoading || !dataLoaded}
          firstRun={firstRun}
          name={name}
          goals={goals}
          streak={streak}
          readiness={readiness}
          highlights={highlights}
          courses={courses}
          findMentor={findMentor}
        />
      </AppShell>
    )
  }

  return (
    <AppShell wide>
      {/* "LaunchPad" is the page; the greeting stays, but as the subtitle —
          the page is now about where the student stands, not who they are.
          Certificates live in the profile. */}
      <PageHeader eyebrow="LaunchPad" title={<>{greet()}, {name}</>} />

      <div className="space-y-6">
        {/* A partner asking to see this student's record is answered before anything else. */}
        <PartnerRequests pendingOnly />
        {/* Order is deliberate: the score (where you stand), then the
            programme (the structured way to raise it), then everything else. */}
        {profileLoading || !readiness ? (
          <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
            <Skeleton className="h-80 lg:col-span-2" />
            <Skeleton className="h-80" />
          </div>
        ) : (
          firstRun ? (
            <div className="grid grid-cols-1 gap-5 lg:grid-cols-3 lg:grid-rows-[auto_1fr]">
              <div className="lg:col-span-2 lg:col-start-1 lg:row-span-2 lg:row-start-1">
                <FirstRunPath name={name} goal={goals[0]} level={user?.user_metadata?.profile?.start_level} />
              </div>
              <KeyMeasures goals={goals} streak={streak} startHere showHours={false} />
            </div>
          ) : (
            // Where they stand, then where it comes from: the score beside the
            // balance of their skills; both programmes in one panel beside their
            // objective; and what their progress says beside their streak.
            <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
              <div className="lg:col-span-2">
                <ReadinessScoreCard readiness={readiness} trend={trend} />
              </div>
              <SkillBalanceCard aptitude={balance.aptitude} progress={balance.progress} />
              <div className="lg:col-span-2">
                <SkillsGrowthPanel readiness={readiness} tracks={practisedTracks} modules={crProgress.modules} />
              </div>
              <KeyMeasures
                goals={goals}
                streak={streak}
                showHours
                hours={activity?.hours30}
                activity={activity}
                place={{ objective: 'lg:col-start-3 lg:row-start-2', hours: 'lg:col-start-3 lg:row-start-3' }}
              />
              <div className="lg:col-span-2 lg:col-start-1 lg:row-start-3">
                <InsightsPanel
                  insights={buildInsights({
                    readiness,
                    trend,
                    bestTrack,
                    modulesDone: crProgress.modulesDone,
                    activity,
                    progress: balance.progress,
                  })}
                />
              </div>
            </div>
          )
        )}

        {/* Explore and mentors side by side, then the numbers: the computer's
            foot of the page. A new student keeps the simple "Find a mentor". */}
        {firstRun ? (
          findMentor
        ) : (
          <>
            <div className="grid grid-cols-1 gap-5 lg:grid-cols-5">
              <div className="lg:col-span-2">
                <ExplorePanel openRoles={openRoles} institutions={institutions} />
              </div>
              <div className="lg:col-span-3">
                <MentorsForYou suggestions={mentorSuggestions} hasMentor={withMentor > 0} />
              </div>
            </div>
            <StatsStrip
              courses={courses.length}
              badges={earnedBadges({
                aptitudeTaken: dmAptitude.result != null || crAptitude.result != null,
                trackPercents: practisedTracks,
                modulesDone: crProgress.modules.filter((m) => m.done >= m.total),
                foundationPassed: assessment != null,
                dmProjectPassed: dmReview.state === 'approved',
                crProjectPassed: crReview.state === 'approved',
                hasMentor: [dmMatch.match, crMatch.match].some((m) => m?.status === 'active'),
                internshipDone,
                bestStreak: activity?.best ?? 0,
              })}
              certificates={certificates}
              bestStreak={activity?.best ?? null}
            />
          </>
        )}

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

      </div>
    </AppShell>
  )
}
