import { useEffect, useRef, useState } from 'react'
import { ArrowLeft, ArrowRight, ListChecks, Loader2, Lock, Send, Sparkles } from 'lucide-react'
import { errorMessage } from '@/lib/errors'
import { useAuthUser } from '@/lib/useAuth'
import { FREQUENCY } from '@/lib/careerReadinessAssessment'
import { Eyebrow } from '@/components/landing/Eyebrow'

type Phase = 'intro' | 'questions' | 'reflection'

/** All the quiz needs to know about a statement. Which ones are reverse-scored
 *  stays on the server, so it isn't here. */
export interface QuizStatement {
  id: string
  statement: string
}

/** What differs between one self-assessment and another. */
export interface QuizCopy {
  /** localStorage namespace for the saved draft; the user id is appended. */
  draftPrefix: string
  /** The paragraph under the intro heading. */
  intro: string
  /** The optional, unscored closing question. */
  closing: { title: string; hint: string; placeholder: string; ariaLabel: string }
}

interface Draft {
  answers: Record<string, number>
  index: number
}

function loadDraft(key: string, questions: QuizStatement[]): Draft | null {
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return null
    const d = JSON.parse(raw) as Draft
    // Only keep answers to questions that still exist, so a changed question
    // bank (it was cut from 25 to 20) can't leave a stale answer counting.
    const ids = new Set(questions.map((q) => q.id))
    const answers = Object.fromEntries(Object.entries(d.answers ?? {}).filter(([id]) => ids.has(id)))
    if (Object.keys(answers).length === 0) return null
    return { answers, index: Math.min(Math.max(d.index ?? 0, 0), questions.length - 1) }
  } catch {
    return null
  }
}

function saveDraft(key: string, draft: Draft) {
  try {
    localStorage.setItem(key, JSON.stringify(draft))
  } catch {
    /* private mode / storage disabled — the quiz still works, it just can't resume */
  }
}

function clearDraft(key: string) {
  try {
    localStorage.removeItem(key)
  } catch {
    /* ignore */
  }
}

const primaryButton =
  'press inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full bg-white px-6 py-3 text-sm font-semibold text-ink-900 shadow-e2 transition-colors hover:bg-brand-50 disabled:opacity-60'
const secondaryButton =
  'press inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full border border-white/20 px-6 py-3 text-sm font-semibold text-white transition-colors hover:border-white/40 disabled:opacity-60'

const panel = 'card-glass-dark glow-edge relative overflow-hidden rounded-xl p-6 sm:p-9'

/**
 * The self-assessment quiz, on the site's dark theme: one statement per
 * screen, rated Never / Sometimes / Often / Always, then an optional closing
 * question. Shared by the Career Readiness and Digital Marketing aptitude
 * assessments. Scoring happens on the server (see onSubmit), so nothing here
 * knows which statements are reverse-scored.
 */
export function SelfAssessmentQuiz({
  questions,
  copy,
  onSubmit,
}: {
  questions: QuizStatement[]
  copy: QuizCopy
  onSubmit: (answers: Record<string, number>, reflection: string) => Promise<void>
}) {
  const { user } = useAuthUser()
  const userId = user?.id
  const key = userId ? `${copy.draftPrefix}.${userId}` : undefined

  const [phase, setPhase] = useState<Phase>('intro')
  const [index, setIndex] = useState(0)
  const [answers, setAnswers] = useState<Record<string, number>>({})
  const [reflection, setReflection] = useState('')
  const [resumable, setResumable] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string>()
  const advance = useRef<number | undefined>(undefined)

  const total = questions.length
  const answeredCount = Object.keys(answers).length
  const current = questions[index]
  // Roughly 15 seconds a statement (it's a quick gut-check, not a think-hard test).
  const minutes = Math.max(1, Math.round((total * 15) / 60))

  // Offer to resume once the session resolves (useAuthUser is null on first render).
  const checked = useRef(false)
  useEffect(() => {
    if (!userId || checked.current) return
    checked.current = true
    const d = loadDraft(`${copy.draftPrefix}.${userId}`, questions)
    if (d) {
      setAnswers(d.answers)
      setIndex(d.index)
      setResumable(true)
    }
  }, [userId, questions, copy.draftPrefix])

  useEffect(() => {
    if (!key || answeredCount === 0 || phase === 'intro') return
    saveDraft(key, { answers, index })
  }, [key, answers, index, answeredCount, phase])

  useEffect(() => () => window.clearTimeout(advance.current), [])

  function choose(value: number) {
    if (!current) return
    setAnswers((a) => ({ ...a, [current.id]: value }))
    // A short beat so the choice registers before the next statement, and Back still works.
    window.clearTimeout(advance.current)
    advance.current = window.setTimeout(() => {
      if (index < total - 1) setIndex((i) => i + 1)
      else setPhase('reflection')
    }, 260)
  }

  // 1-4 on the keyboard picks Never…Always.
  useEffect(() => {
    if (phase !== 'questions') return
    const onKey = (e: KeyboardEvent) => {
      const n = Number(e.key)
      if (n >= 1 && n <= 4) choose(n)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  async function submit() {
    setError(undefined)
    setSubmitting(true)
    try {
      await onSubmit(answers, reflection)
      if (key) clearDraft(key)
    } catch (e) {
      setError(errorMessage(e))
      setSubmitting(false)
    }
  }

  if (phase === 'intro') {
    return (
      <div className={panel}>
        <Eyebrow dark>Before you start</Eyebrow>
        <h2 className="mt-3 font-display text-3xl font-semibold leading-tight tracking-tight text-white">
          {total} statements. About {minutes} minutes.
        </h2>
        <p className="mt-3 max-w-xl text-sm leading-relaxed text-white/70">
          {copy.intro}
        </p>

        <ul className="mt-6 grid gap-3 sm:grid-cols-3">
          {[
            { icon: ListChecks, text: 'Never, Sometimes, Often or Always' },
            { icon: Sparkles, text: 'No right or wrong answers' },
            { icon: Lock, text: 'One attempt, saved to your profile' },
          ].map(({ icon: Icon, text }) => (
            <li key={text} className="flex items-start gap-3 rounded-lg bg-white/[0.06] p-3.5 text-sm text-white/80">
              <Icon size={17} className="mt-0.5 shrink-0 text-brand-200" />
              {text}
            </li>
          ))}
        </ul>

        <div className="mt-7 flex flex-wrap gap-3">
          <button
            type="button"
            className={primaryButton}
            onClick={() => {
              // Resume at the first statement still unanswered.
              const open = questions.findIndex((q) => answers[q.id] == null)
              setIndex(resumable ? (open === -1 ? total - 1 : open) : 0)
              setPhase('questions')
            }}
          >
            {resumable ? `Continue (${answeredCount} of ${total} done)` : 'Start'}
            <ArrowRight size={16} />
          </button>
          {resumable && (
            <button
              type="button"
              className={secondaryButton}
              onClick={() => {
                if (key) clearDraft(key)
                setAnswers({})
                setIndex(0)
                setResumable(false)
                setPhase('questions')
              }}
            >
              Start over
            </button>
          )}
        </div>
      </div>
    )
  }

  if (phase === 'reflection') {
    return (
      <div className={panel}>
        <Eyebrow dark>One last thing</Eyebrow>
        <h2 className="mt-3 font-display text-2xl font-semibold leading-snug tracking-tight text-white sm:text-3xl">
          {copy.closing.title}
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-white/70">
          {copy.closing.hint}
        </p>
        <textarea
          value={reflection}
          onChange={(e) => setReflection(e.target.value)}
          rows={4}
          maxLength={500}
          placeholder={copy.closing.placeholder}
          aria-label={copy.closing.ariaLabel}
          className="mt-5 w-full resize-y rounded-lg border border-white/15 bg-white/[0.06] px-4 py-3 text-sm text-white placeholder:text-white/40 transition-colors focus:border-brand-300 focus:bg-white/[0.09] focus:outline-none"
        />
        <p className="mt-1.5 text-right font-mono text-[11px] text-white/40">{reflection.length} / 500</p>

        {error && (
          <p role="alert" className="mt-3 rounded-lg border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
            <span className="font-semibold">Couldn’t save your answers.</span> {error}
          </p>
        )}

        <div className="mt-6 flex flex-wrap gap-3">
          <button
            type="button"
            className={secondaryButton}
            disabled={submitting}
            onClick={() => {
              setIndex(total - 1)
              setPhase('questions')
            }}
          >
            <ArrowLeft size={16} /> Back
          </button>
          <button type="button" className={primaryButton} disabled={submitting} onClick={() => void submit()}>
            {submitting ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
            {submitting ? 'Saving…' : 'See my results'}
          </button>
        </div>
      </div>
    )
  }

  const chosen = current ? answers[current.id] : undefined

  return (
    <div className={panel}>
      <div className="flex items-center justify-between gap-3">
        <Eyebrow dark>
          Statement {index + 1} / {total}
        </Eyebrow>
        <p className="font-mono text-[11px] font-bold tabular-nums text-white/50">
          {Math.round((answeredCount / total) * 100)}%
        </p>
      </div>

      {/* One segment per statement: answered fill, the current one glows. */}
      <div
        className="mt-4 flex gap-1"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={total}
        aria-valuenow={answeredCount}
      >
        {questions.map((q, i) => (
          <span
            key={q.id}
            className={`h-1.5 flex-1 rounded-full transition-colors duration-300 ${
              answers[q.id] != null ? 'bg-brand-300' : i === index ? 'bg-white/60' : 'bg-white/10'
            }`}
          />
        ))}
      </div>

      <h2
        key={current?.id}
        className="rise-in mt-8 min-h-[6.5rem] font-display text-2xl font-semibold leading-snug tracking-tight text-white sm:min-h-[5.5rem] sm:text-3xl"
      >
        {current?.statement}
      </h2>

      <div role="radiogroup" aria-label="How often is this true for you?" className="mt-7 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {FREQUENCY.map((f) => {
          const active = chosen === f.value
          return (
            <button
              key={f.value}
              type="button"
              role="radio"
              aria-checked={active}
              onClick={() => choose(f.value)}
              className={`press relative flex h-16 items-center justify-center rounded-xl border text-sm font-semibold transition-all duration-200 ${
                active
                  ? 'border-brand-300 bg-brand-500/30 text-white shadow-[0_0_28px_-8px_rgba(143,133,238,0.85)]'
                  : 'border-white/15 bg-white/[0.06] text-white/85 hover:border-white/30 hover:bg-white/[0.12]'
              }`}
            >
              <span
                aria-hidden
                className={`absolute left-2.5 top-2 font-mono text-[10px] font-bold ${active ? 'text-white/70' : 'text-white/30'}`}
              >
                {f.value}
              </span>
              {f.label}
            </button>
          )
        })}
      </div>

      <div className="mt-7 flex items-center justify-between">
        <button
          type="button"
          onClick={() => setIndex((i) => Math.max(0, i - 1))}
          disabled={index === 0}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-white/60 transition-colors hover:text-white disabled:opacity-30"
        >
          <ArrowLeft size={15} /> Back
        </button>
        <p className="hidden font-mono text-[11px] text-white/35 sm:block">Press 1–4 on your keyboard</p>
      </div>
    </div>
  )
}
