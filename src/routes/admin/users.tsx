import { useCallback, useEffect, useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { Search, Users as UsersIcon } from 'lucide-react'
import { fetchUsers, setMentorFlag, type AdminUser } from '@/lib/admin'
import { Alert, Avatar, Badge, EmptyState, Input, PageHeader, Skeleton } from '@/components/ui'

export const Route = createFileRoute('/admin/users')({
  component: UsersPage,
})

const fmtDate = (v: string | null) => (v ? new Date(v).toLocaleDateString() : '—')

function UsersPage() {
  const [search, setSearch] = useState('')
  const [users, setUsers] = useState<AdminUser[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string>()
  const [busyId, setBusyId] = useState<string>()

  const load = useCallback(async (term: string) => {
    setLoading(true)
    setError(undefined)
    try {
      setUsers(await fetchUsers(term))
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    } finally {
      setLoading(false)
    }
  }, [])

  // Debounced so typing doesn't fire a query per keystroke.
  useEffect(() => {
    const id = setTimeout(() => void load(search), 300)
    return () => clearTimeout(id)
  }, [search, load])

  async function toggleMentor(user: AdminUser) {
    setBusyId(user.id)
    setError(undefined)
    try {
      await setMentorFlag(user.id, !user.is_mentor)
      setUsers((prev) =>
        prev.map((u) => (u.id === user.id ? { ...u, is_mentor: !u.is_mentor } : u)),
      )
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    } finally {
      setBusyId(undefined)
    }
  }

  return (
    <>
      <PageHeader
        eyebrow="Admin"
        title="Users"
        subtitle="Everyone with a MySkills account. Mentor access controls the support queue."
      />

      <div className="mb-5 max-w-sm">
        <Input
          label=""
          required={false}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name or email"
          aria-label="Search users"
        />
      </div>

      {error && (
        <div className="mb-5">
          <Alert tone="danger" title="Couldn’t load users">
            <p>{error}</p>
          </Alert>
        </div>
      )}

      {loading ? (
        <Skeleton className="h-64 w-full" />
      ) : users.length === 0 ? (
        <EmptyState
          icon={UsersIcon}
          title={search ? 'No matches' : 'No users yet'}
          description={search ? 'Try a different name or email.' : undefined}
        />
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="border-b border-ink-200 text-xs uppercase tracking-wide text-ink-500">
              <tr>
                <th scope="col" className="px-5 py-3 font-semibold">User</th>
                <th scope="col" className="px-5 py-3 font-semibold">Joined</th>
                <th scope="col" className="px-5 py-3 font-semibold">Last login</th>
                <th scope="col" className="px-5 py-3 font-semibold">Assessment</th>
                <th scope="col" className="px-5 py-3 font-semibold">Mentor</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className="border-b border-ink-100 last:border-0">
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-3">
                      <Avatar name={u.full_name || u.email} size={34} />
                      <div className="min-w-0">
                        <p className="truncate font-medium text-ink-900">
                          {u.full_name || '—'}
                        </p>
                        <p className="truncate text-xs text-ink-500">{u.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3 text-ink-600">{fmtDate(u.created_at)}</td>
                  <td className="px-5 py-3 text-ink-600">{fmtDate(u.last_login)}</td>
                  <td className="px-5 py-3">
                    {u.assessment_percent === null ? (
                      <span className="text-ink-400">Not taken</span>
                    ) : (
                      <Badge tone={u.assessment_percent >= 60 ? 'success' : 'warning'}>
                        {u.assessment_percent}%
                      </Badge>
                    )}
                  </td>
                  <td className="px-5 py-3">
                    <label className="inline-flex cursor-pointer items-center gap-2">
                      <input
                        type="checkbox"
                        checked={u.is_mentor}
                        disabled={busyId === u.id}
                        onChange={() => void toggleMentor(u)}
                        className="h-4 w-4 accent-brand-600"
                      />
                      <span className="text-xs text-ink-600">
                        {u.is_mentor ? 'Mentor' : 'Grant'}
                      </span>
                    </label>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {!loading && users.length > 0 && (
        <p className="mt-3 flex items-center gap-1.5 text-xs text-ink-500">
          <Search size={12} />
          Showing {users.length} {users.length === 200 ? '(capped at 200 — search to narrow)' : ''}
        </p>
      )}
    </>
  )
}
