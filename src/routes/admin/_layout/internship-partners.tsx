import { useEffect, useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { Briefcase, Mail, Phone } from 'lucide-react'
import { errorMessage } from '@/lib/errors'
import { fetchInternshipLeads, setLeadContacted, type InternshipLead } from '@/lib/adminProgrammes'
import { RequireAdmin } from '@/components/admin/AdminSectionGate'
import { Alert, EmptyState, PageHeader, Skeleton } from '@/components/ui'

// Admins only: the table's own RLS lets nobody else read these contacts.
export const Route = createFileRoute('/admin/_layout/internship-partners')({
  component: () => (
    <RequireAdmin>
      <InternshipPartnersPage />
    </RequireAdmin>
  ),
})

const fmtDate = (v: string) => new Date(v).toLocaleDateString()

/** Companies that filled in "post internships with MySkills", newest first. */
function InternshipPartnersPage() {
  const [rows, setRows] = useState<InternshipLead[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string>()
  const [busy, setBusy] = useState<string>()

  useEffect(() => {
    let active = true
    fetchInternshipLeads()
      .then((r) => active && setRows(r))
      .catch((e) => active && setError(errorMessage(e)))
      .finally(() => active && setLoading(false))
    return () => {
      active = false
    }
  }, [])

  async function toggle(l: InternshipLead) {
    setBusy(l.id)
    setError(undefined)
    try {
      await setLeadContacted('internship_partner_leads', l.id, !l.contacted)
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
        title="Internship partners"
        subtitle={`Companies interested in posting internships. ${waiting} not contacted yet.`}
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
        <EmptyState icon={Briefcase} title="No companies yet" />
      ) : (
        <div className="space-y-3">
          {rows.map((l) => (
            <article key={l.id} className={`card p-5 ${l.contacted ? 'opacity-70' : ''}`}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <h2 className="font-display text-lg font-semibold text-ink-900">{l.company}</h2>
                  <p className="text-sm text-ink-700">
                    {l.contact_name}
                    {l.role && <span className="text-ink-500"> · {l.role}</span>}
                    {l.city && <span className="text-ink-500"> · {l.city}</span>}
                  </p>
                  <div className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1 text-xs text-ink-600">
                    <a href={`mailto:${l.email}`} className="inline-flex items-center gap-1 hover:text-brand-700">
                      <Mail size={12} /> {l.email}
                    </a>
                    {l.phone && (
                      <a href={`tel:${l.phone}`} className="inline-flex items-center gap-1 hover:text-brand-700">
                        <Phone size={12} /> {l.phone}
                      </a>
                    )}
                    <span>{fmtDate(l.created_at)}</span>
                  </div>
                </div>
                <label className="inline-flex cursor-pointer items-center gap-2 text-sm text-ink-700">
                  <input
                    type="checkbox"
                    checked={l.contacted}
                    disabled={busy === l.id}
                    onChange={() => void toggle(l)}
                    className="h-4 w-4 accent-brand-600"
                  />
                  {l.contacted ? `Contacted ${l.contacted_at ? fmtDate(l.contacted_at) : ''}` : 'Mark contacted'}
                </label>
              </div>
              {l.roles_offered && (
                <p className="mt-3 whitespace-pre-line rounded-xl bg-ink-100 p-3 text-sm text-ink-700">{l.roles_offered}</p>
              )}
            </article>
          ))}
        </div>
      )}
    </>
  )
}
