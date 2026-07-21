import { useEffect, useState } from 'react'
import { createFileRoute, Link } from '@tanstack/react-router'
import { requireOnboarded } from '@/lib/guards'
import { ArrowRight, Award } from 'lucide-react'
import { useInitialAssessment } from '@/lib/assessmentResults'
import { GOLD_THRESHOLD } from '@/lib/certificates'
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
import { PracticeOverview } from '@/components/practice/PracticeOverview'
import { TrackPicker } from '@/components/practice/TrackPicker'
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

function CertificateEarnedCard({ percent }: { percent: number }) {
  const gold = percent >= GOLD_THRESHOLD
  return (
    <div
      className={`flex flex-col gap-3 rounded-2xl border p-5 sm:flex-row sm:items-center sm:justify-between ${
        gold ? 'border-amber-200 bg-amber-50' : 'border-brand-200 bg-brand-50'
      }`}
    >
      <div className="flex items-center gap-3">
        <span
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white ${
            gold ? 'text-amber-600' : 'text-brand-600'
          }`}
        >
          <Award size={22} />
        </span>
        <div>
          <p className={`text-sm font-semibold ${gold ? 'text-amber-900' : 'text-brand-900'}`}>
            {gold ? 'Gold certificate earned! ' : 'Certificate earned! '}
            <span className="font-normal">You completed the initial assessment.</span>
          </p>
          <p className={`mt-0.5 text-xs ${gold ? 'text-amber-700' : 'text-brand-700'}`}>
            View, download, and share your certificate.
          </p>
        </div>
      </div>
      <Link
        to="/certificate"
        className={`inline-flex shrink-0 items-center justify-center gap-1.5 rounded-full px-4 py-2 text-xs font-semibold text-white transition-colors ${
          gold ? 'bg-amber-600 hover:bg-amber-700' : 'bg-brand-600 hover:bg-brand-700'
        }`}
      >
        View certificate
        <ArrowRight size={13} />
      </Link>
    </div>
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
      {assessmentLoading && <p className="text-sm text-ink-500">Loading…</p>}

      {error && <MigrationError message={error} />}

      {/* Not taken yet -> the one-time initial assessment gates everything else. */}
      {!assessmentLoading && !error && !assessment && (
        <div>
          <div className="mb-6">
            <h1 className="text-2xl font-semibold tracking-tight text-ink-900">
              Initial assessment
            </h1>
            <p className="mt-1 text-sm text-ink-500">
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

      {/* Combined home: a single progress summary, one unified track list,
          then the one-time assessment as a quiet secondary card. */}
      {assessment && !error && !selected && (
        <div className="space-y-8">
          <CertificateEarnedCard percent={assessment.overall.percent} />

          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-ink-900">Practice</h1>
            <p className="mt-1 text-sm text-ink-500">
              Scenario-based Decision Labs to sharpen each marketing skill. Your best
              score per track is what counts.
            </p>
          </div>

          {practiceLoading ? (
            <p className="text-sm text-ink-500">Loading practice…</p>
          ) : (
            <>
              <PracticeOverview practice={practice} onSelect={setSelected} />
              <TrackPicker practice={practice} onSelect={setSelected} />
              <AssessmentSummaryCard assessment={assessment} />
            </>
          )}
        </div>
      )}
    </AppShell>
  )
}
