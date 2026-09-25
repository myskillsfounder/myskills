import { useEffect, useState } from 'react'
import { createFileRoute, Link } from '@tanstack/react-router'
import { ArrowLeft, Loader2 } from 'lucide-react'
import { requireOnboarded } from '@/lib/guards'
import { errorMessage } from '@/lib/errors'
import { trackCareerAssessmentComplete } from '@/lib/analytics'
import {
  fetchAssessmentQuestions,
  submitAssessment,
  useMyAssessmentResult,
  type AssessmentQuestion,
} from '@/lib/careerReadinessAssessment'
import { AppShell } from '@/components/app/AppShell'
import { PageHeader } from '@/components/app/PageHeader'
import { AssessmentQuiz } from '@/components/career-readiness/AssessmentQuiz'
import { AssessmentResult } from '@/components/career-readiness/AssessmentResult'
import { Alert } from '@/components/ui'

// Not in PAGE_SEO on purpose — it's behind sign-in, and the programme it
// belongs to isn't live yet (see career-readiness.tsx).
export const Route = createFileRoute('/career-readiness-assessment')({
  beforeLoad: requireOnboarded,
  component: CareerReadinessAssessmentPage,
})

function CareerReadinessAssessmentPage() {
  const { result, loading, setResult } = useMyAssessmentResult()
  const [questions, setQuestions] = useState<AssessmentQuestion[] | null>(null)
  const [error, setError] = useState<string>()

  // Only fetch the statements once we know the learner hasn't taken it.
  useEffect(() => {
    if (loading || result) return
    let active = true
    fetchAssessmentQuestions()
      .then((q) => active && setQuestions(q))
      .catch((e) => active && setError(errorMessage(e)))
    return () => {
      active = false
    }
  }, [loading, result])

  const taken = Boolean(result)

  return (
    <AppShell>
      <Link
        to="/practice"
        className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-ink-600 hover:text-ink-900"
      >
        <ArrowLeft size={16} /> Back to Practice
      </Link>

      <PageHeader
        eyebrow="Career Readiness"
        title={taken ? 'Your starting point' : 'Initial assessment'}
        description={
          taken
            ? 'What you told us about how you work today, and where the programme can help most.'
            : 'A quick, honest look at the five skills the programme builds — goal setting, communication, leadership, agile working and a growth mindset.'
        }
      />

      {error && (
        <Alert tone="danger" title="The assessment isn’t available right now">
          <p>{error}</p>
        </Alert>
      )}

      {(loading || (!result && !questions && !error)) && (
        <p className="flex items-center gap-2 text-sm text-ink-600">
          <Loader2 size={15} className="animate-spin" /> Loading…
        </p>
      )}

      {result && <AssessmentResult result={result} />}

      {!result && questions && questions.length > 0 && (
        <AssessmentQuiz
          questions={questions}
          onSubmit={async (answers, reflection) => {
            const r = await submitAssessment(answers, reflection)
            trackCareerAssessmentComplete()
            setResult(r)
            window.scrollTo({ top: 0 })
          }}
        />
      )}
    </AppShell>
  )
}
