import { useEffect, useState } from 'react'
import { createFileRoute, Link } from '@tanstack/react-router'
import { ArrowLeft, Award, ChevronRight, Target } from 'lucide-react'
import { requireOnboarded } from '@/lib/guards'
import { useInitialAssessment } from '@/lib/assessmentResults'
import { tierForPercent } from '@/lib/certificates'
import {
  fetchPracticeSummary,
  recordPracticeAttempt,
  type PracticeSummary,
} from '@/lib/practiceResults'
import { initialAssessmentQuestions, type AssessmentGrade } from '@/lib/initialAssessment'
import { questionsForTrack, type ScenarioGrade } from '@/lib/decisionLabs'
import { skillTracks } from '@/lib/skillTracks'
import { AppShell } from '@/components/app/AppShell'
import { AssessmentQuiz } from '@/components/assessment/AssessmentQuiz'
import { AssessmentSummaryCard } from '@/components/assessment/AssessmentSummaryCard'
import { PracticeStats } from '@/components/practice/PracticeStats'
import { NextUpCard } from '@/components/practice/NextUpCard'
import { TrackList } from '@/components/practice/TrackList'
import { ModePicker, type PracticeMode } from '@/components/practice/ModePicker'
import { ScenarioQuiz } from '@/components/practice/ScenarioQuiz'

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
        <code className="rounded bg-red-100 px-1">docs/supabase-next-migration.sql</code>{' '}
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

function PracticePage() {
  const {
    result: assessment,
    loading: assessmentLoading,
    error: assessmentError,
    save,
  } = useInitialAssessment()

  const [practice, setPractice] = useState<PracticeSummary>({})
  const [practiceLoading, setPracticeLoading] = useState(true)
  const [practiceError, setPracticeError] = useState<string>()
  const [selected, setSelected] = useState<string | null>(null)
  const [mode, setMode] = useState<PracticeMode | null>(null)

  useEffect(() => {
    if (assessmentLoading) return
    if (!assessment) {
      setPracticeLoading(false)
      return
    }
    fetchPracticeSummary()
      .then(setPractice)
      .catch((e) => setPracticeError(e instanceof Error ? e.message : String(e)))
      .finally(() => setPracticeLoading(false))
  }, [assessment, assessmentLoading])

  async function completeInitial(grade: AssessmentGrade) {
    await save(grade)
  }

  async function completeTrack(track: string, grade: ScenarioGrade) {
    await recordPracticeAttempt(track, grade)
    setPractice(await fetchPracticeSummary())
    // Return to the practice home so the user sees their updated progress.
    setSelected(null)
  }

  const error = assessmentError ?? practiceError

  return (
    <AppShell wide>
      {assessmentLoading && <p className="text-sm text-ink-600">Loading…</p>}

      {error && <MigrationError message={error} />}

      {/* Not taken yet -> the one-time initial assessment gates everything else. */}
      {!assessmentLoading && !error && !assessment && (
        <div>
          <div className="mb-6">
            <h1 className="font-display text-3xl font-semibold tracking-tight text-ink-900">
              Initial assessment
            </h1>
            <p className="mt-1 text-sm text-ink-600">
              Answer {initialAssessmentQuestions.length} quick questions to unlock
              scenario practice across all skill tracks. You get one attempt, so take
              your time — there’s no time limit.
            </p>
          </div>
          <AssessmentQuiz questions={initialAssessmentQuestions} onComplete={completeInitial} />
        </div>
      )}

      {/* A practice track is open -> run its Decision Lab. */}
      {assessment && !error && selected && (
        <ScenarioQuiz
          trackName={skillTracks.find((t) => t.slug === selected)?.name ?? selected}
          questions={questionsForTrack(selected)}
          onBack={() => setSelected(null)}
          onComplete={(grade) => completeTrack(selected, grade)}
        />
      )}

      {/* Practice home. Order is deliberate: where you stand, what to do next,
          then the modes — action before inventory. */}
      {assessment && !error && !selected && mode === null && (
        <div className="space-y-5">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div className="rise-in">
              <h1 className="font-display text-4xl font-semibold leading-none tracking-tight text-ink-900">
                Practice
              </h1>
              <p className="mt-2 text-sm text-ink-600">
                Sharpen your marketing skills with real-world practice.
              </p>
            </div>
            <CertificateRow percent={assessment.overall.percent} />
          </div>

          {practiceLoading ? (
            <p className="text-sm text-ink-600">Loading practice…</p>
          ) : (
            <>
              <div className="grid gap-5 lg:grid-cols-3">
                <div className="lg:col-span-2">
                  <PracticeStats practice={practice} />
                </div>
                <div className="lg:col-span-1">
                  <NextUpCard practice={practice} onSelect={setSelected} />
                </div>
              </div>

              <ModePicker practice={practice} onSelect={setMode} />

              <AssessmentSummaryCard assessment={assessment} />
            </>
          )}
        </div>
      )}

      {/* Scenario mode — the full track list lives here. */}
      {assessment && !error && !selected && mode === 'scenario' && (
        <div className="space-y-5">
          <button
            type="button"
            onClick={() => setMode(null)}
            className="group inline-flex items-center gap-1.5 text-sm font-medium text-ink-600 transition-colors hover:text-ink-900"
          >
            <ArrowLeft size={16} className="transition-transform duration-300 group-hover:-translate-x-1" /> All practice modes
          </button>

          <div className="flex items-start gap-3">
            <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-brand-500 to-brand-700 text-white shadow-md ring-4 ring-ink-100">
              <Target size={24} />
            </span>
            <div>
              <h1 className="font-display text-3xl font-semibold tracking-tight text-ink-900">Scenario Based</h1>
              <p className="mt-1 text-sm text-ink-600">
                Decision Labs — real business situations, one skill track at a time.
              </p>
            </div>
          </div>

          {practiceLoading ? (
            <p className="text-sm text-ink-600">Loading practice…</p>
          ) : (
            <TrackList practice={practice} onSelect={setSelected} />
          )}
        </div>
      )}
    </AppShell>
  )
}
