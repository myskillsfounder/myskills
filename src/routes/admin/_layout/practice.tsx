import { useEffect, useState } from 'react'
import { createFileRoute, Link } from '@tanstack/react-router'
import { ArrowLeft, Dumbbell } from 'lucide-react'
import { errorMessage } from '@/lib/errors'
import {
  fetchPracticeTracks,
  fetchTrackStudents,
  type PracticeTrackRow,
  type TrackStudentRow,
} from '@/lib/adminProgrammes'
import { skillTracks } from '@/lib/skillTracks'
import { RequireSection } from '@/components/admin/AdminSectionGate'
import { Alert, EmptyState, PageHeader, Skeleton } from '@/components/ui'

export const Route = createFileRoute('/admin/_layout/practice')({
  component: () => (
    <RequireSection section="users">
      <PracticePage />
    </RequireSection>
  ),
})

const fmtDate = (v: string) => new Date(v).toLocaleDateString()

/**
 * The 8 Digital Marketing tracks: how many students practised each and how
 * well, and how many attempts the server graded versus the older ones graded
 * in the browser (which can't be checked). Open a track for its students.
 */
function PracticePage() {
  const [tracks, setTracks] = useState<PracticeTrackRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string>()
  const [open, setOpen] = useState<string | null>(null)

  useEffect(() => {
    let active = true
    fetchPracticeTracks()
      .then((r) => active && setTracks(r))
      .catch((e) => active && setError(errorMessage(e)))
      .finally(() => active && setLoading(false))
    return () => {
      active = false
    }
  }, [])

  const byTrack = new Map(tracks.map((t) => [t.track_slug, t]))

  if (open) {
    return <TrackStudents slug={open} onBack={() => setOpen(null)} />
  }

  return (
    <>
      <PageHeader
        eyebrow="Digital Marketing"
        title="Practice"
        subtitle="Each track’s reach and results. A track’s score is a student’s best of their last three attempts."
      />

      {error && (
        <div className="mb-5">
          <Alert tone="danger" title="Couldn’t load practice">
            <p>{error}</p>
            <p className="mt-1 text-xs">First run? Apply docs/supabase-admin-v2-programmes.sql in Supabase.</p>
          </Alert>
        </div>
      )}

      {loading ? (
        <Skeleton className="h-64 w-full" />
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="border-b border-ink-200 text-xs uppercase tracking-wide text-ink-500">
              <tr>
                <th className="px-4 py-3 font-semibold">Track</th>
                <th className="px-4 py-3 font-semibold">Students</th>
                <th className="px-4 py-3 font-semibold">Average best</th>
                <th className="px-4 py-3 font-semibold">Attempts</th>
                <th className="px-4 py-3 font-semibold">Server-graded</th>
                <th className="px-4 py-3 font-semibold">Older (unverified)</th>
              </tr>
            </thead>
            <tbody>
              {skillTracks.map((t) => {
                const r = byTrack.get(t.slug)
                return (
                  <tr key={t.slug} className="border-b border-ink-100 last:border-0 hover:bg-ink-50/60">
                    <td className="px-4 py-3">
                      <button
                        type="button"
                        onClick={() => setOpen(t.slug)}
                        disabled={!r}
                        className="font-medium text-ink-900 hover:text-brand-700 disabled:cursor-default disabled:hover:text-ink-900"
                      >
                        {t.name}
                      </button>
                    </td>
                    <td className="px-4 py-3 tabular-nums text-ink-800">{r?.students ?? 0}</td>
                    <td className="px-4 py-3 tabular-nums">
                      {r ? (
                        <span className={`font-semibold ${r.avg_best >= 70 ? 'text-emerald-700' : 'text-amber-700'}`}>
                          {Math.round(r.avg_best)}%
                        </span>
                      ) : (
                        <span className="text-ink-400">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 tabular-nums text-ink-800">{r?.attempts ?? 0}</td>
                    <td className="px-4 py-3 tabular-nums text-ink-800">{r?.server_graded ?? 0}</td>
                    <td className="px-4 py-3 tabular-nums text-ink-500">{r?.legacy ?? 0}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </>
  )
}

function TrackStudents({ slug, onBack }: { slug: string; onBack: () => void }) {
  const name = skillTracks.find((t) => t.slug === slug)?.name ?? slug
  const [rows, setRows] = useState<TrackStudentRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string>()

  useEffect(() => {
    let active = true
    fetchTrackStudents(slug)
      .then((r) => active && setRows(r))
      .catch((e) => active && setError(errorMessage(e)))
      .finally(() => active && setLoading(false))
    return () => {
      active = false
    }
  }, [slug])

  return (
    <>
      <button type="button" onClick={onBack} className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-ink-600 hover:text-ink-900">
        <ArrowLeft size={16} /> All tracks
      </button>
      <PageHeader eyebrow="Practice" title={name} subtitle="Every student who has practised this track, best score first." />
      {error && (
        <Alert tone="danger" title="Couldn’t load students">
          <p>{error}</p>
        </Alert>
      )}
      {loading ? (
        <Skeleton className="h-64 w-full" />
      ) : rows.length === 0 ? (
        <EmptyState icon={Dumbbell} title="Nobody has practised this track yet" />
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="border-b border-ink-200 text-xs uppercase tracking-wide text-ink-500">
              <tr>
                <th className="px-4 py-3 font-semibold">Student</th>
                <th className="px-4 py-3 font-semibold">Best</th>
                <th className="px-4 py-3 font-semibold">Attempts</th>
                <th className="px-4 py-3 font-semibold">Server-graded</th>
                <th className="px-4 py-3 font-semibold">Last attempt</th>
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
                  <td className={`px-4 py-3 font-semibold tabular-nums ${r.best >= 70 ? 'text-emerald-700' : 'text-amber-700'}`}>
                    {r.best}%
                  </td>
                  <td className="px-4 py-3 tabular-nums text-ink-800">{r.attempts}</td>
                  <td className="px-4 py-3 tabular-nums text-ink-800">
                    {r.server_graded}
                    {r.server_graded === 0 && <span className="ml-1 text-xs text-amber-700">(unverified)</span>}
                  </td>
                  <td className="px-4 py-3 text-ink-600">{fmtDate(r.last_attempt_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  )
}
