import { useEffect, useState } from 'react'
import { createFileRoute, Link } from '@tanstack/react-router'
import { Briefcase, Mail, Phone, Send } from 'lucide-react'
import { errorMessage } from '@/lib/errors'
import {
  fetchInternshipLeadStatus,
  fetchInternshipLeads,
  setLeadContacted,
  type InternshipLead,
  type LeadPortalStatus,
} from '@/lib/adminProgrammes'
import { RequireSection } from '@/components/admin/AdminSectionGate'
import { InviteLink } from '@/components/admin/InviteLink'
import { Alert, Badge, Button, EmptyState, PageHeader, Skeleton } from '@/components/ui'

// Needs the partner-leads section (a full admin has it): the table's own RLS enforces the same.
export const Route = createFileRoute('/admin/_layout/internship-partners')({
  component: () => (
    <RequireSection section="partner-leads">
      <InternshipPartnersPage />
    </RequireSection>
  ),
})

const fmtDate = (v: string) => new Date(v).toLocaleDateString()

/**
 * Where a company's email stands with the Community portal, so the team can
 * see who still needs inviting and who is waiting to be verified. Matched on
 * the email they gave; someone who signed up with another address shows as
 * not yet in.
 */
function PortalStanding({ s }: { s: LeadPortalStatus | undefined }) {
  if (!s) return null
  if (s.in_portal) return <Badge tone="success">In the portal</Badge>
  if (s.request_status === 'pending') {
    return (
      <Link to="/admin/community-portal" className="inline-flex">
        <Badge tone="warning">Signed up · verify in Portal access</Badge>
      </Link>
    )
  }
  if (s.request_status === 'rejected') return <Badge tone="neutral">Portal sign-up turned down</Badge>
  if (s.has_account) return <Badge tone="brand">Has a MySkills account</Badge>
  return <Badge tone="neutral">Not invited yet</Badge>
}

/** Companies that filled in "post internships with MySkills", newest first. */
function InternshipPartnersPage() {
  const [rows, setRows] = useState<InternshipLead[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string>()
  const [busy, setBusy] = useState<string>()
  const [status, setStatus] = useState<Record<string, LeadPortalStatus>>({})
  const [inviting, setInviting] = useState<string>()

  useEffect(() => {
    let active = true
    fetchInternshipLeads()
      .then((r) => active && setRows(r))
      .catch((e) => active && setError(errorMessage(e)))
      .finally(() => active && setLoading(false))
    // Extra: without it (before the SQL) each lead still offers the invite.
    void fetchInternshipLeadStatus().then((s) => active && setStatus(s))
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
  const inPortal = rows.filter((r) => status[r.id]?.in_portal).length

  return (
    <>
      <PageHeader
        eyebrow="Partners"
        title="Internship companies"
        subtitle={`Companies interested in posting internships. ${waiting} not contacted yet${
          Object.keys(status).length > 0 ? ` · ${inPortal} in the portal` : ''
        }.`}
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
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="font-display text-lg font-semibold text-ink-900">{l.company}</h2>
                    <PortalStanding s={status[l.id]} />
                  </div>
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
              {/* Into the portal from here: the same link as Portal access, already for a company,
                  and the email addressed to them. They are verified there once they sign up. */}
              {!status[l.id]?.in_portal && status[l.id]?.request_status !== 'pending' && (
                <div className="mt-3 border-t border-ink-900/[0.06] pt-3">
                  {inviting === l.id ? (
                    <>
                      <p className="text-sm text-ink-600">
                        {status[l.id]?.has_account
                          ? 'They already have a MySkills account with this email: send the portal sign-in. They say they are a company, then appear in Portal access to verify.'
                          : 'Send the company sign-up link. They sign up with this email, confirm it, then appear in Portal access to verify.'}
                      </p>
                      <div className="mt-2">
                        <InviteLink role="internships" email={l.email} existing={status[l.id]?.has_account} />
                      </div>
                    </>
                  ) : (
                    <Button size="sm" variant="secondary" icon={Send} onClick={() => setInviting(l.id)}>
                      Invite to the portal
                    </Button>
                  )}
                </div>
              )}
            </article>
          ))}
        </div>
      )}
    </>
  )
}
