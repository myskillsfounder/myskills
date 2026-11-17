import { useState } from 'react'
import { ArrowLeft, ArrowRight, Briefcase, Building2, Check, CheckCircle2, Info, ListChecks, Target, X } from 'lucide-react'
import { DIFFICULTY_WEIGHT, questionsForTrack, type Difficulty, type ScenarioQuestion } from '@/lib/decisionLabs'
import { errorMessage } from '@/lib/errors'
import {
  RETAKE_AFTER_MS,
  fetchPracticeRound,
  retakeLabel,
  submitPracticeRound,
  type PracticeResult,
} from '@/lib/practiceResults'

/**
 * The Practise step of a topic page: four scenario questions picked by the server
 * (docs/supabase-practice-quick-round.sql), answered here without leaving the
 * lesson, then graded on the server with a review. The full Decision Lab is still
 * there as a link. If the server doesn't have the round yet, it says so and offers
 * the full lab.
 */

const TINT: Record<Difficulty, string> = {
  Beginner: 'bg-emerald-50 text-emerald-700',
  Intermediate: 'bg-amber-50 text-amber-700',
  Advanced: 'bg-sky-50 text-sky-700',
  Expert: 'bg-rose-50 text-rose-700',
}

function shuffled<T>(items: T[]): T[] {
  const out = [...items]
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[out[i], out[j]] = [out[j], out[i]]
  }
  return out
}

type Phase = 'idle' | 'loading' | 'playing' | 'submitting' | 'result' | 'unavailable'

export function PracticeRound({
  slug,
  trackName,
  fullCount,
  opensAt,
  onSubmitted,
  onContinue,
  onFullLab,
}: {
  slug: string
  trackName: string
  /** How many questions the full Decision Lab has. */
  fullCount: number
  /** When this track can next be taken, or null if it can be taken now. */
  opensAt: Date | null
  /** A round was graded and saved: refresh the scores. */
  onSubmitted: () => void | Promise<void>
  onContinue: () => void
  onFullLab: () => void
}) {
  const [phase, setPhase] = useState<Phase>('idle')
  const [questions, setQuestions] = useState<ScenarioQuestion[]>([])
  const [optionOrder, setOptionOrder] = useState<Record<string, number[]>>({})
  const [answers, setAnswers] = useState<(number | null)[]>([])
  const [index, setIndex] = useState(0)
  const [result, setResult] = useState<PracticeResult | null>(null)
  const [error, setError] = useState('')
  // What the server said, when the short round isn't available: for whoever sets it up.
  const [detail, setDetail] = useState('')

  async function start() {
    setPhase('loading')
    setError('')
    try {
      const ids = await fetchPracticeRound(slug)
      const bank = questionsForTrack(slug)
      const picked = ids.map((id) => bank.find((q) => q.id === id)).filter((q): q is ScenarioQuestion => Boolean(q))
      if (picked.length === 0) throw new Error('No questions came back for this module.')
      setQuestions(picked)
      setOptionOrder(Object.fromEntries(picked.map((q) => [q.id, shuffled(q.options.map((_, i) => i))])))
      setAnswers(picked.map(() => null))
      setIndex(0)
      setPhase('playing')
    } catch (e) {
      const msg = errorMessage(e)
      // Before the SQL has been run, the server doesn't know the function.
      if (/could not find|does not exist|schema cache|not found/i.test(msg)) {
        setDetail(msg)
        setPhase('unavailable')
      }
      else {
        setError(msg)
        setPhase('idle')
      }
    }
  }

  async function submit() {
    setPhase('submitting')
    setError('')
    try {
      const payload: Record<string, number> = {}
      questions.forEach((q, i) => {
        payload[q.id] = answers[i] as number
      })
      setResult(await submitPracticeRound(slug, questions.map((q) => q.id), payload))
      setPhase('result')
      void onSubmitted()
    } catch (e) {
      setError(errorMessage(e))
      setPhase('playing')
    }
  }

  const fullLab = (
    <button type="button" onClick={onFullLab} className="text-sm font-medium text-ink-600 underline-offset-2 hover:text-ink-900 hover:underline">
      Or take the full Decision Lab ({fullCount} questions)
    </button>
  )

  if (phase === 'unavailable') {
    return (
      <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-4">
        <p className="font-semibold text-amber-800">The short round isn’t ready yet</p>
        <p className="mt-1 text-sm text-ink-800">You can still practise with the full Decision Lab.</p>
        {detail && (
          <p className="mt-2 break-words rounded-lg bg-black/20 px-3 py-2 font-mono text-[11px] leading-relaxed text-ink-600">
            Server said: {detail}
          </p>
        )}
        <button
          type="button"
          onClick={onFullLab}
          className="press mt-3 inline-flex h-10 items-center gap-1.5 rounded-xl bg-emerald-600 px-4 text-sm font-semibold text-white shadow-e1 transition-colors hover:bg-emerald-700"
        >
          Open the full Decision Lab <ArrowRight size={15} />
        </button>
      </div>
    )
  }

  if (phase === 'result' && result) {
    const { grade, review } = result
    const passed = grade.percent >= 60
    return (
      <div className="mt-4">
        <div className={`rounded-2xl border p-5 text-center ${passed ? 'border-emerald-200 bg-emerald-50' : 'border-amber-200 bg-amber-50'}`}>
          <span className={`mx-auto flex h-12 w-12 items-center justify-center rounded-full text-white ${passed ? 'bg-emerald-600' : 'bg-amber-600'}`}>
            <CheckCircle2 size={24} />
          </span>
          <p className="mt-3 font-display text-4xl font-semibold text-ink-900">{grade.percent}%</p>
          <p className="mt-1 text-sm text-ink-700">
            {grade.correct} of {grade.total} right · {grade.earnedWeight}/{grade.maxWeight} points
          </p>
          <p className="mx-auto mt-3 max-w-md text-xs text-ink-600">
            Saved. Your score for {trackName} is the best of your last three attempts. You can take it again{' '}
            {retakeLabel(new Date(Date.now() + RETAKE_AFTER_MS))}, with different questions. Read the review below in the meantime.
          </p>
        </div>

        <ul className="mt-4 space-y-3">
          {questions.map((q, i) => {
            const r = review[q.id]
            const right = r != null && answers[i] === r.correctIndex
            return (
              <li key={q.id} className={`rounded-2xl border p-4 ${right ? 'border-emerald-200' : 'border-red-200'}`}>
                <div className="flex items-start gap-2.5">
                  <span className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-white ${right ? 'bg-emerald-600' : 'bg-red-600'}`}>
                    {right ? <Check size={12} strokeWidth={3} /> : <X size={12} strokeWidth={3} />}
                  </span>
                  <div className="min-w-0 flex-1 text-sm">
                    <p className="font-semibold text-ink-900">{q.title}</p>
                    <p className="mt-0.5 text-ink-600">{q.question}</p>
                    {!right && answers[i] !== null && (
                      <p className="mt-2 text-ink-700">
                        <span className="font-medium text-red-700">You chose: </span>
                        {q.options[answers[i] as number]}
                      </p>
                    )}
                    <p className="mt-1.5 text-ink-800">
                      <span className="font-medium text-emerald-700">Right answer: </span>
                      {r ? q.options[r.correctIndex] : '—'}
                    </p>
                    {r && <p className="mt-1.5 leading-relaxed text-ink-700">{r.whyCorrect}</p>}
                    {r && !right && <p className="mt-1.5 leading-relaxed text-ink-600">{r.whyOthersWrong}</p>}
                    {r?.learningOutcome && (
                      <p className="mt-2 inline-flex items-start gap-1 text-xs font-medium text-emerald-700">
                        <ListChecks size={13} className="mt-0.5 shrink-0" /> {r.learningOutcome}
                      </p>
                    )}
                  </div>
                </div>
              </li>
            )
          })}
        </ul>

        <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
          {fullLab}
          <button
            type="button"
            onClick={onContinue}
            className="press inline-flex h-11 items-center gap-1.5 rounded-xl bg-emerald-600 px-5 text-sm font-semibold text-white shadow-e1 transition-colors hover:bg-emerald-700"
          >
            Finish module <ArrowRight size={16} />
          </button>
        </div>
      </div>
    )
  }

  if ((phase === 'playing' || phase === 'submitting') && questions.length > 0) {
    const q = questions[index]
    const last = index === questions.length - 1
    const answered = answers.filter((a) => a !== null).length
    const busy = phase === 'submitting'
    return (
      <div className="mt-4">
        <div className="flex items-center justify-between gap-3 text-xs text-ink-500">
          <span>
            Question {index + 1} of {questions.length}
          </span>
          <span className="inline-flex gap-1" aria-hidden>
            {questions.map((_, i) => (
              <span key={i} className={`h-1.5 w-8 rounded-full ${answers[i] !== null ? 'bg-emerald-600' : i === index ? 'bg-emerald-300' : 'bg-ink-200'}`} />
            ))}
          </span>
        </div>

        <div className="mt-3 rounded-2xl border border-ink-200 bg-ink-50 p-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${TINT[q.difficulty]}`}>{q.difficulty}</span>
            <span className="rounded-full bg-white px-2.5 py-1 text-xs font-medium text-ink-600">{q.competency}</span>
            <span className="ml-auto text-xs text-ink-500">Worth {DIFFICULTY_WEIGHT[q.difficulty]} pts</span>
          </div>
          <h3 className="mt-3 font-semibold text-ink-900">{q.title}</h3>
          <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-ink-600">
            <span className="inline-flex items-center gap-1.5">
              <Building2 size={13} /> {q.company} · {q.industry}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Briefcase size={13} /> {q.role}
            </span>
          </div>
          <p className="mt-3 text-sm leading-relaxed text-ink-800">{q.background}</p>
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            <div className="rounded-xl bg-white p-3">
              <p className="inline-flex items-center gap-1.5 text-xs font-semibold text-ink-900">
                <Target size={13} /> Objective
              </p>
              <p className="mt-1 text-xs leading-relaxed text-ink-600">{q.objective}</p>
            </div>
            <div className="rounded-xl bg-white p-3">
              <p className="inline-flex items-center gap-1.5 text-xs font-semibold text-ink-900">
                <Info size={13} /> What you know
              </p>
              <p className="mt-1 text-xs leading-relaxed text-ink-600">
                {q.information} {q.constraints}
              </p>
            </div>
          </div>
        </div>

        <h3 className="mt-4 font-semibold leading-snug text-ink-900">{q.question}</h3>
        <div role="radiogroup" aria-label="Answers" className="mt-3 space-y-2">
          {(optionOrder[q.id] ?? []).map((optIndex, shown) => {
            const selected = answers[index] === optIndex
            return (
              <button
                key={optIndex}
                type="button"
                role="radio"
                aria-checked={selected}
                disabled={busy}
                onClick={() => setAnswers((prev) => prev.map((a, i) => (i === index ? optIndex : a)))}
                className={`flex w-full items-start gap-3 rounded-xl border px-4 py-3 text-left text-sm transition-colors ${
                  selected ? 'border-emerald-400 bg-emerald-50' : 'border-ink-200 hover:border-ink-300 hover:bg-ink-50'
                }`}
              >
                <span
                  className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-xs font-semibold ${
                    selected ? 'bg-emerald-600 text-white' : 'bg-ink-100 text-ink-700'
                  }`}
                >
                  {String.fromCharCode(65 + shown)}
                </span>
                <span className="leading-snug text-ink-900">{q.options[optIndex]}</span>
              </button>
            )
          })}
        </div>

        {error && (
          <p role="alert" className="mt-3 text-sm text-red-600">
            {error}
          </p>
        )}

        <div className="mt-4 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => setIndex((v) => Math.max(0, v - 1))}
            disabled={index === 0 || busy}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-ink-600 transition-colors hover:text-ink-900 disabled:opacity-40"
          >
            <ArrowLeft size={15} /> Back
          </button>
          {last ? (
            <button
              type="button"
              onClick={() => void submit()}
              disabled={answered < questions.length || busy}
              className="press h-11 rounded-xl bg-emerald-600 px-5 text-sm font-semibold text-white shadow-e1 transition-colors hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {busy ? 'Grading…' : answered < questions.length ? `Answer all (${answered}/${questions.length})` : 'Submit answers'}
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setIndex((v) => Math.min(questions.length - 1, v + 1))}
              disabled={answers[index] === null}
              className="press inline-flex h-11 items-center gap-1.5 rounded-xl bg-emerald-600 px-5 text-sm font-semibold text-white shadow-e1 transition-colors hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Next <ArrowRight size={16} />
            </button>
          )}
        </div>
      </div>
    )
  }

  // Idle (or loading): the start screen.
  return (
    <div className="mt-4">
      <p className="leading-relaxed text-ink-700">
        Four real business situations. Read the brief, make the call, then see the answers and why.
      </p>
      {error && (
        <p role="alert" className="mt-3 text-sm text-red-600">
          {error}
        </p>
      )}
      <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2">
        <button
          type="button"
          disabled={Boolean(opensAt) || phase === 'loading'}
          onClick={() => void start()}
          className="press inline-flex h-11 items-center gap-1.5 rounded-xl bg-emerald-600 px-5 text-sm font-semibold text-white shadow-e1 transition-colors hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-ink-300"
        >
          {phase === 'loading' ? 'Getting your questions…' : 'Start the 4-question round'} <ArrowRight size={15} />
        </button>
        {opensAt ? <span className="text-sm text-ink-600">Opens again {retakeLabel(opensAt)}.</span> : fullLab}
      </div>
      {opensAt && (
        <button
          type="button"
          onClick={onContinue}
          className="press mt-3 inline-flex h-10 items-center gap-1.5 rounded-xl border border-emerald-300 px-4 text-sm font-semibold text-emerald-800 transition-colors hover:bg-emerald-50"
        >
          Finish module <ArrowRight size={15} />
        </button>
      )}
    </div>
  )
}
