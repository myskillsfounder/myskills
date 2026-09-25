import { useEffect, useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { Users } from 'lucide-react'
import { errorMessage } from '@/lib/errors'
import { fetchCareerReadinessLeads, setLeadContacted, type CareerReadinessLead } from '@/lib/adminProgrammes'
import { RequireAdmin } from '@/components/admin/AdminSectionGate'
import { Alert, EmptyState, PageHeader, Skeleton } from '@/components/ui'

// Admins only: the table's own RLS lets nobody else read these contacts.
export const Route = createFileRoute('/admin/_layout/cr-leads')({
  component: () => (
    <RequireAdmin>
      <CareerReadinessLeadsPage />
    </RequireAdmin>
  ),
})

const fmtDate = (v: string) => new Date(v).toLocaleDateString()

/**
 * People who joined the Career Readiness waitlist before the programme opened
 * (the form is retired; these are the leads it collected), newest first.
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

  const waiting = rows.filter((r) => !r.contacted).length

  return (
    <>
      <PageHeader
        eyebrow="Partners"
        title="Career Readiness leads"
        subtitle={`From the old waitlist form. ${waiting} not contacted yet.`}
      />
      {error && (
        <div className="mb-5">
          <Alert tone="danger" title="Something went wrong">
            <p>{error}</p>
          </Alert>
        </div>
      )}
      {loading ? (
        <Skeleton className="h-64 w-full" />
      ) : rows.length === 0 ? (
        <EmptyState icon={Users} title="No leads" />
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="border-b border-ink-200 text-xs uppercase tracking-wide text-ink-500">
              <tr>
                <th className="px-4 py-3 font-semibold">Name</th>
                <th className="px-4 py-3 font-semibold">Phone</th>
                <th className="px-4 py-3 font-semibold">Email / city</th>
                <th className="px-4 py-3 font-semibold">Joined</th>
                <th className="px-4 py-3 font-semibold">Contacted</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((l) => (
                <tr key={l.id} className={`border-b border-ink-100 last:border-0 ${l.contacted ? 'text-ink-400' : ''}`}>
                  <td className="px-4 py-3 font-medium text-ink-900">{l.full_name}</td>
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
