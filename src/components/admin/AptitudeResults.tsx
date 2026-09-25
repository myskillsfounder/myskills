import { useEffect, useState } from 'react'
import { Link } from '@tanstack/react-router'
import { ClipboardList } from 'lucide-react'
import { errorMessage } from '@/lib/errors'
import { fetchAptitudeResults, type AptitudeRow } from '@/lib/adminProgrammes'
import { Alert, EmptyState, PageHeader, Skeleton } from '@/components/ui'

const fmtDate = (v: string) => new Date(v).toLocaleDateString()

/**
 * Everyone who took one programme's aptitude assessment: the average for each
 * dimension (lowest first — where the cohort needs the most help), then each
 * student's scores and the one thing they wrote. Dimensions are scored 4-16.
 */
export function AptitudeResults({
  programme,
  eyebrow,
  title,
  subtitle,
  dimensions,
  levelFor,
  reflectionLabel,
}: {
  programme: 'digital-marketing' | 'career-readiness'
  eyebrow: string
  title: string
  subtitle: string
  dimensions: { key: string; name: string }[]
  levelFor: (score: number) => string
  reflectionLabel: string
}) {
  const [rows, setRows] = useState<AptitudeRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string>()

  useEffect(() => {
    let active = true
    fetchAptitudeResults(programme)
      .then((r) => active && setRows(r))
      .catch((e) => active && setError(errorMessage(e)))
      .finally(() => active && setLoading(false))
    return () => {
      active = false
    }
  }, [programme])

  const averages = dimensions
    .map((d) => ({
      ...d,
      avg: rows.length ? rows.reduce((s, r) => s + (r.scores[d.key] ?? 0), 0) / rows.length : 0,
    }))
    .sort((a, b) => a.avg - b.avg)

  return (
    <>
      <PageHeader eyebrow={eyebrow} title={title} subtitle={subtitle} />

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
        <EmptyState icon={ClipboardList} title="No results yet" description="Results appear as students take it." />
      ) : (
        <>
          <section className="card mb-5 p-5 sm:p-6">
            <h2 className="font-display text-base font-semibold text-ink-900">
              Averages · {rows.length} {rows.length === 1 ? 'student' : 'students'}
            </h2>
            <ul className="mt-3 space-y-2.5">
              {averages.map((a) => (
                <li key={a.key}>
                  <div className="flex items-baseline justify-between gap-3 text-sm">
                    <span className="text-ink-700">{a.name}</span>
                    <span className="shrink-0 text-ink-500">
                      <span className="font-semibold tabular-nums text-ink-900">{a.avg.toFixed(1)}</span>/16 · {levelFor(Math.round(a.avg))}
                    </span>
                  </div>
                  <div className="mt-1 h-2 overflow-hidden rounded-full bg-ink-100">
                    <div className="h-full rounded-full bg-brand-500" style={{ width: `${((a.avg - 4) / 12) * 100}%` }} />
                  </div>
                </li>
              ))}
            </ul>
          </section>

          <div className="card overflow-x-auto">
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead className="border-b border-ink-200 text-xs uppercase tracking-wide text-ink-500">
                <tr>
                  <th className="px-4 py-3 font-semibold">Student</th>
                  {dimensions.map((d) => (
                    <th key={d.key} className="px-3 py-3 font-semibold">
                      {d.name}
                    </th>
                  ))}
                  <th className="px-4 py-3 font-semibold">{reflectionLabel}</th>
                  <th className="px-4 py-3 font-semibold">Taken</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.user_id} className="border-b border-ink-100 align-top last:border-0">
                    <td className="px-4 py-3">
                      <Link to="/admin/users/$id" params={{ id: r.user_id }} className="font-medium text-ink-900 hover:text-brand-700">
                        {r.full_name || '—'}
                      </Link>
                      <p className="text-xs text-ink-500">{r.email}</p>
                    </td>
                    {dimensions.map((d) => (
                      <td key={d.key} className="px-3 py-3 tabular-nums text-ink-800">
                        {r.scores[d.key] ?? '—'}
                      </td>
                    ))}
                    <td className="max-w-xs px-4 py-3 text-xs text-ink-600">{r.reflection || '—'}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-ink-600">{fmtDate(r.completed_at)}</td>
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
