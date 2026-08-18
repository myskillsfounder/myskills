import { useEffect, useMemo, useRef, useState } from 'react'
import { AlertTriangle, ArrowLeft, ArrowRight, CheckCircle2, RotateCcw } from 'lucide-react'
import type { ScenarioQuestion } from '@/lib/decisionLabs'
import { gradeTest, type TestGrade } from '@/lib/tests'

export function TestRunner({
  trackName,
  questions,
  onBack,
  onComplete,
}: {
  trackName: string
  questions: ScenarioQuestion[]
  onBack: () => void
  onComplete: (grade: TestGrade) => Promise<void>
}) {
  const [index, setIndex] = useState(0)
  const [answers, setAnswers] = useState<(number | null)[]>(() => questions.map(() => null))
  const [phase, setPhase] = useState<'quiz' | 'result'>('quiz')
  const [saving, setSaving] = useState(false)
  const savedRef = useRef(false)

  const grade = useMemo<TestGrade | null>(
    () => (phase === 'result' ? gradeTest(questions, answers) : null),
    [phase, questions, answers],
  )

  // Record the attempt once, when results appear.
  useEffect(() => {
    if (phase === 'result' && grade && !savedRef.current) {
      savedRef.current = true
      setSaving(true)
      void onComplete(grade).finally(() => setSaving(false))
    }
  }, [phase, grade, onComplete])

  const q = questions[index]
  const answered = answers.filter((a) => a !== null).length
  const isLast = index === questions.length - 1

  function choose(optionIndex: number) {
    setAnswers((prev) => {
      const next = [...prev]
      next[index] = optionIndex
      return next
    })
  }

  function retake() {
    setAnswers(questions.map(() => null))
    setIndex(0)
    savedRef.current = false
    setPhase('quiz')
  }

  if (phase === 'result' && grade) {
    return (
      <div className="mx-auto max-w-xl">
        <div className="card p-8 text-center">
          <div
            className={`mx-auto flex h-16 w-16 items-center justify-center rounded-full ${
              grade.passed ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'
            }`}
          >
            {grade.passed ? <CheckCircle2 size={30} /> : <AlertTriangle size={30} />}
          </div>
          <h1 className="mt-4 text-2xl font-semibold tracking-tight text-ink-900">
            {grade.passed ? 'Passed' : 'Not passed'}
          </h1>
          <p className="mt-1 text-sm text-ink-600">
            {trackName} · {grade.percent}% ({grade.correct}/{grade.total} correct)
          </p>
          {saving && <p className="mt-2 text-xs text-ink-500">Saving result…</p>}

          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <button
              type="button"
              onClick={retake}
              className="inline-flex items-center gap-2 press h-11 rounded-xl bg-brand-600 px-6 text-sm font-semibold text-white shadow-e1 transition-colors hover:bg-brand-700"
            >
              <RotateCcw size={16} /> Retake test
            </button>
            <button
              type="button"
              onClick={onBack}
              className="inline-flex items-center gap-2 rounded-full border border-ink-300 px-6 py-2.5 text-sm font-semibold text-ink-800 transition-colors hover:bg-ink-100"
            >
              Back to tests
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-4 flex items-center justify-between">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-ink-600 hover:text-ink-900"
        >
          <ArrowLeft size={15} />
          {trackName}
        </button>
        <span className="text-xs font-medium text-ink-500">
          {answered}/{questions.length} answered
        </span>
      </div>

      <div className="mb-2 text-xs text-ink-500">
        Question {index + 1} of {questions.length}
      </div>
      <div className="mb-5 h-1.5 w-full overflow-hidden rounded-full bg-ink-200">
        <div
          className="h-full rounded-full bg-brand-600 transition-all"
          style={{ width: `${((index + 1) / questions.length) * 100}%` }}
        />
      </div>

      <div className="card p-6">
        <span className="text-xs font-medium text-brand-600">{q.competency}</span>
        <h2 className="mt-1 text-base font-semibold leading-snug text-ink-900">{q.question}</h2>
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
          <ArrowLeft size={16} /> Back
        </button>

        {isLast ? (
          <button
            type="button"
            onClick={() => setPhase('result')}
            disabled={answered < questions.length}
            className="inline-flex items-center gap-1.5 rounded-full bg-brand-600 px-6 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {answered < questions.length ? `Answer all (${answered}/${questions.length})` : 'Submit test'}
          </button>
        ) : (
          <button
            type="button"
            onClick={() => setIndex((v) => Math.min(questions.length - 1, v + 1))}
            disabled={answers[index] === null}
            className="inline-flex items-center gap-1.5 rounded-full bg-brand-600 px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Next <ArrowRight size={16} />
          </button>
        )}
      </div>
    </div>
  )
}
