import { useEffect, useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { Eye, KeyRound, UserPlus, Users } from 'lucide-react'
import { errorMessage } from '@/lib/errors'
import {
  GRANTED_RESOURCES,
  LOGS_SESSIONS,
  RESOURCE_LABEL,
  fetchAdminCommunityAccess,
  fetchCommunityUsage,
  grantCommunityAccess,
  revokeCommunityAccess,
  type AdminCommunityAccess,
  type CommunityResource,
  type CommunityUsage,
} from '@/lib/communityPortal'
import { RequireSection } from '@/components/admin/AdminSectionGate'
import { InviteLink, SIGNUP_ROLE } from '@/components/admin/InviteLink'
import { PortalRequestsPanel } from '@/components/admin/PortalRequestsPanel'
import { Alert, Badge, Button, EmptyState, Input, PageHeader, Skeleton } from '@/components/ui'

// Needs the portal-access section (a full admin has it): this decides who can
// open which part of the Community portal, and shows which students use what.
export const Route = createFileRoute('/admin/_layout/community-portal')({
  component: () => (
    <RequireSection section="portal-access">
      <CommunityPortalAdminPage />
    </RequireSection>
  ),
})

const isOrganisation = (r: CommunityResource) => r === 'internships' || r === 'institutions'
const logsSessions = (r: CommunityResource) => r !== 'mentors' && LOGS_SESSIONS[r]

/** What each section's partner is called, for the invite. */
const PARTNER_WORD: Record<CommunityResource, string> = {
  mentors: 'mentor',
  wellness: 'counsellor',
  guidance: 'career guide',
  internships: 'company',
  institutions: 'institution',
}

function CommunityPortalAdminPage() {
  const [access, setAccess] = useState<AdminCommunityAccess[]>([])
  const [usage, setUsage] = useState<CommunityUsage[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string>()

  const [email, setEmail] = useState('')
  const [resource, setResource] = useState<CommunityResource>('wellness')
  const [organisation, setOrganisation] = useState('')
  // Two different things that used to share one form and one tick-box: a
  // partner's own section, or a team member's read-only view of everyone.
  const [who, setWho] = useState<'partner' | 'team'>('partner')
  const overview = who === 'team'
  const needsName = isOrganisation(resource) && !overview
  const [busy, setBusy] = useState(false)
  const [formError, setFormError] = useState<string>()
  // The email that turned out to have no account, so the form can offer the invite.
  const [noAccount, setNoAccount] = useState<string>()
  const [inviteRole, setInviteRole] = useState<CommunityResource>('mentors')
  const [confirm, setConfirm] = useState<string>()

  function pickWho(next: 'partner' | 'team') {
    setWho(next)
    setFormError(undefined)
    setNoAccount(undefined)
    // A mentor's own section comes from their listing, never from here.
    if (next === 'partner' && resource === 'mentors') setResource('wellness')
  }

  async function load() {
    try {
      const [a, u] = await Promise.all([fetchAdminCommunityAccess(), fetchCommunityUsage()])
      setAccess(a)
      setUsage(u)
      setError(undefined)
    } catch (e) {
      setError(errorMessage(e))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void load()
  }, [])

  async function grant() {
    setBusy(true)
    setFormError(undefined)
    setNoAccount(undefined)
    try {
      await grantCommunityAccess(email, resource, needsName ? organisation : '', overview)
      setEmail('')
      setOrganisation('')
      await load()
    } catch (e) {
      const message = errorMessage(e)
      // Not a dead end: say what to do next, whatever wording the database used.
      if (/no account uses/i.test(message)) setNoAccount(email.trim())
      else setFormError(message)
    } finally {
      setBusy(false)
    }
  }

  async function revoke(a: AdminCommunityAccess) {
    setBusy(true)
    setFormError(undefined)
    try {
      await revokeCommunityAccess(a.user_id, a.resource)
      await load()
    } catch (e) {
      setFormError(errorMessage(e))
    } finally {
      setBusy(false)
      setConfirm(undefined)
    }
  }

  const canGrant =
    /^\S+@\S+\.\S+$/.test(email.trim()) && (!needsName || organisation.trim().length >= 2)

  return (
    <>
      <PageHeader
        eyebrow="Community"
        title="Portal access & usage"
        subtitle="Invite partners, verify the ones who sign up, see who can open each part of the Community portal, and which students are using which resource."
      />

      <PortalRequestsPanel onChanged={() => void load()} />

      {error && (
        <div className="mb-5">
          <Alert tone="danger" title="Couldn’t load this page">
            <p>{error}</p>
          </Alert>
        </div>
      )}

      {/* The usual way in: they sign up, and are verified at the top of this page. */}
      <section className="card p-5 sm:p-6">
        <h2 className="flex items-center gap-2 font-display text-lg font-semibold text-ink-900">
          <UserPlus size={18} className="text-brand-700" /> Invite a partner
        </h2>
        <p className="mt-1 text-sm text-ink-600">
          Someone new, with no account yet? Send them the sign-up link. They create their account and confirm their
          email, then appear at the top of this page for you to verify.
        </p>
        <div className="mt-4 grid gap-3 lg:grid-cols-[14rem_minmax(0,1fr)] lg:items-end">
          <label className="block text-sm font-medium text-ink-800">
            They are a…
            <select
              value={inviteRole}
              onChange={(e) => setInviteRole(e.target.value as CommunityResource)}
              className="field mt-1.5 block w-full"
            >
              {(['mentors', ...GRANTED_RESOURCES] as CommunityResource[]).map((r) => (
                <option key={r} value={r}>
                  {PARTNER_WORD[r].replace(/^./, (c) => c.toUpperCase())}
                </option>
              ))}
            </select>
          </label>
          <InviteLink role={SIGNUP_ROLE[inviteRole]} />
        </div>
        {inviteRole === 'mentors' && (
          <p className="mt-3 text-xs text-ink-500">
            Nobody is a mentor until they have signed up, confirmed their email and been verified by the team. If they
            already have an account, add them under Community &gt; Mentors instead.
          </p>
        )}
      </section>

      <section className="card mt-6 p-5 sm:p-6">
        <h2 className="font-display text-lg font-semibold text-ink-900">Give access to an existing account</h2>
        <p className="mt-1 text-sm text-ink-600">
          For someone who already has an account and didn’t come through the sign-up. Each section is given separately;
          a person can hold more than one.
        </p>

        <div className="mt-4 grid gap-2 sm:grid-cols-2" role="radiogroup" aria-label="Who is this for">
          {(
            [
              { id: 'partner', icon: KeyRound, title: 'A partner', body: 'A counsellor, career guide, company or institution. They see only their own students.' },
              { id: 'team', icon: Eye, title: 'The MySkills team', body: 'A read-only overview of every student in a section, whoever they are working with.' },
            ] as const
          ).map(({ id, icon: Icon, title, body }) => (
            <button
              key={id}
              type="button"
              role="radio"
              aria-checked={who === id}
              onClick={() => pickWho(id)}
              className={`flex items-start gap-3 rounded-xl border p-3.5 text-left transition-colors ${
                who === id ? 'border-brand-500 bg-brand-50/60 ring-1 ring-brand-500/30' : 'border-ink-200 bg-white hover:bg-ink-50'
              }`}
            >
              <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${who === id ? 'bg-brand-600 text-white' : 'bg-ink-100 text-ink-600'}`}>
                <Icon size={15} />
              </span>
              <span className="min-w-0">
                <span className="block text-sm font-semibold text-ink-900">{title}</span>
                <span className="block text-xs leading-relaxed text-ink-600">{body}</span>
              </span>
            </button>
          ))}
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Input label="Their email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="name@example.com" />
          <label className="block text-sm font-medium text-ink-800">
            {overview ? 'Section to oversee' : 'Section'}
            <select
              value={resource}
              onChange={(e) => setResource(e.target.value as CommunityResource)}
              className="field mt-1.5 block w-full"
            >
              {((overview ? ['mentors', ...GRANTED_RESOURCES] : GRANTED_RESOURCES) as CommunityResource[]).map((r) => (
                <option key={r} value={r}>
                  {RESOURCE_LABEL[r]}
                </option>
              ))}
            </select>
          </label>
          {needsName && (
            <Input
              label={resource === 'internships' ? 'Company' : 'Institution'}
              value={organisation}
              onChange={(e) => setOrganisation(e.target.value)}
              placeholder={resource === 'internships' ? 'Acme Digital' : 'Institute name'}
              maxLength={160}
            />
          )}
          <div className="flex items-end">
            <Button icon={overview ? Eye : KeyRound} disabled={busy || !canGrant} onClick={() => void grant()}>
              {busy ? 'Saving…' : overview ? 'Give overview' : 'Give access'}
            </Button>
          </div>
        </div>

        {!overview && (
          <p className="mt-3 text-xs text-ink-500">
            Adding a mentor? Not here: invite them above and verify them when they appear, or add an existing account
            under Community &gt; Mentors.
          </p>
        )}

        {noAccount && (
          <div className="mt-4 rounded-xl bg-amber-50 p-4">
            <p className="text-sm font-semibold text-amber-900">{noAccount} doesn’t have an account yet</p>
            <p className="mt-0.5 text-sm text-amber-900/80">
              {overview
                ? 'A team member needs an account first. Ask them to sign up on the site with this email, then give the overview again.'
                : `Send them the sign-up link below. Once they’ve signed up and confirmed their email, they appear at the top of this page for you to verify, and that gives them access.`}
            </p>
            {!overview && (
              <div className="mt-3">
                <InviteLink role={SIGNUP_ROLE[resource]} email={noAccount} />
              </div>
            )}
          </div>
        )}
        {formError && <p className="mt-3 text-sm text-red-700">{formError}</p>}
      </section>

      <section className="mt-6">
        <h2 className="text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-500">Who has access</h2>
        {loading ? (
          <Skeleton className="mt-3 h-32 w-full" />
        ) : access.length === 0 ? (
          <div className="mt-3">
            <EmptyState icon={KeyRound} title="Nobody yet" description="Counsellors, career guides, companies and institutions you give access to appear here." />
          </div>
        ) : (
          <div className="card mt-3 overflow-x-auto">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead className="border-b border-ink-200 text-xs uppercase tracking-wide text-ink-500">
                <tr>
                  <th className="px-4 py-3 font-semibold">Person</th>
                  <th className="px-4 py-3 font-semibold">Resource</th>
                  <th className="px-4 py-3 font-semibold">Students now</th>
                  <th className="px-4 py-3 font-semibold">Sessions logged</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-ink-100">
                {access.map((a) => {
                  const key = `${a.user_id}:${a.resource}`
                  return (
                    <tr key={key}>
                      <td className="px-4 py-3">
                        <p className="font-medium text-ink-900">{a.organisation || a.full_name || '—'}</p>
                        <p className="text-xs text-ink-500">{a.email}</p>
                      </td>
                      <td className="px-4 py-3">
                        <Badge tone="brand">{RESOURCE_LABEL[a.resource]}</Badge>
                        {a.sees_all && <span className="ml-2 text-xs font-medium text-ink-500">sees everything</span>}
                      </td>
                      <td className="px-4 py-3 tabular-nums text-ink-800">{a.sees_all ? '—' : a.active}</td>
                      <td className="px-4 py-3 tabular-nums text-ink-800">{logsSessions(a.resource) && !a.sees_all ? a.sessions : '—'}</td>
                      <td className="px-4 py-3 text-right">
                        {confirm === key ? (
                          <span className="inline-flex items-center gap-2 text-xs text-ink-700">
                            Remove access?
                            <button type="button" disabled={busy} onClick={() => void revoke(a)} className="font-semibold text-red-700 hover:underline">
                              Yes
                            </button>
                            <button type="button" onClick={() => setConfirm(undefined)} className="font-medium text-ink-500 hover:underline">
                              No
                            </button>
                          </span>
                        ) : (
                          <button type="button" onClick={() => setConfirm(key)} className="text-xs font-semibold text-ink-600 hover:text-red-700">
                            Remove
                          </button>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="mt-8">
        <h2 className="text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-500">
          What students are using
        </h2>
        <p className="mt-1 text-sm text-ink-600">
          One row per student using at least one Community resource. Counselling and guidance show only whether it is
          under way and how many sessions were logged — never what was discussed.
        </p>
        {loading ? (
          <Skeleton className="mt-3 h-32 w-full" />
        ) : usage.length === 0 ? (
          <div className="mt-3">
            <EmptyState icon={Users} title="Nothing to show yet" description="Students appear here once they have a mentor, a counsellor or guide, or are with a partner organisation." />
          </div>
        ) : (
          <div className="card mt-3 overflow-x-auto">
            <table className="w-full min-w-[820px] text-left text-sm">
              <thead className="border-b border-ink-200 text-xs uppercase tracking-wide text-ink-500">
                <tr>
                  <th className="px-4 py-3 font-semibold">Student</th>
                  <th className="px-4 py-3 font-semibold">Mentors</th>
                  <th className="px-4 py-3 font-semibold">Wellness</th>
                  <th className="px-4 py-3 font-semibold">Career Guidance</th>
                  <th className="px-4 py-3 font-semibold">Internship</th>
                  <th className="px-4 py-3 font-semibold">Institution</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink-100">
                {usage.map((u) => (
                  <tr key={u.student_id}>
                    <td className="px-4 py-3">
                      <p className="font-medium text-ink-900">{u.full_name || '—'}</p>
                      <p className="text-xs text-ink-500">{u.email}</p>
                    </td>
                    <td className="px-4 py-3 text-ink-800">
                      {u.mentors ? (
                        <>
                          {u.mentors}
                          <span className="block text-xs text-ink-500">{u.mentor_sessions} sessions</span>
                        </>
                      ) : (
                        <span className="text-ink-400">—</span>
                      )}
                    </td>
                    <Support active={u.wellness_active} sessions={u.wellness_sessions} />
                    <Support active={u.guidance_active} sessions={u.guidance_sessions} />
                    <td className="px-4 py-3 text-ink-800">{u.internship || <span className="text-ink-400">—</span>}</td>
                    <td className="px-4 py-3 text-ink-800">{u.institution || <span className="text-ink-400">—</span>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </>
  )
}

function Support({ active, sessions }: { active: boolean; sessions: number }) {
  if (!active && sessions === 0) {
    return (
      <td className="px-4 py-3">
        <span className="text-ink-400">—</span>
      </td>
    )
  }
  return (
    <td className="px-4 py-3 text-ink-800">
      {active ? 'Under way' : 'Finished'}
      <span className="block text-xs text-ink-500">
        {sessions} {sessions === 1 ? 'session' : 'sessions'}
      </span>
    </td>
  )
}
