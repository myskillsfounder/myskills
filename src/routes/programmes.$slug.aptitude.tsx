import { useMemo, useState } from 'react'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { requireOnboarded } from '@/lib/guards'
import { errorMessage } from '@/lib/errors'
import { submitAptitude } from '@/lib/programmeStudent'
import { PageHeader } from '@/components/app/PageHeader'
import { ProgrammeFrame, previewSearch, useMyProgramme } from '@/components/programme/shared'
import { Button } from '@/components/ui'

export const Route = createFileRoute('/programmes/$slug/aptitude')({
  beforeLoad: requireOnboarded,
  validateSearch: previewSearch,
  component: AptitudePage,
})

const SCALE = ['Never', 'Sometimes', 'Often', 'Always'] as const

/** A stable shuffle, so skills are mixed but the order doesn't jump on every render. */
function mixed<T extends { id: string }>(items: T[]): T[] {
  const h = (s: string) => [...s].reduce((a, c) => (a * 31 + c.charCodeAt(0)) >>> 0, 7)
  return [...items].sort((a, b) => h(a.id) - h(b.id))
}

function AptitudePage() {
  const { slug } = Route.useParams()
  const preview = Boolean(Route.useSearch().preview)
  const navigate = useNavigate()
  const { p, error } = useMyProgramme(slug, preview)
  const [answers, setAnswers] = useState<Record<string, number>>({})
  const [busy, setBusy] = useState(false)
  const [saveError, setSaveError] = useState<string>()
  const items = useMemo(() => mixed(p?.content.aptitude.items ?? []), [p])

  return (
    <ProgrammeFrame slug={slug} preview={preview} back="programme" p={p} error={error}>
      {(p) => {
        const answered = items.filter((i) => answers[i.id]).length
        return (
          <div className="space-y-4">
            <PageHeader
              eyebrow={`${p.title} · Aptitude test`}
              title="How do you work today?"
              description="Answer honestly: there are no right answers. Your modules will start with the skills you rate lowest."
            />
            <ol className="space-y-3">
              {items.map((it, i) => (
                <li key={it.id} className="card p-4 sm:p-5">
                  <p className="text-sm font-medium text-ink-900">
                    <span className="mr-1 text-ink-400">{i + 1}.</span> {it.statement}
                  </p>
                  <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4" role="radiogroup" aria-label={it.statement}>
                    {SCALE.map((label, v) => (
                      <button
                        key={label}
                        type="button"
                        role="radio"
                        aria-checked={answers[it.id] === v + 1}
                        onClick={() => setAnswers((a) => ({ ...a, [it.id]: v + 1 }))}
                        className={`rounded-xl border px-3 py-2 text-sm font-medium transition-colors ${
                          answers[it.id] === v + 1 ? 'border-brand-500 bg-brand-50 text-brand-800' : 'border-ink-200 bg-white text-ink-700 hover:border-ink-300'
                        }`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </li>
              ))}
            </ol>
            <div className="sticky bottom-4 flex flex-wrap items-center gap-3 rounded-2xl border border-ink-200 bg-white/95 p-3 shadow-e2 backdrop-blur">
              <span className="text-sm text-ink-600">
                {answered} of {items.length} answered
              </span>
              {saveError && <span className="text-sm text-red-700">{saveError}</span>}
              <Button
                className="ml-auto"
                disabled={busy || answered < items.length}
                onClick={() => {
                  if (preview) {
                    void navigate({ to: '/programmes/$slug', params: { slug }, search: { preview: 1 } })
                    return
                  }
                  setBusy(true)
                  setSaveError(undefined)
                  submitAptitude(slug, answers)
                    .then(() => navigate({ to: '/programmes/$slug', params: { slug } }))
                    .catch((e) => {
                      setSaveError(errorMessage(e))
                      setBusy(false)
                    })
                }}
              >
                {busy ? 'Saving…' : 'See my results'}
              </Button>
            </div>
          </div>
        )
      }}
    </ProgrammeFrame>
  )
}
