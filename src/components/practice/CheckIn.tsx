import { useMemo, useState } from 'react'
import { Check, Lightbulb, Lock, RotateCcw, X } from 'lucide-react'
import type { CheckQuestion } from '@/content/dmTopics'

/**
 * Check-in: a few short scenario questions inside a topic. Each one has a hint,
 * a locked answer (no changing it after) and a reason straight away, right or
 * wrong. A question answered wrong comes back at the end, with its options in a
 * new order, until it is answered right. For learning only: nothing here is a
 * score, and the answers ship with the page.
 */

const LETTERS = ['A', 'B', 'C', 'D']

interface Shown {
  q: CheckQuestion
  /** indexes into q.options, in the order shown */
  order: number[]
}

function shuffle<T>(items: T[]): T[] {
  const a = [...items]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

const present = (qs: CheckQuestion[]): Shown[] => qs.map((q) => ({ q, order: shuffle([0, 1, 2, 3]) }))

export function CheckIn({
  questions,
  done,
  firstTry,
  onFinish,
}: {
  questions: CheckQuestion[]
  /** already finished before: show the summary, with a way to go again */
  done: boolean
  firstTry: number
  /** every question answered right; `firstTry` were right the first time */
  onFinish: (firstTry: number) => void
}) {
  const [round, setRound] = useState(0)
  const [queue, setQueue] = useState<Shown[]>(() => present(questions))
  const [pos, setPos] = useState(0)
  const [picked, setPicked] = useState<number | null>(null) // index into the shown order
  const [locked, setLocked] = useState(false)
  const [hint, setHint] = useState(false)
  const [error, setError] = useState('')
  const [missed, setMissed] = useState<CheckQuestion[]>([])
  const [rights, setRights] = useState(0) // right the first time, this run
  const [replay, setReplay] = useState(false)
  const [finished, setFinished] = useState(false)

  const current = queue[pos]
  const correct = useMemo(
    () => (current && picked !== null ? current.order[picked] === current.q.answer : false),
    [current, picked],
  )

  function restart() {
    setRound(0)
    setQueue(present(questions))
    setPos(0)
    setPicked(null)
    setLocked(false)
    setHint(false)
    setError('')
    setMissed([])
    setRights(0)
    setFinished(false)
    setReplay(true)
  }

  function lock() {
    if (picked === null) {
      setError('Choose an answer first.')
      return
    }
    setError('')
    setLocked(true)
    if (!correct) setMissed((m) => [...m, current.q])
    else if (round === 0) setRights((r) => r + 1)
  }

  function next() {
    setPicked(null)
    setLocked(false)
    setHint(false)
    setError('')
    if (pos + 1 < queue.length) {
      setPos(pos + 1)
      return
    }
    if (missed.length > 0) {
      // The ones that were missed come back, in a new order.
      setQueue(present(missed))
      setMissed([])
      setPos(0)
      setRound((r) => r + 1)
      return
    }
    setFinished(true)
    onFinish(rights)
  }

  const total = questions.length

  if (done && !replay) {
    return (
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl bg-emerald-50 p-4">
        <p className="text-sm text-emerald-900">
          <span className="font-semibold">Check-in complete.</span> You got {firstTry} of {total} right the first time.
        </p>
        <button
          type="button"
          onClick={restart}
          className="press inline-flex h-9 items-center gap-1.5 rounded-lg border border-emerald-300 px-3 text-sm font-semibold text-emerald-800 transition-colors hover:bg-emerald-100"
        >
          <RotateCcw size={14} /> Go again
        </button>
      </div>
    )
  }

  if (finished) {
    return (
      <div className="mt-4 rounded-xl bg-emerald-50 p-4">
        <p className="font-semibold text-emerald-900">Check-in complete</p>
        <p className="mt-1 text-sm leading-relaxed text-emerald-900">
          {rights === total
            ? `All ${total} right the first time. You’ve got this topic’s main ideas.`
            : `${rights} of ${total} right the first time, and every question right in the end. The ones you missed are the ones worth another look.`}
        </p>
        <button
          type="button"
          onClick={restart}
          className="press mt-3 inline-flex h-9 items-center gap-1.5 rounded-lg border border-emerald-300 px-3 text-sm font-semibold text-emerald-800 transition-colors hover:bg-emerald-100"
        >
          <RotateCcw size={14} /> Go again
        </button>
      </div>
    )
  }

  const retrying = round > 0

  return (
    <div className="mt-4 overflow-hidden rounded-xl border border-ink-200 md:grid md:grid-cols-[minmax(0,1fr)_16rem]">
      <div className="p-4 sm:p-5">
        <div className="flex items-center justify-between gap-2 text-xs text-ink-500">
          <span>
            {retrying ? 'Try again' : 'Question'} {pos + 1} of {queue.length}
          </span>
          <span className="inline-flex gap-1" aria-hidden>
            {queue.map((_, i) => (
              <span key={i} className={`h-1.5 w-6 rounded-full ${i < pos ? 'bg-sky-600' : i === pos ? 'bg-sky-300' : 'bg-ink-200'}`} />
            ))}
          </span>
        </div>
        {retrying && pos === 0 && !locked && (
          <p className="mt-2 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800">
            These are the ones you missed. The answers are in a new order.
          </p>
        )}
        <p className="mt-3 text-sm leading-relaxed text-ink-600">{current.q.scenario}</p>
        <p className="mt-1 font-semibold leading-snug text-ink-900">{current.q.question}</p>

        <div role="radiogroup" aria-label="Answers" className="mt-3 grid gap-2 sm:grid-cols-2">
          {current.order.map((optIndex, i) => {
            const isPicked = picked === i
            const isAnswer = optIndex === current.q.answer
            const state = !locked
              ? isPicked
                ? 'border-sky-400 bg-sky-50'
                : 'border-ink-200 hover:border-ink-300 hover:bg-ink-50'
              : isAnswer
                ? 'border-emerald-400 bg-emerald-50'
                : isPicked
                  ? 'border-red-300 bg-red-50'
                  : 'border-ink-200 opacity-70'
            return (
              <button
                key={optIndex}
                type="button"
                role="radio"
                aria-checked={isPicked}
                disabled={locked}
                onClick={() => {
                  setPicked(i)
                  setError('')
                }}
                className={`flex items-start gap-2.5 rounded-xl border p-3 text-left text-sm transition-colors ${state}`}
              >
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-ink-100 text-xs font-semibold text-ink-700">
                  {locked && isAnswer ? <Check size={14} strokeWidth={3} className="text-emerald-700" /> : locked && isPicked ? <X size={14} strokeWidth={3} className="text-red-600" /> : LETTERS[i]}
                </span>
                <span className="leading-snug text-ink-900">{current.q.options[optIndex]}</span>
              </button>
            )
          })}
        </div>

        {locked && (
          <div
            role="status"
            className={`mt-3 rounded-xl p-3.5 text-sm leading-relaxed ${correct ? 'bg-emerald-50 text-emerald-900' : 'bg-amber-50 text-amber-900'}`}
          >
            <p className="font-semibold">{correct ? 'Right.' : 'Not quite. This one will come back.'}</p>
            <p className="mt-1">{current.q.why}</p>
          </div>
        )}

        {error && (
          <p role="alert" className="mt-2 text-sm text-red-600">
            {error}
          </p>
        )}

        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-ink-200 pt-3">
          <p className="flex items-center gap-1.5 text-xs text-ink-500">
            <Lock size={13} /> You can’t change an answer once it’s locked.
          </p>
          {locked ? (
            <button
              type="button"
              onClick={next}
              className="press h-10 rounded-xl bg-sky-600 px-4 text-sm font-semibold text-white shadow-e1 transition-colors hover:bg-sky-700"
            >
              {pos + 1 < queue.length ? 'Next question' : missed.length > 0 ? 'Try the missed ones again' : 'Finish'}
            </button>
          ) : (
            <button
              type="button"
              onClick={lock}
              className="press inline-flex h-10 items-center gap-1.5 rounded-xl bg-sky-600 px-4 text-sm font-semibold text-white shadow-e1 transition-colors hover:bg-sky-700"
            >
              <Lock size={14} /> Lock answer
            </button>
          )}
        </div>
      </div>

      <aside className="border-t border-ink-200 bg-ink-50 p-4 sm:p-5 md:border-l md:border-t-0">
        <p className="flex items-center gap-1.5 font-semibold text-ink-900">
          <Lightbulb size={15} className="text-sky-600" /> Need a hint?
        </p>
        <p className="mt-1 text-sm text-ink-600">Use a hint to get unstuck.</p>
        <button
          type="button"
          disabled={locked}
          onClick={() => setHint((h) => !h)}
          aria-expanded={hint}
          className="press mt-3 h-9 rounded-lg border border-sky-300 px-3 text-sm font-semibold text-sky-700 transition-colors hover:bg-sky-50 disabled:opacity-50"
        >
          {hint && !locked ? 'Hide hint' : 'Show hint'}
        </button>
        {hint && !locked && <p className="mt-3 rounded-lg bg-emerald-50 p-3 text-sm leading-relaxed text-emerald-900">{current.q.hint}</p>}
      </aside>
    </div>
  )
}
