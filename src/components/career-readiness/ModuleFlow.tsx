import { useEffect, useState } from 'react'
import { Link } from '@tanstack/react-router'
import { ArrowRight, Check, CheckCircle2, Lightbulb } from 'lucide-react'
import { errorMessage } from '@/lib/errors'
import {
  MAX_RESPONSE_CHARS,
  MIN_REFLECTION_CHARS,
  MIN_TASK_CHARS,
  type ItemKey,
  type ModuleContent,
} from '@/lib/careerReadinessContent'
import { responseKey, type ProgrammeProgress, type ResponseMap } from '@/lib/careerReadinessProgramme'
import type { ModuleSlug } from '@/lib/programmes'
import { Alert, Button, Textarea } from '@/components/ui'

/** The five steps of a module, in order. */
type Step = 'learn' | ItemKey

const STEP_ORDER: { key: Step; label: string }[] = [
  { key: 'learn', label: 'Learn' },
  { key: 't1', label: 'Task 1' },
  { key: 't2', label: 'Task 2' },
  { key: 't3', label: 'Task 3' },
  { key: 'reflect', label: 'Reflect' },
]

/** Where to open: Learn on a first visit, otherwise the first item not yet saved. */
function firstOpenStep(slug: ModuleSlug, responses: ResponseMap): Step {
  const item = (['t1', 't2', 't3', 'reflect'] as ItemKey[]).find((k) => !responses[responseKey(slug, k)])
  const anySaved = (['t1', 't2', 't3', 'reflect'] as ItemKey[]).some((k) => responses[responseKey(slug, k)])
  return anySaved ? (item ?? 'reflect') : 'learn'
}

/**
 * One module: Learn (three short cards), Practise (three written tasks) and
 * Reflect (one prompt). Each response is saved on its own so nothing is lost
 * leaving halfway, and any of them can be reopened and edited. The server
 * enforces the same minimum lengths; this is just so the button says why it
 * isn't ready.
 */
export function ModuleFlow({
  content,
  index,
  total,
  responses,
  progress,
  onSave,
}: {
  content: ModuleContent
  /** 0-based position in the programme, for "Module 2 of 5". */
  index: number
  total: number
  responses: ResponseMap
  progress: ProgrammeProgress
  onSave: (item: ItemKey, text: string) => Promise<void>
}) {
  const slug = content.slug
  const [step, setStep] = useState<Step>(() => firstOpenStep(slug, responses))
  const saved = (k: ItemKey) => Boolean(responses[responseKey(slug, k)])
  const mine = progress.modules.find((m) => m.slug === slug)
  const complete = Boolean(mine?.complete)

  const stepIndex = STEP_ORDER.findIndex((s) => s.key === step)
  const nextStep = STEP_ORDER[stepIndex + 1]?.key

  return (
    <div className="space-y-5">
      {/* Steps */}
      <ol className="grid grid-cols-5 gap-2" aria-label="Module steps">
        {STEP_ORDER.map((s, i) => {
          const done = s.key === 'learn' ? saved('t1') || i < stepIndex : saved(s.key)
          const on = s.key === step
          return (
            <li key={s.key}>
              <button
                type="button"
                onClick={() => setStep(s.key)}
                aria-current={on ? 'step' : undefined}
                className={`flex w-full flex-col items-center gap-1 rounded-xl border px-1 py-2.5 text-center transition-colors sm:flex-row sm:justify-center sm:gap-2 sm:px-3 ${
                  on
                    ? 'border-ink-900 bg-ink-900 text-white'
                    : 'border-ink-900/10 bg-white text-ink-700 hover:border-ink-900/25'
                }`}
              >
                <span
                  className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold ${
                    done ? 'bg-emerald-500 text-white' : on ? 'bg-white text-ink-900' : 'bg-ink-100 text-ink-600'
                  }`}
                >
                  {done ? <Check size={11} strokeWidth={3} /> : i + 1}
                </span>
                <span className="text-[11px] font-semibold sm:text-xs">{s.label}</span>
              </button>
            </li>
          )
        })}
      </ol>

      {complete && step === 'learn' && (
        <Alert tone="success" title="Module complete">
          You’ve finished every task here. You can reopen any step to read or change your answers.
        </Alert>
      )}

      {step === 'learn' && (
        <section className="space-y-3">
          {content.learn.map((c, i) => (
            <article key={c.title} className="card p-5">
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-brand-700">
                {i + 1} of {content.learn.length}
              </p>
              <h3 className="mt-1 font-display text-lg font-semibold text-ink-900">{c.title}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-ink-700">{c.body}</p>
            </article>
          ))}
          <Button iconRight={ArrowRight} onClick={() => setStep('t1')}>
            Start the tasks
          </Button>
        </section>
      )}

      {step !== 'learn' && (
        <ItemCard
          key={step}
          item={step}
          content={content}
          initial={responses[responseKey(slug, step)] ?? ''}
          alreadySaved={saved(step)}
          onSave={async (text) => {
            await onSave(step, text)
          }}
          onDone={() => nextStep && setStep(nextStep)}
          last={step === 'reflect'}
          moduleComplete={complete}
          index={index}
          total={total}
          progress={progress}
        />
      )}
    </div>
  )
}

function ItemCard({
  item,
  content,
  initial,
  alreadySaved,
  onSave,
  onDone,
  last,
  moduleComplete,
  index,
  total,
  progress,
}: {
  item: ItemKey
  content: ModuleContent
  initial: string
  alreadySaved: boolean
  onSave: (text: string) => Promise<void>
  onDone: () => void
  last: boolean
  moduleComplete: boolean
  index: number
  total: number
  progress: ProgrammeProgress
}) {
  const task = content.tasks.find((t) => t.key === item)
  const isReflection = item === 'reflect'
  const min = isReflection ? MIN_REFLECTION_CHARS : MIN_TASK_CHARS
  const heading = isReflection ? 'Reflect' : (task?.title ?? '')
  const prompt = isReflection ? content.reflection.prompt : (task?.prompt ?? '')
  const hint = isReflection ? content.reflection.hint : (task?.hint ?? '')

  const [text, setText] = useState(initial)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string>()

  // A saved response reloaded from the server (or a step revisited) shows as-is.
  useEffect(() => setText(initial), [initial])

  const length = text.trim().length
  const ready = length >= min
  const changed = text.trim() !== initial.trim()

  async function save() {
    setBusy(true)
    setError(undefined)
    try {
      await onSave(text)
      if (!last) onDone()
    } catch (e) {
      setError(errorMessage(e))
    } finally {
      setBusy(false)
    }
  }

  // The module is finished once all four items are saved, wherever they were
  // saved from — so this follows the server-backed progress, not the click.
  const next = progress.next
  const showFinish = last && moduleComplete

  return (
    <section className="card p-5 sm:p-6">
      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-brand-700">
        {isReflection ? 'Reflect' : 'Practise'} · module {index + 1} of {total}
      </p>
      <h3 className="mt-1 font-display text-xl font-semibold text-ink-900">{heading}</h3>
      <p className="mt-2 text-sm leading-relaxed text-ink-700">{prompt}</p>
      <p className="mt-2 flex items-start gap-2 text-xs leading-relaxed text-ink-500">
        <Lightbulb size={13} className="mt-0.5 shrink-0" /> {hint}
      </p>

      <div className="mt-4">
        <Textarea
          value={text}
          onChange={(e) => {
            setText(e.target.value)
          }}
          rows={isReflection ? 5 : 7}
          maxLength={MAX_RESPONSE_CHARS}
          required={false}
          aria-label={heading}
          placeholder="Write your answer here…"
        />
        <div className="mt-1.5 flex flex-wrap items-center justify-between gap-2 text-xs">
          <span className={ready ? 'text-ink-500' : 'text-ink-600'}>
            {ready ? `${length} characters` : `${length} / ${min} characters to save`}
          </span>
          {alreadySaved && !changed && (
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

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <Button disabled={busy || !ready || (alreadySaved && !changed)} onClick={() => void save()}>
          {busy ? 'Saving…' : last ? (alreadySaved ? 'Save changes' : 'Save & finish module') : alreadySaved ? 'Save changes' : 'Save & continue'}
        </Button>
        {alreadySaved && !changed && !last && (
          <Button variant="secondary" iconRight={ArrowRight} onClick={onDone}>
            Next
          </Button>
        )}
      </div>

      {showFinish && (
        <div className="mt-5 rounded-xl bg-emerald-50 p-4">
          <p className="flex items-center gap-2 text-sm font-semibold text-emerald-800">
            <CheckCircle2 size={16} /> Module complete
          </p>
          <p className="mt-1 text-sm text-emerald-800/90">
            {next
              ? `Up next: ${next.title}.`
              : 'That’s all five modules. Ask a mentor to review your work from Practice.'}
          </p>
          <div className="mt-3 flex flex-wrap gap-3">
            {next ? (
              <Link
                to="/career-module/$slug"
                params={{ slug: next.slug }}
                className="inline-flex items-center gap-1.5 text-sm font-semibold text-emerald-900 hover:underline"
              >
                Open {next.title} <ArrowRight size={14} />
              </Link>
            ) : (
              <Link to="/practice" className="inline-flex items-center gap-1.5 text-sm font-semibold text-emerald-900 hover:underline">
                Go to Practice <ArrowRight size={14} />
              </Link>
            )}
          </div>
        </div>
      )}
    </section>
  )
}
