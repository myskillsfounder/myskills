import { useMemo, useState } from 'react'
import { ArrowLeft, ArrowRight, Check, CheckCircle2, X } from 'lucide-react'
import {
  gradeQuestions,
  type AssessmentGrade,
  type AssessmentQuestion,
} from '@/lib/initialAssessment'

export function AssessmentQuiz({
  questions,
  onComplete,
}: {
  questions: AssessmentQuestion[]
  onComplete: (grade: AssessmentGrade) => Promise<void>
}) {
  const [index, setIndex] = useState(0)
  const [answers, setAnswers] = useState<(number | null)[]>(() => questions.map(() => null))
  const [phase, setPhase] = useState<'quiz' | 'result'>('quiz')
  const [submitting, setSubmitting] = useState(false)

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

  const grade = useMemo<AssessmentGrade | null>(
    () => (phase === 'result' ? gradeQuestions(questions, answers) : null),
    [phase, questions, answers],
  )

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

  async function finish() {
    setSubmitting(true)
    try {
      await onComplete(gradeQuestions(questions, answers))
    } finally {
      setSubmitting(false)
    }
  }

  if (phase === 'result' && grade) {
    const passed = grade.percent >= 60
    return (
      <div className="mx-auto max-w-2xl space-y-5">
        <div className="card p-8 text-center">
          <div
            className={`mx-auto flex h-16 w-16 items-center justify-center rounded-full ${
              passed ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'
            }`}
          >
            <CheckCircle2 size={30} />
          </div>
          <h1 className="mt-4 text-2xl font-semibold tracking-tight text-ink-900">
            {grade.percent}%
          </h1>
          <p className="mt-1 text-sm text-ink-600">
            You answered {grade.correct} of {grade.total} correctly.
          </p>
          <div className="mt-6 space-y-2 text-left">
            {grade.byCategory.map((c) => (
              <div key={c.category} className="flex items-center gap-3">
                <span className="w-40 shrink-0 truncate text-xs text-ink-600">{c.category}</span>
                <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-ink-200">
                  <div
                    className="h-full rounded-full bg-brand-500"
                    style={{ width: `${Math.round((c.correct / c.total) * 100)}%` }}
                  />
                </div>
                <span className="w-10 shrink-0 text-right text-xs font-medium text-ink-800">
                  {c.correct}/{c.total}
                </span>
              </div>
            ))}
          </div>
          <button
            type="button"
            onClick={finish}
            disabled={submitting}
            className="mt-8 inline-flex items-center gap-2 press h-11 rounded-xl bg-brand-600 px-6 text-sm font-semibold text-white shadow-e1 transition-colors hover:bg-brand-700 disabled:opacity-60"
          >
            {submitting ? 'Saving…' : 'Save & continue'}
            <ArrowRight size={16} />
          </button>
        </div>

        <div className="card p-5 sm:p-6">
          <h2 className="font-display text-lg font-semibold text-ink-900">Review answers</h2>
          <ul className="mt-4 space-y-4">
            {questions.map((question, i) => {
              const correct = answers[i] === question.correct
              return (
                <li key={question.id} className="border-b border-ink-200 pb-4 last:border-0">
                  <div className="flex items-start gap-2">
                    <span
                      className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full ${
                        correct ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-600'
                      }`}
                    >
                      {correct ? <Check size={12} /> : <X size={12} />}
                    </span>
                    <div>
                      <p className="text-sm font-medium text-ink-900">{question.question}</p>
                      <p className="mt-1 text-xs text-ink-600">
                        Correct: {question.options[question.correct]}
                      </p>
                      {question.explanation && (
                        <p className="mt-0.5 text-xs text-ink-500">{question.explanation}</p>
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
          <div className="sticky top-6 card p-4">
            <p className="px-1 text-xs font-semibold uppercase tracking-wide text-ink-500">
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
                        active ? 'bg-brand-50 font-medium text-brand-700' : 'text-ink-600 hover:bg-ink-100'
                      }`}
                    >
                      <span
                        className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] ${
                          c.done
                            ? 'bg-emerald-500 text-white'
                            : active
                              ? 'border border-brand-500 text-brand-600'
                              : 'border border-ink-300 text-ink-500'
                        }`}
                      >
                        {c.done ? <Check size={12} /> : c.answered > 0 ? c.answered : ''}
                      </span>
                      <span className="min-w-0 flex-1 truncate">{c.category}</span>
                      <span className="shrink-0 text-[11px] text-ink-500">
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
        <div className="mb-5">
          <div className="flex items-center justify-between text-xs font-medium text-ink-500">
            <span className="uppercase tracking-wide text-brand-600">{q.category}</span>
            <span>
              {index + 1} / {questions.length}
            </span>
          </div>
          <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-ink-200">
            <div
              className="h-full rounded-full bg-brand-600 transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        <div className="card p-6">
          <h2 className="text-lg font-semibold leading-snug text-ink-900">{q.question}</h2>
          <div className="mt-5 space-y-2.5">
            {q.options.map((opt, i) => {
              const selected = answers[index] === i
              return (
                <button
                  key={i}
                  type="button"
                  onClick={() => choose(i)}
                  className={`flex w-full items-center gap-3 rounded-xl border px-4 py-3 text-left text-sm transition-colors ${
                    selected
                      ? 'border-brand-500 bg-brand-50 text-brand-900'
                      : 'border-ink-300 text-ink-800 hover:border-ink-400 hover:bg-ink-100'
                  }`}
                >
                  <span
                    className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border text-xs ${
                      selected ? 'border-brand-600 bg-brand-600 text-white' : 'border-ink-300'
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

        <div className="mt-5 flex items-center justify-between">
          <button
            type="button"
            onClick={() => setIndex((v) => Math.max(0, v - 1))}
            disabled={index === 0}
            className="inline-flex items-center gap-1.5 press h-10 rounded-xl border border-ink-300 bg-white px-4 text-sm font-semibold text-ink-800 transition-colors hover:bg-ink-50 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <ArrowLeft size={16} />
            Back
          </button>

          {isLast ? (
            <button
              type="button"
              onClick={() => setPhase('result')}
              disabled={answered < questions.length}
              className="inline-flex items-center gap-1.5 rounded-full bg-brand-600 px-6 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {answered < questions.length ? `Answer all (${answered}/${questions.length})` : 'Submit'}
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setIndex((v) => Math.min(questions.length - 1, v + 1))}
              disabled={answers[index] === null}
              className="inline-flex items-center gap-1.5 rounded-full bg-brand-600 px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-50"
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
