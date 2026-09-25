import { useEffect, useMemo, useRef, useState } from 'react'
import { errorMessage } from '@/lib/errors'
import { ArrowLeft, ArrowRight, Check, CheckCircle2, RotateCcw, X } from 'lucide-react'
import type { QuizQuestion } from '@/lib/initialAssessment'
import type { QuizGradeResult } from '@/lib/assessmentResults'
import { clearDraft, loadDraft, saveDraft } from '@/lib/assessmentDraft'
import { useAuthUser } from '@/lib/useAuth'

const primaryButton =
  'press inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full bg-white px-6 py-2.5 text-sm font-semibold text-ink-900 shadow-e2 transition-colors hover:bg-brand-50 disabled:cursor-not-allowed disabled:opacity-50'
const secondaryButton =
  'press inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full border border-white/20 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:border-white/40 disabled:cursor-not-allowed disabled:opacity-40'

/**
 * The Foundation assessment quiz (the old initial assessment) on the dark
 * theme. The logic — draft saving and resuming, one-attempt server grading,
 * the review of answers — is unchanged; only how it looks moved.
 */
export function AssessmentQuiz({
  questions,
  onSubmit,
  onContinue,
}: {
  questions: QuizQuestion[]
  /** Grades server-side and persists the result — see grade_initial_assessment
   *  in docs/supabase-server-side-grading.sql. Only reveals correct answers
   *  (in the returned result) once grading is final and one-time-only. */
  onSubmit: (answers: Record<string, number>) => Promise<QuizGradeResult>
  /** Called once the user has seen their result and dismisses it — updates
   *  the parent's cached assessment state so the app moves on. */
  onContinue: (result: QuizGradeResult) => void
}) {
  const [index, setIndex] = useState(0)
  const [answers, setAnswers] = useState<(number | null)[]>(() => questions.map(() => null))
  const [phase, setPhase] = useState<'quiz' | 'result'>('quiz')
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string>()
  const [result, setResult] = useState<QuizGradeResult | null>(null)
  const [resumed, setResumed] = useState(false)

  const { user } = useAuthUser()
  const userId = user?.id

  // Restore once, as soon as the session resolves — `useAuthUser` returns null
  // on first render even though the route guard has already authenticated.
  const restoreAttempted = useRef(false)
  const answersRef = useRef(answers)
  answersRef.current = answers

  useEffect(() => {
    if (!userId || restoreAttempted.current) return
    restoreAttempted.current = true

    const draft = loadDraft(userId, questions)
    // Never overwrite answers already given in this sitting.
    if (!draft || !answersRef.current.every((a) => a === null)) return

    setAnswers(draft.answers)
    setIndex(draft.index)
    setResumed(true)
  }, [userId, questions])

  useEffect(() => {
    if (phase !== 'quiz' || answers.every((a) => a === null)) return
    saveDraft(userId, questions, index, answers)
  }, [userId, questions, index, answers, phase])

  function startOver() {
    clearDraft()
    setAnswers(questions.map(() => null))
    setIndex(0)
    setResumed(false)
  }

  const categories = useMemo(() => {
    const order: string[] = []
    const map = new Map<string, number[]>()
    questions.forEach((q, i) => {
      if (!map.has(q.category)) {
        map.set(q.category, [])
        order.push(q.category)
      }
      map.get(q.category)!.push(i)
    })
    return order.map((category) => {
      const idxs = map.get(category)!
      const done = idxs.every((i) => answers[i] !== null)
      const ans = idxs.filter((i) => answers[i] !== null).length
      return { category, first: idxs[0], answered: ans, total: idxs.length, done }
    })
  }, [questions, answers])

  const q = questions[index]
  const answered = answers.filter((a) => a !== null).length
  const progress = Math.round(((index + (answers[index] !== null ? 1 : 0)) / questions.length) * 100)
  const isLast = index === questions.length - 1
  const showSidebar = categories.length > 1

  function choose(optionIndex: number) {
    setAnswers((prev) => {
      const next = [...prev]
      next[index] = optionIndex
      return next
    })
  }

  async function submit() {
    setSubmitting(true)
    setSubmitError(undefined)
    try {
      const byId: Record<string, number> = {}
      questions.forEach((question, i) => {
        if (answers[i] !== null) byId[question.id] = answers[i] as number
      })
      const graded = await onSubmit(byId)
      setResult(graded)
      setPhase('result')
      // Only after grading is safely persisted — if it throws, the draft is
      // the user's sole copy of a one-attempt quiz.
      clearDraft()
    } catch (err) {
      setSubmitError(errorMessage(err))
    } finally {
      setSubmitting(false)
    }
  }

  if (phase === 'result' && result) {
    const passed = result.percent >= 60
    return (
      <div className="mx-auto max-w-2xl space-y-5">
        <div className="card-glass-dark glow-edge rounded-xl p-8 text-center">
          <div
            className={`mx-auto flex h-16 w-16 items-center justify-center rounded-full ${
              passed ? 'bg-emerald-400/15 text-emerald-300' : 'bg-amber-400/15 text-amber-200'
            }`}
          >
            <CheckCircle2 size={30} />
          </div>
          <p className="mt-4 font-display text-6xl font-semibold leading-none tabular-nums text-white">
            {result.percent}%
          </p>
          <p className="mt-2 text-sm text-white/70">
            You answered {result.correct} of {result.total} correctly.
          </p>
          <div className="mt-6 space-y-2.5 text-left">
            {result.byCategory.map((c) => (
              <div key={c.category} className="flex items-center gap-3">
                <span className="w-40 shrink-0 truncate text-xs text-white/60">{c.category}</span>
                <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/10">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-brand-400 to-brand-200"
                    style={{ width: `${Math.round((c.correct / c.total) * 100)}%` }}
                  />
                </div>
                <span className="w-10 shrink-0 text-right font-mono text-xs font-bold tabular-nums text-white/80">
                  {c.correct}/{c.total}
                </span>
              </div>
            ))}
          </div>
          <p className="mt-6 text-sm text-white/70">Your certificate of foundational progress is ready — you’ll find it in your profile.</p>
          <button type="button" onClick={() => onContinue(result)} className={`mt-4 ${primaryButton}`}>
            Continue
            <ArrowRight size={16} />
          </button>
        </div>

        <div className="card-glass-dark rounded-xl p-5 sm:p-6">
          <h2 className="font-display text-lg font-semibold text-white">Review answers</h2>
          <ul className="mt-4 space-y-4">
            {questions.map((question, i) => {
              const review = result.review[question.id]
              const correct = answers[i] === review?.correctIndex
              return (
                <li key={question.id} className="border-b border-white/10 pb-4 last:border-0">
                  <div className="flex items-start gap-2.5">
                    <span
                      className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full ${
                        correct ? 'bg-emerald-400/20 text-emerald-300' : 'bg-red-400/20 text-red-300'
                      }`}
                    >
                      {correct ? <Check size={12} /> : <X size={12} />}
                    </span>
                    <div>
                      <p className="text-sm font-medium text-white">{question.question}</p>
                      {review && (
                        <>
                          <p className="mt-1 text-xs text-white/70">
                            Correct: {question.options[review.correctIndex]}
                          </p>
                          {review.explanation && (
                            <p className="mt-0.5 text-xs text-white/50">{review.explanation}</p>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                </li>
              )
            })}
          </ul>
        </div>
      </div>
    )
  }

  return (
    <div className="lg:flex lg:items-start lg:gap-6">
      {showSidebar && (
        <aside className="mb-4 hidden lg:block lg:w-60 lg:shrink-0">
          <div className="card-glass-dark sticky top-6 rounded-xl p-4">
            <p className="px-1 font-mono text-[11px] font-bold uppercase tracking-[0.12em] text-brand-200">
              Categories
            </p>
            <ul className="mt-3 space-y-1">
              {categories.map((c) => {
                const active = c.category === q.category
                return (
                  <li key={c.category}>
                    <button
                      type="button"
                      onClick={() => setIndex(c.first)}
                      className={`flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-sm transition-colors ${
                        active ? 'bg-white/10 font-medium text-white' : 'text-white/60 hover:bg-white/[0.06] hover:text-white'
                      }`}
                    >
                      <span
                        className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] ${
                          c.done
                            ? 'bg-emerald-400 text-ink-900'
                            : active
                              ? 'border border-brand-300 text-brand-200'
                              : 'border border-white/25 text-white/50'
                        }`}
                      >
                        {c.done ? <Check size={12} /> : c.answered > 0 ? c.answered : ''}
                      </span>
                      <span className="min-w-0 flex-1 truncate">{c.category}</span>
                      <span className="shrink-0 font-mono text-[11px] text-white/40">
                        {c.answered}/{c.total}
                      </span>
                    </button>
                  </li>
                )
              })}
            </ul>
          </div>
        </aside>
      )}

      <div className="mx-auto max-w-2xl flex-1">
        {resumed && (
          <div className="rise-in mb-4 flex flex-col gap-2.5 rounded-xl border border-brand-300/30 bg-brand-500/10 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-brand-100">
              Picked up where you left off — {answered} of {questions.length} answered.
            </p>
            <button
              type="button"
              onClick={startOver}
              className="press inline-flex shrink-0 items-center gap-1.5 self-start rounded-full border border-white/20 px-3.5 py-1.5 text-xs font-semibold text-white transition-colors hover:border-white/40 sm:self-auto"
            >
              <RotateCcw size={13} />
              Start over
            </button>
          </div>
        )}

        <div className="mb-5">
          <div className="flex items-center justify-between">
            <span className="font-mono text-[11px] font-bold uppercase tracking-[0.12em] text-brand-200">
              [ {q.category} ]
            </span>
            <span className="font-mono text-[11px] font-bold tabular-nums text-white/50">
              {index + 1} / {questions.length}
            </span>
          </div>
          <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-white/10">
            <div
              className="h-full rounded-full bg-gradient-to-r from-brand-400 to-brand-200 transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        <div key={q.id} className="card-glass-dark glow-edge rise-in rounded-xl p-6 sm:p-8">
          <h2 className="font-display text-xl font-semibold leading-snug tracking-tight text-white sm:text-2xl">
            {q.question}
          </h2>
          <div className="mt-6 space-y-2.5">
            {q.options.map((opt, i) => {
              const selected = answers[index] === i
              return (
                <button
                  key={i}
                  type="button"
                  onClick={() => choose(i)}
                  className={`flex w-full items-center gap-3 rounded-xl border px-4 py-3.5 text-left text-sm transition-all duration-200 ${
                    selected
                      ? 'border-brand-300 bg-brand-500/30 text-white shadow-[0_0_28px_-8px_rgba(143,133,238,0.85)]'
                      : 'border-white/15 bg-white/[0.06] text-white/85 hover:border-white/30 hover:bg-white/[0.12]'
                  }`}
                >
                  <span
                    className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border font-mono text-xs font-bold ${
                      selected ? 'border-white bg-white text-ink-900' : 'border-white/25 text-white/60'
                    }`}
                  >
                    {String.fromCharCode(65 + i)}
                  </span>
                  {opt}
                </button>
              )
            })}
          </div>
        </div>

        {submitError && (
          <p role="alert" className="mt-4 rounded-lg border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
            Couldn't submit your assessment: {submitError}
          </p>
        )}

        <div className="mt-5 flex items-center justify-between">
          <button
            type="button"
            onClick={() => setIndex((v) => Math.max(0, v - 1))}
            disabled={index === 0}
            className={secondaryButton}
          >
            <ArrowLeft size={16} />
            Back
          </button>

          {isLast ? (
            <button
              type="button"
              onClick={submit}
              disabled={answered < questions.length || submitting}
              className={primaryButton}
            >
              {submitting
                ? 'Grading…'
                : answered < questions.length
                  ? `Answer all (${answered}/${questions.length})`
                  : 'Submit'}
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setIndex((v) => Math.min(questions.length - 1, v + 1))}
              disabled={answers[index] === null}
              className={primaryButton}
            >
              Next
              <ArrowRight size={16} />
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
