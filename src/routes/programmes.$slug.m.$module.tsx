import { useEffect, useState } from 'react'
import { createFileRoute, Link } from '@tanstack/react-router'
import { ArrowRight, Check, CheckCircle2, Lightbulb } from 'lucide-react'
import { requireOnboarded } from '@/lib/guards'
import { errorMessage } from '@/lib/errors'
import {
  MIN_REFLECTION,
  MIN_TASK,
  QUIZ_PASS,
  gradeLocally,
  moduleDone,
  saveResponse,
  submitQuiz,
  suggestedOrder,
  type MyProgramme,
} from '@/lib/programmeStudent'
import type { ProgrammeModule } from '@/lib/programmeEngine'
import { PageHeader } from '@/components/app/PageHeader'
import { ProgrammeFrame, QuizRunner, previewSearch, useMyProgramme } from '@/components/programme/shared'
import { Alert, Button, Textarea } from '@/components/ui'

export const Route = createFileRoute('/programmes/$slug/m/$module')({
  beforeLoad: requireOnboarded,
  validateSearch: previewSearch,
  component: ModulePage,
})

type Step = 'learn' | 'reflect' | 'quiz' | string

/** A Practise task or the reflection: write, save, move on. */
function WriteStep({
  title,
  prompt,
  hint,
  min,
  initial,
  onSave,
  onNext,
}: {
  title: string
  prompt: string
  hint: string
  min: number
  initial: string
  onSave: (text: string) => Promise<void>
  onNext: () => void
}) {
  const [text, setText] = useState(initial)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string>()
  useEffect(() => setText(initial), [initial])
  const length = text.trim().length
  const changed = text.trim() !== initial.trim()
  return (
    <section className="card p-5 sm:p-6">
      <h3 className="font-display text-xl font-semibold text-ink-900">{title}</h3>
      <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-ink-700">{prompt}</p>
      {hint && (
        <p className="mt-2 flex items-start gap-2 text-xs leading-relaxed text-ink-500">
          <Lightbulb size={13} className="mt-0.5 shrink-0" /> {hint}
        </p>
      )}
      <div className="mt-4">
        <Textarea value={text} onChange={(e) => setText(e.target.value)} rows={7} maxLength={4000} required={false} aria-label={title} placeholder="Write your answer here…" />
        <div className="mt-1.5 flex flex-wrap items-center justify-between gap-2 text-xs">
          <span className="text-ink-500">{length >= min ? `${length} characters` : `${length} / ${min} characters to save`}</span>
          {initial && !changed && (
            <span className="inline-flex items-center gap-1 font-semibold text-emerald-700">
              <CheckCircle2 size={13} /> Saved
            </span>
          )}
        </div>
      </div>
      {error && (
        <div className="mt-3">
          <Alert tone="danger" title="Couldn’t save that">
            <p>{error}</p>
          </Alert>
        </div>
      )}
      <div className="mt-4 flex flex-wrap gap-3">
        <Button
          disabled={busy || length < min || (Boolean(initial) && !changed)}
          onClick={() => {
            setBusy(true)
            setError(undefined)
            onSave(text)
              .then(onNext)
              .catch((e) => setError(errorMessage(e)))
              .finally(() => setBusy(false))
          }}
        >
          {busy ? 'Saving…' : initial ? 'Save changes' : 'Save & continue'}
        </Button>
        {initial && !changed && (
          <Button variant="secondary" iconRight={ArrowRight} onClick={onNext}>
            Next
          </Button>
        )}
      </div>
    </section>
  )
}

function ModuleView({ p, m, preview, reload }: { p: MyProgramme; m: ProgrammeModule; preview: boolean; reload: () => Promise<void> }) {
  const { slug } = Route.useParams()
  const responses = p.responses[m.id] ?? {}
  const [local, setLocal] = useState<Record<string, string>>({})
  const written = (k: string) => Boolean(local[k] ?? responses[k])
  // Only the parts this module has.
  const steps: { key: Step; label: string }[] = [
    ...(m.learn.length ? [{ key: 'learn', label: 'Learn' }] : []),
    ...m.tasks.map((t, i) => ({ key: t.id, label: `Task ${i + 1}` })),
    ...(m.tasks.length ? [{ key: 'reflect', label: 'Reflect' }] : []),
    ...(m.quiz.length ? [{ key: 'quiz', label: 'Quiz' }] : []),
  ]
  // Where to open: Learn on a first visit, then the first thing not yet
  // written, then the quiz once everything is written.
  const [step, setStep] = useState<Step>(() => {
    if (Object.keys(responses).length === 0) return steps[0]?.key ?? 'learn'
    return steps.find((s) => s.key !== 'learn' && s.key !== 'quiz' && !responses[s.key])?.key ?? steps[steps.length - 1]?.key ?? 'learn'
  })
  const idx = steps.findIndex((s) => s.key === step)
  const next = () => setStep(steps[Math.min(idx + 1, steps.length - 1)].key)
  const quiz = p.quizzes[m.id]
  // Just taken: keep the review on screen, even though a retake is now a day away.
  const [taken, setTaken] = useState(false)
  const locked = !preview && !taken && quiz && new Date(quiz.next_at) > new Date()
  const done = moduleDone(p, m)
  const order = suggestedOrder(p)
  const after = order[order.findIndex((x) => x.id === m.id) + 1]
  const search = preview ? { preview: 1 as const } : {}

  const save = async (item: string, text: string) => {
    if (!preview) await saveResponse(slug, m.id, item, text)
    setLocal((l) => ({ ...l, [item]: text }))
    if (!preview) void reload()
  }

  return (
    <div className="space-y-5">
      <ol className="grid gap-2" style={{ gridTemplateColumns: `repeat(${steps.length}, minmax(0, 1fr))` }} aria-label="Module steps">
        {steps.map((s, i) => {
          const isDone =
            s.key === 'learn' ? i < idx || (m.tasks[0] ? written(m.tasks[0].id) : Boolean(quiz)) : s.key === 'quiz' ? (quiz?.best ?? 0) >= QUIZ_PASS : written(s.key)
          const on = s.key === step
          return (
            <li key={s.key}>
              <button
                type="button"
                onClick={() => setStep(s.key)}
                aria-current={on ? 'step' : undefined}
                className={`flex w-full flex-col items-center gap-1 rounded-xl border px-1 py-2.5 text-center transition-colors sm:flex-row sm:justify-center sm:gap-2 sm:px-2 ${
                  on ? 'border-ink-900 bg-ink-900 text-white' : 'border-ink-900/10 bg-white text-ink-700 hover:border-ink-900/25'
                }`}
              >
                <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold ${isDone ? 'bg-emerald-500 text-white' : on ? 'bg-white text-ink-900' : 'bg-ink-100 text-ink-600'}`}>
                  {isDone ? <Check size={11} strokeWidth={3} /> : i + 1}
                </span>
                <span className="text-[11px] font-semibold sm:text-xs">{s.label}</span>
              </button>
            </li>
          )
        })}
      </ol>

      {done && (
        <div className="rounded-2xl bg-emerald-50 p-4">
          <p className="flex items-center gap-2 text-sm font-semibold text-emerald-800">
            <CheckCircle2 size={16} /> Module done
          </p>
          {after ? (
            <Link to="/programmes/$slug/m/$module" params={{ slug, module: after.id }} search={search} className="mt-2 inline-flex items-center gap-1 text-sm font-semibold text-emerald-900 hover:underline">
              Next: {after.title} <ArrowRight size={14} />
            </Link>
          ) : (
            <Link to="/programmes/$slug" params={{ slug }} search={search} className="mt-2 inline-flex items-center gap-1 text-sm font-semibold text-emerald-900 hover:underline">
              Back to the programme <ArrowRight size={14} />
            </Link>
          )}
        </div>
      )}

      {step === 'learn' && (
        <section className="space-y-3">
          {m.learn.map((c, i) => (
            <article key={i} className="card p-5">
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-brand-700">
                {i + 1} of {m.learn.length}
              </p>
              <h3 className="mt-1 font-display text-lg font-semibold text-ink-900">{c.title}</h3>
              <p className="mt-1.5 whitespace-pre-line text-sm leading-relaxed text-ink-700">{c.body}</p>
            </article>
          ))}
          <Button iconRight={ArrowRight} onClick={next}>
            {m.tasks.length ? 'Start the tasks' : 'Take the quiz'}
          </Button>
        </section>
      )}

      {m.tasks.map(
        (t) =>
          step === t.id && (
            <WriteStep key={t.id} title={t.title} prompt={t.prompt} hint={t.hint} min={MIN_TASK} initial={local[t.id] ?? responses[t.id] ?? ''} onSave={(x) => save(t.id, x)} onNext={next} />
          ),
      )}

      {step === 'reflect' && (
        <WriteStep
          title="Reflect"
          prompt={m.reflection.prompt}
          hint={m.reflection.hint}
          min={MIN_REFLECTION}
          initial={local.reflect ?? responses.reflect ?? ''}
          onSave={(x) => save('reflect', x)}
          onNext={next}
        />
      )}

      {step === 'quiz' &&
        (locked ? (
          <div className="card p-5">
            <p className="font-display text-lg font-semibold text-ink-900">Quiz best: {quiz!.best}%</p>
            <p className="mt-1 text-sm text-ink-600">
              {quiz!.best >= QUIZ_PASS ? 'Passed. ' : ''}You can take it again after{' '}
              {new Date(quiz!.next_at).toLocaleString(undefined, { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' })}: a retake straight
              after seeing the answers would test memory, not the skill.
            </p>
          </div>
        ) : (
          <>
            {quiz && !taken && (
              <p className="text-sm text-ink-600">
                Best so far: {quiz.best}% after {quiz.attempts} {quiz.attempts === 1 ? 'try' : 'tries'}. {QUIZ_PASS}% passes.
              </p>
            )}
            <QuizRunner
              key={`quiz-${m.id}`}
              questions={m.quiz}
              passPercent={QUIZ_PASS}
              onSubmit={async (answers) => {
                if (preview) return gradeLocally(m.quiz, answers)
                const r = await submitQuiz(slug, m.id, answers)
                setTaken(true)
                void reload()
                return r
              }}
            />
          </>
        ))}
    </div>
  )
}

/** One module: Learn, each Practise task, Reflect, then the quiz. */
function ModulePage() {
  const { slug, module } = Route.useParams()
  const preview = Boolean(Route.useSearch().preview)
  const { p, error, reload } = useMyProgramme(slug, preview)
  return (
    <ProgrammeFrame slug={slug} preview={preview} back="programme" p={p} error={error}>
      {(p) => {
        const m = p.content.modules.find((x) => x.id === module)
        if (!m) return <p className="text-sm text-ink-600">We couldn’t find that module.</p>
        if (!p.enrolled) {
          return (
            <Alert tone="info" title="Start the programme first">
              <p>
                Open{' '}
                <Link to="/programmes/$slug" params={{ slug }} className="font-semibold underline">
                  {p.title}
                </Link>{' '}
                and press “Start this programme”.
              </p>
            </Alert>
          )
        }
        const skill = p.content.skills.find((s) => s.id === m.skill)?.name
        return (
          <>
            <PageHeader
              eyebrow={`${p.title}${skill ? ` · ${skill}` : ''} · ${m.level}`}
              title={m.title}
              description={
                <>
                  {m.outcome}
                  <span className="mt-1 block text-xs text-ink-500">About {m.minutes} minutes</span>
                </>
              }
            />
            <ModuleView key={m.id} p={p} m={m} preview={preview} reload={reload} />
          </>
        )
      }}
    </ProgrammeFrame>
  )
}
