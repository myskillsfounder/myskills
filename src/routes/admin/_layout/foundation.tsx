import { useEffect, useState } from 'react'
import { createFileRoute, Link } from '@tanstack/react-router'
import { ClipboardCheck } from 'lucide-react'
import { errorMessage } from '@/lib/errors'
import { fetchFoundationCategories, fetchFoundationResults, type FoundationRow } from '@/lib/adminProgrammes'
import { RequireSection } from '@/components/admin/AdminSectionGate'
import { Alert, Badge, EmptyState, PageHeader, Skeleton } from '@/components/ui'

// Student results, so the 'users' section (the server also lets 'assessment' read it).
export const Route = createFileRoute('/admin/_layout/foundation')({
  component: () => (
    <RequireSection section="users">
      <FoundationPage />
    </RequireSection>
  ),
})

const fmtDate = (v: string) => new Date(v).toLocaleDateString()
const KIND_TONE: Record<string, 'gold' | 'neutral' | 'warning'> = { gold: 'gold', silver: 'neutral', bronze: 'warning' }

/**
 * Every Foundation assessment — the one attempt, graded by the server, that
 * issues the certificate — and how each category went on average, weakest
 * first, so the questions or the vocabulary that feeds them can be improved.
 */
function FoundationPage() {
  const [rows, setRows] = useState<FoundationRow[]>([])
  const [cats, setCats] = useState<{ category: string; students: number; avg_percent: number }[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string>()

  useEffect(() => {
    let active = true
    Promise.all([fetchFoundationResults(), fetchFoundationCategories()])
      .then(([r, c]) => {
        if (!active) return
        setRows(r)
        setCats(c)
      })
      .catch((e) => active && setError(errorMessage(e)))
      .finally(() => active && setLoading(false))
    return () => {
      active = false
    }
  }, [])

  const avg = rows.length ? Math.round(rows.reduce((s, r) => s + r.percent, 0) / rows.length) : 0

  return (
    <>
      <PageHeader
        eyebrow="Digital Marketing"
        title="Foundation results"
        subtitle="One attempt per student, graded by the server. Gold 80%+, Silver 60%+, Bronze below."
      />

      {error && (
        <div className="mb-5">
          <Alert tone="danger" title="Couldn’t load results">
            <p>{error}</p>
            <p className="mt-1 text-xs">First run? Apply docs/supabase-admin-v2-programmes.sql in Supabase.</p>
          </Alert>
        </div>
      )}

      {loading ? (
        <Skeleton className="h-64 w-full" />
      ) : rows.length === 0 ? (
        <EmptyState icon={ClipboardCheck} title="No results yet" />
      ) : (
        <>
          <section className="card mb-5 p-5 sm:p-6">
            <h2 className="font-display text-base font-semibold text-ink-900">
              {rows.length} {rows.length === 1 ? 'student' : 'students'} · average {avg}%
            </h2>
            <p className="mt-1 text-xs text-ink-500">By category, weakest first.</p>
            <ul className="mt-3 space-y-2.5">
              {cats.map((c) => (
                <li key={c.category}>
                  <div className="flex items-baseline justify-between gap-3 text-sm">
                    <span className="text-ink-700">{c.category}</span>
                    <span className="shrink-0 font-semibold tabular-nums text-ink-900">{Math.round(c.avg_percent)}%</span>
                  </div>
                  <div className="mt-1 h-2 overflow-hidden rounded-full bg-ink-100">
                    <div
                      className={`h-full rounded-full ${c.avg_percent >= 60 ? 'bg-brand-500' : 'bg-amber-500'}`}
                      style={{ width: `${c.avg_percent}%` }}
                    />
                  </div>
                </li>
              ))}
            </ul>
          </section>

          <div className="card overflow-x-auto">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead className="border-b border-ink-200 text-xs uppercase tracking-wide text-ink-500">
                <tr>
                  <th className="px-4 py-3 font-semibold">Student</th>
                  <th className="px-4 py-3 font-semibold">Score</th>
                  <th className="px-4 py-3 font-semibold">Certificate</th>
                  <th className="px-4 py-3 font-semibold">Taken</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.user_id} className="border-b border-ink-100 last:border-0">
                    <td className="px-4 py-3">
                      <Link to="/admin/users/$id" params={{ id: r.user_id }} className="font-medium text-ink-900 hover:text-brand-700">
                        {r.full_name || '—'}
                      </Link>
                      <p className="text-xs text-ink-500">{r.email}</p>
                    </td>
                    <td className="px-4 py-3 tabular-nums">
                      <span className="font-semibold text-ink-900">{r.percent}%</span>
                      <span className="text-xs text-ink-500"> · {r.correct}/{r.total}</span>
                    </td>
                    <td className="px-4 py-3">
                      {r.certificate_kind ? (
                        <span className="inline-flex items-center gap-2">
                          <Badge tone={KIND_TONE[r.certificate_kind] ?? 'neutral'}>{r.certificate_kind}</Badge>
                          <span className="text-xs text-ink-500">{r.certificate_code}</span>
                        </span>
                      ) : (
                        <span className="text-ink-400">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-ink-600">{fmtDate(r.completed_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </>
  )
}
