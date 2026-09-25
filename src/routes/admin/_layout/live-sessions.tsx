import { useEffect, useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { CalendarCheck, Send } from 'lucide-react'
import { errorMessage } from '@/lib/errors'
import {
  HOST_KINDS,
  fetchAdminLiveSessions,
  recordLiveSession,
  type AdminLiveSession,
  type HostKind,
} from '@/lib/liveSessions'
import { RequireSection } from '@/components/admin/AdminSectionGate'
import { Alert, Button, EmptyState, Input, PageHeader, Skeleton } from '@/components/ui'

// Same section as Mentor Reviews: whoever signs off a student's work is the
// person who confirms the sessions they attended.
export const Route = createFileRoute('/admin/_layout/live-sessions')({
  component: () => (
    <RequireSection section="mentor-reviews">
      <LiveSessionsPage />
    </RequireSection>
  ),
})

const today = () => new Date().toISOString().slice(0, 10)

function LiveSessionsPage() {
  const [rows, setRows] = useState<AdminLiveSession[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string>()

  const [email, setEmail] = useState('')
  const [kind, setKind] = useState<HostKind>('trainer')
  const [host, setHost] = useState('')
  const [title, setTitle] = useState('')
  const [heldOn, setHeldOn] = useState(today())
  const [busy, setBusy] = useState(false)
  const [formError, setFormError] = useState<string>()
  const [saved, setSaved] = useState<string>()

  async function load() {
    setError(undefined)
    try {
      setRows(await fetchAdminLiveSessions())
    } catch (e) {
      setError(errorMessage(e))
    } finally {
      setLoading(false)
    }
  }
  useEffect(() => {
    void load()
  }, [])

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setBusy(true)
    setFormError(undefined)
    setSaved(undefined)
    try {
      await recordLiveSession({ studentEmail: email, hostKind: kind, hostName: host, title, heldOn })
      setSaved(`Recorded for ${email.trim()}.`)
      setEmail('')
      await load()
    } catch (err) {
      setFormError(errorMessage(err))
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      <PageHeader
        eyebrow="Admin"
        title="Live sessions"
        subtitle="Confirm that a student attended a live session with a trainer, mentor or institution. Each confirmed session is worth 2 points of their Career Readiness Score, up to 10."
      />

      <form onSubmit={submit} className="card mb-6 space-y-4 p-5 sm:p-6">
        <h2 className="font-display text-lg font-semibold text-ink-900">Record attendance</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <Input label="Student’s email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          <div>
            <label className="mb-1.5 block text-sm font-medium text-ink-800" htmlFor="kind">
              Run by
            </label>
            <select id="kind" value={kind} onChange={(e) => setKind(e.target.value as HostKind)} className="field">
              {HOST_KINDS.map((k) => (
                <option key={k.value} value={k.value}>
                  {k.label}
                </option>
              ))}
            </select>
          </div>
          <Input
            label={kind === 'institution' ? 'Institution name' : 'Name of the mentor or trainer'}
            value={host}
            onChange={(e) => setHost(e.target.value)}
          />
          <Input label="Session title" value={title} onChange={(e) => setTitle(e.target.value)} />
          <Input label="Date held" type="date" max={today()} value={heldOn} onChange={(e) => setHeldOn(e.target.value)} />
        </div>
        {formError && (
          <Alert tone="danger" title="Couldn’t record that">
            <p>{formError}</p>
          </Alert>
        )}
        {saved && <Alert tone="success">{saved}</Alert>}
        <Button type="submit" icon={Send} disabled={busy}>
          {busy ? 'Recording…' : 'Record attendance'}
        </Button>
      </form>

      {error && (
        <div className="mb-5">
          <Alert tone="danger" title="Couldn’t load sessions">
            <p>{error}</p>
            <p className="mt-1">First run? Apply docs/supabase-live-sessions.sql in Supabase.</p>
          </Alert>
        </div>
      )}

      {loading ? (
        <Skeleton className="h-40 w-full" />
      ) : rows.length === 0 ? (
        <EmptyState
          icon={CalendarCheck}
          title="Nothing recorded yet"
          description="Confirmed attendance shows up here, with who recorded it."
        />
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-ink-200 text-xs uppercase tracking-wide text-ink-500">
              <tr>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Student</th>
                <th className="px-4 py-3">Session</th>
                <th className="px-4 py-3">Run by</th>
                <th className="px-4 py-3">Recorded by</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className="border-b border-ink-100 last:border-0">
                  <td className="whitespace-nowrap px-4 py-3 text-ink-700">{r.held_on}</td>
                  <td className="px-4 py-3">
                    <p className="font-medium text-ink-900">{r.student_name || 'Unnamed'}</p>
                    <p className="text-xs text-ink-500">{r.student_email}</p>
                  </td>
                  <td className="px-4 py-3 text-ink-800">{r.title}</td>
                  <td className="px-4 py-3 text-ink-700">
                    {r.host_name} <span className="text-xs text-ink-500">· {r.host_kind}</span>
                  </td>
                  <td className="px-4 py-3 text-ink-600">{r.recorded_by_name || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  )
}
