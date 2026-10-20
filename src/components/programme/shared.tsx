import { useCallback, useEffect, useState, type ReactNode } from 'react'
import { Link } from '@tanstack/react-router'
import { ArrowLeft, Check, Eye, X } from 'lucide-react'
import { errorMessage } from '@/lib/errors'
import { fetchMyProgramme, type MyProgramme, type QuizResult } from '@/lib/programmeStudent'
import type { Question } from '@/lib/programmeEngine'
import { AppShell } from '@/components/app/AppShell'
import { Alert, Button, Skeleton } from '@/components/ui'

/** ?preview=1: staff trying a draft. Every programme page reads it the same way. */
export const previewSearch = (s: Record<string, unknown>): { preview?: 1 } =>
  s.preview === 1 || s.preview === '1' || s.preview === true ? { preview: 1 } : {}

/** The programme as this student sees it, with a way to reload after saving. */
export function useMyProgramme(slug: string, preview: boolean) {
  const [p, setP] = useState<MyProgramme | undefined>(undefined)
  const [error, setError] = useState<string>()
  const reload = useCallback(async () => {
    try {
      setP(await fetchMyProgramme(slug, preview))
      setError(undefined)
    } catch (e) {
      setError(errorMessage(e))
    }
  }, [slug, preview])
  useEffect(() => {
    void reload()
  }, [reload])
  return { p, setP, error, reload }
}

/** Every programme page: the app shell, the way back, the preview banner, loading and errors. */
export function ProgrammeFrame({
  slug,
  preview,
  back,
  p,
  error,
  children,
}: {
  slug: string
  preview: boolean
  /** Where "back" goes: the catalogue, or the programme page. */
  back: 'catalogue' | 'programme'
  p: MyProgramme | undefined
  error: string | undefined
  children: (p: MyProgramme) => ReactNode
}) {
  return (
    <AppShell wide>
      <div className="mx-auto max-w-3xl">
        {back === 'catalogue' ? (
          <Link to="/programmes" className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-ink-600 hover:text-ink-900">
            <ArrowLeft size={16} /> Programmes
          </Link>
        ) : (
          <Link
            to="/programmes/$slug"
            params={{ slug }}
            search={preview ? { preview: 1 } : {}}
            className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-ink-600 hover:text-ink-900"
          >
            <ArrowLeft size={16} /> {p?.title ?? 'Programme'}
          </Link>
        )}
        {preview && (
          <div className="mb-5 flex items-start gap-3 rounded-xl border border-gold-200 bg-gold-50 p-3.5 text-sm text-ink-800">
            <Eye size={17} className="mt-0.5 shrink-0 text-gold-700" />
            <p>
              <span className="font-semibold">Preview{p?.preview ? ` of the ${p.preview.status === 'draft' ? 'draft' : 'live version'}, v${p.version}` : ''}.</span>{' '}
              This is what students will see. Nothing you do here is saved, and quizzes are checked in your browser.
            </p>
          </div>
        )}
        {error ? (
          <Alert tone="danger" title="Couldn’t open this programme">
            <p>{error}</p>
          </Alert>
        ) : !p ? (
          <div className="space-y-4">
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-64 w-full" />
          </div>
        ) : (
          children(p)
        )}
      </div>
    </AppShell>
  )
}

const LETTER = 'ABCDEF'

/** A scenario question's case: company, role, background, objective… */
function CaseDetails({ q }: { q: Question }) {
  const c = q.context
  if (!c) return null
  const head = [c.company, c.role, c.industry].filter((x) => x && x.trim())
  const rows = (
    [
      ['Background', c.background],
      ['Objective', c.objective],
      ['What you know', c.information],
      ['Constraints', c.constraints],
    ] as const
  ).filter(([, v]) => v && v.trim())
  if (head.length === 0 && rows.length === 0) return null
  return (
    <div className="mt-2 rounded-xl bg-ink-50 p-3 text-sm leading-relaxed text-ink-700">
      {head.length > 0 && <p className="text-xs font-semibold text-ink-500">{head.join(' · ')}</p>}
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
 * A set of multiple-choice questions: answer all, submit, then see what was
 * right and why. Used for module quizzes and the final assessment.
 */
export function QuizRunner({
  questions,
  onSubmit,
  passPercent,
  submitLabel = 'Submit answers',
  onDone,
  doneLabel,
}: {
  questions: Question[]
  onSubmit: (answers: Record<string, number>) => Promise<QuizResult>
  passPercent: number
  submitLabel?: string
  onDone?: () => void
  doneLabel?: string
}) {
  const [answers, setAnswers] = useState<Record<string, number>>({})
  const [result, setResult] = useState<QuizResult>()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string>()
  const answered = questions.filter((q) => answers[q.id] !== undefined).length

  async function submit() {
    setBusy(true)
    setError(undefined)
    try {
      setResult(await onSubmit(answers))
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } catch (e) {
      setError(errorMessage(e))
    } finally {
      setBusy(false)
    }
  }

  const passed = result ? result.grade.percent >= passPercent : false
  return (
    <div className="space-y-4">
      {result && (
        <div className={`rounded-2xl p-5 ${passed ? 'bg-emerald-50' : 'bg-amber-50'}`}>
          <p className={`font-display text-3xl font-semibold ${passed ? 'text-emerald-800' : 'text-amber-800'}`}>{result.grade.percent}%</p>
          <p className="mt-1 text-sm text-ink-700">
            {result.grade.correct} of {result.grade.total} right.{' '}
            {passed ? 'Passed.' : `${passPercent}% passes. Read the explanations below, then try again later.`}
          </p>
          {onDone && (
            <div className="mt-3">
              <Button size="sm" onClick={onDone}>
                {doneLabel ?? 'Continue'}
              </Button>
            </div>
          )}
        </div>
      )}

      <ol className="space-y-4">
        {questions.map((q, i) => {
          const r = result?.review[q.id]
          const mine = answers[q.id]
          return (
            <li key={q.id} className="card p-5">
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-brand-700">
                Question {i + 1} of {questions.length}
                {q.topic ? ` · ${q.topic}` : ''}
              </p>
              {q.title && <p className="mt-1 font-display text-base font-semibold text-ink-900">{q.title}</p>}
              {q.scenario && <p className="mt-2 rounded-xl bg-ink-50 p-3 text-sm leading-relaxed text-ink-700">{q.scenario}</p>}
              <CaseDetails q={q} />
              <p className="mt-2 font-medium text-ink-900">{q.question}</p>
              <ul className="mt-3 space-y-2" role="radiogroup" aria-label={`Question ${i + 1}`}>
                {q.options.map((o, j) => {
                  const right = r ? r.correctIndex === j : false
                  const wrongPick = r && mine === j && !right
                  return (
                    <li key={j}>
                      <label
                        className={`flex cursor-pointer items-start gap-3 rounded-xl border px-3.5 py-2.5 text-sm transition-colors ${
                          r
                            ? right
                              ? 'border-emerald-400 bg-emerald-50'
                              : wrongPick
                                ? 'border-red-300 bg-red-50'
                                : 'border-ink-200 bg-white'
                            : mine === j
                              ? 'border-brand-500 bg-brand-50'
                              : 'border-ink-200 bg-white hover:border-ink-300'
                        } ${r ? 'cursor-default' : ''}`}
                      >
                        <input
                          type="radio"
                          name={q.id}
                          checked={mine === j}
                          disabled={Boolean(r)}
                          onChange={() => setAnswers((a) => ({ ...a, [q.id]: j }))}
                          className="mt-0.5 h-4 w-4 accent-brand-600"
                        />
                        <span className="min-w-0 flex-1">
                          <span className="font-semibold text-ink-500">{LETTER[j]}.</span> {o}
                        </span>
                        {right && <Check size={16} className="shrink-0 text-emerald-600" />}
                        {wrongPick && <X size={16} className="shrink-0 text-red-600" />}
                      </label>
                    </li>
                  )
                })}
              </ul>
              {r && (r.explanation || r.whyWrong || r.learningOutcome) && (
                <div className="mt-3 space-y-1.5 rounded-xl bg-ink-50 p-3 text-sm leading-relaxed text-ink-700">
                  {r.explanation && (
                    <p>
                      <span className="font-semibold text-ink-900">Why: </span>
                      {r.explanation}
                    </p>
                  )}
                  {r.whyWrong && (
                    <p>
                      <span className="font-semibold text-ink-900">The others: </span>
                      {r.whyWrong}
                    </p>
                  )}
                  {r.learningOutcome && (
                    <p>
                      <span className="font-semibold text-ink-900">What it teaches: </span>
                      {r.learningOutcome}
                    </p>
                  )}
                </div>
              )}
            </li>
          )
        })}
      </ol>

      {!result && (
        <div className="sticky bottom-4 flex flex-wrap items-center gap-3 rounded-2xl border border-ink-200 bg-white/95 p-3 shadow-e2 backdrop-blur">
          <span className="text-sm text-ink-600">
            {answered} of {questions.length} answered
          </span>
          {error && <span className="text-sm text-red-700">{error}</span>}
          <Button className="ml-auto" disabled={busy || answered < questions.length} onClick={() => void submit()}>
            {busy ? 'Checking…' : submitLabel}
          </Button>
        </div>
      )}
    </div>
  )
}
