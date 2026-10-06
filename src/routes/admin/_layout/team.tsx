import { useCallback, useEffect, useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { Crown, KeyRound, Pencil, ShieldCheck, Trash2, UserPlus, Users } from 'lucide-react'
import { errorMessage } from '@/lib/errors'
import {
  ALL_SECTIONS,
  PRESETS,
  SECTION_GROUPS,
  TEAM_DOMAIN,
  fetchTeam,
  sectionLabel,
  setStaffAccess,
  type TeamMember,
} from '@/lib/adminTeam'
import type { StaffSection } from '@/lib/staffAccess'
import { RequireAdmin } from '@/components/admin/AdminSectionGate'
import { Alert, Avatar, Badge, Button, EmptyState, Input, PageHeader, Skeleton } from '@/components/ui'

// Full admins only: this page decides who else can open the admin panel.
export const Route = createFileRoute('/admin/_layout/team')({
  component: () => (
    <RequireAdmin>
      <TeamPage />
    </RequireAdmin>
  ),
})

const day = (iso: string | null) =>
  iso ? new Date(iso).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' }) : 'never'

const sameSet = (a: string[], b: string[]) => a.length === b.length && a.every((x) => b.includes(x))

/** Tick the sections one person may open. Presets fill it in for the usual jobs. */
function SectionPicker({ value, onChange }: { value: StaffSection[]; onChange: (next: StaffSection[]) => void }) {
  const toggle = (id: StaffSection) => onChange(value.includes(id) ? value.filter((s) => s !== id) : [...value, id])
  return (
    <div>
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs font-semibold uppercase tracking-[0.12em] text-ink-500">Start from</span>
        {PRESETS.map((p) => (
          <button
            key={p.label}
            type="button"
            title={p.hint}
            onClick={() => onChange(p.sections)}
            className={`rounded-full border px-3 py-1 text-xs font-semibold transition-colors ${
              sameSet(value, p.sections) ? 'border-brand-500 bg-brand-50 text-brand-800' : 'border-ink-300 text-ink-700 hover:bg-ink-100'
            }`}
          >
            {p.label}
          </button>
        ))}
        {value.length > 0 && (
          <button type="button" onClick={() => onChange([])} className="text-xs font-semibold text-ink-500 hover:text-ink-800 hover:underline">
            Clear
          </button>
        )}
      </div>

      <div className="mt-4 grid gap-x-8 gap-y-5 sm:grid-cols-2">
        {SECTION_GROUPS.map((g) => (
          <fieldset key={g.label}>
            <legend className="text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-400">{g.label}</legend>
            <div className="mt-1.5 space-y-1.5">
              {g.sections.map((s) => (
                <label key={s.id} className="flex cursor-pointer items-start gap-2.5 rounded-lg px-2 py-1.5 hover:bg-ink-50">
                  <input
                    type="checkbox"
                    checked={value.includes(s.id)}
                    onChange={() => toggle(s.id)}
                    className="mt-0.5 h-4 w-4 shrink-0 accent-brand-600"
                  />
                  <span className="min-w-0">
                    <span className="block text-sm font-medium text-ink-900">{s.label}</span>
                    <span className="block text-xs leading-snug text-ink-500">{s.opens}</span>
                  </span>
                </label>
              ))}
            </div>
          </fieldset>
        ))}
      </div>
      <p className="mt-3 text-xs text-ink-500">
        {value.length} of {ALL_SECTIONS.length} sections. Everyone with any access also gets the Dashboard and the Inbox,
        limited to what they can open.
      </p>
    </div>
  )
}

function MemberRow({ member, busy, onSave }: { member: TeamMember; busy: boolean; onSave: (sections: StaffSection[]) => Promise<void> }) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState<StaffSection[]>(member.sections)
  const [confirmRemove, setConfirmRemove] = useState(false)
  const name = member.full_name?.trim() || member.email.split('@')[0]

  return (
    <li className="card p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <Avatar name={name} size={40} />
          <div className="min-w-0">
            <p className="flex flex-wrap items-center gap-2 font-semibold text-ink-900">
              <span className="truncate">{name}</span>
              {member.is_admin ? (
                <Badge tone="gold" icon={Crown}>
                  Full admin
                </Badge>
              ) : (
                <Badge tone="brand">Team member</Badge>
              )}
            </p>
            <p className="truncate text-sm text-ink-600">{member.email}</p>
            <p className="text-xs text-ink-500">Last signed in {day(member.last_sign_in_at)}</p>
          </div>
        </div>
        {!member.is_admin && !editing && (
          <div className="flex gap-2">
            <Button size="sm" variant="secondary" icon={Pencil} onClick={() => (setDraft(member.sections), setEditing(true))}>
              Change access
            </Button>
            <Button size="sm" variant="ghost" icon={Trash2} onClick={() => setConfirmRemove(true)}>
              Remove
            </Button>
          </div>
        )}
      </div>

      {member.is_admin ? (
        <p className="mt-3 text-sm text-ink-600">
          Opens everything, including this page. Full admins are set in Supabase, not here.
        </p>
      ) : editing ? (
        <div className="mt-4 border-t border-ink-900/[0.06] pt-4">
          <SectionPicker value={draft} onChange={setDraft} />
          <div className="mt-4 flex flex-wrap gap-2">
            <Button
              disabled={busy || sameSet(draft, member.sections)}
              onClick={() => void onSave(draft).then(() => setEditing(false), () => {})}
            >
              {busy ? 'Saving…' : draft.length === 0 ? 'Save (removes all access)' : 'Save access'}
            </Button>
            <Button variant="ghost" disabled={busy} onClick={() => setEditing(false)}>
              Cancel
            </Button>
          </div>
        </div>
      ) : (
        <ul className="mt-3 flex flex-wrap gap-1.5">
          {member.sections.map((s) => (
            <li key={s} className="rounded-full bg-ink-100 px-2.5 py-1 text-xs font-medium text-ink-700">
              {sectionLabel(s)}
            </li>
          ))}
        </ul>
      )}

      {confirmRemove && (
        <div className="mt-4 flex flex-wrap items-center gap-3 rounded-xl bg-red-50 p-3">
          <p className="min-w-0 flex-1 text-sm text-red-900">
            Remove {member.email} from the admin panel? Their account stays; they just can’t open /admin.
          </p>
          <Button size="sm" variant="danger" disabled={busy} onClick={() => void onSave([]).then(() => setConfirmRemove(false), () => {})}>
            {busy ? 'Removing…' : 'Yes, remove'}
          </Button>
          <Button size="sm" variant="ghost" disabled={busy} onClick={() => setConfirmRemove(false)}>
            Keep
          </Button>
        </div>
      )}
    </li>
  )
}

function TeamPage() {
  const [team, setTeam] = useState<TeamMember[] | null | undefined>(undefined)
  const [error, setError] = useState<string>()
  const [busy, setBusy] = useState<string>()
  const [email, setEmail] = useState('')
  const [sections, setSections] = useState<StaffSection[]>([])
  const [added, setAdded] = useState<string>()

  const load = useCallback(async () => {
    try {
      setTeam(await fetchTeam())
    } catch (e) {
      setError(errorMessage(e))
      setTeam([])
    }
  }, [])
  useEffect(() => {
    void load()
  }, [load])

  async function save(target: string, next: StaffSection[]) {
    setBusy(target)
    setError(undefined)
    try {
      await setStaffAccess(target, next)
      await load()
    } catch (e) {
      setError(errorMessage(e))
      throw e
    } finally {
      setBusy(undefined)
    }
  }

  const cleanEmail = email.trim().toLowerCase()
  const emailProblem = !cleanEmail
    ? null
    : !cleanEmail.endsWith(TEAM_DOMAIN)
      ? `Team access is only for ${TEAM_DOMAIN} accounts.`
      : team?.some((m) => m.email.toLowerCase() === cleanEmail)
        ? 'They’re already on the team: change their access below.'
        : null

  async function add() {
    setAdded(undefined)
    try {
      await save(cleanEmail, sections)
      setAdded(cleanEmail)
      setEmail('')
      setSections([])
    } catch {
      /* shown above */
    }
  }

  return (
    <>
      <PageHeader
        eyebrow="Team"
        title="Team & access"
        subtitle="Who on the MySkills team can open this admin panel, and which parts. Partners don’t belong here: mentors, companies and institutions use the Community portal."
      />

      {/* The three kinds of access, side by side, because they are easy to confuse. */}
      <div className="mb-6 grid gap-3 md:grid-cols-3">
        {[
          { icon: Crown, tone: 'bg-gold-50 text-gold-700', title: 'Full admin', body: 'Everything, including this page. Set in Supabase only.' },
          { icon: ShieldCheck, tone: 'bg-brand-50 text-brand-700', title: 'Team member', body: `An ${TEAM_DOMAIN} account given some sections here.` },
          { icon: KeyRound, tone: 'bg-ink-100 text-ink-600', title: 'Partner', body: 'Not in the admin panel at all. Verified under Community > Portal access & usage.' },
        ].map(({ icon: Icon, tone, title, body }) => (
          <div key={title} className="flex items-start gap-3 rounded-2xl border border-ink-900/[0.07] bg-white p-4">
            <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${tone}`}>
              <Icon size={17} />
            </span>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-ink-900">{title}</p>
              <p className="text-xs leading-relaxed text-ink-600">{body}</p>
            </div>
          </div>
        ))}
      </div>

      {error && (
        <div className="mb-5">
          <Alert tone="danger" title="That didn’t work">
            <p>{error}</p>
          </Alert>
        </div>
      )}

      {team === undefined ? (
        <Skeleton className="h-64 w-full" />
      ) : team === null ? (
        <Alert tone="warning" title="Team access isn’t set up yet">
          <p>
            Run <code>docs/supabase-admin-team.sql</code> in Supabase, then reload this page.
          </p>
        </Alert>
      ) : (
        <>
          <section className="card p-5 sm:p-6">
            <h2 className="flex items-center gap-2 font-display text-lg font-semibold text-ink-900">
              <UserPlus size={18} className="text-brand-700" /> Give someone access
            </h2>
            <p className="mt-0.5 text-sm text-ink-600">
              They need an account with their {TEAM_DOMAIN} email first (they can sign up on the site with it). Then enter
              the email and choose what they can open.
            </p>
            <div className="mt-4 max-w-md">
              <Input
                label="Work email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                error={emailProblem ?? undefined}
                placeholder={`name${TEAM_DOMAIN}`}
                autoComplete="off"
              />
            </div>
            <div className="mt-5">
              <SectionPicker value={sections} onChange={setSections} />
            </div>
            <div className="mt-5 flex flex-wrap items-center gap-3">
              <Button
                icon={UserPlus}
                disabled={Boolean(busy) || !cleanEmail || Boolean(emailProblem) || sections.length === 0}
                onClick={() => void add()}
              >
                {busy === cleanEmail ? 'Giving access…' : 'Give access'}
              </Button>
              {added && <span className="text-sm font-medium text-emerald-700">{added} can now sign in at /admin/login.</span>}
            </div>
          </section>

          <h2 className="mb-3 mt-8 flex items-center gap-2 font-display text-lg font-semibold text-ink-900">
            <Users size={18} className="text-ink-500" /> Who has access · {team.length}
          </h2>
          {team.length === 0 ? (
            <EmptyState icon={Users} title="Nobody yet" description="Give a team member access above." />
          ) : (
            <ul className="space-y-3">
              {team.map((m) => (
                <MemberRow key={m.user_id} member={m} busy={busy === m.email} onSave={(next) => save(m.email, next)} />
              ))}
            </ul>
          )}
        </>
      )}
    </>
  )
}
