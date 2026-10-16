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
  // A new key for the profile, so a half-finished draft of the earlier
  // version's statements can't be mixed into it.
  draftPrefix: 'myskills.lifeSkillsDraft',
  intro:
    'You’ll see one statement at a time. Say how often it’s true for you — it’s a starting point, not a test, so answer as you really are. It doesn’t change your Global Readiness Score, and only you and your mentor see it.',
  closing: {
    title: 'Which one skill would you most like to get better at?',
    hint: 'In your own words. It’s optional and isn’t scored — a mentor will see it when they review your progress.',
    placeholder: 'e.g. Staying calm when I’m criticised…',
    ariaLabel: 'The skill you most want to improve',
  },
}

function CareerReadinessAssessmentPage() {
  const { result, loading, setResult } = useMyAssessmentResult()
  // "Back to Practice" returns to this programme's tab.
  useEffect(() => rememberProgramme(2), [])
  const [questions, setQuestions] = useState<AssessmentQuestion[] | null>(null)
  const [error, setError] = useState<string>()

  // Only fetch the statements once we know the learner hasn't taken it: one
  // attempt each (everyone's earlier results were cleared when this test
  // started, docs/supabase-leadership-test-reset.sql).
  useEffect(() => {
    if (loading || result) return
    let active = true
    fetchAssessmentQuestions()
      .then((q) => active && setQuestions(q.questions))
      .catch((e) => active && setError(errorMessage(e)))
    return () => {
      active = false
    }
  }, [loading, result])

  const taken = Boolean(result)

  return (
    <DarkShell
      back={{ to: '/practice', label: 'Back to Practice' }}
      eyebrow="Global Leadership"
      title={taken ? 'Your leadership aptitude' : 'Leadership Aptitude Test'}
      description={
        taken
          ? 'What you told us about how you work and relate to people today, and where the programme can help most.'
          : 'A quick, honest look at the 14 skills the Global Leadership Programme builds: self-awareness, empathy, critical and creative thinking, decision-making, problem-solving, communication, relationships, coping with stress and emotions, goal setting, leadership, agile working and a growth mindset.'
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
