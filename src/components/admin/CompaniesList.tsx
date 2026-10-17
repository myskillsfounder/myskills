import { useMemo, useState } from 'react'
import { Link } from '@tanstack/react-router'
import { ArrowRight, Building2, Check, Globe, Mail, MapPin, Phone, Send, X } from 'lucide-react'
import { errorMessage } from '@/lib/errors'
import { setLeadContacted } from '@/lib/adminProgrammes'
import { reviewPortalRequest } from '@/lib/portalAccess'
import { useStaffAccessContext } from '@/lib/staffAccess'
import type { AdminCompany, CompanyStage } from '@/lib/internships'
import { InviteLink } from '@/components/admin/InviteLink'
import { Badge, Button, Chip, EmptyState, Textarea } from '@/components/ui'

const fmtDate = (v: string) => new Date(v).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })
const plural = (n: number, one: string, many = `${one}s`) => `${n} ${n === 1 ? one : many}`

/** Where a company is, in the order the team moves it along. */
const STAGE: Record<CompanyStage, { label: string; tone: 'neutral' | 'brand' | 'success' | 'warning'; what: string }> = {
  signed_up: { label: 'Signed up · to verify', tone: 'warning', what: 'Asked for the portal and is waiting for you to verify them.' },
  interested: { label: 'Interested', tone: 'brand', what: 'Filled in the form on the website. Not in the portal yet.' },
  in_portal: { label: 'In the portal', tone: 'success', what: 'Verified: they can post roles.' },
  turned_down: { label: 'Turned down', tone: 'neutral', what: 'Their portal sign-up was refused.' },
  removed: { label: 'Access removed', tone: 'neutral', what: 'Was verified; their portal access has since been taken away.' },
}

type Filter = 'all' | CompanyStage

/** Verify a company's portal sign-up here, or turn it down with a reason they are shown. */
function Verify({ c, onChanged }: { c: AdminCompany; onChanged: () => void }) {
  const [busy, setBusy] = useState(false)
  const [refusing, setRefusing] = useState(false)
  const [note, setNote] = useState('')
  const [error, setError] = useState<string>()

  async function run(fn: () => Promise<void>) {
    setBusy(true)
    setError(undefined)
    try {
      await fn()
      onChanged()
    } catch (e) {
      setError(errorMessage(e))
      setBusy(false)
    }
  }

  if (!c.request_id) return null
  return (
    <div className="mt-3 border-t border-ink-900/[0.06] pt-3">
      {refusing ? (
        <div className="space-y-2">
          <Textarea
            label="Why (they are shown this, and it is emailed to them)"
            rows={2}
            maxLength={1000}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="For example: we couldn’t confirm the company. Reply with its website."
          />
          <div className="flex flex-wrap gap-2">
            <Button
              size="sm"
              variant="secondary"
              disabled={busy || note.trim().length < 3}
              onClick={() => void run(() => reviewPortalRequest(c.request_id!, 'rejected', { note }))}
            >
              Turn down
            </Button>
            <Button size="sm" variant="secondary" disabled={busy} onClick={() => setRefusing(false)}>
              Cancel
            </Button>
          </div>
        </div>
      ) : (
        <div className="flex flex-wrap items-center gap-2">
          <Button size="sm" icon={Check} disabled={busy} onClick={() => void run(() => reviewPortalRequest(c.request_id!, 'approved'))}>
            Verify: open their portal
          </Button>
          <button
            type="button"
            disabled={busy}
            onClick={() => setRefusing(true)}
            className="inline-flex h-9 items-center gap-1.5 px-2 text-sm font-medium text-ink-600 hover:text-ink-900"
          >
            <X size={14} /> Turn down
          </button>
        </div>
      )}
      {error && <p className="mt-2 text-sm text-red-700">{error}</p>}
    </div>
  )
}

function CompanyCard({ c, canVerify, onChanged }: { c: AdminCompany; canVerify: boolean; onChanged: () => void }) {
  const [inviting, setInviting] = useState(false)
  const [contacted, setContacted] = useState(Boolean(c.contacted))
  const [busy, setBusy] = useState(false)
  const st = STAGE[c.stage]

  async function toggleContacted() {
    if (!c.lead_id) return
    setBusy(true)
    try {
      await setLeadContacted('internship_partner_leads', c.lead_id, !contacted)
      setContacted((v) => !v)
    } finally {
      setBusy(false)
    }
  }

  const work =
    c.stage === 'in_portal'
      ? [
          plural(c.roles_live, 'live role'),
          c.roles_pending > 0 ? `${c.roles_pending} waiting for approval` : null,
          c.applicants_waiting > 0 ? plural(c.applicants_waiting, 'new applicant') : null,
          plural(c.interns_now, 'intern') + ' now',
          c.internships_confirmed > 0 ? `${c.internships_confirmed} confirmed` : null,
        ]
          .filter(Boolean)
          .join(' · ')
      : null

  return (
    <li className="card p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="font-display text-lg font-semibold text-ink-900">{c.organisation}</h2>
            <Badge tone={st.tone}>{st.label}</Badge>
          </div>
          <p className="mt-0.5 text-xs text-ink-500">
            {st.what}
            {c.since ? ` Since ${fmtDate(c.since)}.` : ''}
          </p>
          <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-ink-700">
            {c.contact_name && <span>{c.contact_name}</span>}
            {c.email && (
              <a href={`mailto:${c.email}`} className="inline-flex items-center gap-1 hover:text-brand-700">
                <Mail size={13} /> {c.email}
              </a>
            )}
            {c.phone && (
              <a href={`tel:${c.phone}`} className="inline-flex items-center gap-1 hover:text-brand-700">
                <Phone size={13} /> {c.phone}
              </a>
            )}
            {c.city && (
              <span className="inline-flex items-center gap-1">
                <MapPin size={13} /> {c.city}
              </span>
            )}
            {c.website && (
              <a href={c.website} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 hover:text-brand-700">
                <Globe size={13} /> Website
              </a>
            )}
          </div>
        </div>
        {/* Only a company that filled in the form has a "contacted" to tick. */}
        {c.lead_id && c.stage !== 'in_portal' && (
          <label className="inline-flex cursor-pointer items-center gap-2 text-sm text-ink-700">
            <input type="checkbox" checked={contacted} disabled={busy} onChange={() => void toggleContacted()} className="h-4 w-4 accent-brand-600" />
            {contacted ? `Contacted${c.contacted_at ? ` ${fmtDate(c.contacted_at)}` : ''}` : 'Mark contacted'}
          </label>
        )}
      </div>

      {c.about && <p className="mt-3 text-sm leading-relaxed text-ink-700">{c.about}</p>}
      {c.note && <p className="mt-3 whitespace-pre-line rounded-xl bg-ink-100 p-3 text-sm text-ink-700">{c.note}</p>}

      {work && (
        <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-ink-900/[0.06] pt-3">
          <p className="text-sm text-ink-700">{work}</p>
          <Link to="/admin/internships" className="inline-flex items-center gap-1 text-sm font-semibold text-brand-700 hover:text-brand-800">
            Roles &amp; applications <ArrowRight size={14} />
          </Link>
        </div>
      )}

      {c.stage === 'signed_up' &&
        (canVerify ? (
          <Verify c={c} onChanged={onChanged} />
        ) : (
          <p className="mt-3 border-t border-ink-900/[0.06] pt-3 text-sm text-ink-600">
            Verifying needs the Portal access &amp; usage section. Ask a super admin, or someone who has it.
          </p>
        ))}

      {(c.stage === 'interested' || c.stage === 'removed') && c.email && (
        <div className="mt-3 border-t border-ink-900/[0.06] pt-3">
          {inviting ? (
            <>
              <p className="text-sm text-ink-600">
                {c.has_account
                  ? 'They already have a MySkills account with this email: send the portal sign-in. They say they are a company, then appear here to verify.'
                  : 'Send the company sign-up link. They sign up with this email, confirm it, then appear here to verify.'}
              </p>
              <div className="mt-2">
                <InviteLink role="internships" email={c.email} existing={c.has_account} />
              </div>
            </>
          ) : (
            <Button size="sm" variant="secondary" icon={Send} onClick={() => setInviting(true)}>
              Invite to the portal
            </Button>
          )}
        </div>
      )}
    </li>
  )
}

/**
 * Every internship company in one list, however it arrived: the website form,
 * a portal sign-up, or access given by the team. Filtered by where it stands,
 * and moved along from here: invite, verify, then their roles.
 */
export function CompaniesList({ rows, onChanged }: { rows: AdminCompany[]; onChanged: () => void }) {
  const { isAdmin, sections } = useStaffAccessContext()
  const canVerify = isAdmin === true || (sections?.includes('portal-access') ?? false)
  const counts = useMemo(() => {
    const c: Record<Filter, number> = { all: rows.length, signed_up: 0, interested: 0, in_portal: 0, turned_down: 0, removed: 0 }
    for (const r of rows) c[r.stage] += 1
    return c
  }, [rows])
  const [filter, setFilter] = useState<Filter>('all')
  const shown = filter === 'all' ? rows : rows.filter((r) => r.stage === filter)
  const order: Filter[] = ['all', 'signed_up', 'interested', 'in_portal', 'turned_down', 'removed']

  if (rows.length === 0) {
    return (
      <EmptyState
        icon={Building2}
        title="No companies yet"
        description="Companies appear here when they fill in the form on the website, or sign up in the Community portal."
      />
    )
  }
  return (
    <div>
      <div className="flex flex-wrap gap-2">
        {order
          .filter((f) => f === 'all' || counts[f] > 0)
          .map((f) => (
            <Chip key={f} active={filter === f} onClick={() => setFilter(f)}>
              {f === 'all' ? 'All' : STAGE[f].label} · {counts[f]}
            </Chip>
          ))}
      </div>
      <ul className="mt-4 space-y-3">
        {shown.map((c) => (
          <CompanyCard key={c.key} c={c} canVerify={canVerify} onChanged={onChanged} />
        ))}
      </ul>
    </div>
  )
}
