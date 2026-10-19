import { useEffect, useState } from 'react'
import { createFileRoute, Link } from '@tanstack/react-router'
import { ArrowRight } from 'lucide-react'
import { INBOX_KINDS, fetchInbox, type InboxKind } from '@/lib/adminInbox'
import { RequireSection } from '@/components/admin/AdminSectionGate'
import { PartnerVerificationBoard } from '@/components/admin/PortalRequestsPanel'
import { PageHeader } from '@/components/ui'

// Next to the Inbox, because a partner can do nothing until someone here
// verifies them. Needs the portal-access section, as verifying always has.
export const Route = createFileRoute('/admin/_layout/partner-verification')({
  component: () => (
    <RequireSection section="portal-access">
      <PartnerVerificationPage />
    </RequireSection>
  ),
})

/** Partners who come in another way and are approved on their own page. */
const ELSEWHERE: InboxKind[] = ['mentor-application', 'institution-application']

function PartnerVerificationPage() {
  const [others, setOthers] = useState<{ kind: InboxKind; n: number }[]>([])

  useEffect(() => {
    let active = true
    fetchInbox()
      .then((items) => {
        if (!active || !items) return
        setOthers(
          ELSEWHERE.map((kind) => ({ kind, n: items.filter((i) => i.kind === kind).length })).filter((o) => o.n > 0),
        )
      })
      .catch(() => {})
    return () => {
      active = false
    }
  }, [])

  return (
    <>
      <PageHeader
        eyebrow="Home"
        title="Partners to verify"
        subtitle="Mentors, counsellors, career guides, companies and institutions who signed up for the Community portal and confirmed their email. They can do nothing until you verify them."
      />

      {others.length > 0 && (
        <ul className="mb-6 flex flex-wrap gap-2">
          {others.map((o) => (
            <li key={o.kind}>
              <Link
                to={INBOX_KINDS[o.kind].to}
                className="inline-flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3.5 py-2 text-sm font-medium text-amber-900 hover:bg-amber-100"
              >
                {o.n} {o.n === 1 ? INBOX_KINDS[o.kind].label.toLowerCase() : INBOX_KINDS[o.kind].plural.toLowerCase()} on
                their own page <ArrowRight size={14} />
              </Link>
            </li>
          ))}
        </ul>
      )}

      <PartnerVerificationBoard />
    </>
  )
}
