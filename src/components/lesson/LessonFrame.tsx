import { useEffect, useState, type ReactNode } from 'react'
import { ArrowLeft, ArrowRight, Check, CheckCircle2, Lightbulb, ListChecks, PenLine, Target, BookOpen, type LucideIcon } from 'lucide-react'
import { errorMessage } from '@/lib/errors'
import type { Question } from '@/lib/programmeEngine'
import type { QuizResult } from '@/lib/programmeStudent'

/**
 * The interactive lesson (Paul, 18 Nov 2026: every course's workbook as interactive as
 * Digital Marketing's). A dark header with progress and a coloured step track, then ONE
 * step on screen at a time, each in its own colour, with Continue and Back. The Global
 * Leadership modules and the course-engine programmes (Entrepreneurship, Data
 * Analytics) all use it; what a step does (saving a task, grading a quiz) stays with
 * the page that owns the programme.
 */

export type StepKind = 'learn' | 'task' | 'reflect' | 'quiz'

export interface LessonStep {
  key: string
  label: string
  kind: StepKind
  done: boolean
}

/** Each kind of step's colour and icon. Full class names, so Tailwind can see them. */
const LOOK: Record<StepKind, { icon: LucideIcon; node: string; band: string; button: string; text: string; soft: string }> = {
  learn: { icon: BookOpen, node: 'bg-brand-600', band: 'from-brand-600 to-brand-700', button: 'bg-brand-600 hover:bg-brand-700', text: 'text-brand-700', soft: 'border-brand-200 bg-brand-50' },
  task: { icon: Target, node: 'bg-rose-600', band: 'from-rose-600 to-rose-700', button: 'bg-rose-600 hover:bg-rose-700', text: 'text-rose-700', soft: 'border-rose-200 bg-rose-50' },
  reflect: { icon: PenLine, node: 'bg-amber-600', band: 'from-amber-600 to-amber-700', button: 'bg-amber-600 hover:bg-amber-700', text: 'text-amber-700', soft: 'border-amber-200 bg-amber-50' },
  quiz: { icon: ListChecks, node: 'bg-sky-600', band: 'from-sky-600 to-sky-700', button: 'bg-sky-600 hover:bg-sky-700', text: 'text-sky-700', soft: 'border-sky-200 bg-sky-50' },
}

export const lessonLook = LOOK

/* ------------------------------------------------------------------ the frame */

export function LessonFrame({
  icon: HeaderIcon,
  eyebrow,
  title,
  subtitle,
  steps,
  active,
  onSelect,
  banner,
  children,
  onFinish,
  finishLabel = 'Finish',
}: {
  icon: LucideIcon
  eyebrow: string
  title: string
  subtitle?: ReactNode
  steps: LessonStep[]
  active: string
  onSelect: (key: string) => void
  /** Between the header and the step, such as "Module done". */
  banner?: ReactNode
  children: ReactNode
  /** Shown on the last step when there is one thing to do at the end. */
  onFinish?: () => void
  finishLabel?: string
}) {
  const index = Math.max(0, steps.findIndex((s) => s.key === active))
  const here = steps[index]
  const doneCount = steps.filter((s) => s.done).length
  const percent = steps.length ? Math.round((doneCount / steps.length) * 100) : 0
  const upNext = steps.find((s) => !s.done)
  const next = steps[index + 1]
  const prev = steps[index - 1]

  function show(key: string) {
    onSelect(key)
    // Bring the step to the top once it has drawn.
    window.setTimeout(() => document.getElementById('lesson-body')?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 30)
  }

  return (
    <div className="space-y-4">
      <header className="surface-wood-dark relative overflow-hidden rounded-3xl p-5 shadow-e2 sm:p-7">
        <span aria-hidden className="pointer-events-none absolute -right-10 -top-10 opacity-[0.16]">
          <svg width="240" height="240" viewBox="0 0 240 240" fill="none" stroke="#f6e3c8" strokeWidth="2">
            <circle cx="150" cy="90" r="90" />
            <circle cx="150" cy="90" r="68" />
            <circle cx="150" cy="90" r="46" />
            <circle cx="150" cy="90" r="22" />
          </svg>
        </span>
        <div className="relative flex items-start gap-4">
          <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-400 to-brand-700 text-white shadow-e1 ring-1 ring-white/20 sm:h-16 sm:w-16">
            <HeaderIcon size={28} />
          </span>
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/60">{eyebrow}</p>
            <h1 className="mt-1 font-display text-2xl font-semibold leading-tight tracking-tight text-white sm:text-3xl">{title}</h1>
            {subtitle && <div className="mt-1.5 max-w-2xl text-sm leading-relaxed text-white/75">{subtitle}</div>}
          </div>
        </div>

        <div className="relative mt-5">
          <div className="flex items-center justify-between text-xs text-white/70">
            <span>
              {doneCount} of {steps.length} steps done
            </span>
            <span className="font-semibold text-white">{percent}%</span>
          </div>
          <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-white/15" role="progressbar" aria-valuenow={percent} aria-valuemin={0} aria-valuemax={100} aria-label="Module progress">
            <div className="h-full rounded-full bg-gradient-to-r from-brand-200 to-emerald-300 transition-[width] duration-500" style={{ width: `${percent}%` }} />
          </div>
        </div>

        <ol className="relative mt-5 grid" style={{ gridTemplateColumns: `repeat(${steps.length}, minmax(0, 1fr))` }} aria-label="Steps">
          {steps.map((s, i) => {
            const look = LOOK[s.kind]
            const Icon = look.icon
            const on = s.key === active
            return (
              <li key={s.key} className="relative flex flex-col items-center">
                {i > 0 && <span aria-hidden className={`absolute right-1/2 top-[19px] h-0.5 w-full ${steps[i - 1].done ? 'bg-emerald-400/70' : 'bg-white/15'}`} />}
                <button type="button" onClick={() => show(s.key)} aria-current={on ? 'step' : undefined} className="group relative flex flex-col items-center gap-1.5">
                  <span
                    className={`relative flex h-10 w-10 items-center justify-center rounded-full text-white transition-all duration-300 ${s.done ? 'bg-emerald-600' : look.node} ${
                      on ? 'scale-110 ring-4 ring-white/30' : s.done ? '' : 'opacity-60 group-hover:opacity-100'
                    }`}
                  >
                    {s.done ? <Check size={18} strokeWidth={3} /> : <Icon size={17} />}
                  </span>
                  <span className={`max-w-full truncate text-[11px] ${on ? 'font-semibold text-white' : 'text-white/65'}`}>{s.label}</span>
                </button>
              </li>
            )
          })}
        </ol>

        {upNext && (
          <div className="relative mt-5">
            <button
              type="button"
              onClick={() => show(upNext.key)}
              className="press inline-flex h-11 items-center gap-1.5 rounded-xl bg-white px-5 text-sm font-semibold text-ink-900 shadow-e1 transition-transform hover:-translate-y-0.5"
            >
              {doneCount === 0 ? 'Start' : 'Continue'}: {upNext.label} <ArrowRight size={16} />
            </button>
          </div>
        )}
      </header>

      {banner}

      {here && (
        <section id="lesson-body" className="scroll-mt-24 overflow-hidden rounded-3xl border border-ink-200 bg-white shadow-e1" aria-live="polite">
          <div className={`flex items-center justify-between gap-3 bg-gradient-to-r px-5 py-3 text-white sm:px-7 ${LOOK[here.kind].band}`}>
            <p className="flex items-center gap-2 text-sm font-semibold">
              {(() => {
                const Icon = LOOK[here.kind].icon
                return <Icon size={17} aria-hidden />
              })()}
              Step {index + 1} of {steps.length} · {here.label}
            </p>
            {here.done && (
              <span className="inline-flex items-center gap-1 rounded-full bg-white/20 px-2.5 py-0.5 text-xs font-semibold">
                <Check size={12} strokeWidth={3} /> Done
              </span>
            )}
          </div>
          <div className="p-5 sm:p-7">
            {children}
            <div className="mt-7 flex items-center justify-between gap-3 border-t border-ink-200 pt-4">
              {prev ? (
                <button type="button" onClick={() => show(prev.key)} className="inline-flex items-center gap-1.5 text-sm font-medium text-ink-600 transition-colors hover:text-ink-900">
                  <ArrowLeft size={15} /> {prev.label}
                </button>
              ) : (
                <span />
              )}
              {next ? (
                <button
                  type="button"
                  onClick={() => show(next.key)}
                  className={`press inline-flex h-11 items-center gap-1.5 rounded-xl px-5 text-sm font-semibold text-white shadow-e1 transition-colors ${LOOK[here.kind].button}`}
                >
                  Continue to {next.label} <ArrowRight size={16} />
                </button>
              ) : onFinish ? (
                <button
                  type="button"
                  onClick={onFinish}
                  className={`press inline-flex h-11 items-center gap-1.5 rounded-xl px-5 text-sm font-semibold text-white shadow-e1 transition-colors ${LOOK[here.kind].button}`}
                >
                  {finishLabel} <ArrowRight size={16} />
                </button>
              ) : null}
            </div>
          </div>
        </section>
      )}
    </div>
  )
}

/* ------------------------------------------------------------------- learn */

/** The module's teaching cards, set as a page: numbered, large and easy to read. */
export function LessonLearn({ cards }: { cards: { title: string; body: string }[] }) {
  return (
    <div className="space-y-5">
      {cards.map((c, i) => (
        <article key={c.title + i} className="flex gap-4">
          <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-600 text-sm font-semibold text-white">{i + 1}</span>
          <div className="min-w-0">
            <h2 className="font-display text-lg font-semibold text-ink-900 sm:text-xl">{c.title}</h2>
            <p className="mt-1.5 whitespace-pre-line text-[16px] leading-8 text-ink-700">{c.body}</p>
          </div>
        </article>
      ))}
    </div>
  )
}

/* ------------------------------------------------------------------- write */

/**
 * A written task or the reflection: write, save, move on. The server holds the same
 * minimum length; this says why Save isn't ready yet.
 */
export function LessonWrite({
  kind,
  title,
  prompt,
  hint,
  min,
  max = 4000,
  initial,
  onSave,
  onNext,
  last = false,
}: {
  kind: 'task' | 'reflect'
  title: string
  prompt: string
  hint?: string
  min: number
  max?: number
  initial: string
  onSave: (text: string) => Promise<void>
  /** Go on after saving (or without changing anything). */
  onNext: () => void
  /** The last step: no Next after saving. */
  last?: boolean
}) {
  const look = LOOK[kind]
  const [text, setText] = useState(initial)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  useEffect(() => {
    setText(initial)
  }, [initial])
  const length = text.trim().length
  const ready = length >= min
  const changed = text.trim() !== initial.trim()
  const saved = Boolean(initial) && !changed

  async function save() {
    setBusy(true)
    setError('')
    try {
      await onSave(text)
      if (!last) onNext()
    } catch (e) {
      setError(errorMessage(e))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div>
      <p className={`text-xs font-semibold uppercase tracking-[0.14em] ${look.text}`}>{kind === 'reflect' ? 'Reflect' : 'Practise'}</p>
      <h2 className="mt-1 font-display text-xl font-semibold text-ink-900 sm:text-2xl">{title}</h2>
      <p className="mt-2 whitespace-pre-line leading-relaxed text-ink-700">{prompt}</p>
      {hint && (
        <p className={`mt-3 flex items-start gap-2 rounded-xl border p-3 text-sm leading-relaxed text-ink-800 ${look.soft}`}>
          <Lightbulb size={15} className={`mt-0.5 shrink-0 ${look.text}`} /> {hint}
        </p>
      )}
      <label htmlFor="lesson-answer" className="sr-only">
        {title}
      </label>
      <textarea
        id="lesson-answer"
        rows={kind === 'reflect' ? 5 : 7}
        value={text}
        maxLength={max}
        onChange={(e) => {
          setText(e.target.value)
          setError('')
        }}
        placeholder="Write your answer here…"
        className="mt-4 w-full resize-y rounded-2xl border border-ink-200 bg-white p-4 text-[15px] leading-relaxed text-ink-900 placeholder:text-ink-400 focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-200"
      />
      <div className="mt-2">
        <div className="h-1.5 overflow-hidden rounded-full bg-ink-200">
          <div className={`h-full rounded-full transition-all ${ready ? 'bg-emerald-600' : 'bg-ink-400'}`} style={{ width: `${Math.min(100, (length / min) * 100)}%` }} />
        </div>
        <div className="mt-1.5 flex flex-wrap items-center justify-between gap-2 text-xs">
          <span className={ready ? 'text-ink-500' : 'text-ink-600'}>{ready ? `${length} characters` : `${length} / ${min} characters to save`}</span>
          {saved && (
            <span className="inline-flex items-center gap-1 font-semibold text-emerald-700">
              <CheckCircle2 size={13} /> Saved
            </span>
          )}
        </div>
      </div>
      {error && (
        <p role="alert" className="mt-3 text-sm text-red-600">
          {error}
        </p>
      )}
      <div className="mt-4 flex flex-wrap items-center gap-3">
        <button
          type="button"
          disabled={busy || !ready || saved}
          onClick={() => void save()}
          className={`press h-11 rounded-xl px-5 text-sm font-semibold text-white shadow-e1 transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${look.button}`}
        >
          {busy ? 'Saving…' : last ? (initial ? 'Save changes' : 'Save and finish') : initial ? 'Save changes' : 'Save and continue'}
        </button>
        {saved && !last && (
          <button type="button" onClick={onNext} className="press inline-flex h-11 items-center gap-1.5 rounded-xl border border-ink-300 px-4 text-sm font-semibold text-ink-800 transition-colors hover:bg-ink-100">
            Next <ArrowRight size={15} />
          </button>
        )}
      </div>
    </div>
  )
}

/* -------------------------------------------------------------------- quiz */

const LETTERS = 'ABCDEF'

function shuffled<T>(items: T[]): T[] {
  const out = [...items]
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[out[i], out[j]] = [out[j], out[i]]
  }
  return out
}

/** One question's case: company, role, background, objective and so on. */
function CaseBlock({ q }: { q: Question }) {
  const c = q.context
  const head = c ? [c.company, c.role, c.industry].filter((x) => x && x.trim()) : []
  const rows = c
    ? ([
        ['Background', c.background],
        ['Objective', c.objective],
        ['What you know', c.information],
        ['Constraints', c.constraints],
      ] as const).filter(([, v]) => v && v.trim())
    : []
  if (!q.scenario?.trim() && head.length === 0 && rows.length === 0) return null
  return (
    <div className="mt-3 rounded-2xl border border-ink-200 bg-ink-50 p-4 text-sm leading-relaxed text-ink-700">
      {head.length > 0 && <p className="text-xs font-semibold text-ink-500">{head.join(' · ')}</p>}
      {q.scenario?.trim() && <p className={head.length ? 'mt-1' : ''}>{q.scenario}</p>}
      {rows.map(([k, v]) => (
        <p key={k} className="mt-1">
          <span className="font-semibold text-ink-900">{k}: </span>
          {v}
        </p>
      ))}
    </div>
  )
}

/**
 * A module's quiz, one question at a time, then graded together (by the server, so the
 * answers stay there) with a review of every question and why.
 */
export function LessonQuiz({
  questions,
  passPercent,
  onSubmit,
  onDone,
  doneLabel = 'Continue',
}: {
  questions: Question[]
  passPercent: number
  onSubmit: (answers: Record<string, number>) => Promise<QuizResult>
  onDone?: () => void
  doneLabel?: string
}) {
  const [order] = useState(() => Object.fromEntries(questions.map((q) => [q.id, shuffled(q.options.map((_, i) => i))])))
  const [answers, setAnswers] = useState<Record<string, number>>({})
  const [index, setIndex] = useState(0)
  const [result, setResult] = useState<QuizResult | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const look = LOOK.quiz

  async function submit() {
    setBusy(true)
    setError('')
    try {
      setResult(await onSubmit(answers))
    } catch (e) {
      setError(errorMessage(e))
    } finally {
      setBusy(false)
    }
  }

  if (result) {
    const passed = result.grade.percent >= passPercent
    return (
      <div>
        <div className={`rounded-2xl border p-5 text-center ${passed ? 'border-emerald-200 bg-emerald-50' : 'border-amber-200 bg-amber-50'}`}>
          <span className={`mx-auto flex h-12 w-12 items-center justify-center rounded-full text-white ${passed ? 'bg-emerald-600' : 'bg-amber-600'}`}>
            <CheckCircle2 size={24} />
          </span>
          <p className="mt-3 font-display text-4xl font-semibold text-ink-900">{result.grade.percent}%</p>
          <p className="mt-1 text-sm text-ink-700">
            {result.grade.correct} of {result.grade.total} right.{' '}
            {passed ? 'Passed.' : `${passPercent}% passes. Read the reasons below, then try again later.`}
          </p>
        </div>
        <ul className="mt-4 space-y-3">
          {questions.map((q) => {
            const r = result.review[q.id]
            const mine = answers[q.id]
            const right = r != null && mine === r.correctIndex
            return (
              <li key={q.id} className={`rounded-2xl border p-4 ${right ? 'border-emerald-200' : 'border-red-200'}`}>
                <div className="flex items-start gap-2.5">
                  <span className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-white ${right ? 'bg-emerald-600' : 'bg-red-600'}`}>
                    {right ? <Check size={12} strokeWidth={3} /> : <span className="text-[11px] font-bold">×</span>}
                  </span>
                  <div className="min-w-0 flex-1 text-sm">
                    <p className="font-semibold text-ink-900">{q.title || q.question}</p>
                    {q.title && <p className="mt-0.5 text-ink-600">{q.question}</p>}
                    {!right && mine !== undefined && (
                      <p className="mt-2 text-ink-700">
                        <span className="font-medium text-red-700">You chose: </span>
                        {q.options[mine]}
                      </p>
                    )}
                    <p className="mt-1.5 text-ink-800">
                      <span className="font-medium text-emerald-700">Right answer: </span>
                      {r ? q.options[r.correctIndex] : '—'}
                    </p>
                    {r?.explanation && <p className="mt-1.5 leading-relaxed text-ink-700">{r.explanation}</p>}
                    {r?.whyWrong && !right && <p className="mt-1.5 leading-relaxed text-ink-600">{r.whyWrong}</p>}
                    {r?.learningOutcome && <p className="mt-2 text-xs font-medium text-emerald-700">{r.learningOutcome}</p>}
                  </div>
                </div>
              </li>
            )
          })}
        </ul>
        {onDone && (
          <button
            type="button"
            onClick={onDone}
            className={`press mt-5 inline-flex h-11 items-center gap-1.5 rounded-xl px-5 text-sm font-semibold text-white shadow-e1 transition-colors ${look.button}`}
          >
            {doneLabel} <ArrowRight size={16} />
          </button>
        )}
      </div>
    )
  }

  const q = questions[index]
  if (!q) return null
  const last = index === questions.length - 1
  const answered = questions.filter((x) => answers[x.id] !== undefined).length
  return (
    <div>
      <div className="flex items-center justify-between gap-3 text-xs text-ink-500">
        <span>
          Question {index + 1} of {questions.length}
          {q.topic ? ` · ${q.topic}` : ''}
        </span>
        <span className="inline-flex gap-1" aria-hidden>
          {questions.map((x, i) => (
            <span key={x.id} className={`h-1.5 w-7 rounded-full ${answers[x.id] !== undefined ? 'bg-sky-600' : i === index ? 'bg-sky-300' : 'bg-ink-200'}`} />
          ))}
        </span>
      </div>
      {q.title && <h2 className="mt-3 font-display text-lg font-semibold text-ink-900">{q.title}</h2>}
      <CaseBlock q={q} />
      <p className="mt-4 font-semibold leading-snug text-ink-900">{q.question}</p>
      <div role="radiogroup" aria-label="Answers" className="mt-3 space-y-2">
        {(order[q.id] ?? []).map((optIndex, shown) => {
          const selected = answers[q.id] === optIndex
          return (
            <button
              key={optIndex}
              type="button"
              role="radio"
              aria-checked={selected}
              disabled={busy}
              onClick={() => setAnswers((a) => ({ ...a, [q.id]: optIndex }))}
              className={`flex w-full items-start gap-3 rounded-xl border px-4 py-3 text-left text-sm transition-colors ${
                selected ? 'border-sky-400 bg-sky-50' : 'border-ink-200 hover:border-ink-300 hover:bg-ink-50'
              }`}
            >
              <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-xs font-semibold ${selected ? 'bg-sky-600 text-white' : 'bg-ink-100 text-ink-700'}`}>
                {LETTERS[shown]}
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
            className={`press h-11 rounded-xl px-5 text-sm font-semibold text-white shadow-e1 transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${look.button}`}
          >
            {busy ? 'Grading…' : answered < questions.length ? `Answer all (${answered}/${questions.length})` : 'Submit answers'}
          </button>
        ) : (
          <button
            type="button"
            onClick={() => setIndex((v) => Math.min(questions.length - 1, v + 1))}
            disabled={answers[q.id] === undefined}
            className={`press inline-flex h-11 items-center gap-1.5 rounded-xl px-5 text-sm font-semibold text-white shadow-e1 transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${look.button}`}
          >
            Next <ArrowRight size={16} />
          </button>
        )}
      </div>
    </div>
  )
}
