import { useEffect, useState } from 'react'
import { errorMessage } from '@/lib/errors'
import { createFileRoute, Link } from '@tanstack/react-router'
import { ArrowLeft, Award, Brain, ChevronRight, Target } from 'lucide-react'
import { requireOnboarded } from '@/lib/guards'
import { useAuthUser } from '@/lib/useAuth'
import { useInitialAssessment } from '@/lib/assessmentResults'
import { tierForPercent } from '@/lib/certificates'
import {
  fetchPracticeSummary,
  recordPracticeAttempt,
  type PracticeSummary,
} from '@/lib/practiceResults'
import { fetchInitialAssessmentQuestions, type QuizQuestion } from '@/lib/initialAssessment'
import { questionsForTrack, type ScenarioGrade } from '@/lib/decisionLabs'
import { skillTracks } from '@/lib/skillTracks'
import { vocabularyTerms, type VocabLevel } from '@/lib/vocabulary'
import { useVocabProgress } from '@/lib/vocabularyProgress'
import { AppShell } from '@/components/app/AppShell'
import { PageHeader } from '@/components/app/PageHeader'
import { AssessmentCard } from '@/components/career-readiness/AssessmentCard'
import { AssessmentQuiz } from '@/components/assessment/AssessmentQuiz'
import { AptitudeCard } from '@/components/aptitude/AptitudeCard'
import { useMyAptitudeResult } from '@/lib/dmAptitude'
import { AssessmentSummaryCard } from '@/components/assessment/AssessmentSummaryCard'
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
  PERSONAL_DEVELOPMENT_MODULES,
} from '@/lib/programmes'
import { CareerReadinessPractice } from '@/components/practice/CareerReadinessPractice'
import { CareerReadinessOverview } from '@/components/practice/CareerReadinessOverview'
import { ProgrammeCompletion } from '@/components/practice/ProgrammeCompletion'
import { MentorReviewPanel } from '@/components/practice/MentorReviewPanel'
import { useMentorReview } from '@/lib/mentorReview'

export const Route = createFileRoute('/practice')({
  beforeLoad: requireOnboarded,
  component: PracticePage,
})

/** How much of Beginner has to be learned before Advanced opens up. A real
 *  lock, not just a visual nudge — the two levels used to sit as equal,
 *  independent cards with nothing steering anyone through the basics
 *  first. */
const ADVANCED_UNLOCK_PERCENT = 70

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

/**
 * The certificate used to be a full-width banner at the very top, pushing the
 * actual practice content below the fold. It's a reward you've already earned,
 * not a task — so it's now a single quiet row in the page header.
 */
function CertificateRow({ percent }: { percent: number }) {
  const tier = tierForPercent(percent)
  return (
    <Link
      to="/certificate"
      className={`group rise-in flex items-center gap-2.5 rounded-full border py-2 pl-3 pr-2.5 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md ${tier.ui.border} ${tier.ui.bg}`}
    >
      <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white shadow-sm ${tier.ui.icon}`}>
        <Award size={14} />
      </span>
      <span className={`text-sm font-semibold ${tier.ui.textStrong}`}>{tier.label} certificate</span>
      <ChevronRight
        size={15}
        className={`${tier.ui.textSoft} transition-transform duration-300 group-hover:translate-x-0.5`}
      />
    </Link>
  )
}

/** Labels which programme the section below belongs to. Both programmes use
 *  the same heading, score row and grid, so the page reads as two parallel
 *  sections rather than one long list. */
function ProgrammeHeading({
  step,
  name,
  title,
  subtitle,
  status,
  live,
}: {
  step: number
  name: string
  title: string
  subtitle: string
  status: string
  live: boolean
}) {
  return (
    <div className="flex items-start gap-3.5 border-t border-ink-900/[0.06] pt-6">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-ink-900 font-display text-sm font-semibold text-white">
        {step}
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-brand-700">{name}</p>
          <span
            className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-semibold ${
              live ? 'bg-emerald-50 text-emerald-700' : 'bg-ink-100 text-ink-600'
            }`}
          >
            <span className={`h-1.5 w-1.5 rounded-full ${live ? 'bg-emerald-500' : 'bg-ink-400'}`} />
            {status}
          </span>
        </div>
        <h2 className="mt-1 font-display text-2xl font-semibold tracking-tight text-ink-900">{title}</h2>
        <p className="mt-1 max-w-2xl text-sm leading-relaxed text-ink-600">{subtitle}</p>
      </div>
    </div>
  )
}

function PracticePage() {
  const {
    result: assessment,
    loading: assessmentLoading,
    error: assessmentError,
    submit,
    commit,
  } = useInitialAssessment()

  // The aptitude assessment is step 1 and unlocks Practice. Anyone who already
  // finished the Foundation assessment (the old initial assessment) before it
  // existed keeps their access rather than being sent back to the start.
  const { result: aptitude, loading: aptitudeLoading } = useMyAptitudeResult()
  const unlocked = aptitude != null || assessment != null
  const gateLoading = assessmentLoading || aptitudeLoading
  const [showFoundation, setShowFoundation] = useState(false)

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
  const advancedLocked = beginnerPercent < ADVANCED_UNLOCK_PERCENT

  const [practice, setPractice] = useState<PracticeSummary>({})
  const [practiceLoading, setPracticeLoading] = useState(true)
  const [practiceError, setPracticeError] = useState<string>()
  const [selected, setSelected] = useState<string | null>(null)
  const [mode, setMode] = useState<PracticeMode | null>(null)
  const [vocabLevel, setVocabLevel] = useState<VocabLevel | null>(null)

  const [quizQuestions, setQuizQuestions] = useState<QuizQuestion[]>([])
  const [quizQuestionsError, setQuizQuestionsError] = useState<string>()

  // Practice data loads as soon as Practice is unlocked, not only once the
  // Foundation assessment is done.
  useEffect(() => {
    if (!unlocked) return
    fetchPracticeSummary()
      .then(setPractice)
      .catch((e) => setPracticeError(errorMessage(e)))
      .finally(() => setPracticeLoading(false))
  }, [unlocked])

  // The Foundation questions are only needed once someone opens that quiz.
  useEffect(() => {
    if (!showFoundation || assessment || quizQuestions.length > 0) return
    fetchInitialAssessmentQuestions()
      .then(setQuizQuestions)
      .catch((e) => setQuizQuestionsError(errorMessage(e)))
  }, [showFoundation, assessment, quizQuestions.length])

  async function completeTrack(track: string, grade: ScenarioGrade) {
    await recordPracticeAttempt(track, grade)
    setPractice(await fetchPracticeSummary())
    // Return to the practice home so the user sees their updated progress.
    setSelected(null)
  }

  const error = assessmentError ?? practiceError ?? quizQuestionsError
  const dmReview = useMentorReview('digital-marketing')

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
    practiceDone: false,
    practiceStarted: false,
    practiceDetail: `All ${PERSONAL_DEVELOPMENT_MODULES.length} modules — opens with the programme`,
    mentorReview: 'none',
    internshipDone: false,
  })

  return (
    <AppShell wide>
      {gateLoading && <p className="text-sm text-ink-600">Loading…</p>}

      {error && <MigrationError message={error} />}

      {/* Practice is locked until the aptitude assessment is taken. */}
      {!gateLoading && !error && !unlocked && (
        <div className="space-y-5">
          <PageHeader
            className="mb-1"
            eyebrow="Programmes"
            title="Practice"
            description="Two programmes, one place to practise: your digital marketing skills, and personal development with AI."
          />
          <AptitudeCard result={null} gate />
        </div>
      )}

      {/* The Foundation assessment (the old initial assessment), opened from
          the card on the practice home. */}
      {unlocked && !error && !assessment && showFoundation && quizQuestions.length === 0 && (
        <p className="text-sm text-ink-600">Loading questions…</p>
      )}
      {unlocked && !error && !assessment && showFoundation && quizQuestions.length > 0 && (
        <div>
          <button
            type="button"
            onClick={() => setShowFoundation(false)}
            className="group mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-ink-600 transition-colors hover:text-ink-900"
          >
            <ArrowLeft size={16} className="transition-transform duration-300 group-hover:-translate-x-1" /> Back to Practice
          </button>
          <PageHeader
            eyebrow="Practice"
            title="Foundation assessment"
            description={
              <>
                Answer {quizQuestions.length} quick questions on the fundamentals across all skill
                tracks. You get one attempt, so take your time — there’s no time limit.
              </>
            }
          />
          <AssessmentQuiz
            questions={quizQuestions}
            onSubmit={submit}
            onContinue={(r) => {
              commit(r)
              setShowFoundation(false)
            }}
          />
        </div>
      )}

      {/* A practice track is open -> run its Decision Lab. */}
      {unlocked && !error && selected && (
        <ScenarioQuiz
          trackName={skillTracks.find((t) => t.slug === selected)?.name ?? selected}
          questions={questionsForTrack(selected)}
          onBack={() => setSelected(null)}
          onComplete={(grade) => completeTrack(selected, grade)}
        />
      )}

      {/* Practice home. Order is deliberate: where you stand, what to do next,
          then the modes — action before inventory. */}
      {unlocked && !error && !selected && mode === null && !showFoundation && (
        <div className="space-y-5">
          <PageHeader
            className="mb-1"
            eyebrow="Programmes"
            title="Practice"
            description="Two programmes, one place to practise: your digital marketing skills, and personal development with AI."
            actions={assessment ? <CertificateRow percent={assessment.overall.percent} /> : undefined}
          />

          {practiceLoading ? (
            <p className="text-sm text-ink-600">Loading practice…</p>
          ) : (
            <>
              {/* Everything above the Career Readiness heading is the Digital
                  Marketing Programme: the assessment, all 8 tracks, vocabulary
                  and the certificate. */}
              <ProgrammeHeading
                step={1}
                name={DIGITAL_MARKETING.name}
                status="In progress"
                live
                title="Your digital marketing skills"
                subtitle="Real scenarios, the language marketers use, and the numbers behind every campaign."
              />

              <AptitudeCard result={aptitude} />

              <div className="grid gap-5 lg:grid-cols-3">
                <div className="lg:col-span-2">
                  <PracticeStats practice={practice} />
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

              {assessment ? (
                <AssessmentSummaryCard assessment={assessment} />
              ) : (
                <section className="surface-wood-dark rise-in relative flex flex-col gap-4 overflow-hidden rounded-2xl p-5 shadow-e2 sm:flex-row sm:items-center sm:justify-between sm:p-6">
                  <div className="min-w-0">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/60">Foundation assessment</p>
                    <h3 className="mt-1.5 font-display text-2xl font-semibold leading-tight text-white">
                      Test what you know
                    </h3>
                    <p className="mt-1.5 max-w-xl text-xs leading-relaxed text-white/70 sm:text-sm">
                      One attempt across all skill tracks, and the certificate for your foundational progress.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowFoundation(true)}
                    className="press inline-flex shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-ink-900 shadow-e2 transition-colors hover:bg-brand-50"
                  >
                    Take the assessment
                  </button>
                </section>
              )}

              <div className="pt-4">
                <ProgrammeHeading
                  step={2}
                  name={CAREER_READINESS.name}
                  status="Opens soon"
                  live={false}
                  title="Personal development with AI"
                  subtitle="Five modules — goal setting, communication, leadership, agile methodology and a growth mindset. AI is your practice partner; people give the feedback."
                />
              </div>
              <AssessmentCard />
              <CareerReadinessOverview />
              <ProgrammeCompletion stages={crStages} />
              <CareerReadinessPractice />
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
                lockedHint: `Reach ${ADVANCED_UNLOCK_PERCENT}% in Beginner to unlock`,
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
