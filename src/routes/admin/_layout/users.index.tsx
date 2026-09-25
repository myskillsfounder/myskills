import { useCallback, useEffect, useMemo, useState } from 'react'
import { errorMessage } from '@/lib/errors'
import { createFileRoute, Link } from '@tanstack/react-router'
import { CheckCircle2, ChevronRight, Search, Users as UsersIcon } from 'lucide-react'
import { setMentorFlag } from '@/lib/admin'
import { fetchStudents, type AdminStudent } from '@/lib/adminStudents'
import { bandFor } from '@/lib/readinessScore'
import { skillTracks } from '@/lib/skillTracks'
import { RequireSection } from '@/components/admin/AdminSectionGate'
import { Alert, Avatar, EmptyState, Input, PageHeader, Skeleton } from '@/components/ui'

export const Route = createFileRoute('/admin/_layout/users/')({
  component: () => (
    <RequireSection section="users">
      <StudentsPage />
    </RequireSection>
  ),
})

const fmtDate = (v: string | null) => (v ? new Date(v).toLocaleDateString() : '—')

type Sort = 'newest' | 'score'

const BAND_TONE: Record<string, string> = {
  Standout: 'bg-emerald-50 text-emerald-700',
  Strong: 'bg-brand-50 text-brand-700',
  Building: 'bg-brand-50/60 text-brand-600',
  'Getting started': 'bg-ink-100 text-ink-600',
}

/**
 * Every student with their Career Readiness Score (recomputed by the server
 * when the list loads) and where they are in both programmes. A row opens the
 * student's page with everything behind those numbers.
 */
function StudentsPage() {
  const [search, setSearch] = useState('')
  const [sort, setSort] = useState<Sort>('newest')
  const [students, setStudents] = useState<AdminStudent[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string>()
  const [busyId, setBusyId] = useState<string>()

  const load = useCallback(async (term: string) => {
    setLoading(true)
    setError(undefined)
    try {
      setStudents(await fetchStudents(term))
    } catch (e) {
      setError(errorMessage(e))
    } finally {
      setLoading(false)
    }
  }, [])

  // Debounced so typing doesn't fire a query per keystroke.
  useEffect(() => {
    const id = setTimeout(() => void load(search), 300)
    return () => clearTimeout(id)
  }, [search, load])

  const rows = useMemo(
    () => (sort === 'score' ? [...students].sort((a, b) => b.score - a.score) : students),
    [students, sort],
  )

  async function toggleMentor(s: AdminStudent) {
    setBusyId(s.id)
    setError(undefined)
    try {
      await setMentorFlag(s.id, !s.is_mentor)
      setStudents((prev) => prev.map((u) => (u.id === s.id ? { ...u, is_mentor: !u.is_mentor } : u)))
    } catch (e) {
      setError(errorMessage(e))
    } finally {
      setBusyId(undefined)
    }
  }

  return (
    <>
      <PageHeader
        eyebrow="Students"
        title="All students"
        subtitle="Career Readiness Score and progress in both programmes. Open a student to see everything behind the number."
      />

      <div className="mb-5 flex flex-wrap items-end gap-3">
        <div className="w-full max-w-sm">
          <Input
            label=""
            required={false}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or email"
            aria-label="Search students"
          />
        </div>
        <div className="flex gap-2">
          {(['newest', 'score'] as Sort[]).map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setSort(s)}
              className={`rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors ${
                sort === s ? 'border-brand-500 bg-brand-50 text-brand-800' : 'border-ink-300 text-ink-600 hover:bg-ink-100'
              }`}
            >
              {s === 'newest' ? 'Newest' : 'Highest score'}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div className="mb-5">
          <Alert tone="danger" title="Couldn’t load students">
            <p>{error}</p>
            <p className="mt-1 text-xs">First run? Apply docs/supabase-admin-v2.sql in Supabase.</p>
          </Alert>
        </div>
      )}

      {loading ? (
        <Skeleton className="h-64 w-full" />
      ) : rows.length === 0 ? (
        <EmptyState
          icon={UsersIcon}
          title={search ? 'No matches' : 'No students yet'}
          description={search ? 'Try a different name or email.' : undefined}
        />
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full min-w-[860px] text-left text-sm">
            <thead className="border-b border-ink-200 text-xs uppercase tracking-wide text-ink-500">
              <tr>
                <th scope="col" className="px-4 py-3 font-semibold">Student</th>
                <th scope="col" className="px-4 py-3 font-semibold">Score</th>
                <th scope="col" className="px-4 py-3 font-semibold">Digital Marketing</th>
                <th scope="col" className="px-4 py-3 font-semibold">Career Readiness</th>
                <th scope="col" className="px-4 py-3 font-semibold">Last login</th>
                <th scope="col" className="px-4 py-3 font-semibold">Mentor</th>
                <th scope="col" className="px-2 py-3" aria-label="Open" />
              </tr>
            </thead>
            <tbody>
              {rows.map((s) => {
                const band = bandFor(s.score).label
                return (
                  <tr key={s.id} className="border-b border-ink-100 last:border-0 hover:bg-ink-50/60">
                    <td className="px-4 py-3">
                      <Link to="/admin/users/$id" params={{ id: s.id }} className="flex items-center gap-3">
                        <Avatar name={s.full_name || s.email} size={34} />
                        <div className="min-w-0">
                          <p className="flex items-center gap-1.5 truncate font-medium text-ink-900">
                            {s.full_name || '—'}
                            {s.identity_verified && (
                              <CheckCircle2 size={13} className="shrink-0 text-emerald-600" aria-label="Identity verified" />
                            )}
                          </p>
                          <p className="truncate text-xs text-ink-500">{s.email}</p>
                        </div>
                      </Link>
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-display text-lg font-semibold tabular-nums text-ink-900">{s.score}</p>
                      <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${BAND_TONE[band]}`}>
                        {band}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-ink-600">
                      <p>
                        <span className="font-semibold text-ink-900">{s.dm_tracks}</span>/{skillTracks.length} tracks
                      </p>
                      <p>{s.dm_foundation === null ? 'Foundation not taken' : `Foundation ${s.dm_foundation}%`}</p>
                      {s.dm_signed_off && <p className="font-semibold text-emerald-700">Signed off</p>}
                    </td>
                    <td className="px-4 py-3 text-xs text-ink-600">
                      <p>
                        <span className="font-semibold text-ink-900">{s.cr_modules}</span>/5 modules
                      </p>
                      {s.cr_signed_off && <p className="font-semibold text-emerald-700">Signed off</p>}
                    </td>
                    <td className="px-4 py-3 text-ink-600">{fmtDate(s.last_login)}</td>
                    <td className="px-4 py-3">
                      <label className="inline-flex cursor-pointer items-center gap-2">
                        <input
                          type="checkbox"
                          checked={s.is_mentor}
                          disabled={busyId === s.id}
                          onChange={() => void toggleMentor(s)}
                          className="h-4 w-4 accent-brand-600"
                        />
                        <span className="text-xs text-ink-600">{s.is_mentor ? 'Mentor' : 'Grant'}</span>
                      </label>
                    </td>
                    <td className="px-2 py-3">
                      <Link
                        to="/admin/users/$id"
                        params={{ id: s.id }}
                        aria-label={`Open ${s.full_name || s.email}`}
                        className="flex h-8 w-8 items-center justify-center rounded-lg text-ink-400 hover:bg-ink-100 hover:text-ink-700"
                      >
                        <ChevronRight size={16} />
                      </Link>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {!loading && rows.length > 0 && (
        <p className="mt-3 flex items-center gap-1.5 text-xs text-ink-500">
          <Search size={12} />
          Showing {rows.length} {rows.length === 200 ? '(capped at 200 — search to narrow)' : ''}
        </p>
      )}
    </>
  )
}
