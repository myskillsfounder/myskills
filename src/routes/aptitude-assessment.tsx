import { useEffect, useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { Loader2 } from 'lucide-react'
import { guestOrOnboarded } from '@/lib/guards'
import { errorMessage } from '@/lib/errors'
import { trackAptitudeComplete, trackEvent } from '@/lib/analytics'
import {
  fetchAptitudeQuestions,
  submitAptitude,
  useMyAptitudeResult,
  type AptitudeQuestion,
} from '@/lib/dmAptitude'
import { AptitudeResult } from '@/components/aptitude/AptitudeResult'
import { DarkError, DarkShell } from '@/components/self-assessment/DarkShell'
import { SignUpToSee } from '@/components/self-assessment/SignUpToSee'
import { CoachNote } from '@/components/self-assessment/CoachNote'
import { strongestFor } from '@/lib/guestResult'
import { useAuthUser } from '@/lib/useAuth'
import { clearPendingAptitude, pendingAptitudeFor, savePendingAptitude } from '@/lib/pendingAptitude'
import { SelfAssessmentQuiz, type QuizCopy } from '@/components/self-assessment/Quiz'

// Not in PAGE_SEO on purpose: the result is behind sign-in. The test itself
// can be taken signed out (lib/pendingAptitude.ts).
export const Route = createFileRoute('/aptitude-assessment')({
  beforeLoad: guestOrOnboarded,
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
  const [error, setError] = useState<string>()
  const { user, loading: authLoading } = useAuthUser()
  // Answered before signing up: the result waits for an account.
  const [waiting, setWaiting] = useState(() => pendingAptitudeFor('/aptitude-assessment') !== null)
  const [scoring, setScoring] = useState(false)

  // Signed in now, with answers from before: score them, once.
  useEffect(() => {
    if (authLoading || loading || !user) return
    const pending = pendingAptitudeFor('/aptitude-assessment')
    if (!pending) return
    clearPendingAptitude()
    setWaiting(false)
    if (result) return
    setScoring(true)
    submitAptitude(pending.answers, pending.reflection)
      .then((r) => {
        trackAptitudeComplete()
        setResult(r)
      })
      .catch((e) => setError(errorMessage(e)))
      .finally(() => setScoring(false))
  }, [authLoading, loading, user, result, setResult])
  const [questions, setQuestions] = useState<AptitudeQuestion[] | null>(null)

  // Only fetch the statements once we know the learner hasn't taken it.
  useEffect(() => {
    if (loading || authLoading || result || waiting || scoring) return
    let active = true
    fetchAptitudeQuestions()
      .then((q) => {
        if (!active) return
        // None readable (a visitor, before docs/supabase-aptitude-before-signup.sql) reads as unavailable.
        if (q.length === 0) setError('Please try again in a little while.')
        else setQuestions(q)
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
      eyebrow="Digital Marketing"
      title={taken ? 'Your marketing aptitude' : 'Aptitude assessment'}
      description={
        taken
          ? 'What you already notice and do, and the parts of digital marketing that should come most naturally.'
          : 'Before any theory: a quick look at how you already notice ads, offers, ideas and trends — the instincts good marketers build on.'
      }
    >
      {error && <DarkError title="The assessment isn’t available right now." message={error} />}

      {(loading || scoring || (!result && !waiting && !questions && !error)) && (
        <p className="flex items-center gap-2 text-sm text-white/60">
          <Loader2 size={15} className="animate-spin" /> {scoring ? 'Working out your results…' : 'Loading…'}
        </p>
      )}

      {result && <CoachNote test="dm-aptitude" />}
      {result && <AptitudeResult result={result} />}

      {!result && waiting && !user && !authLoading && <SignUpToSee route="/aptitude-assessment" />}

      {!result && !waiting && !scoring && questions && questions.length > 0 && (
        <SelfAssessmentQuiz
          questions={questions}
          copy={COPY}
          onSubmit={async (answers, reflection) => {
            // Signed out: keep the answers, and ask for an account to see the result.
            if (!user) {
              savePendingAptitude('/aptitude-assessment', answers, reflection, strongestFor('/aptitude-assessment', questions, answers))
              trackEvent('aptitude_answered_guest', { programme: 'digital-marketing' })
              setWaiting(true)
              window.scrollTo({ top: 0 })
              return
            }
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
