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
import { AptitudeCard } from '@/components/aptitude/AptitudeCard'
import { useMyAptitudeResult } from '@/lib/dmAptitude'
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
  completionStages,
  DIGITAL_MARKETING,
} from '@/lib/programmes'
import { CareerReadinessPractice } from '@/components/practice/CareerReadinessPractice'
import { CareerReadinessOverview } from '@/components/practice/CareerReadinessOverview'
import { ProgrammeCompletion } from '@/components/practice/ProgrammeCompletion'
import { MentorReviewPanel } from '@/components/practice/MentorReviewPanel'
import { useMentorReview } from '@/lib/mentorReview'
import { useCareerReadinessProgress } from '@/lib/careerReadinessProgramme'
import { useMyLiveSessions } from '@/lib/liveSessions'
import { rememberProgramme, savedProgramme, type Programme } from '@/lib/practiceProgramme'

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

/** The two programmes, side by side: one tap switches between them. Only the
 *  chosen programme's content is on the page, so neither buries the other. */
function ProgrammeTabs({ active, onChange }: { active: Programme; onChange: (p: Programme) => void }) {
  const items: { step: Programme; name: string }[] = [
    { step: 1, name: DIGITAL_MARKETING.name },
    { step: 2, name: CAREER_READINESS.name },
  ]
  return (
    <div role="tablist" aria-label="Programmes" className="grid grid-cols-2 gap-3">
      {items.map((it) => {
        const on = it.step === active
        return (
          <button
            key={it.step}
            type="button"
            role="tab"
            aria-selected={on}
            onClick={() => onChange(it.step)}
            className={`press flex min-w-0 items-center gap-3 rounded-2xl border p-3.5 text-left transition-colors sm:p-4 ${
              on
                ? 'border-ink-900 bg-ink-900 text-white shadow-e2'
                : 'border-ink-900/10 bg-white text-ink-900 hover:border-ink-900/25'
            }`}
          >
            <span
              className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full font-display text-sm font-semibold ${
                on ? 'bg-white text-ink-900' : 'bg-ink-900 text-white'
              }`}
            >
              {it.step}
            </span>
            <span className="min-w-0 font-display text-sm font-semibold leading-snug sm:text-base">{it.name}</span>
          </button>
        )
      })}
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
  const unlocked = aptitude != null || assessment != null
  const gateLoading = assessmentLoading || aptitudeLoading

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
  const [programme, setProgramme] = useState<Programme>(savedProgramme)

  function chooseProgramme(p: Programme) {
    setProgramme(p)
    rememberProgramme(p)
  }


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

  // Platform internships aren't built yet, so no programme can show
  // Complete; the mentor review is real for Digital Marketing.
  const practisedTracks = skillTracks.filter((t) => practice[t.slug])
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
    internshipDone: false,
  })
  const crStages = completionStages({
    practiceDone: crProgress.complete,
    practiceStarted: crProgress.started,
    practiceDetail: crProgress.started
      ? `${crProgress.modulesDone} of ${crProgress.modulesTotal} modules finished`
      : `Finish all ${crProgress.modulesTotal} modules`,
    mentorReview: crReview.state,
    internshipDone: false,
  })

  return (
    <AppShell wide>
      {gateLoading && <p className="text-sm text-ink-600">Loading…</p>}

      {error && <MigrationError message={error} />}

      {/* Practice is locked until the aptitude assessment is taken. */}
      {!gateLoading && !error && !unlocked && (
        <div className="space-y-5">
          <AptitudeCard result={null} gate />
        </div>
      )}

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
              <ProgrammeTabs active={programme} onChange={chooseProgramme} />

              {/* Programme 1 is everything from the aptitude assessment through the
                  Foundation assessment, all 8 tracks and vocabulary. */}
              {programme === 1 && (
                <>
                  <AptitudeCard result={aptitude} />

                  <div className="grid gap-5 lg:grid-cols-3">
                    <div className="lg:col-span-2">
                      <PracticeStats
                        practice={practice}
                        foundationDone={assessment != null}
                        mentorApproved={dmReview.state === 'approved'}
                        foundationPercent={assessment?.overall.percent ?? null}
                        liveSessions={dmSessions.length}
                      />
                    </div>
                    <div className="lg:col-span-1">
                      <NextUpCard practice={practice} onSelect={setSelected} />
                    </div>
                  </div>

                  <ProgrammeCompletion stages={dmStages}>
                    <MentorReviewPanel
                      programme="digital-marketing"
                      practiceDone={practisedTracks.length === skillTracks.length}
                      review={dmReview.review}
                      state={dmReview.state}
                      onChange={() => void dmReview.reload()}
                    />
                  </ProgrammeCompletion>

                  <ModePicker
                    practice={practice}
                    vocabLearned={vocabLearned}
                    vocabTotal={vocabularyTerms.length}
                    onSelect={setMode}
                  />

                  <FoundationCard
                    assessment={assessment}
                    unlock={foundationUnlock}
                    onOpenVocabulary={() => setMode('vocabulary')}
                  />
                </>
              )}

              {programme === 2 && (
                <>
                  <AssessmentCard />
                  <CareerReadinessOverview
                    progress={crProgress}
                    mentorApproved={crReview.state === 'approved'}
                    liveSessions={liveSessions.length}
                  />
                  <ProgrammeCompletion stages={crStages}>
                    <MentorReviewPanel
                      programme="career-readiness"
                      practiceDone={crProgress.complete}
                      review={crReview.review}
                      state={crReview.state}
                      onChange={() => void crReview.reload()}
                    />
                  </ProgrammeCompletion>
                  <CareerReadinessPractice progress={crProgress} />
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
            <TrackList practice={practice} onSelect={setSelected} />
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
