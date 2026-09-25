import { useEffect, useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { Loader2 } from 'lucide-react'
import { requireOnboarded } from '@/lib/guards'
import { errorMessage } from '@/lib/errors'
import { useInitialAssessment } from '@/lib/assessmentResults'
import { fetchInitialAssessmentQuestions, type QuizQuestion } from '@/lib/initialAssessment'
import { useFoundationUnlock } from '@/lib/foundation'
import { AssessmentQuiz } from '@/components/assessment/AssessmentQuiz'
import { FoundationLock } from '@/components/assessment/FoundationLock'
import { FoundationResult } from '@/components/assessment/FoundationResult'
import { DarkError, DarkShell } from '@/components/self-assessment/DarkShell'

// Not in PAGE_SEO on purpose — it's behind sign-in.
export const Route = createFileRoute('/foundation-assessment')({
  beforeLoad: requireOnboarded,
  component: FoundationAssessmentPage,
})

/**
 * The Foundation assessment — the old initial assessment, now the second step
 * of Digital Marketing. Three states: already taken (the results and the
 * certificate), locked (vocabulary isn't far enough along), or the quiz.
 */
function FoundationAssessmentPage() {
  const { result, loading, error: resultError, submit, commit } = useInitialAssessment()
  const unlock = useFoundationUnlock()
  const [questions, setQuestions] = useState<QuizQuestion[] | null>(null)
  const [questionsError, setQuestionsError] = useState<string>()
  // Grading finishes inside the quiz, which then shows the answer review. Only
  // once that's dismissed do we commit and swap to the results view.
  const error = resultError ?? questionsError

  const canTake = !loading && !result && unlock.unlocked

  useEffect(() => {
    if (!canTake || questions) return
    let active = true
    fetchInitialAssessmentQuestions()
      .then((q) => active && setQuestions(q))
      .catch((e) => active && setQuestionsError(errorMessage(e)))
    return () => {
      active = false
    }
  }, [canTake, questions])

  const taken = Boolean(result)

  return (
    <DarkShell
      back={{ to: '/practice', label: 'Back to Practice' }}
      eyebrow="Digital Marketing"
      title={taken ? 'Your foundational progress' : 'Foundation assessment'}
      description={
        taken
          ? 'How you did on the fundamentals, and the certificate it earned.'
          : 'Step two: test what you know across the core areas of digital marketing. One attempt, no time limit, and a certificate at the end.'
      }
    >
      {error && <DarkError title="The assessment isn’t available right now." message={error} />}

      {loading && (
        <p className="flex items-center gap-2 text-sm text-white/60">
          <Loader2 size={15} className="animate-spin" /> Loading…
        </p>
      )}

      {!loading && result && <FoundationResult assessment={result} />}

      {!loading && !result && !unlock.unlocked && <FoundationLock unlock={unlock} />}

      {canTake && !questions && !error && (
        <p className="flex items-center gap-2 text-sm text-white/60">
          <Loader2 size={15} className="animate-spin" /> Loading questions…
        </p>
      )}

      {canTake && questions && questions.length > 0 && (
        <AssessmentQuiz
          questions={questions}
          onSubmit={submit}
          onContinue={(graded) => {
            commit(graded)
            window.scrollTo({ top: 0 })
          }}
        />
      )}
    </DarkShell>
  )
}
