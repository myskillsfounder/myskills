import { useMemo, useState } from 'react'
import { Link } from '@tanstack/react-router'
import { ArrowRight, Building2, Check, Globe, Mail, MapPin, Phone, Search, Send, User, X } from 'lucide-react'
import { errorMessage } from '@/lib/errors'
import { setLeadContacted } from '@/lib/adminProgrammes'
import { reviewPortalRequest } from '@/lib/portalAccess'
import { revokeCommunityAccess } from '@/lib/communityPortal'
import { useStaffAccessContext } from '@/lib/staffAccess'
import type { AdminCompany, CompanyStage } from '@/lib/internships'
import { InviteLink } from '@/components/admin/InviteLink'
import { OrgAvatar } from '@/components/admin/OrgAvatar'
import { Badge, Button, Chip, EmptyState, Textarea } from '@/components/ui'
import { ExportButton } from '@/components/admin/ExportButton'
import { csvDate } from '@/lib/csv'

const fmtDate = (v: string) => new Date(v).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })
const shortDate = (v: string) => new Date(v).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })
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

/** Take a company out of the portal: its roles stop showing to students. */
function RemoveAccess({ c, onChanged }: { c: AdminCompany; onChanged: () => void }) {
  const [confirming, setConfirming] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string>()
  if (!c.user_id) return null
  return (
    <div className="mt-3">
      {confirming ? (
        <div className="flex flex-wrap items-center gap-3 rounded-xl bg-red-50 p-3">
          <p className="min-w-0 flex-1 text-sm text-red-900">
            Remove {c.organisation} from the portal? Their roles stop showing to students and they can’t sign in to the
            portal. Students already interning keep their internship.
          </p>
          <Button
            size="sm"
            variant="danger"
            disabled={busy}
            onClick={() => {
              setBusy(true)
              void revokeCommunityAccess(c.user_id!, 'internships')
                .then(onChanged)
                .catch((e) => {
                  setError(errorMessage(e))
                  setBusy(false)
                })
            }}
          >
            {busy ? 'Removing…' : 'Yes, remove'}
          </Button>
          <Button size="sm" variant="ghost" disabled={busy} onClick={() => setConfirming(false)}>
            Keep
          </Button>
        </div>
      ) : (
        <button type="button" onClick={() => setConfirming(true)} className="text-sm font-medium text-ink-500 hover:text-red-700">
          Remove their portal access
        </button>
      )}
      {error && <p className="mt-2 text-sm text-red-700">{error}</p>}
    </div>
  )
}

/** A number and what it counts, for a company's profile. */
function Stat({ n, label, tone = 'text-ink-900' }: { n: number; label: string; tone?: string }) {
  return (
    <div className="rounded-xl bg-ink-50 px-3 py-2.5">
      <p className={`font-display text-xl font-semibold leading-none tabular-nums ${tone}`}>{n}</p>
      <p className="mt-1 text-xs text-ink-600">{label}</p>
    </div>
  )
}

/** One line in the list: enough to recognise the company and see where it stands. */
function CompanyRow({ c, active, onOpen }: { c: AdminCompany; active: boolean; onOpen: () => void }) {
  const st = STAGE[c.stage]
  const line =
    c.stage === 'in_portal'
      ? [plural(c.roles_live, 'live role'), c.interns_now > 0 ? `${c.interns_now} interning` : null].filter(Boolean).join(' · ')
      : c.stage === 'signed_up'
        ? `Signed up${c.since ? ` ${shortDate(c.since)}` : ''}`
        : c.contacted
          ? `Contacted${c.contacted_at ? ` ${shortDate(c.contacted_at)}` : ''}`
          : c.since
            ? `Asked ${shortDate(c.since)}`
            : ''
  const needs = c.roles_pending + c.applicants_waiting
  return (
    <button
      type="button"
      onClick={onOpen}
      aria-current={active ? 'true' : undefined}
      className={`flex w-full items-center gap-3 px-4 py-3 text-left transition-colors ${active ? 'bg-brand-50' : 'hover:bg-ink-50'}`}
    >
      <OrgAvatar name={c.organisation} size="sm" />
      <span className="min-w-0 flex-1">
        <span className={`block truncate text-sm font-semibold ${active ? 'text-brand-800' : 'text-ink-900'}`}>{c.organisation}</span>
        <span className="block truncate text-xs text-ink-500">
          {[c.city, line].filter(Boolean).join(' · ') || st.what}
        </span>
      </span>
      {needs > 0 && (
        <span className="rounded-full bg-amber-500 px-1.5 py-0.5 text-[11px] font-bold leading-none text-white" title="Roles to approve and new applicants">
          {needs}
        </span>
      )}
      <Badge tone={st.tone}>{st.label}</Badge>
    </button>
  )
}

/** The whole company: who they are, how to reach them, what they do with students, and the next step. */
function CompanyProfile({ c, canVerify, onChanged }: { c: AdminCompany; canVerify: boolean; onChanged: () => void }) {
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

  const website = c.website && (/^https?:\/\//.test(c.website) ? c.website : `https://${c.website}`)

  return (
    <article className="card p-5 sm:p-6">
      <div className="flex items-start gap-4">
        <OrgAvatar name={c.organisation} size="lg" />
        <div className="min-w-0 flex-1">
          <h2 className="font-display text-xl font-semibold leading-tight text-ink-900">{c.organisation}</h2>
          <div className="mt-1.5 flex flex-wrap items-center gap-2">
            <Badge tone={st.tone}>{st.label}</Badge>
            {c.city && (
              <span className="inline-flex items-center gap-1 text-sm text-ink-600">
                <MapPin size={13} className="text-ink-400" /> {c.city}
              </span>
            )}
          </div>
          <p className="mt-1.5 text-xs text-ink-500">
            {st.what}
            {c.since ? ` Since ${fmtDate(c.since)}.` : ''}
          </p>
        </div>
      </div>

      {c.about ? (
        <div className="mt-5">
          <h3 className="text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-500">About</h3>
          <p className="mt-1.5 whitespace-pre-line text-sm leading-relaxed text-ink-800">{c.about}</p>
        </div>
      ) : (
        c.stage === 'in_portal' && <p className="mt-5 text-sm text-ink-500">They haven’t written about the company in the portal yet.</p>
      )}

      {c.stage === 'in_portal' && (
        <div className="mt-5">
          <div className="flex items-center justify-between gap-3">
            <h3 className="text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-500">With students</h3>
            <Link to="/admin/internships" className="inline-flex items-center gap-1 text-sm font-semibold text-brand-700 hover:text-brand-800">
              Roles &amp; applications <ArrowRight size={14} />
            </Link>
          </div>
          <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4">
            <Stat n={c.roles_live} label="Live roles" />
            <Stat n={c.roles_pending} label="To approve" tone={c.roles_pending > 0 ? 'text-amber-700' : 'text-ink-900'} />
            <Stat n={c.applicants_waiting} label="New applicants" tone={c.applicants_waiting > 0 ? 'text-amber-700' : 'text-ink-900'} />
            <Stat n={c.interns_now} label={`Interning · ${c.internships_confirmed} confirmed`} />
          </div>
        </div>
      )}

      <div className="mt-5">
        <h3 className="text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-500">Contact</h3>
        <ul className="mt-2 space-y-1.5 text-sm text-ink-800">
          {c.contact_name && (
            <li className="inline-flex items-center gap-2">
              <User size={14} className="text-ink-400" /> {c.contact_name}
            </li>
          )}
          {c.email && (
            <li>
              <a href={`mailto:${c.email}`} className="inline-flex items-center gap-2 hover:text-brand-700">
                <Mail size={14} className="text-ink-400" /> {c.email}
              </a>
            </li>
          )}
          {c.phone && (
            <li>
              <a href={`tel:${c.phone}`} className="inline-flex items-center gap-2 hover:text-brand-700">
                <Phone size={14} className="text-ink-400" /> {c.phone}
              </a>
            </li>
          )}
          {website && (
            <li>
              <a href={website} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 hover:text-brand-700">
                <Globe size={14} className="text-ink-400" /> {c.website}
              </a>
            </li>
          )}
          {!c.contact_name && !c.email && !c.phone && !website && <li className="text-ink-500">No contact details.</li>}
        </ul>
      </div>

      {c.note && (
        <div className="mt-5">
          <h3 className="text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-500">What they told us</h3>
          <p className="mt-1.5 whitespace-pre-line rounded-xl bg-ink-100 p-3 text-sm leading-relaxed text-ink-700">{c.note}</p>
        </div>
      )}

      {/* Only a company that filled in the form has a "contacted" to tick. */}
      {c.lead_id && c.stage !== 'in_portal' && (
        <label className="mt-5 inline-flex cursor-pointer items-center gap-2 text-sm text-ink-700">
          <input type="checkbox" checked={contacted} disabled={busy} onChange={() => void toggleContacted()} className="h-4 w-4 accent-brand-600" />
          {contacted ? `Contacted${c.contacted_at ? ` ${fmtDate(c.contacted_at)}` : ''}` : 'Mark contacted'}
        </label>
      )}

      {c.stage === 'in_portal' && canVerify && <RemoveAccess c={c} onChanged={onChanged} />}

      {c.stage === 'signed_up' &&
        (canVerify ? (
          <Verify c={c} onChanged={onChanged} />
        ) : (
          <p className="mt-3 border-t border-ink-900/[0.06] pt-3 text-sm text-ink-600">
            Verifying needs the Portal access &amp; usage section. Ask a super admin, or someone who has it.
          </p>
        ))}

      {(c.stage === 'interested' || c.stage === 'removed') && c.email && (
        <div className="mt-4 border-t border-ink-900/[0.06] pt-4">
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
    </article>
  )
}

/** The order the team works in: sign-ups to verify, then the companies posting, then the rest. */
const STAGE_ORDER: CompanyStage[] = ['signed_up', 'in_portal', 'interested', 'removed', 'turned_down']

/**
 * Every internship company in one list, however it arrived: the website form,
 * a portal sign-up, or access given by the team. The list on the left; the
 * company you pick, in full, on the right (under its row on a narrow screen).
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
  const [q, setQ] = useState('')
  const [open, setOpen] = useState<string>()
  const order: Filter[] = ['all', 'signed_up', 'interested', 'in_portal', 'turned_down', 'removed']

  const term = q.trim().toLowerCase()
  const shown = rows
    .filter((r) => filter === 'all' || r.stage === filter)
    .filter((r) => !term || [r.organisation, r.contact_name ?? '', r.email ?? '', r.city ?? ''].some((v) => v.toLowerCase().includes(term)))
    .sort(
      (a, b) =>
        STAGE_ORDER.indexOf(a.stage) - STAGE_ORDER.indexOf(b.stage) || (b.since ?? '').localeCompare(a.since ?? '') || a.organisation.localeCompare(b.organisation),
    )
  const current = shown.find((r) => r.key === open) ?? shown[0]

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
      <div className="flex flex-wrap items-center gap-2">
        {order
          .filter((f) => f === 'all' || counts[f] > 0)
          .map((f) => (
            <Chip key={f} active={filter === f} onClick={() => setFilter(f)}>
              {f === 'all' ? 'All' : STAGE[f].label} · {counts[f]}
            </Chip>
          ))}
      </div>
      <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
        <div className="relative w-full max-w-sm">
          <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-400" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Company, person, email or city"
            aria-label="Search companies"
            className="field h-10" style={{ paddingLeft: '2.25rem' }}
          />
        </div>
        <ExportButton<AdminCompany>
          name="companies"
          rows={shown}
          columns={[
            { header: 'Company', value: (c) => c.organisation },
            { header: 'Stage', value: (c) => STAGE[c.stage].label },
            { header: 'Contact', value: (c) => c.contact_name },
            { header: 'Email', value: (c) => c.email },
            { header: 'Phone', value: (c) => c.phone },
            { header: 'City', value: (c) => c.city },
            { header: 'Website', value: (c) => c.website },
            { header: 'Live roles', value: (c) => c.roles_live },
            { header: 'Roles to approve', value: (c) => c.roles_pending },
            { header: 'New applicants', value: (c) => c.applicants_waiting },
            { header: 'Interning now', value: (c) => c.interns_now },
            { header: 'Internships confirmed', value: (c) => c.internships_confirmed },
            { header: 'Contacted', value: (c) => (c.lead_id ? Boolean(c.contacted) : '') },
            { header: 'Since', value: (c) => csvDate(c.since) },
            { header: 'About', value: (c) => c.about },
            { header: 'What they told us', value: (c) => c.note },
          ]}
        />
      </div>

      {shown.length === 0 ? (
        <p className="mt-6 text-sm text-ink-500">No company matches.</p>
      ) : (
        <div className="mt-4 grid items-start gap-5 lg:grid-cols-[minmax(0,22rem)_minmax(0,1fr)]">
          <ul className="card divide-y divide-ink-900/[0.06] overflow-hidden">
            {shown.map((c) => (
              <li key={c.key}>
                <CompanyRow c={c} active={current?.key === c.key} onOpen={() => setOpen(c.key)} />
                {current?.key === c.key && (
                  <div className="border-t border-ink-900/[0.06] bg-ink-50 p-3 lg:hidden">
                    <CompanyProfile key={c.key} c={c} canVerify={canVerify} onChanged={onChanged} />
                  </div>
                )}
              </li>
            ))}
          </ul>
          {current && (
            <div className="sticky top-24 hidden lg:block">
              <CompanyProfile key={current.key} c={current} canVerify={canVerify} onChanged={onChanged} />
            </div>
          )}
        </div>
      )}
    </div>
  )
}
