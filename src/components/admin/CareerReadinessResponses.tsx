import { useEffect, useState } from 'react'
import { errorMessage } from '@/lib/errors'
import { MODULE_CONTENT, type ItemKey } from '@/lib/careerReadinessContent'
import { fetchLearnerResponses, type LearnerResponse } from '@/lib/careerReadinessProgramme'
import { PERSONAL_DEVELOPMENT_MODULES } from '@/lib/programmes'

const ITEM_ORDER: ItemKey[] = ['t1', 't2', 't3', 'reflect']

/**
 * What a Career Readiness learner actually wrote, module by module, under the
 * task it answers — the thing a mentor is signing off. Loaded when the review
 * is opened (open by default while it's waiting), not with the whole queue.
 */
export function CareerReadinessResponses({ userId, defaultOpen }: { userId: string; defaultOpen: boolean }) {
  const [open, setOpen] = useState(defaultOpen)
  const [rows, setRows] = useState<LearnerResponse[] | null>(null)
  const [error, setError] = useState<string>()

  useEffect(() => {
    if (!open || rows) return
    let active = true
    fetchLearnerResponses(userId)
      .then((r) => active && setRows(r))
      .catch((e) => active && setError(errorMessage(e)))
    return () => {
      active = false
    }
  }, [open, rows, userId])

  const byKey = new Map((rows ?? []).map((r) => [`${r.module}:${r.item}`, r]))

  return (
    <div className="mt-4 border-t border-ink-200 pt-4">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="text-xs font-semibold uppercase tracking-wide text-ink-500 hover:text-ink-800"
        aria-expanded={open}
      >
        Written answers {open ? '▾' : '▸'}
      </button>

      {open && error && <p className="mt-2 text-sm text-red-700">{error}</p>}
      {open && !rows && !error && <p className="mt-2 text-sm text-ink-500">Loading…</p>}

      {open && rows && (
        <div className="mt-3 space-y-5">
          {rows.length === 0 && <p className="text-sm text-ink-500">Nothing written yet.</p>}
          {PERSONAL_DEVELOPMENT_MODULES.map((m, i) => {
            const content = MODULE_CONTENT.find((c) => c.slug === m.slug)
            const written = ITEM_ORDER.filter((k) => byKey.has(`${m.slug}:${k}`))
            if (!content || written.length === 0) return null
            return (
              <section key={m.slug}>
                <h3 className="font-display text-base font-semibold text-ink-900">
                  Module {i + 1} · {m.title}
                </h3>
                <div className="mt-2 space-y-3">
                  {written.map((k) => {
                    const task = content.tasks.find((t) => t.key === k)
                    const question = k === 'reflect' ? content.reflection.prompt : (task?.prompt ?? '')
                    const title = k === 'reflect' ? 'Reflection' : (task?.title ?? k)
                    return (
                      <div key={k} className="rounded-xl bg-ink-100 p-3.5">
                        <p className="text-xs font-semibold text-ink-700">{title}</p>
                        <p className="mt-0.5 text-xs leading-relaxed text-ink-500">{question}</p>
                        <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-ink-800">
                          {byKey.get(`${m.slug}:${k}`)?.response}
                        </p>
                      </div>
                    )
                  })}
                </div>
              </section>
            )
          })}
        </div>
      )}
    </div>
  )
}
