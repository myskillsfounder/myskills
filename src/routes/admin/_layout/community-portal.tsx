import { useEffect, useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { KeyRound, Users } from 'lucide-react'
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
  type CommunityUsage,
  type GrantedResource,
} from '@/lib/communityPortal'
import { RequireAdmin } from '@/components/admin/AdminSectionGate'
import { Alert, Badge, Button, EmptyState, Input, PageHeader, Skeleton } from '@/components/ui'

// Admins only: this decides who can open which part of the Community portal,
// and shows which students are using which resource.
export const Route = createFileRoute('/admin/_layout/community-portal')({
  component: () => (
    <RequireAdmin>
      <CommunityPortalAdminPage />
    </RequireAdmin>
  ),
})

const needsOrganisation = (r: GrantedResource) => !LOGS_SESSIONS[r]

function CommunityPortalAdminPage() {
  const [access, setAccess] = useState<AdminCommunityAccess[]>([])
  const [usage, setUsage] = useState<CommunityUsage[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string>()

  const [email, setEmail] = useState('')
  const [resource, setResource] = useState<GrantedResource>('wellness')
  const [organisation, setOrganisation] = useState('')
  const [busy, setBusy] = useState(false)
  const [formError, setFormError] = useState<string>()
  const [confirm, setConfirm] = useState<string>()

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
    try {
      await grantCommunityAccess(email, resource, needsOrganisation(resource) ? organisation : '')
      setEmail('')
      setOrganisation('')
      await load()
    } catch (e) {
      setFormError(errorMessage(e))
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
    /^\S+@\S+\.\S+$/.test(email.trim()) && (!needsOrganisation(resource) || organisation.trim().length >= 2)

  return (
    <>
      <PageHeader
        eyebrow="Community"
        title="Portal access & usage"
        subtitle="Who can open each part of the Community portal, and which students are using which resource. Mentors get access by being linked to a mentor listing (Community > Mentors)."
      />

      {error && (
        <div className="mb-5">
          <Alert tone="danger" title="Couldn’t load this page">
            <p>{error}</p>
          </Alert>
        </div>
      )}

      <section className="card p-5 sm:p-6">
        <h2 className="font-display text-lg font-semibold text-ink-900">Give someone access</h2>
        <p className="mt-1 text-sm text-ink-600">
          They need a MySkills account first (they can create one at the Community portal sign-in). Each resource is
          granted separately; a person can hold more than one.
        </p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Input label="Their email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="name@example.com" />
          <label className="block text-sm font-medium text-ink-800">
            Resource
            <select
              value={resource}
              onChange={(e) => setResource(e.target.value as GrantedResource)}
              className="field mt-1.5 block w-full"
            >
              {GRANTED_RESOURCES.map((r) => (
                <option key={r} value={r}>
                  {RESOURCE_LABEL[r]}
                </option>
              ))}
            </select>
          </label>
          {needsOrganisation(resource) && (
            <Input
              label={resource === 'internships' ? 'Company' : 'Institution'}
              value={organisation}
              onChange={(e) => setOrganisation(e.target.value)}
              placeholder={resource === 'internships' ? 'Acme Digital' : 'Institute name'}
              maxLength={160}
            />
          )}
          <div className="flex items-end">
            <Button icon={KeyRound} disabled={busy || !canGrant} onClick={() => void grant()}>
              {busy ? 'Saving…' : 'Give access'}
            </Button>
          </div>
        </div>
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
                      </td>
                      <td className="px-4 py-3 tabular-nums text-ink-800">{a.active}</td>
                      <td className="px-4 py-3 tabular-nums text-ink-800">{LOGS_SESSIONS[a.resource] ? a.sessions : '—'}</td>
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
