import { useEffect, useState } from 'react'
import { createFileRoute, Link } from '@tanstack/react-router'
import { Lock } from 'lucide-react'
import { requireOnboarded } from '@/lib/guards'
import { useInitialAssessment } from '@/lib/assessmentResults'
import { fetchTestSummary, recordTestAttempt, type TestSummary } from '@/lib/testResults'
import { buildTest, type TestGrade } from '@/lib/tests'
import { skillTracks } from '@/lib/skillTracks'
import type { ScenarioQuestion } from '@/lib/decisionLabs'
import { AppShell } from '@/components/app/AppShell'
import { TestPicker } from '@/components/tests/TestPicker'
import { TestRunner } from '@/components/tests/TestRunner'

export const Route = createFileRoute('/tests')({
  beforeLoad: requireOnboarded,
  component: TestsPage,
})

function TestsPage() {
  const { result: assessment, loading: assessmentLoading } = useInitialAssessment()
  const [tests, setTests] = useState<TestSummary>({})
  const [testsLoading, setTestsLoading] = useState(true)
  const [error, setError] = useState<string>()
  const [active, setActive] = useState<{ slug: string; questions: ScenarioQuestion[] } | null>(null)

  useEffect(() => {
    if (assessmentLoading) return
    if (!assessment) {
      setTestsLoading(false)
      return
    }
    fetchTestSummary()
      .then(setTests)
      .catch((e) => setError(e instanceof Error ? e.message : String(e)))
      .finally(() => setTestsLoading(false))
  }, [assessment, assessmentLoading])

  async function completeTest(slug: string, grade: TestGrade) {
    await recordTestAttempt(slug, grade)
    setTests(await fetchTestSummary())
  }

  const trackName = (slug: string) => skillTracks.find((t) => t.slug === slug)?.name ?? slug

  return (
    <AppShell wide>
      {assessmentLoading && <p className="text-sm text-ink-500">Loading…</p>}

      {error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-5 text-sm text-red-700">
          <p className="font-semibold">Couldn’t load tests.</p>
          <p className="mt-1">{error}</p>
          <p className="mt-2 text-red-600">First run? Apply <code className="rounded bg-red-100 px-1">docs/supabase-tests.sql</code> in Supabase.</p>
        </div>
      )}

      {/* Gate on the initial assessment, like practice. */}
      {!assessmentLoading && !error && !assessment && (
        <div className="rounded-2xl border border-dashed border-ink-200 bg-white p-10 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-ink-100 text-ink-400">
            <Lock size={22} />
          </div>
          <h1 className="mt-4 text-xl font-semibold text-ink-900">Tests are locked</h1>
          <p className="mt-1 text-sm text-ink-500">
            Complete your initial assessment first to unlock timed tests.
          </p>
          <Link
            to="/practice"
            className="mt-4 inline-flex items-center rounded-full bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700"
          >
            Go to assessment
          </Link>
        </div>
      )}

      {/* A test is running */}
      {assessment && !error && active && (
        <TestRunner
          trackName={trackName(active.slug)}
          questions={active.questions}
          onBack={() => setActive(null)}
          onComplete={(grade) => completeTest(active.slug, grade)}
        />
      )}

      {/* Test picker */}
      {assessment && !error && !active && (
        testsLoading ? (
          <p className="text-sm text-ink-500">Loading tests…</p>
        ) : (
          <TestPicker
            tests={tests}
            onStart={(slug) => setActive({ slug, questions: buildTest(slug) })}
          />
        )
      )}
    </AppShell>
  )
}
