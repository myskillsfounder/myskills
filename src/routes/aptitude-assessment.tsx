import { useEffect, useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { Loader2 } from 'lucide-react'
import { requireOnboarded } from '@/lib/guards'
import { errorMessage } from '@/lib/errors'
import { trackAptitudeComplete } from '@/lib/analytics'
import {
  fetchAptitudeQuestions,
  submitAptitude,
  useMyAptitudeResult,
  type AptitudeQuestion,
} from '@/lib/dmAptitude'
import { AptitudeResult } from '@/components/aptitude/AptitudeResult'
import { DarkError, DarkShell } from '@/components/self-assessment/DarkShell'
import { SelfAssessmentQuiz, type QuizCopy } from '@/components/self-assessment/Quiz'

// Not in PAGE_SEO on purpose — it's behind sign-in.
export const Route = createFileRoute('/aptitude-assessment')({
  beforeLoad: requireOnboarded,
  component: AptitudeAssessmentPage,
})

const COPY: QuizCopy = {
  draftPrefix: 'myskills.dmAptitudeDraft',
  intro:
    'You’ll see one statement at a time. Say how often it’s true for you — there are no right answers, so answer as you really are. Finishing it unlocks Practice.',
  closing: {
    title: 'Which part of marketing are you most curious about?',
    hint: 'In your own words. It’s optional and isn’t scored — it helps us point you at the right place to start.',
    placeholder: 'e.g. How brands make an ad go viral…',
    ariaLabel: 'The part of marketing you are most curious about',
  },
}

function AptitudeAssessmentPage() {
  const { result, loading, setResult } = useMyAptitudeResult()
  const [questions, setQuestions] = useState<AptitudeQuestion[] | null>(null)
  const [error, setError] = useState<string>()

  // Only fetch the statements once we know the learner hasn't taken it.
  useEffect(() => {
    if (loading || result) return
    let active = true
    fetchAptitudeQuestions()
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
      eyebrow="Digital Marketing"
      title={taken ? 'Your marketing aptitude' : 'Aptitude assessment'}
      description={
        taken
          ? 'What you already notice and do, and the parts of digital marketing that should come most naturally.'
          : 'Before any theory: a quick look at how you already notice ads, offers, ideas and trends — the instincts good marketers build on.'
      }
    >
      {error && <DarkError title="The assessment isn’t available right now." message={error} />}

      {(loading || (!result && !questions && !error)) && (
        <p className="flex items-center gap-2 text-sm text-white/60">
          <Loader2 size={15} className="animate-spin" /> Loading…
        </p>
      )}

      {result && <AptitudeResult result={result} />}

      {!result && questions && questions.length > 0 && (
        <SelfAssessmentQuiz
          questions={questions}
          copy={COPY}
          onSubmit={async (answers, reflection) => {
            const r = await submitAptitude(answers, reflection)
            trackAptitudeComplete()
            setResult(r)
            window.scrollTo({ top: 0 })
          }}
        />
      )}
    </DarkShell>
  )
}
