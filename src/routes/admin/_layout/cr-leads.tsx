import { useEffect, useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { Users } from 'lucide-react'
import { errorMessage } from '@/lib/errors'
import { fetchCareerReadinessLeads, setLeadContacted, type CareerReadinessLead } from '@/lib/adminProgrammes'
import { RequireSection } from '@/components/admin/AdminSectionGate'
import { Alert, EmptyState, PageHeader, Skeleton } from '@/components/ui'
import { ExportButton } from '@/components/admin/ExportButton'
import { csvDate, csvDateTime } from '@/lib/csv'

// Needs the leads section (a full admin has it): the table's own RLS enforces the same
// (docs/supabase-admin-tidy.sql).
export const Route = createFileRoute('/admin/_layout/cr-leads')({
  component: () => (
    <RequireSection section="leads">
      <CareerReadinessLeadsPage />
    </RequireSection>
  ),
})

const fmtDate = (v: string) => new Date(v).toLocaleDateString()

const PROGRAMME: Record<string, string> = {
  'global-leadership': 'Global Leadership',
  entrepreneurship: 'Entrepreneurship',
  'data-analytics': 'Data Analytics',
}
const programmeName = (p: string) => PROGRAMME[p] ?? p

/**
 * People who asked to hear about a programme before it opened, newest first:
 * the old Global Leadership waitlist, and Entrepreneurship and Data Analytics
 * from the phone's front door. Filter by programme.
 */
function CareerReadinessLeadsPage() {
  const [rows, setRows] = useState<CareerReadinessLead[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string>()
  const [busy, setBusy] = useState<string>()

  useEffect(() => {
    let active = true
    fetchCareerReadinessLeads()
      .then((r) => active && setRows(r))
      .catch((e) => active && setError(errorMessage(e)))
      .finally(() => active && setLoading(false))
    return () => {
      active = false
    }
  }, [])

  async function toggle(l: CareerReadinessLead) {
    setBusy(l.id)
    setError(undefined)
    try {
      await setLeadContacted('career_readiness_leads', l.id, !l.contacted)
      setRows((prev) =>
        prev.map((r) =>
          r.id === l.id ? { ...r, contacted: !l.contacted, contacted_at: !l.contacted ? new Date().toISOString() : null } : r,
        ),
      )
    } catch (e) {
      setError(errorMessage(e))
    } finally {
      setBusy(undefined)
    }
  }

  const [only, setOnly] = useState('')
  const shown = only ? rows.filter((r) => r.programme === only) : rows
  const waiting = shown.filter((r) => !r.contacted).length
  const programmes = [...new Set(rows.map((r) => r.programme))]

  return (
    <>
      <PageHeader
        eyebrow="Programmes"
        title="Programme leads"
        subtitle={`People waiting for a programme to open. ${waiting} not contacted yet.`}
        actions={
          <ExportButton<CareerReadinessLead>
            name="programme-leads"
            rows={shown}
            columns={[
              { header: 'Received', value: (r) => csvDateTime(r.created_at) },
              { header: 'Programme', value: (r) => programmeName(r.programme) },
              { header: 'Name', value: (r) => r.full_name },
              { header: 'Phone', value: (r) => r.phone },
              { header: 'Email', value: (r) => r.email },
              { header: 'City', value: (r) => r.city },
              { header: 'Contacted', value: (r) => r.contacted },
              { header: 'Contacted on', value: (r) => csvDate(r.contacted_at) },
            ]}
          />
        }
      />
      {error && (
        <div className="mb-5">
          <Alert tone="danger" title="Something went wrong">
            <p>{error}</p>
          </Alert>
        </div>
      )}
      {programmes.length > 1 && (
        <div className="mb-4 flex flex-wrap gap-2">
          {['', ...programmes].map((p) => (
            <button
              key={p || 'all'}
              type="button"
              onClick={() => setOnly(p)}
              className={`rounded-full px-3 py-1.5 text-sm font-medium ${only === p ? 'bg-ink-900 text-white' : 'bg-ink-100 text-ink-700 hover:bg-ink-200'}`}
            >
              {p ? programmeName(p) : 'All'} ({p ? rows.filter((r) => r.programme === p).length : rows.length})
            </button>
          ))}
        </div>
      )}
      {loading ? (
        <Skeleton className="h-64 w-full" />
      ) : shown.length === 0 ? (
        <EmptyState icon={Users} title="No leads" />
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="border-b border-ink-200 text-xs uppercase tracking-wide text-ink-500">
              <tr>
                <th className="px-4 py-3 font-semibold">Name</th>
                <th className="px-4 py-3 font-semibold">Programme</th>
                <th className="px-4 py-3 font-semibold">Phone</th>
                <th className="px-4 py-3 font-semibold">Email / city</th>
                <th className="px-4 py-3 font-semibold">Joined</th>
                <th className="px-4 py-3 font-semibold">Contacted</th>
              </tr>
            </thead>
            <tbody>
              {shown.map((l) => (
                <tr key={l.id} className={`border-b border-ink-100 last:border-0 ${l.contacted ? 'text-ink-400' : ''}`}>
                  <td className="px-4 py-3 font-medium text-ink-900">{l.full_name}</td>
                  <td className="px-4 py-3 text-ink-600">{programmeName(l.programme)}</td>
                  <td className="px-4 py-3">
                    <a href={`tel:${l.phone}`} className="text-ink-700 hover:text-brand-700">
                      {l.phone}
                    </a>
                  </td>
                  <td className="px-4 py-3 text-ink-600">
                    {l.email ? (
                      <a href={`mailto:${l.email}`} className="hover:text-brand-700">
                        {l.email}
                      </a>
                    ) : (
                      (l.city ?? '—')
                    )}
                  </td>
                  <td className="px-4 py-3 text-ink-600">{fmtDate(l.created_at)}</td>
                  <td className="px-4 py-3">
                    <label className="inline-flex cursor-pointer items-center gap-2 text-xs text-ink-600">
                      <input
                        type="checkbox"
                        checked={l.contacted}
                        disabled={busy === l.id}
                        onChange={() => void toggle(l)}
                        className="h-4 w-4 accent-brand-600"
                      />
                      {l.contacted && l.contacted_at ? fmtDate(l.contacted_at) : 'Mark'}
                    </label>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  )
}
