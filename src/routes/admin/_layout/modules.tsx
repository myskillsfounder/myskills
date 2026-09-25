import { useEffect, useState } from 'react'
import { createFileRoute, Link } from '@tanstack/react-router'
import { ArrowLeft, BookOpen } from 'lucide-react'
import { errorMessage } from '@/lib/errors'
import { fetchCrModules, fetchModuleAnswers, type ModuleAnswerRow } from '@/lib/adminProgrammes'
import { ITEM_KEYS, MODULE_CONTENT } from '@/lib/careerReadinessContent'
import { PERSONAL_DEVELOPMENT_MODULES } from '@/lib/programmes'
import { RequireSection } from '@/components/admin/AdminSectionGate'
import { Alert, EmptyState, PageHeader, Skeleton } from '@/components/ui'

export const Route = createFileRoute('/admin/_layout/modules')({
  component: () => (
    <RequireSection section="mentor-reviews">
      <ModulesPage />
    </RequireSection>
  ),
})

/**
 * The five Career Readiness modules: how many students started and finished
 * each, and — opening one — every student's written answers, task by task.
 */
function ModulesPage() {
  const [rows, setRows] = useState<{ module: string; started: number; finished: number }[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string>()
  const [open, setOpen] = useState<string | null>(null)

  useEffect(() => {
    let active = true
    fetchCrModules()
      .then((r) => active && setRows(r))
      .catch((e) => active && setError(errorMessage(e)))
      .finally(() => active && setLoading(false))
    return () => {
      active = false
    }
  }, [])

  if (open) return <ModuleAnswers slug={open} onBack={() => setOpen(null)} />

  const byModule = new Map(rows.map((r) => [r.module, r]))

  return (
    <>
      <PageHeader
        eyebrow="Career Readiness"
        title="Modules & answers"
        subtitle="Each module is three written tasks and a reflection. Open one to read what students wrote."
      />

      {error && (
        <div className="mb-5">
          <Alert tone="danger" title="Couldn’t load modules">
            <p>{error}</p>
            <p className="mt-1 text-xs">First run? Apply docs/supabase-admin-v2-programmes.sql in Supabase.</p>
          </Alert>
        </div>
      )}

      {loading ? (
        <Skeleton className="h-64 w-full" />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {PERSONAL_DEVELOPMENT_MODULES.map((m, i) => {
            const r = byModule.get(m.slug)
            return (
              <button
                key={m.slug}
                type="button"
                onClick={() => setOpen(m.slug)}
                className="card lift p-5 text-left"
              >
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-500">Module {i + 1}</p>
                <h2 className="mt-1 font-display text-lg font-semibold text-ink-900">{m.title}</h2>
                <p className="mt-2 text-sm text-ink-600">
                  <span className="font-semibold text-ink-900">{r?.started ?? 0}</span> started ·{' '}
                  <span className="font-semibold text-emerald-700">{r?.finished ?? 0}</span> finished
                </p>
              </button>
            )
          })}
        </div>
      )}
    </>
  )
}

function ModuleAnswers({ slug, onBack }: { slug: string; onBack: () => void }) {
  const meta = PERSONAL_DEVELOPMENT_MODULES.find((m) => m.slug === slug)
  const content = MODULE_CONTENT.find((c) => c.slug === slug)
  const [rows, setRows] = useState<ModuleAnswerRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string>()

  useEffect(() => {
    let active = true
    fetchModuleAnswers(slug)
      .then((r) => active && setRows(r))
      .catch((e) => active && setError(errorMessage(e)))
      .finally(() => active && setLoading(false))
    return () => {
      active = false
    }
  }, [slug])

  // One card per student, their answers in task order.
  const students = new Map<string, { name: string; email: string; answers: Map<string, ModuleAnswerRow> }>()
  for (const r of rows) {
    const s = students.get(r.user_id) ?? { name: r.full_name || '—', email: r.email, answers: new Map() }
    s.answers.set(r.item, r)
    students.set(r.user_id, s)
  }
  const title = (k: string) =>
    k === 'reflect' ? 'Reflection' : (content?.tasks.find((t) => t.key === k)?.title ?? k)

  return (
    <>
      <button type="button" onClick={onBack} className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-ink-600 hover:text-ink-900">
        <ArrowLeft size={16} /> All modules
      </button>
      <PageHeader eyebrow="Modules & answers" title={meta?.title ?? slug} subtitle={content?.outcome} />
      {error && (
        <Alert tone="danger" title="Couldn’t load answers">
          <p>{error}</p>
        </Alert>
      )}
      {loading ? (
        <Skeleton className="h-64 w-full" />
      ) : students.size === 0 ? (
        <EmptyState icon={BookOpen} title="Nobody has written anything here yet" />
      ) : (
        <div className="space-y-4">
          {[...students.entries()].map(([id, s]) => (
            <article key={id} className="card p-5 sm:p-6">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <Link to="/admin/users/$id" params={{ id }} className="font-display text-base font-semibold text-ink-900 hover:text-brand-700">
                  {s.name}
                </Link>
                <span className="text-xs text-ink-500">
                  {s.email} · {s.answers.size}/{ITEM_KEYS.length} written
                </span>
              </div>
              <div className="mt-3 space-y-3">
                {ITEM_KEYS.filter((k) => s.answers.has(k)).map((k) => (
                  <div key={k} className="rounded-xl bg-ink-100 p-3.5">
                    <p className="text-xs font-semibold text-ink-700">{title(k)}</p>
                    <p className="mt-1.5 whitespace-pre-line text-sm leading-relaxed text-ink-800">{s.answers.get(k)!.response}</p>
                  </div>
                ))}
              </div>
            </article>
          ))}
        </div>
      )}
    </>
  )
}
