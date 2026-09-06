import { useState } from 'react'
import { Link } from '@tanstack/react-router'
import { ArrowRight, BrainCircuit, RotateCw, Sparkles } from 'lucide-react'
import { vocabularyTerms } from '@/lib/vocabulary'
import { useVocabProgress } from '@/lib/vocabularyProgress'

function pickTerm(excludeId?: string) {
  const pool = excludeId ? vocabularyTerms.filter((t) => t.id !== excludeId) : vocabularyTerms
  return pool[Math.floor(Math.random() * pool.length)] ?? vocabularyTerms[0]
}

/**
 * Dashboard-sized bite: one marketing term at a time, reveal the definition,
 * mark it learned. Replaces the old "Recommended prompts" slot — same spot,
 * but building toward the full Vocabulary Builder on /practice rather than
 * just linking out to a prompt library.
 */
export function VocabularyCoach({ userKey }: { userKey: string }) {
  const { learnedCount, markLearned } = useVocabProgress(userKey)
  const [term, setTerm] = useState(() => pickTerm())
  const [revealed, setRevealed] = useState(false)

  function next(markCurrentLearned: boolean) {
    if (markCurrentLearned) markLearned(term.id)
    setTerm(pickTerm(term.id))
    setRevealed(false)
  }

  return (
    <section className="card rise-in p-5 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2.5">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-700">
              <BrainCircuit size={16} />
            </span>
            <h2 className="font-display text-lg font-semibold text-ink-900">Vocabulary Builder</h2>
          </div>
          <p className="mt-1.5 text-xs leading-relaxed text-ink-600">
            Your daily marketing word coach — one term at a time.
          </p>
        </div>
        <Link
          to="/practice"
          className="group inline-flex shrink-0 items-center gap-1 text-sm font-semibold text-brand-700 hover:text-brand-800"
        >
          Full builder
          <ArrowRight size={14} className="transition-transform group-hover:translate-x-0.5" />
        </Link>
      </div>

      <div className="mt-4 rounded-2xl border border-ink-900/[0.08] bg-ink-50 p-6 text-center">
        <span className="inline-flex rounded-full bg-white px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-brand-700 shadow-e1">
          {term.category}
        </span>
        <p className="mt-3 font-display text-2xl font-semibold leading-tight text-ink-900">
          {term.term}
        </p>

        {revealed ? (
          <p className="rise-in mt-3 text-sm leading-relaxed text-ink-700">{term.definition}</p>
        ) : (
          <button
            type="button"
            onClick={() => setRevealed(true)}
            className="press mt-4 inline-flex items-center gap-1.5 rounded-full bg-brand-600 px-4 py-2 text-sm font-semibold text-white shadow-e1 transition-colors hover:bg-brand-700"
          >
            <Sparkles size={14} />
            Reveal definition
          </button>
        )}
      </div>

      <div className="mt-4 flex items-center justify-between gap-3">
        <p className="text-xs font-medium text-ink-500">
          {learnedCount} word{learnedCount === 1 ? '' : 's'} learned
        </p>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => next(false)}
            className="inline-flex items-center gap-1.5 rounded-full border border-ink-300 px-3.5 py-1.5 text-xs font-semibold text-ink-700 transition-colors hover:bg-ink-100"
          >
            <RotateCw size={12} />
            Skip
          </button>
          {revealed && (
            <button
              type="button"
              onClick={() => next(true)}
              className="press inline-flex items-center gap-1.5 rounded-full bg-emerald-600 px-4 py-1.5 text-xs font-semibold text-white shadow-e1 transition-colors hover:bg-emerald-700"
            >
              Got it
              <ArrowRight size={12} />
            </button>
          )}
        </div>
      </div>
    </section>
  )
}
