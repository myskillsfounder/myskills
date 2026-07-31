import { useEffect, useState } from 'react'
import { createFileRoute, Link } from '@tanstack/react-router'
import { Award, ChevronRight } from 'lucide-react'
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
      className={`flex items-center gap-2.5 rounded-full border py-1.5 pl-2.5 pr-2 transition-colors ${tier.ui.border} ${tier.ui.bg}`}
    >
      <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white ${tier.ui.icon}`}>
        <Award size={13} />
      </span>
      <span className={`text-xs font-semibold ${tier.ui.textStrong}`}>{tier.label} certificate</span>
      <ChevronRight size={14} className={tier.ui.textSoft} />
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

      {/* Practice home. Order is deliberate: where you stand, what to do next,
          then the full list — action before inventory. */}
      {assessment && !error && !selected && (
        <div className="space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h1 className="text-2xl font-semibold tracking-tight text-ink-900">Practice</h1>
            <CertificateRow percent={assessment.overall.percent} />
          </div>

          {practiceLoading ? (
            <p className="text-sm text-ink-500">Loading practice…</p>
          ) : (
            <>
              <div className="grid gap-5 lg:grid-cols-3 lg:items-start">
                <div className="lg:col-span-2">
                  <PracticeStats practice={practice} />
                </div>
                <div className="lg:col-span-1">
                  <NextUpCard practice={practice} onSelect={setSelected} />
                </div>
              </div>

              <TrackList practice={practice} onSelect={setSelected} />

              <AssessmentSummaryCard assessment={assessment} />
            </>
          )}
        </div>
      )}
    </AppShell>
  )
}
