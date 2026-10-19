import { useCallback, useEffect, useState } from 'react'
import { createFileRoute, Link } from '@tanstack/react-router'
import { History } from 'lucide-react'
import { errorMessage } from '@/lib/errors'
import { ACTIVITY_AREAS, areaOf, describe, fetchActivity, subjectIsStudent, type ActivityRow } from '@/lib/adminActivity'
import { fetchTeamMembers, type TeamMemberV2 } from '@/lib/adminTeam'
import { RequireAdmin } from '@/components/admin/AdminSectionGate'
import { Alert, Avatar, Button, Chip, EmptyState, PageHeader, Skeleton } from '@/components/ui'

// Super admins only: the record of what everyone on the team did.
export const Route = createFileRoute('/admin/_layout/activity')({
  component: () => (
    <RequireAdmin>
      <ActivityPage />
    </RequireAdmin>
  ),
})

const PAGE = 50
const dayLabel = (iso: string) => {
  const d = new Date(iso)
  const today = new Date()
  const yest = new Date(Date.now() - 86400000)
  if (d.toDateString() === today.toDateString()) return 'Today'
  if (d.toDateString() === yest.toDateString()) return 'Yesterday'
  return d.toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
}
const time = (iso: string) => new Date(iso).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })

/**
 * Everything the team did, newest first: who, what, about whom, and when. The
 * database writes it as each change happens, through any page, so nothing
 * here can be left out or edited after the fact. Filter by person or area.
 */
function ActivityPage() {
  const [rows, setRows] = useState<ActivityRow[] | null | undefined>(undefined)
  const [more, setMore] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)
  const [error, setError] = useState<string>()
  const [actor, setActor] = useState<string>('')
  const [area, setArea] = useState<string>('')
  const [team, setTeam] = useState<TeamMemberV2[]>([])

  useEffect(() => {
    void fetchTeamMembers().then((t) => setTeam((t ?? []).filter((m) => m.user_id)), () => {})
  }, [])

  const tables = ACTIVITY_AREAS.find((a) => a.id === area)?.tables
  const load = useCallback(async () => {
    setRows(undefined)
    setError(undefined)
    try {
      const r = await fetchActivity({ limit: PAGE, actor: actor || undefined, tables })
      setRows(r)
      setMore((r?.length ?? 0) === PAGE)
    } catch (e) {
      setError(errorMessage(e))
      setRows([])
    }
    // tables follows area
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [actor, area])
  useEffect(() => {
    void load()
  }, [load])

  async function loadMore() {
    if (!rows || rows.length === 0) return
    setLoadingMore(true)
    try {
      const r = (await fetchActivity({ before: rows[rows.length - 1].at, limit: PAGE, actor: actor || undefined, tables })) ?? []
      setRows([...rows, ...r])
      setMore(r.length === PAGE)
    } catch (e) {
      setError(errorMessage(e))
    } finally {
      setLoadingMore(false)
    }
  }

  // Grouped by day, in order.
  const days: { day: string; items: ActivityRow[] }[] = []
  for (const r of rows ?? []) {
    const d = dayLabel(r.at)
    const last = days[days.length - 1]
    if (last && last.day === d) last.items.push(r)
    else days.push({ day: d, items: [r] })
  }

  return (
    <>
      <PageHeader
        eyebrow="Team"
        title="Activity log"
        subtitle="Everything the team did in the admin panel, and who did it: approvals, verifications, access, grades, edits. Written by the database as it happens; nobody can change it."
      />

      {rows === null ? (
        <Alert tone="warning" title="The activity log isn’t set up yet">
          <p>
            Run <code>docs/supabase-activity-log.sql</code> in Supabase. It starts recording from then on.
          </p>
        </Alert>
      ) : (
        <>
          <div className="mb-5 space-y-3">
            <div className="flex flex-wrap gap-2">
              <Chip active={area === ''} onClick={() => setArea('')}>
                Everything
              </Chip>
              {ACTIVITY_AREAS.map((a) => (
                <Chip key={a.id} active={area === a.id} onClick={() => setArea(a.id)}>
                  {a.label}
                </Chip>
              ))}
            </div>
            <label className="inline-flex items-center gap-2 text-sm text-ink-600">
              Who
              <select value={actor} onChange={(e) => setActor(e.target.value)} className="field h-10 py-0">
                <option value="">Everyone</option>
                {team.map((m) => (
                  <option key={m.user_id!} value={m.user_id!}>
                    {m.full_name?.trim() || m.email}
                  </option>
                ))}
              </select>
            </label>
          </div>

          {error && (
            <div className="mb-5">
              <Alert tone="danger" title="Couldn’t load the log">
                <p>{error}</p>
              </Alert>
            </div>
          )}

          {rows === undefined ? (
            <Skeleton className="h-64 w-full" />
          ) : rows.length === 0 ? (
            <EmptyState icon={History} title="Nothing yet" description="Changes the team makes appear here as they happen." />
          ) : (
            <div className="space-y-6">
              {days.map((g) => (
                <section key={g.day}>
                  <h2 className="mb-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-500">{g.day}</h2>
                  <ul className="card divide-y divide-ink-900/[0.06]">
                    {g.items.map((r) => {
                      const name = r.actor_id ? r.actor_name || r.actor_email || 'Someone' : 'Supabase'
                      return (
                        <li key={r.id} className="flex items-start gap-3 px-4 py-3">
                          <Avatar name={name} size={32} />
                          <div className="min-w-0 flex-1">
                            <p className="text-sm leading-snug text-ink-800">
                              <span className="font-semibold text-ink-900">{name}</span> {describe(r)}
                            </p>
                            <p className="mt-0.5 text-xs text-ink-500">
                              {time(r.at)} · {areaOf(r.table_name)}
                              {r.actor_email && r.actor_id && ` · ${r.actor_email}`}
                              {!r.actor_id && ' · made in the Supabase SQL editor'}
                              {r.subject_id && subjectIsStudent(r.table_name) && (
                                <>
                                  {' · '}
                                  <Link to="/admin/users/$id" params={{ id: r.subject_id }} className="font-semibold text-brand-700 hover:underline">
                                    Open student
                                  </Link>
                                </>
                              )}
                            </p>
                          </div>
                        </li>
                      )
                    })}
                  </ul>
                </section>
              ))}
              {more && (
                <Button variant="secondary" disabled={loadingMore} onClick={() => void loadMore()}>
                  {loadingMore ? 'Loading…' : 'Show older'}
                </Button>
              )}
            </div>
          )}
        </>
      )}
    </>
  )
}
