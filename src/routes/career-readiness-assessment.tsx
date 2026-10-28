import { useEffect, useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { Loader2 } from 'lucide-react'
import { guestOrOnboarded } from '@/lib/guards'
import { errorMessage } from '@/lib/errors'
import { rememberProgramme } from '@/lib/practiceProgramme'
import { trackCareerAssessmentComplete, trackEvent } from '@/lib/analytics'
import {
  fetchAssessmentQuestions,
  submitAssessment,
  useMyAssessmentResult,
  type AssessmentQuestion,
} from '@/lib/careerReadinessAssessment'
import { AssessmentResult } from '@/components/career-readiness/AssessmentResult'
import { DarkError, DarkShell } from '@/components/self-assessment/DarkShell'
import { SignUpToSee } from '@/components/self-assessment/SignUpToSee'
import { CoachNote } from '@/components/self-assessment/CoachNote'
import { strongestFor } from '@/lib/guestResult'
import { useAuthUser } from '@/lib/useAuth'
import { clearPendingAptitude, pendingAptitudeFor, savePendingAptitude } from '@/lib/pendingAptitude'
import { SelfAssessmentQuiz, type QuizCopy } from '@/components/self-assessment/Quiz'

// Not in PAGE_SEO on purpose: the result is behind sign-in. The test itself
// can be taken signed out (lib/pendingAptitude.ts).
export const Route = createFileRoute('/career-readiness-assessment')({
  beforeLoad: guestOrOnboarded,
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
  const [error, setError] = useState<string>()
  const { user, loading: authLoading } = useAuthUser()
  // Answered before signing up: the result waits for an account.
  const [waiting, setWaiting] = useState(() => pendingAptitudeFor('/career-readiness-assessment') !== null)
  const [scoring, setScoring] = useState(false)

  // Signed in now, with answers from before: score them, once.
  useEffect(() => {
    if (authLoading || loading || !user) return
    const pending = pendingAptitudeFor('/career-readiness-assessment')
    if (!pending) return
    clearPendingAptitude()
    setWaiting(false)
    if (result) return
    setScoring(true)
    submitAssessment(pending.answers, pending.reflection)
      .then((r) => {
        trackCareerAssessmentComplete()
        setResult(r)
      })
      .catch((e) => setError(errorMessage(e)))
      .finally(() => setScoring(false))
  }, [authLoading, loading, user, result, setResult])
  // "Back to Practice" returns to this programme's tab.
  useEffect(() => rememberProgramme(2), [])
  const [questions, setQuestions] = useState<AssessmentQuestion[] | null>(null)

  // Only fetch the statements once we know the learner hasn't taken it: one
  // attempt each (everyone's earlier results were cleared when this test
  // started, docs/supabase-leadership-test-reset.sql).
  useEffect(() => {
    if (loading || authLoading || result || waiting || scoring) return
    let active = true
    fetchAssessmentQuestions()
      .then((q) => {
        if (!active) return
        // None readable (a visitor, before docs/supabase-aptitude-before-signup.sql) reads as unavailable.
        if (q.questions.length === 0) setError('Please try again in a little while.')
        else setQuestions(q.questions)
      })
      .catch((e) => active && setError(errorMessage(e)))
    return () => {
      active = false
    }
  }, [loading, authLoading, result, waiting, scoring])

  const taken = Boolean(result)

  return (
    <DarkShell
      back={user ? { to: '/practice', label: 'Back to Practice' } : { to: '/', label: 'Back' }}
      eyebrow="Global Leadership"
      title={taken ? 'Your leadership aptitude' : 'Leadership Aptitude Test'}
      description={
        taken
          ? 'What you told us about how you work and relate to people today, and where the programme can help most.'
          : 'A quick, honest look at the 14 skills the Global Leadership Programme builds: self-awareness, empathy, critical and creative thinking, decision-making, problem-solving, communication, relationships, coping with stress and emotions, goal setting, leadership, agile working and a growth mindset.'
      }
    >
      {error && <DarkError title="The assessment isn’t available right now." message={error} />}

      {(loading || scoring || (!result && !waiting && !questions && !error)) && (
        <p className="flex items-center gap-2 text-sm text-white/60">
          <Loader2 size={15} className="animate-spin" /> {scoring ? 'Working out your results…' : 'Loading…'}
        </p>
      )}

      {result && <CoachNote test="gl-aptitude" />}
      {result && <AssessmentResult result={result} />}

      {!result && waiting && !user && !authLoading && <SignUpToSee route="/career-readiness-assessment" />}

      {!result && !waiting && !scoring && questions && questions.length > 0 && (
        <SelfAssessmentQuiz
          questions={questions}
          copy={COPY}
          onSubmit={async (answers, reflection) => {
            // Signed out: keep the answers, and ask for an account to see the result.
            if (!user) {
              savePendingAptitude('/career-readiness-assessment', answers, reflection, strongestFor('/career-readiness-assessment', questions, answers))
              trackEvent('aptitude_answered_guest', { programme: 'global-leadership' })
              setWaiting(true)
              window.scrollTo({ top: 0 })
              return
            }
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
