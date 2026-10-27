import { useState, type ReactNode } from 'react'
import { ArrowLeft, ArrowRight, Award, Check, X } from 'lucide-react'
import { errorMessage } from '@/lib/errors'
import type { QuizResult } from '@/lib/programmeStudent'
import type { Question } from '@/lib/programmeEngine'
import { tierForPercent } from '@/lib/certificates'
import type { CertificateKind } from '@/lib/certificates'

export const darkPrimaryButton =
  'press inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full bg-white px-6 py-2.5 text-sm font-semibold text-ink-900 shadow-e2 transition-colors hover:bg-brand-50 disabled:cursor-not-allowed disabled:opacity-50'
const secondaryButton =
  'press inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full border border-white/20 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:border-white/40 disabled:cursor-not-allowed disabled:opacity-40'

/** The certificate bands on the dark surface (TIERS' own colours are for light cards). */
export const DARK_TIER: Record<CertificateKind, string> = {
  gold: 'bg-amber-400/15 text-amber-200',
  silver: 'bg-slate-300/15 text-slate-100',
  bronze: 'bg-orange-400/15 text-orange-200',
}

const LETTER = 'ABCDEFGH'

/** A case's structured details, on the dark card. */
function CaseDetails({ q }: { q: Question }) {
  const c = q.context
  if (!c) return null
  const head = [c.company, c.role, c.industry].filter((x) => x && x.trim())
  const rows = (
    [
      ['Background', c.background],
      ['Objective', c.objective],
      ['What you know', c.information],
      ['Constraints', c.constraints],
    ] as const
  ).filter(([, v]) => v && v.trim())
  if (head.length === 0 && rows.length === 0) return null
  return (
    <div className="mt-3 rounded-xl bg-white/[0.06] p-3.5 text-sm leading-relaxed text-white/75">
      {head.length > 0 && <p className="text-xs font-semibold text-white/50">{head.join(' · ')}</p>}
      {rows.map(([k, v]) => (
        <p key={k} className="mt-1">
          <span className="font-semibold text-white">{k}: </span>
          {v}
        </p>
      ))}
    </div>
  )
}

/**
 * The Foundation assessment on the dark test screen, one question at a time:
 * the same look as Digital Marketing's (components/assessment/AssessmentQuiz)
 * and every aptitude test, so a test reads the same in every programme. Module
 * quizzes stay in the lesson (QuizRunner in ./shared).
 */
export function FocusedQuiz({
  questions,
  onSubmit,
  resultNote,
  onDone,
  doneLabel,
  aside,
}: {
  questions: Question[]
  onSubmit: (answers: Record<string, number>) => Promise<QuizResult>
  /** Under the score: the certificate link, or a preview note. */
  resultNote?: (r: QuizResult) => ReactNode
  onDone?: () => void
  doneLabel?: string
  /** Beside the progress count while answering: the timer. */
  aside?: ReactNode
}) {
  const [index, setIndex] = useState(0)
  const [answers, setAnswers] = useState<Record<string, number>>({})
  const [result, setResult] = useState<QuizResult>()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string>()

  const q = questions[index]
  const answered = questions.filter((x) => answers[x.id] !== undefined).length
  const isLast = index === questions.length - 1
  const progress = Math.round(((index + (answers[q.id] !== undefined ? 1 : 0)) / questions.length) * 100)

  async function submit() {
    setBusy(true)
    setError(undefined)
    try {
      setResult(await onSubmit(answers))
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } catch (e) {
      setError(errorMessage(e))
    } finally {
      setBusy(false)
    }
  }

  if (result) {
    const tier = tierForPercent(result.grade.percent)
    return (
      <div className="mx-auto max-w-2xl space-y-5">
        <div className="card-glass-dark glow-edge rounded-xl p-8 text-center">
          <div className={`mx-auto flex h-16 w-16 items-center justify-center rounded-full ${DARK_TIER[tier.kind]}`}>
            <Award size={30} />
          </div>
          <p className="mt-4 font-display text-6xl font-semibold leading-none tabular-nums text-white">{result.grade.percent}%</p>
          <p className="mt-2 text-sm text-white/70">
            You answered {result.grade.correct} of {result.grade.total} correctly: {tier.label} band ({tier.meaning}).
          </p>
          {resultNote?.(result)}
          {onDone && (
            <button type="button" onClick={onDone} className={`mt-5 ${secondaryButton}`}>
              {doneLabel ?? 'Continue'}
            </button>
          )}
        </div>

        <div className="card-glass-dark rounded-xl p-5 sm:p-6">
          <h2 className="font-display text-lg font-semibold text-white">Review answers</h2>
          <ul className="mt-4 space-y-4">
            {questions.map((question) => {
              const r = result.review[question.id]
              const correct = answers[question.id] === r?.correctIndex
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
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-white">{question.question}</p>
                      {r && (
                        <div className="mt-1 space-y-0.5 text-xs leading-relaxed">
                          {!correct && answers[question.id] !== undefined && (
                            <p className="text-red-200/80">Yours: {question.options[answers[question.id]]}</p>
                          )}
                          <p className="text-white/75">Correct: {question.options[r.correctIndex]}</p>
                          {r.explanation && <p className="text-white/55">{r.explanation}</p>}
                          {r.whyWrong && <p className="text-white/45">The others: {r.whyWrong}</p>}
                          {r.learningOutcome && <p className="text-white/45">What it teaches: {r.learningOutcome}</p>}
                        </div>
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
      <div className="mb-5">
        <div className="flex items-center justify-between gap-3">
          <span className="truncate font-mono text-[11px] font-bold uppercase tracking-[0.12em] text-brand-200">[ {q.topic || 'Question'} ]</span>
          <span className="flex shrink-0 items-center gap-3">
            {aside}
            <span className="font-mono text-[11px] font-bold tabular-nums text-white/50">
              {index + 1} / {questions.length}
            </span>
          </span>
        </div>
        <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-white/10">
          <div className="h-full rounded-full bg-gradient-to-r from-brand-400 to-brand-200 transition-all" style={{ width: `${progress}%` }} />
        </div>
      </div>

      <div key={q.id} className="card-glass-dark glow-edge rise-in rounded-xl p-6 sm:p-8">
        {q.title && <p className="font-mono text-[11px] font-bold uppercase tracking-[0.12em] text-white/50">{q.title}</p>}
        {q.scenario && <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-white/75">{q.scenario}</p>}
        <CaseDetails q={q} />
        <h2 className="mt-4 font-display text-xl font-semibold leading-snug tracking-tight text-white sm:text-2xl">{q.question}</h2>
        <div className="mt-6 space-y-2.5" role="radiogroup" aria-label={`Question ${index + 1}`}>
          {q.options.map((opt, i) => {
            const selected = answers[q.id] === i
            return (
              <button
                key={i}
                type="button"
                role="radio"
                aria-checked={selected}
                onClick={() => setAnswers((a) => ({ ...a, [q.id]: i }))}
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
                  {LETTER[i]}
                </span>
                {opt}
              </button>
            )
          })}
        </div>
      </div>

      {error && (
        <p role="alert" className="mt-4 rounded-lg border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          Couldn’t submit your answers: {error}
        </p>
      )}

      <div className="mt-5 flex items-center justify-between">
        <button type="button" onClick={() => setIndex((v) => Math.max(0, v - 1))} disabled={index === 0} className={secondaryButton}>
          <ArrowLeft size={16} /> Back
        </button>
        {isLast ? (
          <button type="button" onClick={() => void submit()} disabled={answered < questions.length || busy} className={darkPrimaryButton}>
            {busy ? 'Grading…' : answered < questions.length ? `Answer all (${answered}/${questions.length})` : 'Submit'}
          </button>
        ) : (
          <button
            type="button"
            onClick={() => setIndex((v) => Math.min(questions.length - 1, v + 1))}
            disabled={answers[q.id] === undefined}
            className={darkPrimaryButton}
          >
            Next <ArrowRight size={16} />
          </button>
        )}
      </div>
    </div>
  )
}
