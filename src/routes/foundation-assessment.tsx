import { useEffect, useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { Loader2 } from 'lucide-react'
import { requireOnboarded } from '@/lib/guards'
import { errorMessage } from '@/lib/errors'
import { useInitialAssessment } from '@/lib/assessmentResults'
import { fetchInitialAssessmentQuestions, type QuizQuestion } from '@/lib/initialAssessment'
import { useFoundationUnlock } from '@/lib/foundation'
import { useFoundationStatus } from '@/lib/foundationPath'
import { AssessmentQuiz } from '@/components/assessment/AssessmentQuiz'
import { BenchmarkResult } from '@/components/assessment/BenchmarkResult'
import { FoundationLock } from '@/components/assessment/FoundationLock'
import { FoundationResult } from '@/components/assessment/FoundationResult'
import { PathChooser } from '@/components/assessment/PathChooser'
import { DarkError, DarkShell } from '@/components/self-assessment/DarkShell'

// Not in PAGE_SEO on purpose — it's behind sign-in.
export const Route = createFileRoute('/foundation-assessment')({
  beforeLoad: requireOnboarded,
  component: FoundationAssessmentPage,
})

/**
 * The Foundation assessment: the benchmark for Digital Marketing.
 *   - Taken: the results and the certificate.
 *   - Beginner (or no choice yet): opens once the Beginner vocabulary is
 *     learned, as before.
 *   - Experienced: open straight away. Under 60% it's a benchmark; the next
 *     attempt opens once the gap tracks are practised (or, while the
 *     questions carry no skill, the Beginner vocabulary is learned).
 * Before docs/supabase-foundation-certificates.sql is run, the status can't
 * be read and the page works as it always did.
 */
function FoundationAssessmentPage() {
  const { result, loading, error: resultError, submit, commit } = useInitialAssessment()
  const unlock = useFoundationUnlock()
  const { status, reload } = useFoundationStatus('digital-marketing')
  const [questions, setQuestions] = useState<QuizQuestion[] | null>(null)
  const [questionsError, setQuestionsError] = useState<string>()
  const error = resultError ?? questionsError

  const path = status?.path ?? null
  const benchmark = status?.benchmark ?? null
  const placed = Boolean(status?.placement && Object.keys(status.placement).length)
  // Who may take it now.
  const open = !status
    ? unlock.unlocked
    : benchmark
      ? status.open && (placed || unlock.unlocked)
      : path === 'experienced'
        ? true
        : unlock.unlocked
  const ready = !loading && status !== undefined
  const canTake = ready && !result && open

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
      title={taken ? 'Your foundational progress' : benchmark ? 'Your Foundation benchmark' : 'Foundation assessment'}
      description={
        taken
          ? 'How you did on the fundamentals, and the certificate it earned.'
          : benchmark
            ? 'Where you stand today, what to practise, and your next attempt.'
            : 'The benchmark for Digital Marketing: the core areas, no time limit, and a certificate at the end.'
      }
    >
      {error && <DarkError title="The assessment isn’t available right now." message={error} />}

      {!ready && (
        <p className="flex items-center gap-2 text-sm text-white/60">
          <Loader2 size={15} className="animate-spin" /> Loading…
        </p>
      )}

      {ready && result && <FoundationResult assessment={result} />}

      {ready && !result && status && status.switchable && (
        <div className="card-glass-dark mb-6 rounded-xl p-5 sm:p-6">
          <PathChooser slug="digital-marketing" current={path} onChosen={reload} />
        </div>
      )}

      {ready && !result && benchmark && status && (
        <div className="mb-6">
          <BenchmarkResult
            status={status}
            nextOpen={open}
            waitingOn={
              placed
                ? 'Your next attempt opens once each of those tracks is at 60% or more.'
                : `Your next attempt opens once you’ve learned ${unlock.required}% of the Beginner vocabulary (${unlock.percent}% so far).`
            }
          />
        </div>
      )}

      {ready && !result && !benchmark && !open && <FoundationLock unlock={unlock} />}

      {canTake && benchmark && (
        <p className="mb-3 font-display text-lg font-semibold text-white">Your next attempt: this one earns your certificate, whatever you score.</p>
      )}
      {canTake && !benchmark && path === 'experienced' && (
        <p className="mb-3 text-sm text-white/70">
          60% or more earns your certificate now. Below that it’s a benchmark: no certificate yet, and it shows what to practise.
        </p>
      )}

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
            if (graded.kind === 'benchmark') {
              setQuestions(null)
              reload()
            }
            window.scrollTo({ top: 0 })
          }}
        />
      )}
    </DarkShell>
  )
}
