import { useEffect, useState } from 'react'
import { errorMessage } from '@/lib/errors'
import { createFileRoute } from '@tanstack/react-router'
import { ArrowLeft, ClipboardList, Plus, Trash2 } from 'lucide-react'
import {
  deleteAssessmentQuestion,
  fetchAllAssessmentQuestions,
  saveAssessmentQuestion,
  type AdminAssessmentQuestion,
  type AssessmentQuestionInput,
} from '@/lib/admin'
import { assessmentCategories } from '@/lib/initialAssessment'
import { Alert, Button, EmptyState, Input, PageHeader, Skeleton, Textarea } from '@/components/ui'

export const Route = createFileRoute('/admin/assessment-questions')({
  component: AssessmentQuestionsPage,
})

const EMPTY: AssessmentQuestionInput = {
  category: assessmentCategories[0],
  question: '',
  options: ['', '', '', ''],
  sort_order: 0,
  correct_index: 0,
  explanation: '',
}

function Editor({
  initial,
  onCancel,
  onSaved,
}: {
  initial: AssessmentQuestionInput
  onCancel: () => void
  onSaved: () => void
}) {
  const [form, setForm] = useState(initial)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string>()

  function setOption(i: number, value: string) {
    setForm((f) => ({ ...f, options: f.options.map((o, oi) => (oi === i ? value : o)) }))
  }

  function addOption() {
    setForm((f) => ({ ...f, options: [...f.options, ''] }))
  }

  function removeOption(i: number) {
    setForm((f) => {
      const options = f.options.filter((_, oi) => oi !== i)
      // Keep pointing at a valid option after the list shifts — clamp rather
      // than silently leaving correct_index referencing whatever slid into
      // this slot.
      let correct_index = f.correct_index
      if (i === f.correct_index) correct_index = 0
      else if (i < f.correct_index) correct_index -= 1
      return { ...f, options, correct_index }
    })
  }

  async function save() {
    if (!form.category.trim()) return setError('A category is required.')
    if (!form.question.trim()) return setError('A question is required.')

    setSaving(true)
    setError(undefined)
    try {
      await saveAssessmentQuestion(form)
      onSaved()
    } catch (e) {
      setError(errorMessage(e))
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="card space-y-5 p-6">
      <button
        type="button"
        onClick={onCancel}
        className="inline-flex items-center gap-1.5 text-sm font-medium text-ink-600 hover:text-ink-900"
      >
        <ArrowLeft size={16} /> Back to questions
      </button>

      <div>
        <Input
          label="Category"
          list="assessment-categories"
          value={form.category}
          onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
          hint="Pick an existing category or type a new one."
        />
        <datalist id="assessment-categories">
          {assessmentCategories.map((c) => (
            <option key={c} value={c} />
          ))}
        </datalist>
      </div>

      <Textarea
        label="Question"
        rows={2}
        value={form.question}
        onChange={(e) => setForm((f) => ({ ...f, question: e.target.value }))}
      />

      <div>
        <p className="mb-1.5 text-sm font-medium text-ink-800">
          Options <span className="font-normal text-ink-400">— select the correct one</span>
        </p>
        <div className="space-y-2">
          {form.options.map((opt, i) => (
            <div key={i} className="flex items-center gap-2.5">
              <input
                type="radio"
                name="correct"
                checked={form.correct_index === i}
                onChange={() => setForm((f) => ({ ...f, correct_index: i }))}
                className="h-4 w-4 shrink-0 accent-brand-600"
                aria-label={`Option ${i + 1} is correct`}
              />
              <input
                value={opt}
                onChange={(e) => setOption(i, e.target.value)}
                placeholder={`Option ${i + 1}`}
                className="field flex-1"
              />
              {form.options.length > 2 && (
                <button
                  type="button"
                  onClick={() => removeOption(i)}
                  aria-label={`Remove option ${i + 1}`}
                  className="shrink-0 rounded-lg p-2 text-ink-400 hover:bg-ink-100 hover:text-red-600"
                >
                  <Trash2 size={15} />
                </button>
              )}
            </div>
          ))}
        </div>
        <Button type="button" variant="ghost" size="sm" icon={Plus} onClick={addOption} className="mt-2">
          Add option
        </Button>
      </div>

      <Textarea
        label="Explanation"
        rows={2}
        required={false}
        value={form.explanation}
        onChange={(e) => setForm((f) => ({ ...f, explanation: e.target.value }))}
        hint="Shown to the test-taker after they finish, next to what they missed."
      />

      <Input
        label="Sort order"
        type="number"
        value={String(form.sort_order)}
        onChange={(e) => setForm((f) => ({ ...f, sort_order: Number(e.target.value) || 0 }))}
        hint="Lower numbers appear first in the assessment."
      />

      {error && (
        <Alert tone="danger" title="Couldn’t save">
          <p>{error}</p>
        </Alert>
      )}

      <div className="flex gap-2">
        <Button onClick={() => void save()} disabled={saving}>
          {saving ? 'Saving…' : 'Save question'}
        </Button>
        <Button variant="ghost" onClick={onCancel} disabled={saving}>
          Cancel
        </Button>
      </div>
    </div>
  )
}

function toInput(q: AdminAssessmentQuestion): AssessmentQuestionInput {
  return {
    id: q.id,
    category: q.category,
    question: q.question,
    options: q.options,
    sort_order: q.sort_order,
    correct_index: q.correct_index,
    explanation: q.explanation,
  }
}

function AssessmentQuestionsPage() {
  const [questions, setQuestions] = useState<AdminAssessmentQuestion[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string>()
  const [editing, setEditing] = useState<AssessmentQuestionInput | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<string>()

  async function load() {
    setLoading(true)
    setError(undefined)
    try {
      setQuestions(await fetchAllAssessmentQuestions())
    } catch (e) {
      setError(errorMessage(e))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void load()
  }, [])

  async function remove(id: string) {
    try {
      await deleteAssessmentQuestion(id)
      setConfirmDelete(undefined)
      await load()
    } catch (e) {
      setError(errorMessage(e))
    }
  }

  if (editing) {
    return (
      <Editor
        initial={editing}
        onCancel={() => setEditing(null)}
        onSaved={() => {
          setEditing(null)
          void load()
        }}
      />
    )
  }

  // Known categories first (in their assessment order), then anything custom
  // an admin has since added, grouped last.
  const knownCategories = assessmentCategories.filter((c) => questions.some((q) => q.category === c))
  const customCategories = [...new Set(questions.map((q) => q.category))].filter(
    (c) => !assessmentCategories.includes(c),
  )
  const groups = [...knownCategories, ...customCategories]

  return (
    <>
      <PageHeader
        eyebrow="Admin"
        title="Assessment questions"
        subtitle="The one-time initial assessment's question bank. Correct answers stay server-side until you save a change here."
        actions={
          <Button
            icon={Plus}
            onClick={() =>
              setEditing({ ...EMPTY, sort_order: (questions.at(-1)?.sort_order ?? -1) + 1 })
            }
          >
            New question
          </Button>
        }
      />

      {error && (
        <div className="mb-5">
          <Alert tone="danger" title="Something went wrong">
            <p>{error}</p>
          </Alert>
        </div>
      )}

      {loading ? (
        <Skeleton className="h-64 w-full" />
      ) : questions.length === 0 ? (
        <EmptyState
          icon={ClipboardList}
          title="No questions yet"
          description="Add the first question in the assessment bank."
          action={
            <Button icon={Plus} onClick={() => setEditing({ ...EMPTY })}>
              New question
            </Button>
          }
        />
      ) : (
        <div className="space-y-8">
          {groups.map((category) => (
            <section key={category}>
              <h2 className="mb-3 text-xs font-semibold uppercase tracking-wide text-ink-500">
                {category}
              </h2>
              <div className="space-y-3">
                {questions
                  .filter((q) => q.category === category)
                  .map((q) => (
                    <article key={q.id} className="card flex flex-wrap items-start gap-4 p-4">
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-ink-900">{q.question}</p>
                        <ul className="mt-2 space-y-0.5 text-sm">
                          {q.options.map((opt, i) => (
                            <li
                              key={i}
                              className={
                                i === q.correct_index
                                  ? 'font-medium text-emerald-700'
                                  : 'text-ink-500'
                              }
                            >
                              {i === q.correct_index ? '✓ ' : '— '}
                              {opt}
                            </li>
                          ))}
                        </ul>
                      </div>

                      <div className="flex shrink-0 gap-2">
                        <Button size="sm" variant="secondary" onClick={() => setEditing(toInput(q))}>
                          Edit
                        </Button>
                        {confirmDelete === q.id ? (
                          <>
                            <Button size="sm" variant="danger" onClick={() => void remove(q.id)}>
                              Confirm
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => setConfirmDelete(undefined)}
                            >
                              Cancel
                            </Button>
                          </>
                        ) : (
                          <Button
                            size="sm"
                            variant="ghost"
                            icon={Trash2}
                            onClick={() => setConfirmDelete(q.id)}
                          >
                            Delete
                          </Button>
                        )}
                      </div>
                    </article>
                  ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </>
  )
}
