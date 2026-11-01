import { useEffect, useState } from 'react'
import { errorMessage } from '@/lib/errors'
import { createFileRoute } from '@tanstack/react-router'
import { ArrowLeft, Brain, Target } from 'lucide-react'
import { requireOnboarded } from '@/lib/guards'
import { useAuthUser } from '@/lib/useAuth'
import { useInitialAssessment } from '@/lib/assessmentResults'
import {
  fetchPracticeSummary,
  submitPracticeAttempt,
  type PracticeSummary,
} from '@/lib/practiceResults'
import { questionsForTrack } from '@/lib/decisionLabs'
import { skillTracks } from '@/lib/skillTracks'
import { vocabularyTerms, type VocabLevel } from '@/lib/vocabulary'
import { VOCAB_UNLOCK_PERCENT, useVocabProgress } from '@/lib/vocabularyProgress'
import { AppShell } from '@/components/app/AppShell'
import { PageHeader } from '@/components/app/PageHeader'
import { AssessmentCard } from '@/components/career-readiness/AssessmentCard'
import { LiveMentorCard } from '@/components/practice/LiveMentorCard'
import { useMyAssessmentResult } from '@/lib/careerReadinessAssessment'
import { useMyMatch } from '@/lib/mentorMatches'
import { AptitudeCard } from '@/components/aptitude/AptitudeCard'
import { StartChoice } from '@/components/practice/StartChoice'
import { strongestAptitude, suggestedTrackOrder, useMyAptitudeResult } from '@/lib/dmAptitude'
import type { FoundationUnlock } from '@/lib/foundation'
import { FoundationCard } from '@/components/assessment/FoundationCard'
import { PracticeStats } from '@/components/practice/PracticeStats'
import { NextUpCard } from '@/components/practice/NextUpCard'
import { TrackList } from '@/components/practice/TrackList'
import { ModePicker, type PracticeMode } from '@/components/practice/ModePicker'
import { ScenarioQuiz } from '@/components/practice/ScenarioQuiz'
import { VocabularyQuiz } from '@/components/practice/VocabularyQuiz'
import { VocabLevelPicker } from '@/components/practice/VocabLevelPicker'
import {
  CAREER_READINESS,
  careerReadinessProgress,
  completionStages,
  DIGITAL_MARKETING,
  digitalMarketingProgress,
} from '@/lib/programmes'
import { CareerReadinessPractice } from '@/components/practice/CareerReadinessPractice'
import { CareerReadinessOverview } from '@/components/practice/CareerReadinessOverview'
import { ProgrammeCompletion } from '@/components/practice/ProgrammeCompletion'
import { MentorReviewPanel } from '@/components/practice/MentorReviewPanel'
import { useMentorReview } from '@/lib/mentorReview'
import { useCareerReadinessProgress } from '@/lib/careerReadinessProgramme'
import { useMyLiveSessions } from '@/lib/liveSessions'
import { useHasStarted } from '@/lib/firstRun'
import { clearSavedProgramme, savedProgramme, type Programme } from '@/lib/practiceProgramme'
import { fetchMyProgrammes, type MyEnrolment } from '@/lib/programmeStudent'
import { FocusRoomsCard } from '@/components/focus/FocusRoomsCard'
import { ProgrammeCards, RecommendedProgrammes, recommendFor } from '@/components/practice/ProgrammeCards'
import { useProfile } from '@/lib/useProfile'
import { isPhone } from '@/lib/device'
import { useInternshipDone } from '@/lib/internships'

export const Route = createFileRoute('/practice')({
  beforeLoad: requireOnboarded,
  component: PracticePage,
})

function MigrationError({ message }: { message: string }) {
  return (
    <div className="rounded-2xl border border-red-200 bg-red-50 p-5 text-sm text-red-700">
      <p className="font-semibold">Couldn’t load this page.</p>
      <p className="mt-1">{message}</p>
      <p className="mt-2 text-red-600">
        First run? Apply{' '}
        <code className="rounded bg-red-100 px-1">docs/supabase-server-side-grading.sql</code>{' '}
        in Supabase (see docs/supabase-schema.sql for the full schema reference).
      </p>
    </div>
  )
}

/** Inside one programme: its name, and the way back to every programme. */
function ProgrammeHeader({ programme, onBack }: { programme: Programme; onBack: () => void }) {
  const name = programme === 1 ? DIGITAL_MARKETING.name : CAREER_READINESS.name
  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={onBack}
        className="group inline-flex items-center gap-1.5 text-sm font-medium text-ink-600 transition-colors hover:text-ink-900"
      >
        <ArrowLeft size={16} className="transition-transform duration-300 group-hover:-translate-x-1" /> All programmes
      </button>
      <h1 className="font-display text-2xl font-semibold tracking-tight text-ink-900 sm:text-3xl">{name}</h1>
    </div>
  )
}

function PracticePage() {
  const {
    result: assessment,
    loading: assessmentLoading,
    error: assessmentError,
  } = useInitialAssessment()

  // The aptitude assessment is step 1 and unlocks Practice. Anyone who already
  // finished the Foundation assessment (the old initial assessment) before it
  // existed keeps their access rather than being sent back to the start.
  const { result: aptitude, loading: aptitudeLoading } = useMyAptitudeResult()
  // Either programme's aptitude assessment opens Practice: a student can start
  // with the marketing one or the personal one. Each programme's own content
  // still waits for its own assessment (see the programme tabs below).
  const crAptitude = useMyAssessmentResult()
  const dmUnlocked = aptitude != null || assessment != null
  const crUnlocked = crAptitude.result != null
  // An account from before the aptitude assessments existed has practised or
  // had live sessions without taking one. It keeps Practice, with its progress,
  // rather than being sent back to the start.
  const started = useHasStarted()
  const unlocked = dmUnlocked || crUnlocked || started === true
  const gateLoading =
    assessmentLoading || aptitudeLoading || crAptitude.loading || (!dmUnlocked && !crUnlocked && started === null)

  const { user } = useAuthUser()
  const { learnedIds: vocabLearnedIds, markLearned: markVocabLearned, countLearned: countVocabLearned } =
    useVocabProgress(user?.id ?? 'guest')
  const vocabLearned = countVocabLearned(vocabularyTerms)

  const beginnerTerms = vocabularyTerms.filter((t) => t.level === 'beginner')
  const advancedTerms = vocabularyTerms.filter((t) => t.level === 'advanced')
  const beginnerLearned = countVocabLearned(beginnerTerms)
  const advancedLearned = countVocabLearned(advancedTerms)
  const beginnerPercent = beginnerTerms.length
    ? Math.round((beginnerLearned / beginnerTerms.length) * 100)
    : 0
  const advancedLocked = beginnerPercent < VOCAB_UNLOCK_PERCENT
  // The Foundation assessment opens on the same mark, using the live numbers
  // this page already tracks as the learner works through vocabulary.
  const foundationUnlock: FoundationUnlock = {
    learned: beginnerLearned,
    total: beginnerTerms.length,
    percent: beginnerPercent,
    required: VOCAB_UNLOCK_PERCENT,
    unlocked: !advancedLocked,
  }

  const [practice, setPractice] = useState<PracticeSummary>({})
  const [practiceLoading, setPracticeLoading] = useState(true)
  const [practiceError, setPracticeError] = useState<string>()
  const [selected, setSelected] = useState<string | null>(null)
  const [mode, setMode] = useState<PracticeMode | null>(null)
  const [vocabLevel, setVocabLevel] = useState<VocabLevel | null>(null)
  // Null: the programme cards. A link that asked for a programme (a Global
  // Leadership module, a dashboard card) opens it, once (lib/practiceProgramme.ts).
  const [programme, setProgramme] = useState<Programme | null>(savedProgramme)
  useEffect(() => clearSavedProgramme(), [])

  // The course-engine programmes the student has joined, for the cards.
  const [engine, setEngine] = useState<MyEnrolment[]>()
  useEffect(() => {
    if (!unlocked) return
    let live = true
    fetchMyProgrammes().then((e) => live && setEngine(e))
    return () => {
      live = false
    }
  }, [unlocked])

  // Practice data loads as soon as Practice is unlocked, not only once the
  // Foundation assessment is done.
  useEffect(() => {
    if (!unlocked) return
    fetchPracticeSummary()
      .then(setPractice)
      .catch((e) => setPracticeError(errorMessage(e)))
      .finally(() => setPracticeLoading(false))
  }, [unlocked])

  // The server grades and records the attempt; refresh the scores behind the
  // result screen, and stay on it so the learner can read the review.
  async function submitTrack(track: string, answers: Record<string, number>) {
    const result = await submitPracticeAttempt(track, answers)
    setPractice(await fetchPracticeSummary())
    return result
  }

  const error = assessmentError ?? practiceError
  const dmReview = useMentorReview('digital-marketing')
  const crReview = useMentorReview('career-readiness')
  const { progress: crProgress } = useCareerReadinessProgress()
  const { crSessions: liveSessions, dmSessions } = useMyLiveSessions()
  const dmMatch = useMyMatch('digital-marketing')
  const crMatch = useMyMatch('career-readiness')

  // An internship signed off by its company and confirmed by the team is the
  // last stage of either programme.
  const internshipDone = useInternshipDone()
  const practisedTracks = skillTracks.filter((t) => practice[t.slug])
  // Digital Marketing shows its progress once there is any of it, aptitude or not.
  const dmOpen = dmUnlocked || practisedTracks.length > 0 || dmSessions.length > 0
  const practiceAvg = practisedTracks.length
    ? Math.round(practisedTracks.reduce((sum, t) => sum + practice[t.slug].percent, 0) / practisedTracks.length)
    : 0
  const dmStages = completionStages({
    practiceDone: practisedTracks.length === skillTracks.length,
    practiceStarted: practisedTracks.length > 0,
    practiceDetail: practisedTracks.length
      ? `${practisedTracks.length} of ${skillTracks.length} tracks practised · ${practiceAvg}% average`
      : `Practise all ${skillTracks.length} skill tracks`,
    mentorReview: dmReview.state,
    mentoring: {
      aptitudeDone: aptitude != null,
      status: dmMatch.match?.status ?? null,
      mentorName: dmMatch.match?.mentor?.full_name ?? null,
      sessions: dmSessions.length,
    },
    internshipDone,
  })
  const crStages = completionStages({
    practiceDone: crProgress.complete,
    practiceStarted: crProgress.started,
    practiceDetail: crProgress.started
      ? `${crProgress.modulesDone} of ${crProgress.modulesTotal} modules finished`
      : `Finish all ${crProgress.modulesTotal} modules`,
    mentorReview: crReview.state,
    mentoring: {
      aptitudeDone: crAptitude.result != null,
      status: crMatch.match?.status ?? null,
      mentorName: crMatch.match?.mentor?.full_name ?? null,
      sessions: liveSessions.length,
    },
    internshipDone,
  })

  const phone = isPhone()

  // Recommended next: the courses not joined yet, in the order that suits
  // the goal the student gave at onboarding.
  const { profile } = useProfile()
  const goalId = profile?.goals[0]
  const recommended = recommendFor(goalId, {
    dm: dmOpen,
    cr: crUnlocked || crProgress.started,
    engine: (engine ?? []).map((e) => e.slug),
  })

  // The cards' progress, the same numbers the dashboard shows.
  const crStarted = crUnlocked || crProgress.started || crReview.state !== 'none' || liveSessions.length > 0
  const dmCard = dmOpen
    ? digitalMarketingProgress(
        assessment != null,
        practisedTracks.length,
        skillTracks.length,
        dmReview.state === 'approved',
        internshipDone,
        aptitude != null,
      )
    : null
  const crCard = crStarted
    ? careerReadinessProgress(
        crAptitude.result != null,
        crProgress.modulesDone,
        crProgress.modulesTotal,
        crReview.state === 'approved',
        internshipDone,
      )
    : null

  // Each block of the Practice home, named, so the two layouts below are a
  // matter of order and not of two copies.
  const dmAptitudeCard = <AptitudeCard result={aptitude} />
  const dmStats = (
    <PracticeStats
      practice={practice}
      foundationDone={assessment != null}
      aptitudeDone={aptitude != null}
      project={dmReview.project}
      foundationPercent={assessment?.overall.percent ?? null}
      liveSessions={dmSessions.length}
    />
  )
  // The aptitude result decides where a new student starts: the tracks that
  // lean on their strongest aptitude come first.
  const suggested = aptitude ? suggestedTrackOrder(aptitude.scores) : []
  const strongest = aptitude ? strongestAptitude(aptitude.scores) : null
  const dmNextUp = (
    <NextUpCard practice={practice} onSelect={setSelected} suggested={suggested} suitedTo={strongest?.name} />
  )
  const dmCompletion = (
    <ProgrammeCompletion stages={dmStages}>
      <MentorReviewPanel
        programme="digital-marketing"
        practiceDone={practisedTracks.length === skillTracks.length}
        review={dmReview.review}
        state={dmReview.state}
        submissionsLeft={dmReview.submissionsLeft}
        onChange={() => void dmReview.reload()}
      />
    </ProgrammeCompletion>
  )
  const dmModes = (
    <ModePicker practice={practice} vocabLearned={vocabLearned} vocabTotal={vocabularyTerms.length} onSelect={setMode} />
  )
  const dmFoundation = (
    <FoundationCard assessment={assessment} unlock={foundationUnlock} onOpenVocabulary={() => setMode('vocabulary')} />
  )
  // After the self-paced practice: live sessions with a mentor the student and
  // mentor both agreed on.
  const dmLive = (
    <LiveMentorCard
      programme="digital-marketing"
      aptitudeDone={aptitude != null}
      aptitudeTo="/aptitude-assessment"
      sessions={dmSessions.length}
    />
  )
  const crOverview = (
    <CareerReadinessOverview progress={crProgress} project={crReview.project} liveSessions={liveSessions.length} />
  )
  const crCompletion = (
    <ProgrammeCompletion stages={crStages}>
      <MentorReviewPanel
        programme="career-readiness"
        // The project opens once the five core modules are done.
        practiceDone={crProgress.coreComplete}
        review={crReview.review}
        state={crReview.state}
        submissionsLeft={crReview.submissionsLeft}
        onChange={() => void crReview.reload()}
      />
    </ProgrammeCompletion>
  )
  const crModules = <CareerReadinessPractice progress={crProgress} />
  // Studying alongside others in the programme's own Focus Room (1 Nov 2026).
  const dmRoom = <FocusRoomsCard room={{ slug: 'digital-marketing', title: 'Digital Marketing' }} />
  const crRoom = <FocusRoomsCard room={{ slug: 'career-readiness', title: 'Global Leadership' }} />
  const crLive = (
    <LiveMentorCard
      programme="career-readiness"
      aptitudeDone={crAptitude.result != null}
      aptitudeTo="/career-readiness-assessment"
      sessions={liveSessions.length}
    />
  )

  return (
    <AppShell wide>
      {gateLoading && <p className="text-sm text-ink-600">Loading…</p>}

      {error && <MigrationError message={error} />}

      {/* Practice is locked until an aptitude assessment is taken — the
          marketing one or the personal one, the student's choice. */}
      {!gateLoading && !error && !unlocked && <StartChoice />}

      {/* A practice track is open -> run its Decision Lab. */}
      {unlocked && !error && selected && (
        <ScenarioQuiz
          trackName={skillTracks.find((t) => t.slug === selected)?.name ?? selected}
          questions={questionsForTrack(selected)}
          onBack={() => setSelected(null)}
          onSubmit={(answers) => submitTrack(selected, answers)}
        />
      )}

      {/* Practice home. Order is deliberate: where you stand, what to do next,
          then the modes — action before inventory. */}
      {unlocked && !error && !selected && mode === null && (
        <div className="space-y-5">
          {practiceLoading ? (
            <p className="text-sm text-ink-600">Loading practice…</p>
          ) : (
            <>
              {programme === null && (
                <>
                  <ProgrammeCards dm={dmCard} cr={crCard} engine={engine} onOpen={setProgramme} />
                  <FocusRoomsCard />
                  {engine !== undefined && <RecommendedProgrammes goalId={goalId} courses={recommended} />}
                </>
              )}
              {programme !== null && <ProgrammeHeader programme={programme} onBack={() => setProgramme(null)} />}

              {/* Programme 1 is everything from the aptitude assessment through the
                  Foundation assessment, all 8 tracks and vocabulary. */}
              {programme === 1 && !dmOpen && <AptitudeCard result={null} gate />}

              {/* On a computer: where you stand, then what to do. */}
              {programme === 1 && dmOpen && !phone && (
                <>
                  {dmAptitudeCard}
                  <div className="grid gap-5 lg:grid-cols-3">
                    <div className="lg:col-span-2">{dmStats}</div>
                    <div className="lg:col-span-1">{dmNextUp}</div>
                  </div>
                  {dmRoom}
                  {dmCompletion}
                  {dmModes}
                  {dmFoundation}
                  {dmLive}
                </>
              )}

              {/* On a phone the order turns round: the thing to practise now is
                  first, under the thumb, and the standing comes after it. The
                  aptitude assessment leads only while it is still to be taken. */}
              {programme === 1 && dmOpen && phone && (
                <>
                  {aptitude == null && dmAptitudeCard}
                  {dmNextUp}
                  {dmRoom}
                  {dmModes}
                  {dmFoundation}
                  {dmStats}
                  {dmCompletion}
                  {dmLive}
                  {aptitude != null && dmAptitudeCard}
                </>
              )}

              {programme === 2 && !phone && (
                <>
                  <AssessmentCard />
                  {crOverview}
                  {crRoom}
                  {crCompletion}
                  {crModules}
                  {crLive}
                </>
              )}

              {programme === 2 && phone && (
                <>
                  {crAptitude.result == null && <AssessmentCard />}
                  {crModules}
                  {crRoom}
                  {crOverview}
                  {crCompletion}
                  {crLive}
                  {crAptitude.result != null && <AssessmentCard />}
                </>
              )}
            </>
          )}
        </div>
      )}

      {/* Scenario mode — the full track list lives here. */}
      {unlocked && !error && !selected && mode === 'scenario' && (
        <div className="space-y-5">
          <button
            type="button"
            onClick={() => setMode(null)}
            className="group inline-flex items-center gap-1.5 text-sm font-medium text-ink-600 transition-colors hover:text-ink-900"
          >
            <ArrowLeft size={16} className="transition-transform duration-300 group-hover:-translate-x-1" /> All practice modes
          </button>

          <PageHeader
            className="mb-1"
            eyebrow="Practice"
            title="Scenario Based"
            description="Decision Labs — real business situations, one skill track at a time."
            leading={
              <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-brand-500 to-brand-700 text-white shadow-md ring-4 ring-ink-100">
                <Target size={24} />
              </span>
            }
          />

          {practiceLoading ? (
            <p className="text-sm text-ink-600">Loading practice…</p>
          ) : (
            <TrackList practice={practice} onSelect={setSelected} suited={strongest?.tracks ?? []} />
          )}
        </div>
      )}

      {/* Vocabulary Builder — pick a level, then a multiple-choice round
          through that level's terms. */}
      {unlocked && !error && !selected && mode === 'vocabulary' && vocabLevel === null && (
        <div className="space-y-5">
          <button
            type="button"
            onClick={() => setMode(null)}
            className="group inline-flex items-center gap-1.5 text-sm font-medium text-ink-600 transition-colors hover:text-ink-900"
          >
            <ArrowLeft size={16} className="transition-transform duration-300 group-hover:-translate-x-1" /> All practice modes
          </button>

          <PageHeader
            className="mb-1"
            eyebrow="Practice"
            title="Vocabulary Builder"
            description="Choose a level to practice."
            leading={
              <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-sky-500 to-brand-600 text-white shadow-md ring-4 ring-ink-100">
                <Brain size={24} />
              </span>
            }
          />

          <VocabLevelPicker
            rows={[
              {
                level: 'beginner',
                label: 'Beginner',
                description: 'The terms you run into first — CTR, SEO, KPI, and the rest of the basics.',
                learned: beginnerLearned,
                total: beginnerTerms.length,
              },
              {
                level: 'advanced',
                label: 'Advanced',
                description: 'The nuanced ones — attribution windows, churn rate, domain authority.',
                learned: advancedLearned,
                total: advancedTerms.length,
                locked: advancedLocked,
                lockedHint: `Reach ${VOCAB_UNLOCK_PERCENT}% in Beginner to unlock`,
              },
            ]}
            onSelect={setVocabLevel}
          />
        </div>
      )}

      {unlocked && !error && !selected && mode === 'vocabulary' && vocabLevel !== null && (
        <VocabularyQuiz
          bank={vocabularyTerms.filter((t) => t.level === vocabLevel)}
          learnedIds={vocabLearnedIds}
          backLabel={vocabLevel === 'beginner' ? 'Beginner' : 'Advanced'}
          onBack={() => setVocabLevel(null)}
          onTermLearned={markVocabLearned}
        />
      )}
    </AppShell>
  )
}
