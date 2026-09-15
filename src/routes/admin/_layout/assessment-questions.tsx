import { useEffect, useState } from 'react'
import { errorMessage } from '@/lib/errors'
import { createFileRoute } from '@tanstack/react-router'
import { ArrowLeft, ClipboardList, FolderPlus, Layers, Plus, Trash2 } from 'lucide-react'
import {
  deleteAssessmentQuestion,
  deletePracticeQuestionSet,
  deletePracticeSetQuestion,
  fetchAllAssessmentQuestions,
  fetchPracticeQuestionSets,
  fetchPracticeSetQuestions,
  saveAssessmentQuestion,
  savePracticeQuestionSet,
  savePracticeSetQuestion,
  type AdminAssessmentQuestion,
  type PracticeQuestionSet,
  type PracticeSetQuestion,
} from '@/lib/admin'
import { assessmentCategories } from '@/lib/initialAssessment'
import { RequireSection } from '@/components/admin/AdminSectionGate'
import { Alert, Button, EmptyState, Input, PageHeader, Skeleton, Textarea } from '@/components/ui'

export const Route = createFileRoute('/admin/_layout/assessment-questions')({
  component: () => (
    <RequireSection section="assessment">
      <AssessmentQuestionsPage />
    </RequireSection>
  ),
})

/** Shared shape between an initial-assessment question and a practice-set
 *  question — same MCQ fields either way, just saved to a different table. */
interface QuestionFormValue {
  id?: string
  category: string
  question: string
  options: string[]
  sort_order: number
  correct_index: number
  explanation: string
}

/* ============================================================================
 * Generic question editor — used for both the initial assessment and any
 * practice set, since the fields are identical. Only what happens on save
 * differs, which the caller supplies.
 * ========================================================================== */
function QuestionEditor({
  initial,
  categorySuggestions,
  onCancel,
  onSave,
}: {
  initial: QuestionFormValue
  categorySuggestions?: string[]
  onCancel: () => void
  onSave: (value: QuestionFormValue) => Promise<void>
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
      let correct_index = f.correct_index
      if (i === f.correct_index) correct_index = 0
      else if (i < f.correct_index) correct_index -= 1
      return { ...f, options, correct_index }
    })
  }

  async function save() {
    if (categorySuggestions && !form.category.trim()) return setError('A category is required.')
    if (!form.question.trim()) return setError('A question is required.')

    setSaving(true)
    setError(undefined)
    try {
      await onSave(form)
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
        <ArrowLeft size={16} /> Back
      </button>

      {categorySuggestions && (
        <div>
          <Input
            label="Category"
            list="question-categories"
            value={form.category}
            onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
            hint="Pick an existing category or type a new one."
          />
          <datalist id="question-categories">
            {categorySuggestions.map((c) => (
              <option key={c} value={c} />
            ))}
          </datalist>
        </div>
      )}

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
        hint="Shown after finishing, next to what was missed."
      />

      <Input
        label="Sort order"
        type="number"
        value={String(form.sort_order)}
        onChange={(e) => setForm((f) => ({ ...f, sort_order: Number(e.target.value) || 0 }))}
        hint="Lower numbers appear first."
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

function QuestionList<T extends { id: string; question: string; options: string[]; correct_index: number }>({
  questions,
  onEdit,
  onDelete,
}: {
  questions: T[]
  onEdit: (q: T) => void
  onDelete: (id: string) => void
}) {
  const [confirmDelete, setConfirmDelete] = useState<string>()
  return (
    <div className="space-y-3">
      {questions.map((q) => (
        <article key={q.id} className="card flex flex-wrap items-start gap-4 p-4">
          <div className="min-w-0 flex-1">
            <p className="font-medium text-ink-900">{q.question}</p>
            <ul className="mt-2 space-y-0.5 text-sm">
              {q.options.map((opt, i) => (
                <li key={i} className={i === q.correct_index ? 'font-medium text-emerald-700' : 'text-ink-500'}>
                  {i === q.correct_index ? '✓ ' : '— '}
                  {opt}
                </li>
              ))}
            </ul>
          </div>
          <div className="flex shrink-0 gap-2">
            <Button size="sm" variant="secondary" onClick={() => onEdit(q)}>
              Edit
            </Button>
            {confirmDelete === q.id ? (
              <>
                <Button size="sm" variant="danger" onClick={() => onDelete(q.id)}>
                  Confirm
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setConfirmDelete(undefined)}>
                  Cancel
                </Button>
              </>
            ) : (
              <Button size="sm" variant="ghost" icon={Trash2} onClick={() => setConfirmDelete(q.id)}>
                Delete
              </Button>
            )}
          </div>
        </article>
      ))}
    </div>
  )
}

/* ============================================================================
 * Initial assessment card content — the original single-set editor, grouped
 * by category. Unchanged behavior, now reachable from the hub.
 * ========================================================================== */
function InitialAssessmentView({ onBack }: { onBack: () => void }) {
  const [questions, setQuestions] = useState<AdminAssessmentQuestion[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string>()
  const [editing, setEditing] = useState<QuestionFormValue | null>(null)

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
      await load()
    } catch (e) {
      setError(errorMessage(e))
    }
  }

  if (editing) {
    return (
      <QuestionEditor
        initial={editing}
        categorySuggestions={assessmentCategories}
        onCancel={() => setEditing(null)}
        onSave={async (value) => {
          await saveAssessmentQuestion(value)
          setEditing(null)
          await load()
        }}
      />
    )
  }

  const knownCategories = assessmentCategories.filter((c) => questions.some((q) => q.category === c))
  const customCategories = [...new Set(questions.map((q) => q.category))].filter(
    (c) => !assessmentCategories.includes(c),
  )
  const groups = [...knownCategories, ...customCategories]

  return (
    <div className="space-y-5">
      <button
        type="button"
        onClick={onBack}
        className="inline-flex items-center gap-1.5 text-sm font-medium text-ink-600 hover:text-ink-900"
      >
        <ArrowLeft size={16} /> Back to Assessment
      </button>

      <PageHeader
        eyebrow="Initial Assessment"
        title="Question bank"
        subtitle="The one-time initial assessment. Correct answers stay server-side until you save a change here."
        actions={
          <Button
            icon={Plus}
            onClick={() =>
              setEditing({
                category: assessmentCategories[0],
                question: '',
                options: ['', '', '', ''],
                sort_order: (questions.at(-1)?.sort_order ?? -1) + 1,
                correct_index: 0,
                explanation: '',
              })
            }
          >
            New question
          </Button>
        }
      />

      {error && (
        <Alert tone="danger" title="Something went wrong">
          <p>{error}</p>
        </Alert>
      )}

      {loading ? (
        <Skeleton className="h-64 w-full" />
      ) : questions.length === 0 ? (
        <EmptyState icon={ClipboardList} title="No questions yet" description="Add the first one." />
      ) : (
        <div className="space-y-8">
          {groups.map((category) => (
            <section key={category}>
              <h2 className="mb-3 text-xs font-semibold uppercase tracking-wide text-ink-500">{category}</h2>
              <QuestionList
                questions={questions.filter((q) => q.category === category)}
                onEdit={(q) => setEditing(q)}
                onDelete={(id) => void remove(id)}
              />
            </section>
          ))}
        </div>
      )}
    </div>
  )
}

/* ============================================================================
 * A practice set's questions — flat list, no category grouping (a set is
 * one cohesive quiz), plus rename/delete for the set itself.
 * ========================================================================== */
function PracticeSetView({
  set,
  onBack,
  onSetChanged,
}: {
  set: PracticeQuestionSet
  onBack: () => void
  onSetChanged: () => void
}) {
  const [questions, setQuestions] = useState<PracticeSetQuestion[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string>()
  const [editing, setEditing] = useState<QuestionFormValue | null>(null)
  const [editingSet, setEditingSet] = useState(false)
  const [setForm, setSetForm] = useState({ name: set.name, description: set.description })
  const [savingSet, setSavingSet] = useState(false)

  async function load() {
    setLoading(true)
    setError(undefined)
    try {
      setQuestions(await fetchPracticeSetQuestions(set.id))
    } catch (e) {
      setError(errorMessage(e))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [set.id])

  async function remove(id: string) {
    try {
      await deletePracticeSetQuestion(id)
      await load()
    } catch (e) {
      setError(errorMessage(e))
    }
  }

  async function saveSetDetails() {
    if (!setForm.name.trim()) return setError('A name is required.')
    setSavingSet(true)
    setError(undefined)
    try {
      await savePracticeQuestionSet({ id: set.id, ...setForm, sort_order: set.sort_order })
      setEditingSet(false)
      onSetChanged()
    } catch (e) {
      setError(errorMessage(e))
    } finally {
      setSavingSet(false)
    }
  }

  if (editing) {
    return (
      <QuestionEditor
        initial={editing}
        onCancel={() => setEditing(null)}
        onSave={async (value) => {
          await savePracticeSetQuestion({ ...value, set_id: set.id })
          setEditing(null)
          await load()
        }}
      />
    )
  }

  return (
    <div className="space-y-5">
      <button
        type="button"
        onClick={onBack}
        className="inline-flex items-center gap-1.5 text-sm font-medium text-ink-600 hover:text-ink-900"
      >
        <ArrowLeft size={16} /> Back to Assessment
      </button>

      {editingSet ? (
        <div className="card space-y-4 p-6">
          <Input
            label="Set name"
            value={setForm.name}
            onChange={(e) => setSetForm((f) => ({ ...f, name: e.target.value }))}
          />
          <Textarea
            label="Description"
            required={false}
            rows={2}
            value={setForm.description}
            onChange={(e) => setSetForm((f) => ({ ...f, description: e.target.value }))}
          />
          <div className="flex gap-2">
            <Button onClick={() => void saveSetDetails()} disabled={savingSet}>
              {savingSet ? 'Saving…' : 'Save'}
            </Button>
            <Button variant="ghost" onClick={() => setEditingSet(false)} disabled={savingSet}>
              Cancel
            </Button>
          </div>
        </div>
      ) : (
        <PageHeader
          eyebrow="Practice set"
          title={set.name}
          subtitle={set.description || undefined}
          actions={
            <div className="flex gap-2">
              <Button variant="secondary" onClick={() => setEditingSet(true)}>
                Rename
              </Button>
              <Button
                icon={Plus}
                onClick={() =>
                  setEditing({
                    category: '',
                    question: '',
                    options: ['', '', '', ''],
                    sort_order: (questions.at(-1)?.sort_order ?? -1) + 1,
                    correct_index: 0,
                    explanation: '',
                  })
                }
              >
                New question
              </Button>
            </div>
          }
        />
      )}

      {error && (
        <Alert tone="danger" title="Something went wrong">
          <p>{error}</p>
        </Alert>
      )}

      {loading ? (
        <Skeleton className="h-64 w-full" />
      ) : questions.length === 0 ? (
        <EmptyState icon={ClipboardList} title="No questions yet" description="Add the first one to this set." />
      ) : (
        <QuestionList questions={questions} onEdit={(q) => setEditing(q)} onDelete={(id) => void remove(id)} />
      )}
    </div>
  )
}

/* ============================================================================
 * Hub — one card for the initial assessment, one per practice set, plus a
 * form to create a new set.
 * ========================================================================== */
function Hub({
  sets,
  loading,
  error,
  onOpenInitial,
  onOpenSet,
  onCreateSet,
  onDeleteSet,
}: {
  sets: PracticeQuestionSet[]
  loading: boolean
  error?: string
  onOpenInitial: () => void
  onOpenSet: (set: PracticeQuestionSet) => void
  onCreateSet: (name: string, description: string) => Promise<void>
  onDeleteSet: (id: string) => void
}) {
  const [creating, setCreating] = useState(false)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [saving, setSaving] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState<string>()

  async function create() {
    if (!name.trim()) return
    setSaving(true)
    try {
      await onCreateSet(name, description)
      setName('')
      setDescription('')
      setCreating(false)
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      <PageHeader
        eyebrow="Admin"
        title="Assessment"
        subtitle="The one-time initial assessment, plus any number of additional practice question sets."
        actions={
          <Button icon={FolderPlus} onClick={() => setCreating(true)}>
            New set
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

      {creating && (
        <div className="card mb-5 space-y-4 p-6">
          <p className="text-xs font-semibold uppercase tracking-wide text-ink-400">New practice set</p>
          <Input label="Name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. SEO refresher" />
          <Textarea
            label="Description"
            required={false}
            rows={2}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
          <div className="flex gap-2">
            <Button onClick={() => void create()} disabled={saving || !name.trim()}>
              {saving ? 'Creating…' : 'Create set'}
            </Button>
            <Button variant="ghost" onClick={() => setCreating(false)} disabled={saving}>
              Cancel
            </Button>
          </div>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <button
          type="button"
          onClick={onOpenInitial}
          className="card flex flex-col gap-2 p-5 text-left transition-shadow hover:shadow-e2"
        >
          <ClipboardList className="text-brand-600" size={20} />
          <p className="font-medium text-ink-900">Initial Assessment</p>
          <p className="text-sm text-ink-500">The one-time, gated benchmark quiz.</p>
        </button>

        {loading ? (
          <Skeleton className="h-32 w-full" />
        ) : (
          sets.map((set) => (
            <div key={set.id} className="card flex flex-col gap-2 p-5">
              <button type="button" onClick={() => onOpenSet(set)} className="flex flex-1 flex-col gap-2 text-left">
                <Layers className="text-brand-600" size={20} />
                <p className="font-medium text-ink-900">{set.name}</p>
                <p className="text-sm text-ink-500">
                  {set.description || `${set.question_count} question${set.question_count === 1 ? '' : 's'}`}
                </p>
              </button>
              {confirmDelete === set.id ? (
                <div className="flex gap-2">
                  <Button size="sm" variant="danger" onClick={() => onDeleteSet(set.id)}>
                    Confirm delete
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => setConfirmDelete(undefined)}>
                    Cancel
                  </Button>
                </div>
              ) : (
                <Button
                  size="sm"
                  variant="ghost"
                  icon={Trash2}
                  onClick={() => setConfirmDelete(set.id)}
                  className="self-start"
                >
                  Delete set
                </Button>
              )}
            </div>
          ))
        )}
      </div>
    </>
  )
}

function AssessmentQuestionsPage() {
  const [view, setView] = useState<{ kind: 'hub' } | { kind: 'initial' } | { kind: 'set'; set: PracticeQuestionSet }>({
    kind: 'hub',
  })
  const [sets, setSets] = useState<PracticeQuestionSet[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string>()

  async function loadSets() {
    setLoading(true)
    setError(undefined)
    try {
      setSets(await fetchPracticeQuestionSets())
    } catch (e) {
      setError(errorMessage(e))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadSets()
  }, [])

  if (view.kind === 'initial') {
    return <InitialAssessmentView onBack={() => setView({ kind: 'hub' })} />
  }

  if (view.kind === 'set') {
    // Keep the open set's details fresh against the hub's list (e.g. after a rename).
    const current = sets.find((s) => s.id === view.set.id) ?? view.set
    return (
      <PracticeSetView
        set={current}
        onBack={() => setView({ kind: 'hub' })}
        onSetChanged={() => void loadSets()}
      />
    )
  }

  return (
    <Hub
      sets={sets}
      loading={loading}
      error={error}
      onOpenInitial={() => setView({ kind: 'initial' })}
      onOpenSet={(set) => setView({ kind: 'set', set })}
      onCreateSet={async (name, description) => {
        await savePracticeQuestionSet({ name, description, sort_order: sets.length })
        await loadSets()
      }}
      onDeleteSet={(id) => {
        void deletePracticeQuestionSet(id)
          .then(loadSets)
          .catch((e) => setError(errorMessage(e)))
      }}
    />
  )
}
