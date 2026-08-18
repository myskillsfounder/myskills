import { useMemo, useState } from 'react'
import {
  ArrowLeft,
  ArrowRight,
  Briefcase,
  Building2,
  Check,
  CheckCircle2,
  Info,
  ListChecks,
  Target,
  X,
} from 'lucide-react'
import {
  DIFFICULTY_WEIGHT,
  gradeScenarios,
  type Difficulty,
  type ScenarioGrade,
  type ScenarioQuestion,
} from '@/lib/decisionLabs'

const DIFFICULTY_TINT: Record<Difficulty, string> = {
  Beginner: 'bg-emerald-50 text-emerald-700',
  Intermediate: 'bg-amber-50 text-amber-700',
  Advanced: 'bg-sky-50 text-sky-700',
  Expert: 'bg-rose-50 text-rose-700',
}

export function ScenarioQuiz({
  trackName,
  questions,
  onComplete,
  onBack,
}: {
  trackName: string
  questions: ScenarioQuestion[]
  onComplete: (grade: ScenarioGrade) => Promise<void>
  onBack: () => void
}) {
  const [index, setIndex] = useState(0)
  const [answers, setAnswers] = useState<(number | null)[]>(() => questions.map(() => null))
  const [phase, setPhase] = useState<'quiz' | 'result'>('quiz')
  const [submitting, setSubmitting] = useState(false)

  const grade = useMemo<ScenarioGrade | null>(
    () => (phase === 'result' ? gradeScenarios(questions, answers) : null),
    [phase, questions, answers],
  )

  const q = questions[index]
  const answered = answers.filter((a) => a !== null).length
  const progress = Math.round(((index + (answers[index] !== null ? 1 : 0)) / questions.length) * 100)
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
    setPhase('quiz')
  }

  async function finish() {
    setSubmitting(true)
    try {
      await onComplete(gradeScenarios(questions, answers))
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
            {grade.correct} of {grade.total} correct &middot; {grade.earnedWeight}/{grade.maxWeight}{' '}
            weighted points
          </p>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <button
              type="button"
              onClick={finish}
              disabled={submitting}
              className="inline-flex items-center gap-2 press h-11 rounded-xl bg-brand-600 px-6 text-sm font-semibold text-white shadow-e1 transition-colors hover:bg-brand-700 disabled:opacity-60"
            >
              {submitting ? 'Saving…' : 'Save result'}
              <ArrowRight size={16} />
            </button>
            <button
              type="button"
              onClick={retake}
              className="inline-flex items-center gap-2 rounded-full border border-ink-300 px-6 py-2.5 text-sm font-semibold text-ink-800 transition-colors hover:bg-ink-100"
            >
              Practice again
            </button>
            <button
              type="button"
              onClick={onBack}
              className="inline-flex items-center gap-2 rounded-full px-4 py-2.5 text-sm font-medium text-ink-600 transition-colors hover:text-ink-900"
            >
              Back to tracks
            </button>
          </div>
        </div>

        <div className="card p-5 sm:p-6">
          <h2 className="font-display text-lg font-semibold text-ink-900">Review scenarios</h2>
          <ul className="mt-4 space-y-5">
            {questions.map((question, i) => {
              const correct = answers[i] === question.correct
              return (
                <li key={question.id} className="border-b border-ink-200 pb-5 last:border-0">
                  <div className="flex items-start gap-2">
                    <span
                      className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full ${
                        correct ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-600'
                      }`}
                    >
                      {correct ? <Check size={12} /> : <X size={12} />}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-ink-900">{question.title}</p>
                      <p className="mt-1 text-xs text-ink-600">{question.question}</p>
                      <p className="mt-1.5 text-xs text-ink-600">
                        <span className="font-medium text-ink-900">Correct: </span>
                        {question.options[question.correct]}
                      </p>
                      <p className="mt-1 text-xs text-ink-500">{question.whyCorrect}</p>
                      {!correct && (
                        <p className="mt-1 text-xs text-ink-500">{question.whyOthersWrong}</p>
                      )}
                      {question.learningOutcome && (
                        <p className="mt-1.5 inline-flex items-start gap-1 text-xs font-medium text-brand-700">
                          <ListChecks size={13} className="mt-0.5 shrink-0" />
                          {question.learningOutcome}
                        </p>
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
    <div className="mx-auto max-w-2xl">
      <div className="mb-5 flex items-center justify-between">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-ink-600 hover:text-ink-900"
        >
          <ArrowLeft size={15} />
          {trackName}
        </button>
        <span className="text-xs font-medium text-ink-500">
          {index + 1} / {questions.length}
        </span>
      </div>

      <div className="mb-5 h-1.5 w-full overflow-hidden rounded-full bg-ink-200">
        <div
          className="h-full rounded-full bg-brand-600 transition-all"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Scenario brief */}
      <div className="mb-4 rounded-2xl border border-ink-200 bg-ink-100 p-5">
        <div className="flex flex-wrap items-center gap-2">
          <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${DIFFICULTY_TINT[q.difficulty]}`}>
            {q.difficulty}
          </span>
          <span className="rounded-full bg-white px-2.5 py-1 text-xs font-medium text-ink-600">
            {q.competency}
          </span>
          <span className="ml-auto text-xs text-ink-500">
            Worth {DIFFICULTY_WEIGHT[q.difficulty]} pts
          </span>
        </div>
        <h2 className="mt-3 text-base font-semibold text-ink-900">{q.title}</h2>
        <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-ink-600">
          <span className="inline-flex items-center gap-1.5">
            <Building2 size={13} />
            {q.company} &middot; {q.industry}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Briefcase size={13} />
            {q.role}
          </span>
        </div>
        <p className="mt-3 text-sm leading-relaxed text-ink-800">{q.background}</p>
        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          <div className="rounded-lg bg-white p-3">
            <p className="inline-flex items-center gap-1.5 text-xs font-semibold text-ink-900">
              <Target size={13} />
              Objective
            </p>
            <p className="mt-1 text-xs text-ink-600">{q.objective}</p>
          </div>
          <div className="rounded-lg bg-white p-3">
            <p className="inline-flex items-center gap-1.5 text-xs font-semibold text-ink-900">
              <Info size={13} />
              Available info &amp; constraints
            </p>
            <p className="mt-1 text-xs text-ink-600">
              {q.information} {q.constraints}
            </p>
          </div>
        </div>
      </div>

      <div className="card p-6">
        <h3 className="text-base font-semibold leading-snug text-ink-900">{q.question}</h3>
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
            {answered < questions.length ? `Answer all (${answered}/${questions.length})` : 'See results'}
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
  )
}
