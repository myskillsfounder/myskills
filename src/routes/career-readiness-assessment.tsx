import { useEffect, useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { ArrowRight, Loader2 } from 'lucide-react'
import { requireOnboarded } from '@/lib/guards'
import { errorMessage } from '@/lib/errors'
import { rememberProgramme } from '@/lib/practiceProgramme'
import { trackCareerAssessmentComplete } from '@/lib/analytics'
import {
  fetchAssessmentQuestions,
  isLifeSkills,
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
    'You’ll see one statement at a time. Say how often it’s true for you — it’s a starting point, not a test, so answer as you really are. It doesn’t change your Career Readiness Score, and only you and your mentor see it.',
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
  const [profileReady, setProfileReady] = useState(false)
  const [error, setError] = useState<string>()
  // Someone with the earlier version's result can take the profile once.
  const [retaking, setRetaking] = useState(false)

  const earlier = result != null && !isLifeSkills(result.scores)
  const asking = !result || retaking

  // The statements, when there is something to take: no result yet, or only
  // the earlier version's (to know whether the profile is there to offer).
  useEffect(() => {
    if (loading || (result && !earlier)) return
    let active = true
    fetchAssessmentQuestions()
      .then((q) => {
        if (!active) return
        setQuestions(q.questions)
        setProfileReady(q.lifeSkills)
      })
      .catch((e) => active && setError(errorMessage(e)))
    return () => {
      active = false
    }
  }, [loading, result, earlier])

  const taken = Boolean(result) && !retaking

  return (
    <DarkShell
      back={{ to: '/practice', label: 'Back to Practice' }}
      eyebrow="Career Readiness"
      title={taken ? 'Your life skills profile' : 'Life skills profile'}
      description={
        taken
          ? 'What you told us about how you work and relate to people today, and where the programme can help most.'
          : 'A quick, honest look at WHO’s ten life skills, the ones the programme builds: self-awareness, empathy, critical and creative thinking, decision-making, problem-solving, communication, relationships, and coping with stress and emotions.'
      }
    >
      {error && <DarkError title="The assessment isn’t available right now." message={error} />}

      {(loading || (asking && !questions && !error)) && (
        <p className="flex items-center gap-2 text-sm text-white/60">
          <Loader2 size={15} className="animate-spin" /> Loading…
        </p>
      )}

      {/* The earlier version's result, with the profile offered in its place. */}
      {taken && earlier && profileReady && (
        <div className="mb-6 rounded-2xl border border-white/10 bg-white/[0.06] p-5">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-brand-200">New</p>
          <p className="mt-1.5 font-display text-xl font-semibold text-white">Take the life skills profile</p>
          <p className="mt-1 text-sm leading-relaxed text-white/70">
            The programme now measures WHO’s ten life skills. Your result below is from the earlier, five-skill version.
            The profile takes about eight minutes and replaces it.
          </p>
          <button
            type="button"
            onClick={() => {
              setRetaking(true)
              window.scrollTo({ top: 0 })
            }}
            className="press mt-4 inline-flex items-center gap-2 rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-ink-900 shadow-e2"
          >
            Take the profile <ArrowRight size={16} />
          </button>
        </div>
      )}

      {taken && result && <AssessmentResult result={result} />}

      {asking && questions && questions.length > 0 && (
        <SelfAssessmentQuiz
          questions={questions}
          copy={COPY}
          onSubmit={async (answers, reflection) => {
            const r = await submitAssessment(answers, reflection)
            trackCareerAssessmentComplete()
            setResult(r)
            setRetaking(false)
            window.scrollTo({ top: 0 })
          }}
        />
      )}
    </DarkShell>
  )
}
