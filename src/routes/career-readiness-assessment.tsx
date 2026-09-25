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
import { AssessmentQuiz } from '@/components/career-readiness/AssessmentQuiz'
import { AssessmentResult } from '@/components/career-readiness/AssessmentResult'
import { Eyebrow } from '@/components/landing/Eyebrow'
import { GlowOrb, GridBackdrop } from '@/components/landing/GridBackdrop'

// Not in PAGE_SEO on purpose — it's behind sign-in, and the programme it
// belongs to isn't live yet (see career-readiness.tsx).
export const Route = createFileRoute('/career-readiness-assessment')({
  beforeLoad: requireOnboarded,
  component: CareerReadinessAssessmentPage,
})

/**
 * A focused, full-screen dark flow rather than a page inside the app shell:
 * the same surface, grid and glow as the Career Readiness landing page, so
 * the assessment feels like the programme it belongs to. The only chrome is
 * a way back to Practice.
 */
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
    <div className="surface-wood-dark relative min-h-screen overflow-hidden">
      <GridBackdrop mask="ellipse 75% 60% at 50% 0%" />
      <GlowOrb className="-left-24 top-24 h-72 w-72" color="rgba(143,133,238,0.16)" />
      <GlowOrb className="-right-24 bottom-10 h-72 w-72" color="rgba(211,164,65,0.10)" />

      <div className="relative mx-auto max-w-4xl px-4 pb-16 pt-5 sm:px-6">
        <div className="flex items-center justify-between">
          <Link
            to="/practice"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-white/60 transition-colors hover:text-white"
          >
            <ArrowLeft size={16} /> Back to Practice
          </Link>
          <span className="font-display text-sm font-semibold text-white/80">MySkills</span>
        </div>

        <header className="rise-in mt-10 mb-8">
          <Eyebrow dark>Career Readiness</Eyebrow>
          <h1 className="mt-3 font-display text-4xl font-semibold leading-[1.1] tracking-tight text-white sm:text-5xl">
            {taken ? 'Your starting point' : 'Initial assessment'}
          </h1>
          <p className="mt-3 max-w-2xl text-base leading-relaxed text-white/70">
            {taken
              ? 'What you told us about how you work today, and where the programme can help most.'
              : 'A quick, honest look at the five skills the programme builds — goal setting, communication, leadership, agile working and a growth mindset.'}
          </p>
        </header>

        {error && (
          <p role="alert" className="rounded-lg border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
            <span className="font-semibold">The assessment isn’t available right now.</span> {error}
          </p>
        )}

        {(loading || (!result && !questions && !error)) && (
          <p className="flex items-center gap-2 text-sm text-white/60">
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
      </div>
    </div>
  )
}
