import { useState } from 'react'
import { ChevronDown, Plus, X } from 'lucide-react'
import { DIFFICULTIES, blankQuestion, type Question } from '@/lib/programmeEngine'
import { AddButton, Area, ItemTools, NumberField, Select, Text, moved, replaced } from './fields'

const LETTER = 'ABCDEF'

function QuestionEditor({ q, onChange }: { q: Question; onChange: (q: Question) => void }) {
  const set = <K extends keyof Question>(k: K, v: Question[K]) => onChange({ ...q, [k]: v })
  return (
    <div className="space-y-3">
      <Area label="Scenario (optional)" value={q.scenario} onChange={(v) => set('scenario', v)} rows={2} placeholder="The situation the question is set in" />
      <Area label="Question" value={q.question} onChange={(v) => set('question', v)} rows={2} />
      <div>
        <p className="text-sm font-medium text-ink-800">Options · pick the right one</p>
        <ul className="mt-1.5 space-y-2">
          {q.options.map((o, i) => (
            <li key={i} className="flex items-center gap-2">
              <label className="flex shrink-0 cursor-pointer items-center gap-1.5 text-sm font-semibold text-ink-700" title="The right answer">
                <input
                  type="radio"
                  name={`correct-${q.id}`}
                  checked={q.correct_index === i}
                  onChange={() => set('correct_index', i)}
                  className="h-4 w-4 accent-emerald-600"
                />
                {LETTER[i]}
              </label>
              <input
                value={o}
                onChange={(e) => set('options', replaced(q.options, i, e.target.value))}
                className={`field ${q.correct_index === i ? 'border-emerald-400' : ''}`}
              />
              {q.options.length > 2 && (
                <button
                  type="button"
                  aria-label="Remove option"
                  onClick={() =>
                    onChange({
                      ...q,
                      options: q.options.filter((_, j) => j !== i),
                      correct_index: q.correct_index === i ? 0 : q.correct_index > i ? q.correct_index - 1 : q.correct_index,
                    })
                  }
                  className="rounded-lg p-1.5 text-ink-400 hover:bg-ink-100 hover:text-red-700"
                >
                  <X size={14} />
                </button>
              )}
            </li>
          ))}
        </ul>
        {q.options.length < 6 && (
          <button
            type="button"
            onClick={() => set('options', [...q.options, ''])}
            className="mt-2 inline-flex items-center gap-1 text-sm font-medium text-brand-700 hover:underline"
          >
            <Plus size={13} /> Add an option
          </button>
        )}
      </div>
      <Area label="Why the right answer is right (shown after the attempt)" value={q.explanation} onChange={(v) => set('explanation', v)} rows={2} />
      <div className="grid gap-3 sm:grid-cols-3">
        <Text label="Topic" value={q.topic} onChange={(v) => set('topic', v)} placeholder="e.g. Pivot tables" />
        <Select label="Difficulty" value={q.difficulty} options={DIFFICULTIES} onChange={(v) => set('difficulty', v)} />
        <NumberField label="Weight (points)" value={q.weight} min={1} onChange={(v) => set('weight', v)} />
      </div>
    </div>
  )
}

/** A quiz or the final assessment: questions that open one at a time. */
export function QuestionList({ questions, onChange }: { questions: Question[]; onChange: (q: Question[]) => void }) {
  const [open, setOpen] = useState<string>()
  return (
    <div>
      {questions.length === 0 && <p className="text-sm text-ink-500">No questions yet.</p>}
      <ol className="space-y-2">
        {questions.map((q, i) => {
          const isOpen = open === q.id
          return (
            <li key={q.id} className="rounded-xl border border-ink-200 bg-white">
              <div className="flex items-center gap-2 px-3 py-2">
                <button type="button" onClick={() => setOpen(isOpen ? undefined : q.id)} aria-expanded={isOpen} className="flex min-w-0 flex-1 items-center gap-2 text-left">
                  <span className="text-xs font-semibold tabular-nums text-ink-400">{i + 1}</span>
                  <span className="min-w-0 flex-1 truncate text-sm text-ink-900">{q.question || <span className="text-ink-400">Untitled question</span>}</span>
                  <span className="hidden shrink-0 text-xs text-ink-500 sm:inline">
                    {q.topic || 'no topic'} · {q.difficulty}
                  </span>
                  <ChevronDown size={15} className={`shrink-0 text-ink-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                </button>
                <ItemTools
                  index={i}
                  count={questions.length}
                  onMove={(to) => onChange(moved(questions, i, to))}
                  onRemove={() => onChange(questions.filter((_, j) => j !== i))}
                  removeLabel="Remove question"
                />
              </div>
              {isOpen && (
                <div className="border-t border-ink-900/[0.06] p-3">
                  <QuestionEditor q={q} onChange={(n) => onChange(replaced(questions, i, n))} />
                </div>
              )}
            </li>
          )
        })}
      </ol>
      <div className="mt-3">
        <AddButton
          onClick={() => {
            const q = blankQuestion()
            onChange([...questions, q])
            setOpen(q.id)
          }}
        >
          Add a question
        </AddButton>
      </div>
    </div>
  )
}
