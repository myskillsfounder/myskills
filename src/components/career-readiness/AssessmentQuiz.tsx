import { useEffect, useRef, useState } from 'react'
import { ArrowLeft, ArrowRight, Loader2, Send } from 'lucide-react'
import { errorMessage } from '@/lib/errors'
import { useAuthUser } from '@/lib/useAuth'
import { FREQUENCY, type AssessmentQuestion } from '@/lib/careerReadinessAssessment'
import { Alert, Button, Textarea } from '@/components/ui'

type Phase = 'intro' | 'questions' | 'reflection'

const draftKey = (userId: string) => `myskills.careerAssessmentDraft.${userId}`

interface Draft {
  answers: Record<string, number>
  index: number
}

function loadDraft(userId: string, questions: AssessmentQuestion[]): Draft | null {
  try {
    const raw = localStorage.getItem(draftKey(userId))
    if (!raw) return null
    const d = JSON.parse(raw) as Draft
    // Only keep answers to questions that still exist, so a changed question
    // bank can't leave a stale answer counting.
    const ids = new Set(questions.map((q) => q.id))
    const answers = Object.fromEntries(Object.entries(d.answers ?? {}).filter(([id]) => ids.has(id)))
    if (Object.keys(answers).length === 0) return null
    return { answers, index: Math.min(Math.max(d.index ?? 0, 0), questions.length - 1) }
  } catch {
    return null
  }
}

function saveDraft(userId: string, draft: Draft) {
  try {
    localStorage.setItem(draftKey(userId), JSON.stringify(draft))
  } catch {
    /* private mode / storage disabled — the quiz still works, it just can't resume */
  }
}

function clearDraft(userId: string) {
  try {
    localStorage.removeItem(draftKey(userId))
  } catch {
    /* ignore */
  }
}

/**
 * The Career Readiness self-awareness assessment: one statement per screen,
 * rated Never / Sometimes / Often / Always, then an optional closing
 * question. Scoring happens on the server (see onSubmit), so nothing here
 * knows which statements are reverse-scored.
 */
export function AssessmentQuiz({
  questions,
  onSubmit,
}: {
  questions: AssessmentQuestion[]
  onSubmit: (answers: Record<string, number>, reflection: string) => Promise<void>
}) {
  const { user } = useAuthUser()
  const userId = user?.id

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

  // Offer to resume once the session resolves (useAuthUser is null on first render).
  const checked = useRef(false)
  useEffect(() => {
    if (!userId || checked.current) return
    checked.current = true
    const d = loadDraft(userId, questions)
    if (d) {
      setAnswers(d.answers)
      setIndex(d.index)
      setResumable(true)
    }
  }, [userId, questions])

  useEffect(() => {
    if (!userId || answeredCount === 0 || phase === 'intro') return
    saveDraft(userId, { answers, index })
  }, [userId, answers, index, answeredCount, phase])

  useEffect(() => () => window.clearTimeout(advance.current), [])

  function choose(value: number) {
    if (!current) return
    setAnswers((a) => ({ ...a, [current.id]: value }))
    // A short beat so the choice registers before the next statement, and Back still works.
    window.clearTimeout(advance.current)
    advance.current = window.setTimeout(() => {
      if (index < total - 1) setIndex((i) => i + 1)
      else setPhase('reflection')
    }, 220)
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
      if (userId) clearDraft(userId)
    } catch (e) {
      setError(errorMessage(e))
      setSubmitting(false)
    }
  }

  if (phase === 'intro') {
    return (
      <div className="card p-6 sm:p-8">
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-brand-700">Before you start</p>
        <h2 className="mt-1 font-display text-2xl font-semibold tracking-tight text-ink-900">
          {total} statements, about 8 minutes
        </h2>
        <ul className="mt-4 space-y-2.5 text-sm leading-relaxed text-ink-600">
          <li>Rate how often each one is true for you: Never, Sometimes, Often or Always.</li>
          <li>There are no right answers. It’s a starting point, not a test, so answer as you really are.</li>
          <li>It doesn’t change your Career Readiness Score, and you get one attempt.</li>
        </ul>
        <div className="mt-6 flex flex-wrap gap-3">
          <Button
            size="lg"
            iconRight={ArrowRight}
            onClick={() => {
              // Resume at the first statement still unanswered.
              const open = questions.findIndex((q) => answers[q.id] == null)
              setIndex(resumable ? (open === -1 ? total - 1 : open) : 0)
              setPhase('questions')
            }}
          >
            {resumable ? `Continue (${answeredCount} of ${total} done)` : 'Start'}
          </Button>
          {resumable && (
            <Button
              size="lg"
              variant="secondary"
              onClick={() => {
                if (userId) clearDraft(userId)
                setAnswers({})
                setIndex(0)
                setResumable(false)
                setPhase('questions')
              }}
            >
              Start over
            </Button>
          )}
        </div>
      </div>
    )
  }

  if (phase === 'reflection') {
    return (
      <div className="card p-6 sm:p-8">
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-brand-700">One last thing</p>
        <h2 className="mt-1 font-display text-2xl font-semibold tracking-tight text-ink-900">
          Which one skill would you most like to get better at?
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-ink-600">
          In your own words. It’s optional and isn’t scored — a mentor will see it when they review your
          progress.
        </p>
        <div className="mt-4">
          <Textarea
            value={reflection}
            onChange={(e) => setReflection(e.target.value)}
            required={false}
            rows={4}
            maxLength={500}
            placeholder="e.g. Speaking up in meetings without freezing…"
            aria-label="The skill you most want to improve"
          />
        </div>
        {error && (
          <div className="mt-4">
            <Alert tone="danger" title="Couldn’t save your answers">
              <p>{error}</p>
            </Alert>
          </div>
        )}
        <div className="mt-5 flex flex-wrap gap-3">
          <Button
            variant="secondary"
            icon={ArrowLeft}
            disabled={submitting}
            onClick={() => {
              setIndex(total - 1)
              setPhase('questions')
            }}
          >
            Back
          </Button>
          <Button size="lg" icon={submitting ? Loader2 : Send} disabled={submitting} onClick={() => void submit()}>
            {submitting ? 'Saving…' : 'See my results'}
          </Button>
        </div>
      </div>
    )
  }

  const chosen = current ? answers[current.id] : undefined

  return (
    <div className="card p-6 sm:p-8">
      <div className="flex items-center justify-between gap-3">
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-brand-700">
          Statement {index + 1} of {total}
        </p>
        <p className="font-display text-sm font-semibold tabular-nums text-ink-500">
          {Math.round((answeredCount / total) * 100)}%
        </p>
      </div>
      <div
        className="mt-2 h-1.5 overflow-hidden rounded-full bg-ink-100"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={total}
        aria-valuenow={answeredCount}
      >
        <div
          className="h-full rounded-full bg-gradient-to-r from-brand-500 to-brand-700 transition-all duration-300"
          style={{ width: `${(answeredCount / total) * 100}%` }}
        />
      </div>

      <h2 className="mt-7 min-h-[4.5rem] font-display text-xl font-semibold leading-snug tracking-tight text-ink-900 sm:text-2xl">
        {current?.statement}
      </h2>

      <div role="radiogroup" aria-label="How often is this true for you?" className="mt-6 grid grid-cols-2 gap-2.5 sm:grid-cols-4">
        {FREQUENCY.map((f) => {
          const active = chosen === f.value
          return (
            <button
              key={f.value}
              type="button"
              role="radio"
              aria-checked={active}
              onClick={() => choose(f.value)}
              className={`press flex h-14 flex-col items-center justify-center rounded-xl border text-sm font-semibold transition-colors ${
                active
                  ? 'border-brand-600 bg-brand-600 text-white'
                  : 'border-ink-300 bg-white text-ink-800 hover:border-brand-300 hover:bg-brand-50'
              }`}
            >
              {f.label}
              <span className={`text-[10px] font-medium ${active ? 'text-white/70' : 'text-ink-400'}`}>{f.value}</span>
            </button>
          )
        })}
      </div>

      <div className="mt-6 flex items-center justify-between">
        <button
          type="button"
          onClick={() => setIndex((i) => Math.max(0, i - 1))}
          disabled={index === 0}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-ink-600 transition-colors hover:text-ink-900 disabled:opacity-40"
        >
          <ArrowLeft size={15} /> Back
        </button>
        <p className="hidden text-xs text-ink-400 sm:block">Tip: press 1–4 on your keyboard</p>
      </div>
    </div>
  )
}
