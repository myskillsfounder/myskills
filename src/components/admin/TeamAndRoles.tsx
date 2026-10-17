import { useCallback, useEffect, useState } from 'react'
import { Crown, KeyRound, Pencil, Plus, ShieldCheck, Trash2, UserPlus, Users } from 'lucide-react'
import { errorMessage } from '@/lib/errors'
import {
  TEAM_DOMAIN,
  deleteStaffRole,
  fetchStaffRoles,
  fetchTeamMembers,
  removeTeamMember,
  saveStaffRole,
  sectionLabel,
  setTeamMember,
  type StaffRole,
  type TeamMemberV2,
} from '@/lib/adminTeam'
import type { StaffSection } from '@/lib/staffAccess'
import { SectionPicker, sameSet } from '@/components/admin/SectionPicker'
import { Alert, Avatar, Badge, Button, Chip, EmptyState, Input, PageHeader, Skeleton, Textarea } from '@/components/ui'

const day = (iso: string | null) =>
  iso ? new Date(iso).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' }) : 'never'

/** "Custom" in the role choice: the member gets their own ticked sections. */
const CUSTOM = '__custom'

/** A role, or custom sections: the one choice made for every team member. */
function AccessChoice({
  roles,
  roleId,
  sections,
  onRole,
  onSections,
}: {
  roles: StaffRole[]
  roleId: string
  sections: StaffSection[]
  onRole: (id: string) => void
  onSections: (s: StaffSection[]) => void
}) {
  const role = roles.find((r) => r.id === roleId)
  return (
    <div className="space-y-3">
      <label className="block max-w-md text-sm font-medium text-ink-800">
        Role
        <select value={roleId} onChange={(e) => onRole(e.target.value)} className="field mt-1.5 block w-full">
          <option value="">Choose a role…</option>
          {roles.map((r) => (
            <option key={r.id} value={r.id}>
              {r.name}
            </option>
          ))}
          <option value={CUSTOM}>Custom: choose sections</option>
        </select>
      </label>
      {role && (
        <div>
          {role.description && <p className="text-sm text-ink-600">{role.description}</p>}
          <SectionChips sections={role.sections} />
        </div>
      )}
      {roleId === CUSTOM && <SectionPicker value={sections} onChange={onSections} presets={false} />}
    </div>
  )
}

function SectionChips({ sections }: { sections: StaffSection[] }) {
  return (
    <ul className="mt-2 flex flex-wrap gap-1.5">
      {sections.map((s) => (
        <li key={s} className="rounded-full bg-ink-100 px-2.5 py-1 text-xs font-medium text-ink-700">
          {sectionLabel(s)}
        </li>
      ))}
    </ul>
  )
}

/* ------------------------------------------------------------- members */

function MemberCard({ m, roles, onChanged }: { m: TeamMemberV2; roles: StaffRole[]; onChanged: () => Promise<void> }) {
  const [editing, setEditing] = useState(false)
  const [roleId, setRoleId] = useState(m.role_id ?? CUSTOM)
  const [sections, setSections] = useState<StaffSection[]>(m.sections)
  const [removing, setRemoving] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string>()
  const name = m.full_name?.trim() || m.email.split('@')[0]

  async function run(fn: () => Promise<void>) {
    setBusy(true)
    setError(undefined)
    try {
      await fn()
      await onChanged()
      setEditing(false)
      setRemoving(false)
    } catch (e) {
      setError(errorMessage(e))
    } finally {
      setBusy(false)
    }
  }

  const unchanged = roleId === (m.role_id ?? CUSTOM) && (roleId !== CUSTOM || sameSet(sections, m.sections))
  const canSave = !unchanged && roleId !== '' && (roleId !== CUSTOM || sections.length > 0)

  return (
    <li className="card p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <Avatar name={name} size={40} />
          <div className="min-w-0">
            <p className="flex flex-wrap items-center gap-2 font-semibold text-ink-900">
              <span className="truncate">{name}</span>
              {m.is_admin ? (
                <Badge tone="gold" icon={Crown}>
                  Super admin
                </Badge>
              ) : (
                <Badge tone="brand">{m.role_name ?? 'Custom'}</Badge>
              )}
            </p>
            <p className="truncate text-sm text-ink-600">{m.email}</p>
            <p className="text-xs text-ink-500">
              {!m.has_account
                ? 'No account yet: their access starts when they sign up with this email.'
                : `Last signed in ${day(m.last_sign_in_at)}`}
            </p>
          </div>
        </div>
        {!m.is_admin && !editing && !removing && (
          <div className="flex gap-2">
            <Button size="sm" variant="secondary" icon={Pencil} onClick={() => setEditing(true)}>
              Change
            </Button>
            <Button size="sm" variant="ghost" icon={Trash2} onClick={() => setRemoving(true)}>
              Remove
            </Button>
          </div>
        )}
      </div>

      {m.is_admin ? (
        <p className="mt-3 text-sm text-ink-600">Opens everything, including this page. Super admins are set in Supabase.</p>
      ) : editing ? (
        <div className="mt-4 border-t border-ink-900/[0.06] pt-4">
          <AccessChoice
            roles={roles}
            roleId={roleId}
            sections={sections}
            onRole={(id) => {
              setRoleId(id)
              if (id === CUSTOM && sections.length === 0) setSections(m.sections)
            }}
            onSections={setSections}
          />
          <div className="mt-4 flex flex-wrap gap-2">
            <Button
              disabled={busy || !canSave}
              onClick={() => void run(() => setTeamMember(m.email, roleId === CUSTOM ? null : roleId, roleId === CUSTOM ? sections : []))}
            >
              {busy ? 'Saving…' : 'Save'}
            </Button>
            <Button variant="ghost" disabled={busy} onClick={() => setEditing(false)}>
              Cancel
            </Button>
          </div>
        </div>
      ) : (
        <SectionChips sections={m.sections} />
      )}

      {removing && (
        <div className="mt-4 flex flex-wrap items-center gap-3 rounded-xl bg-red-50 p-3">
          <p className="min-w-0 flex-1 text-sm text-red-900">
            Take {m.email} off the team? Their account stays; they just can’t open the admin panel.
          </p>
          <Button size="sm" variant="danger" disabled={busy} onClick={() => void run(() => removeTeamMember(m.email))}>
            {busy ? 'Removing…' : 'Yes, remove'}
          </Button>
          <Button size="sm" variant="ghost" disabled={busy} onClick={() => setRemoving(false)}>
            Keep
          </Button>
        </div>
      )}
      {error && <p className="mt-2 text-sm text-red-700">{error}</p>}
    </li>
  )
}

function AddMember({ roles, team, onChanged }: { roles: StaffRole[]; team: TeamMemberV2[]; onChanged: () => Promise<void> }) {
  const [email, setEmail] = useState('')
  const [roleId, setRoleId] = useState('')
  const [sections, setSections] = useState<StaffSection[]>([])
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string>()
  const [added, setAdded] = useState<string>()

  const clean = email.trim().toLowerCase()
  const problem = !clean
    ? null
    : !clean.endsWith(TEAM_DOMAIN)
      ? `Team members need a ${TEAM_DOMAIN} email.`
      : team.some((m) => m.email === clean)
        ? 'They’re already on the team: change them below.'
        : null
  const ready = clean && !problem && roleId !== '' && (roleId !== CUSTOM || sections.length > 0)

  async function add() {
    setBusy(true)
    setError(undefined)
    setAdded(undefined)
    try {
      await setTeamMember(clean, roleId === CUSTOM ? null : roleId, roleId === CUSTOM ? sections : [])
      await onChanged()
      setAdded(clean)
      setEmail('')
      setRoleId('')
      setSections([])
    } catch (e) {
      setError(errorMessage(e))
    } finally {
      setBusy(false)
    }
  }

  return (
    <section className="card p-5 sm:p-6">
      <h2 className="flex items-center gap-2 font-display text-lg font-semibold text-ink-900">
        <UserPlus size={18} className="text-brand-700" /> Add a team member
      </h2>
      <p className="mt-0.5 text-sm text-ink-600">
        Any {TEAM_DOMAIN} email, even before they have an account: their access starts the moment they sign up with it.
      </p>
      <div className="mt-4 max-w-md">
        <Input
          label="Work email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          error={problem ?? undefined}
          placeholder={`name${TEAM_DOMAIN}`}
          autoComplete="off"
        />
      </div>
      <div className="mt-4">
        <AccessChoice roles={roles} roleId={roleId} sections={sections} onRole={setRoleId} onSections={setSections} />
      </div>
      <div className="mt-5 flex flex-wrap items-center gap-3">
        <Button icon={UserPlus} disabled={busy || !ready} onClick={() => void add()}>
          {busy ? 'Adding…' : 'Add to the team'}
        </Button>
        {added && (
          <span className="text-sm font-medium text-emerald-700">
            {added} is on the team. They sign in at /admin/login, or sign up with that email first.
          </span>
        )}
      </div>
      {error && <p className="mt-2 text-sm text-red-700">{error}</p>}
    </section>
  )
}

/* --------------------------------------------------------------- roles */

function RoleForm({
  initial,
  onDone,
  onCancel,
}: {
  initial: StaffRole | null
  onDone: () => Promise<void>
  onCancel: () => void
}) {
  const [name, setName] = useState(initial?.name ?? '')
  const [description, setDescription] = useState(initial?.description ?? '')
  const [sections, setSections] = useState<StaffSection[]>(initial?.sections ?? [])
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string>()

  async function save() {
    setBusy(true)
    setError(undefined)
    try {
      await saveStaffRole(initial?.id ?? null, name, description, sections)
      await onDone()
    } catch (e) {
      setError(errorMessage(e))
      setBusy(false)
    }
  }

  return (
    <div className="card space-y-4 p-5 sm:p-6">
      <p className="font-display text-lg font-semibold text-ink-900">{initial ? `Change “${initial.name}”` : 'New role'}</p>
      {initial && initial.members > 0 && (
        <p className="text-sm text-ink-600">
          {initial.members === 1 ? 'The 1 person' : `All ${initial.members} people`} with this role get the change straight away.
        </p>
      )}
      <div className="grid gap-4 sm:grid-cols-2">
        <Input label="Name" value={name} maxLength={40} onChange={(e) => setName(e.target.value)} placeholder="Internship desk" />
      </div>
      <Textarea
        label="What it’s for"
        required={false}
        rows={2}
        maxLength={200}
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder="Handles internship companies, roles and sign-offs."
      />
      <SectionPicker value={sections} onChange={setSections} presets={false} />
      {error && <p className="text-sm text-red-700">{error}</p>}
      <div className="flex flex-wrap gap-2">
        <Button disabled={busy || name.trim().length < 2 || sections.length === 0} onClick={() => void save()}>
          {busy ? 'Saving…' : initial ? 'Save role' : 'Create role'}
        </Button>
        <Button variant="ghost" disabled={busy} onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </div>
  )
}

function RoleCard({ r, onEdit, onChanged }: { r: StaffRole; onEdit: () => void; onChanged: () => Promise<void> }) {
  const [deleting, setDeleting] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string>()
  return (
    <li className="card p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="flex flex-wrap items-center gap-2 font-display text-lg font-semibold text-ink-900">
            {r.name}
            <span className="rounded-full bg-ink-100 px-2 py-0.5 text-xs font-semibold text-ink-600">
              {r.members} {r.members === 1 ? 'member' : 'members'}
            </span>
          </p>
          {r.description && <p className="mt-0.5 text-sm text-ink-600">{r.description}</p>}
        </div>
        {!deleting && (
          <div className="flex gap-2">
            <Button size="sm" variant="secondary" icon={Pencil} onClick={onEdit}>
              Change
            </Button>
            <Button size="sm" variant="ghost" icon={Trash2} onClick={() => setDeleting(true)}>
              Delete
            </Button>
          </div>
        )}
      </div>
      <SectionChips sections={r.sections} />
      {deleting && (
        <div className="mt-4 flex flex-wrap items-center gap-3 rounded-xl bg-red-50 p-3">
          <p className="min-w-0 flex-1 text-sm text-red-900">
            Delete “{r.name}”?{' '}
            {r.members > 0 ? `Its ${r.members === 1 ? 'member keeps' : `${r.members} members keep`} exactly what they have now, as custom access.` : ''}
          </p>
          <Button
            size="sm"
            variant="danger"
            disabled={busy}
            onClick={() => {
              setBusy(true)
              void deleteStaffRole(r.id)
                .then(onChanged)
                .catch((e) => setError(errorMessage(e)))
                .finally(() => setBusy(false))
            }}
          >
            {busy ? 'Deleting…' : 'Yes, delete'}
          </Button>
          <Button size="sm" variant="ghost" disabled={busy} onClick={() => setDeleting(false)}>
            Keep
          </Button>
        </div>
      )}
      {error && <p className="mt-2 text-sm text-red-700">{error}</p>}
    </li>
  )
}

/* ---------------------------------------------------------------- page */

/**
 * The super admin's page: who is on the internal team and what each can open.
 * People are added by email (before they have an account, if need be) and
 * given a role, a named set of sections; changing a role changes it for all
 * who have it. Super admins themselves are set in Supabase, never here.
 */
export function TeamAndRoles({ initial }: { initial: TeamMemberV2[] }) {
  const [team, setTeam] = useState<TeamMemberV2[]>(initial)
  const [roles, setRoles] = useState<StaffRole[] | null>(null)
  const [error, setError] = useState<string>()
  const [tab, setTab] = useState<'members' | 'roles'>('members')
  const [editingRole, setEditingRole] = useState<StaffRole | null | undefined>(undefined)

  const load = useCallback(async () => {
    try {
      const [t, r] = await Promise.all([fetchTeamMembers(), fetchStaffRoles()])
      if (t) setTeam(t)
      setRoles(r)
      setError(undefined)
    } catch (e) {
      setError(errorMessage(e))
    }
  }, [])
  useEffect(() => {
    void load()
  }, [load])

  const admins = team.filter((m) => m.is_admin)
  const members = team.filter((m) => !m.is_admin)

  return (
    <>
      <PageHeader
        eyebrow="Team"
        title="Team & roles"
        subtitle="Who on the MySkills team can open this admin panel, and what each can do. Add people by their work email and give them a role."
      />

      {/* The three kinds of access, side by side, because they are easy to confuse. */}
      <div className="mb-6 grid gap-3 md:grid-cols-3">
        {[
          { icon: Crown, tone: 'bg-gold-50 text-gold-700', title: 'Super admin', body: 'Everything, including this page. Set in Supabase only.' },
          { icon: ShieldCheck, tone: 'bg-brand-50 text-brand-700', title: 'Team member', body: `A ${TEAM_DOMAIN} email given a role here.` },
          { icon: KeyRound, tone: 'bg-ink-100 text-ink-600', title: 'Partner', body: 'Not in the admin panel at all. Verified under Partners > Portal access & usage.' },
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

      <div className="mb-5 flex flex-wrap gap-2">
        <Chip active={tab === 'members'} icon={Users} onClick={() => setTab('members')}>
          Team members · {members.length}
        </Chip>
        <Chip active={tab === 'roles'} icon={ShieldCheck} onClick={() => setTab('roles')}>
          Roles · {roles?.length ?? '…'}
        </Chip>
      </div>

      {roles === null ? (
        <Skeleton className="h-64 w-full" />
      ) : tab === 'members' ? (
        <div className="space-y-8">
          <AddMember roles={roles} team={team} onChanged={load} />

          <section>
            <h2 className="mb-3 flex items-center gap-2 font-display text-lg font-semibold text-ink-900">
              <Crown size={18} className="text-gold-600" /> Super admins · {admins.length}
            </h2>
            <ul className="space-y-3">
              {admins.map((m) => (
                <MemberCard key={m.email} m={m} roles={roles} onChanged={load} />
              ))}
            </ul>
          </section>

          <section>
            <h2 className="mb-3 flex items-center gap-2 font-display text-lg font-semibold text-ink-900">
              <Users size={18} className="text-ink-500" /> Team members · {members.length}
            </h2>
            {members.length === 0 ? (
              <EmptyState icon={Users} title="Nobody yet" description="Add a team member above." />
            ) : (
              <ul className="space-y-3">
                {members.map((m) => (
                  <MemberCard key={m.email} m={m} roles={roles} onChanged={load} />
                ))}
              </ul>
            )}
          </section>
        </div>
      ) : (
        <div className="space-y-4">
          <p className="max-w-2xl text-sm text-ink-600">
            A role is a named set of sections. Give it to team members instead of ticking sections for each person; change
            the role, and everyone with it changes too.
          </p>
          {editingRole === undefined ? (
            <Button icon={Plus} onClick={() => setEditingRole(null)}>
              New role
            </Button>
          ) : (
            <RoleForm
              key={editingRole?.id ?? 'new'}
              initial={editingRole}
              onCancel={() => setEditingRole(undefined)}
              onDone={async () => {
                setEditingRole(undefined)
                await load()
              }}
            />
          )}
          <ul className="space-y-3">
            {roles.map((r) => (
              <RoleCard
                key={r.id}
                r={r}
                onChanged={load}
                onEdit={() => {
                  setEditingRole(r)
                  window.scrollTo({ top: 0, behavior: 'smooth' })
                }}
              />
            ))}
          </ul>
        </div>
      )}
    </>
  )
}
