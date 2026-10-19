import { useCallback, useEffect, useMemo, useState } from 'react'
import { createFileRoute, Link } from '@tanstack/react-router'
import { CalendarClock, ChevronDown, Mail, MessageSquare, Phone, Search, UserRound } from 'lucide-react'
import { errorMessage } from '@/lib/errors'
import {
  LEAD_STAGES,
  addLeadNote,
  fetchInstitutionLeads,
  fetchLeadNotes,
  fetchLeadOwners,
  stageInfo,
  updateInstitutionLead,
  type InstitutionLead,
  type LeadNote,
  type LeadStage,
} from '@/lib/institutionLeads'
import { useAuthUser } from '@/lib/useAuth'
import { RequireSection } from '@/components/admin/AdminSectionGate'
import { Alert, Badge, Button, Chip, EmptyState, Input, PageHeader, Skeleton, Textarea } from '@/components/ui'

// The section that used to open Demo requests ('demo-requests') opens this.
export const Route = createFileRoute('/admin/_layout/institution-leads')({
  component: () => (
    <RequireSection section="demo-requests">
      <InstitutionLeadsPage />
    </RequireSection>
  ),
})

const day = (iso: string) => new Date(iso.length === 10 ? `${iso}T00:00:00` : iso).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })
const todayIso = () => {
  const d = new Date()
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}
const isOpen = (l: InstitutionLead) => l.stage === 'new' || l.stage === 'contacted' || l.stage === 'visit'
const isDue = (l: InstitutionLead) => isOpen(l) && l.follow_up_on != null && l.follow_up_on <= todayIso()

type Owner = { user_id: string; name: string }

/** A lead opened from the list: contact, what they asked, and everything the team does with it. */
function LeadDetail({ lead, owners, onChanged }: { lead: InstitutionLead; owners: Owner[]; onChanged: () => void }) {
  const [stage, setStage] = useState<LeadStage>(lead.stage)
  const [owner, setOwner] = useState<string>(lead.owner_id ?? '')
  const [followUp, setFollowUp] = useState<string>(lead.follow_up_on ?? '')
  const [lostReason, setLostReason] = useState<string>(lead.lost_reason ?? '')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string>()
  const [notes, setNotes] = useState<LeadNote[] | null>(null)
  const [note, setNote] = useState('')

  const loadNotes = useCallback(() => {
    fetchLeadNotes(lead.id).then(setNotes, (e) => setError(errorMessage(e)))
  }, [lead.id])
  useEffect(loadNotes, [loadNotes])

  const changed =
    stage !== lead.stage ||
    owner !== (lead.owner_id ?? '') ||
    followUp !== (lead.follow_up_on ?? '') ||
    (stage === 'lost' && lostReason !== (lead.lost_reason ?? ''))

  async function save() {
    setBusy(true)
    setError(undefined)
    try {
      await updateInstitutionLead(lead.id, {
        stage,
        owner: owner || null,
        followUp: followUp || null,
        lostReason: stage === 'lost' ? lostReason : null,
      })
      onChanged()
    } catch (e) {
      setError(errorMessage(e))
    } finally {
      setBusy(false)
    }
  }

  async function saveNote() {
    if (!note.trim()) return
    setBusy(true)
    setError(undefined)
    try {
      await addLeadNote(lead.id, note)
      setNote('')
      loadNotes()
      onChanged()
    } catch (e) {
      setError(errorMessage(e))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="grid gap-6 border-t border-ink-900/[0.06] bg-ink-50/60 px-4 py-5 sm:px-5 lg:grid-cols-2">
      <div className="space-y-4">
        <div className="space-y-1.5 text-sm text-ink-700">
          <a href={`mailto:${lead.email}`} className="flex items-center gap-2 hover:text-brand-700">
            <Mail size={14} className="text-ink-400" /> {lead.email}
          </a>
          {lead.phone && (
            <a href={`tel:${lead.phone}`} className="flex items-center gap-2 hover:text-brand-700">
              <Phone size={14} className="text-ink-400" /> {lead.phone}
            </a>
          )}
          {lead.preferred_time && (
            <p className="flex items-center gap-2">
              <CalendarClock size={14} className="text-ink-400" /> Best time: {lead.preferred_time}
            </p>
          )}
          {lead.city && <p className="text-ink-500">From {lead.city}</p>}
          {lead.student_id && (
            <Link to="/admin/users/$id" params={{ id: lead.student_id }} className="inline-flex items-center gap-1.5 font-semibold text-brand-700 hover:underline">
              <UserRound size={14} /> Open their student page
            </Link>
          )}
        </div>
        {lead.message && <p className="whitespace-pre-line rounded-xl bg-white p-3 text-sm text-ink-700 ring-1 ring-ink-900/[0.06]">{lead.message}</p>}

        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-500">Stage</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {LEAD_STAGES.map((s) => (
              <Chip key={s.key} active={stage === s.key} onClick={() => setStage(s.key)}>
                {s.label}
              </Chip>
            ))}
          </div>
          {stage === 'lost' && (
            <div className="mt-3">
              <Input label="Why it closed" value={lostReason} maxLength={300} onChange={(e) => setLostReason(e.target.value)} placeholder="Chose another institute; fees too high; not reachable after 3 calls" />
            </div>
          )}
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block text-sm font-medium text-ink-800">
            Owner
            <select value={owner} onChange={(e) => setOwner(e.target.value)} className="field mt-1.5 block w-full">
              <option value="">Nobody yet</option>
              {owners.map((o) => (
                <option key={o.user_id} value={o.user_id}>
                  {o.name}
                </option>
              ))}
            </select>
          </label>
          {stage !== 'enrolled' && stage !== 'lost' && (
            <Input label="Follow up on" type="date" required={false} value={followUp} onChange={(e) => setFollowUp(e.target.value)} />
          )}
        </div>
        <Button size="sm" disabled={busy || !changed || (stage === 'lost' && lostReason.trim().length < 2)} onClick={() => void save()}>
          {busy ? 'Saving…' : 'Save'}
        </Button>
        {error && <p className="text-sm text-red-700">{error}</p>}
      </div>

      <div>
        <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-500">
          <MessageSquare size={12} /> Notes
        </p>
        <div className="mt-2 space-y-2">
          <Textarea label="" required={false} rows={2} maxLength={2000} value={note} onChange={(e) => setNote(e.target.value)} placeholder="Called; interested in the weekend batch; visiting Saturday" />
          <Button size="sm" variant="secondary" disabled={busy || !note.trim()} onClick={() => void saveNote()}>
            Add note
          </Button>
        </div>
        {notes === null ? (
          <Skeleton className="mt-3 h-16 w-full" />
        ) : notes.length === 0 ? (
          <p className="mt-3 text-sm text-ink-500">No notes yet.</p>
        ) : (
          <ul className="mt-3 space-y-2">
            {notes.map((n) => (
              <li key={n.id} className="rounded-xl bg-white p-3 ring-1 ring-ink-900/[0.06]">
                <p className="whitespace-pre-line text-sm text-ink-800">{n.body}</p>
                <p className="mt-1 text-xs text-ink-500">
                  {n.author_name} · {new Date(n.created_at).toLocaleString(undefined, { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                </p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}

type Filter = 'open' | 'due' | LeadStage | 'all'

/**
 * Institution leads: every student who said they're interested in an
 * institution, worked from first call to enrolment. Filter by stage, by who
 * owns it, or by institution; search by name, email, phone or course; open one
 * to change its stage, owner and follow-up, and keep notes.
 */
function InstitutionLeadsPage() {
  const { user } = useAuthUser()
  const [leads, setLeads] = useState<InstitutionLead[] | null | undefined>(undefined)
  const [owners, setOwners] = useState<Owner[]>([])
  const [error, setError] = useState<string>()
  const [filter, setFilter] = useState<Filter>('open')
  const [ownerFilter, setOwnerFilter] = useState<'all' | 'mine' | 'none'>('all')
  const [institution, setInstitution] = useState('')
  const [q, setQ] = useState('')
  const [open, setOpen] = useState<string>()

  const load = useCallback(async () => {
    try {
      setLeads(await fetchInstitutionLeads())
      setError(undefined)
    } catch (e) {
      setError(errorMessage(e))
      setLeads([])
    }
  }, [])
  useEffect(() => {
    void load()
    void fetchLeadOwners().then(setOwners)
  }, [load])

  const all = useMemo(() => leads ?? [], [leads])
  const counts = useMemo(() => {
    const c: Record<string, number> = { open: 0, due: 0, all: all.length }
    for (const s of LEAD_STAGES) c[s.key] = 0
    for (const l of all) {
      c[l.stage] += 1
      if (isOpen(l)) c.open += 1
      if (isDue(l)) c.due += 1
    }
    return c
  }, [all])
  const institutions = useMemo(() => [...new Set(all.map((l) => l.institution_name))].sort(), [all])

  const term = q.trim().toLowerCase()
  const shown = all
    .filter((l) => (filter === 'all' ? true : filter === 'open' ? isOpen(l) : filter === 'due' ? isDue(l) : l.stage === filter))
    .filter((l) => (ownerFilter === 'all' ? true : ownerFilter === 'mine' ? l.owner_id === user?.id : !l.owner_id))
    .filter((l) => !institution || l.institution_name === institution)
    .filter(
      (l) =>
        !term ||
        [l.full_name, l.email, l.phone ?? '', l.course ?? '', l.institution_name].some((v) => v.toLowerCase().includes(term)),
    )
    // Due follow-ups first, then the newest.
    .sort((a, b) => Number(isDue(b)) - Number(isDue(a)) || b.created_at.localeCompare(a.created_at))

  const enrolled = counts.enrolled ?? 0
  const decided = enrolled + (counts.lost ?? 0)
  const chips: { key: Filter; label: string }[] = [
    { key: 'open', label: 'Open' },
    { key: 'due', label: 'Follow-up due' },
    ...LEAD_STAGES.map((s) => ({ key: s.key as Filter, label: s.label })),
    { key: 'all', label: 'All' },
  ]

  return (
    <>
      <PageHeader
        eyebrow="Institutions"
        title="Institution leads"
        subtitle={
          leads
            ? `${counts.new} new · ${counts.due} follow-ups due · ${counts.open} open · ${enrolled} enrolled${
                decided ? ` (${Math.round((enrolled / decided) * 100)}% of closed leads)` : ''
              }`
            : 'Students interested in an institution, from first call to enrolment.'
        }
      />
      {error && (
        <div className="mb-5">
          <Alert tone="danger" title="Something went wrong">
            <p>{error}</p>
          </Alert>
        </div>
      )}
      {leads === undefined ? (
        <Skeleton className="h-64 w-full" />
      ) : leads === null ? (
        <Alert tone="warning" title="Institution leads aren’t set up yet">
          <p>
            Run <code>docs/supabase-institution-leads.sql</code> in Supabase, then reload this page.
          </p>
        </Alert>
      ) : (
        <div className="space-y-3">
          <div className="flex flex-wrap gap-2">
            {chips.map((c) => (
              <Chip key={c.key} active={filter === c.key} onClick={() => setFilter(c.key)}>
                {c.label} · {counts[c.key] ?? 0}
              </Chip>
            ))}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative min-w-0 flex-1 sm:max-w-xs">
              <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-400" />
              <input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Name, email, phone or course" aria-label="Search leads" className="field h-10 w-full pl-9" />
            </div>
            <select value={ownerFilter} onChange={(e) => setOwnerFilter(e.target.value as typeof ownerFilter)} className="field h-10 py-0" style={{ width: 'auto' }} aria-label="Owner">
              <option value="all">Everyone’s</option>
              <option value="mine">Mine</option>
              <option value="none">Nobody’s yet</option>
            </select>
            {institutions.length > 1 && (
              <select value={institution} onChange={(e) => setInstitution(e.target.value)} className="field h-10 py-0" style={{ width: 'auto' }} aria-label="Institution">
                <option value="">Every institution</option>
                {institutions.map((i) => (
                  <option key={i} value={i}>
                    {i}
                  </option>
                ))}
              </select>
            )}
          </div>

          {shown.length === 0 ? (
            <EmptyState icon={UserRound} title="No leads here" description="Students who say they’re interested in an institution appear here." />
          ) : (
            <ul className="card divide-y divide-ink-900/[0.06] overflow-hidden">
              {shown.map((l) => {
                const st = stageInfo(l.stage)
                const due = isDue(l)
                const isThis = open === l.id
                return (
                  <li key={l.id}>
                    <button
                      type="button"
                      onClick={() => setOpen(isThis ? undefined : l.id)}
                      aria-expanded={isThis}
                      className="flex w-full flex-wrap items-center gap-x-4 gap-y-1.5 px-4 py-3.5 text-left transition-colors hover:bg-ink-50 sm:px-5"
                    >
                      <span className="min-w-0 flex-1 basis-56">
                        <span className="block truncate font-semibold text-ink-900">{l.full_name}</span>
                        <span className="block truncate text-sm text-ink-600">
                          {l.institution_name}
                          {l.course ? ` · ${l.course}` : ''}
                        </span>
                      </span>
                      <Badge tone={st.tone}>{st.label}</Badge>
                      <span className="w-28 text-xs text-ink-500">{l.owner_name ?? 'No owner'}</span>
                      <span className={`w-32 text-xs ${due ? 'font-semibold text-red-600' : 'text-ink-500'}`}>
                        {l.follow_up_on && isOpen(l) ? `Follow up ${day(l.follow_up_on)}` : `In ${day(l.created_at)}`}
                      </span>
                      <span className="w-14 text-xs text-ink-400">{l.notes ? `${l.notes} ${l.notes === 1 ? 'note' : 'notes'}` : ''}</span>
                      <ChevronDown size={16} className={`shrink-0 text-ink-400 transition-transform ${isThis ? 'rotate-180' : ''}`} />
                    </button>
                    {isThis && (
                      <LeadDetail
                        key={l.updated_at}
                        lead={l}
                        owners={owners}
                        onChanged={() => void load()}
                      />
                    )}
                  </li>
                )
              })}
            </ul>
          )}
        </div>
      )}
    </>
  )
}
