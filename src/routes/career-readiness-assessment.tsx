import { useEffect, useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { Loader2 } from 'lucide-react'
import { requireOnboarded } from '@/lib/guards'
import { errorMessage } from '@/lib/errors'
import { rememberProgramme } from '@/lib/practiceProgramme'
import { trackCareerAssessmentComplete } from '@/lib/analytics'
import {
  fetchAssessmentQuestions,
  submitAssessment,
  useMyAssessmentResult,
  type AssessmentQuestion,
} from '@/lib/careerReadinessAssessment'
import { AssessmentResult } from '@/components/career-readiness/AssessmentResult'
import { DarkError, DarkShell } from '@/components/self-assessment/DarkShell'
import { SelfAssessmentQuiz, type QuizCopy } from '@/components/self-assessment/Quiz'

// Not in PAGE_SEO on purpose — it's behind sign-in.
export const Route = createFileRoute('/career-readiness-assessment')({
  beforeLoad: requireOnboarded,
  component: CareerReadinessAssessmentPage,
})

const COPY: QuizCopy = {
  // Kept from before the quiz was shared, so a half-finished draft survives.
  draftPrefix: 'myskills.careerAssessmentDraft',
  intro:
    'You’ll see one statement at a time. Say how often it’s true for you — it’s a starting point, not a test, so answer as you really are. It doesn’t change your Career Readiness Score.',
  closing: {
    title: 'Which one skill would you most like to get better at?',
    hint: 'In your own words. It’s optional and isn’t scored — a mentor will see it when they review your progress.',
    placeholder: 'e.g. Speaking up in meetings without freezing…',
    ariaLabel: 'The skill you most want to improve',
  },
}

function CareerReadinessAssessmentPage() {
  const { result, loading, setResult } = useMyAssessmentResult()
  // "Back to Practice" returns to this programme's tab.
  useEffect(() => rememberProgramme(2), [])
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
    <DarkShell
      back={{ to: '/practice', label: 'Back to Practice' }}
      eyebrow="Career Readiness"
      title={taken ? 'Your personal aptitude' : 'Personal aptitude assessment'}
      description={
        taken
          ? 'What you told us about how you work today, and where the programme can help most.'
          : 'A quick, honest look at the five skills the programme builds — goal setting, communication, leadership, agile working and a growth mindset.'
      }
    >
      {error && <DarkError title="The assessment isn’t available right now." message={error} />}

      {(loading || (!result && !questions && !error)) && (
        <p className="flex items-center gap-2 text-sm text-white/60">
          <Loader2 size={15} className="animate-spin" /> Loading…
        </p>
      )}

      {result && <AssessmentResult result={result} />}

      {!result && questions && questions.length > 0 && (
        <SelfAssessmentQuiz
          questions={questions}
          copy={COPY}
          onSubmit={async (answers, reflection) => {
            const r = await submitAssessment(answers, reflection)
            trackCareerAssessmentComplete()
            setResult(r)
            window.scrollTo({ top: 0 })
          }}
        />
      )}
    </DarkShell>
  )
}
