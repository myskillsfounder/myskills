import { useState } from 'react'
import { ArrowLeft, ArrowRight, Check, RotateCcw, X } from 'lucide-react'
import type { VocabTerm } from '@/lib/vocabulary'

interface VocabQuestion {
  term: VocabTerm
  options: string[]
  correctIndex: number
}

function shuffled<T>(items: T[]): T[] {
  return [...items].sort(() => Math.random() - 0.5)
}

function buildRound(bank: VocabTerm[], size: number): VocabQuestion[] {
  return shuffled(bank)
    .slice(0, size)
    .map((term) => {
      const distractors = shuffled(bank.filter((t) => t.id !== term.id)).slice(0, 3)
      const options = shuffled([term.definition, ...distractors.map((d) => d.definition)])
      return { term, options, correctIndex: options.indexOf(term.definition) }
    })
}

const ROUND_SIZE = 10

/**
 * Multiple-choice round: term shown, pick the matching definition from four
 * options. A correct answer marks that term "learned" — the same store the
 * dashboard's Vocabulary Coach reads from, so progress adds up either way.
 */
export function VocabularyQuiz({
  bank,
  onBack,
  onTermLearned,
}: {
  bank: VocabTerm[]
  onBack: () => void
  onTermLearned: (id: string) => void
}) {
  const size = Math.min(ROUND_SIZE, bank.length)
  const [round, setRound] = useState(() => buildRound(bank, size))
  const [index, setIndex] = useState(0)
  const [selected, setSelected] = useState<number | null>(null)
  const [score, setScore] = useState(0)
  const [phase, setPhase] = useState<'quiz' | 'result'>('quiz')

  const q = round[index]
  const isLast = index === round.length - 1

  function choose(i: number) {
    if (selected !== null) return
    setSelected(i)
    if (i === q.correctIndex) {
      setScore((s) => s + 1)
      onTermLearned(q.term.id)
    }
  }

  function next() {
    if (isLast) {
      setPhase('result')
      return
    }
    setIndex((v) => v + 1)
    setSelected(null)
  }

  function restart() {
    setRound(buildRound(bank, size))
    setIndex(0)
    setSelected(null)
    setScore(0)
    setPhase('quiz')
  }

  if (phase === 'result') {
    const pct = Math.round((score / round.length) * 100)
    const passed = pct >= 70
    return (
      <div className="mx-auto max-w-xl">
        <div className="card p-8 text-center">
          <div
            className={`mx-auto flex h-16 w-16 items-center justify-center rounded-full ${
              passed ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'
            }`}
          >
            <Check size={30} />
          </div>
          <h1 className="mt-4 font-display text-3xl font-semibold text-ink-900">{pct}%</h1>
          <p className="mt-1 text-sm text-ink-600">
            You matched {score} of {round.length} terms correctly.
          </p>
          <div className="mt-6 flex flex-col gap-2.5 sm:flex-row sm:justify-center">
            <button
              type="button"
              onClick={restart}
              className="press inline-flex items-center justify-center gap-1.5 rounded-full bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white shadow-e1 transition-colors hover:bg-brand-700"
            >
              <RotateCcw size={15} />
              Practice again
            </button>
            <button
              type="button"
              onClick={onBack}
              className="inline-flex items-center justify-center gap-1.5 rounded-full border border-ink-300 px-5 py-2.5 text-sm font-semibold text-ink-800 transition-colors hover:bg-ink-100"
            >
              Back to practice modes
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-xl">
      <div className="mb-5 flex items-center justify-between text-xs font-medium text-ink-500">
        <button
          type="button"
          onClick={onBack}
          className="group inline-flex items-center gap-1.5 text-ink-600 transition-colors hover:text-ink-900"
        >
          <ArrowLeft size={15} className="transition-transform duration-300 group-hover:-translate-x-1" />
          All practice modes
        </button>
        <span>
          {index + 1} / {round.length}
        </span>
      </div>

      <div className="mb-5 h-1.5 w-full overflow-hidden rounded-full bg-ink-200">
        <div
          className="h-full rounded-full bg-brand-600 transition-all"
          style={{ width: `${(index / round.length) * 100}%` }}
        />
      </div>

      <div className="card p-6">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-brand-600">
          {q.term.category}
        </p>
        <h2 className="mt-1.5 font-display text-2xl font-semibold leading-tight text-ink-900">
          {q.term.term}
        </h2>
        <p className="mt-1 text-sm text-ink-600">Which definition matches this term?</p>

        <div className="mt-5 space-y-2.5">
          {q.options.map((opt, i) => {
            const showState = selected !== null
            const isCorrect = i === q.correctIndex
            const isSelected = selected === i
            return (
              <button
                key={i}
                type="button"
                onClick={() => choose(i)}
                disabled={showState}
                className={`flex w-full items-start gap-3 rounded-xl border px-4 py-3 text-left text-sm transition-colors ${
                  showState && isCorrect
                    ? 'border-emerald-400 bg-emerald-50 text-emerald-900'
                    : showState && isSelected
                      ? 'border-red-300 bg-red-50 text-red-800'
                      : 'border-ink-300 text-ink-800 hover:border-ink-400 hover:bg-ink-100'
                }`}
              >
                <span
                  className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border text-xs ${
                    showState && isCorrect
                      ? 'border-emerald-500 bg-emerald-500 text-white'
                      : showState && isSelected
                        ? 'border-red-400 bg-red-400 text-white'
                        : 'border-ink-300'
                  }`}
                >
                  {showState && isCorrect ? (
                    <Check size={12} />
                  ) : showState && isSelected ? (
                    <X size={12} />
                  ) : (
                    String.fromCharCode(65 + i)
                  )}
                </span>
                {opt}
              </button>
            )
          })}
        </div>
      </div>

      <div className="mt-5 flex justify-end">
        <button
          type="button"
          onClick={next}
          disabled={selected === null}
          className="inline-flex items-center gap-1.5 rounded-full bg-brand-600 px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isLast ? 'See results' : 'Next'}
          <ArrowRight size={16} />
        </button>
      </div>
    </div>
  )
}
