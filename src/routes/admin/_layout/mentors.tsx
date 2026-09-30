import { useCallback, useEffect, useState } from 'react'
import { errorMessage } from '@/lib/errors'
import { createFileRoute } from '@tanstack/react-router'
import { Check, Inbox, Link2, Mail, MapPin, Phone, Unlink, UserCheck, X } from 'lucide-react'
import {
  approveMentorApplication,
  fetchListedMentors,
  fetchMentorApplications,
  linkMentorAccount,
  rejectMentorApplication,
  unlinkMentorAccount,
  type ApplicationStatus,
  type ListedMentor,
  type MentorApplication,
} from '@/lib/mentors'
import { RequireSection } from '@/components/admin/AdminSectionGate'
import { Alert, Badge, Button, Chip, EmptyState, Input, PageHeader, Skeleton, Textarea } from '@/components/ui'

export const Route = createFileRoute('/admin/_layout/mentors')({
  component: () => (
    <RequireSection section="mentors">
      <MentorReviewQueue />
    </RequireSection>
  ),
})

const MISSING_LABEL: Record<string, string> = {
  bio: 'a bio',
  expertise: 'areas of expertise',
  linkedin: 'their LinkedIn',
  phone: 'a phone number',
}

const FILTERS: { label: string; value: ApplicationStatus | 'all' }[] = [
  { label: 'Pending', value: 'pending' },
  { label: 'Approved', value: 'approved' },
  { label: 'Rejected', value: 'rejected' },
  { label: 'All', value: 'all' },
]

const TONE: Record<ApplicationStatus, 'warning' | 'success' | 'danger'> = {
  pending: 'warning',
  approved: 'success',
  rejected: 'danger',
}

function ApplicationCard({
  app,
  onApprove,
  onReject,
  busy,
}: {
  app: MentorApplication
  onApprove: () => void
  onReject: (note: string) => void
  busy: boolean
}) {
  const [rejecting, setRejecting] = useState(false)
  const [note, setNote] = useState('')

  return (
    <article className="card p-5 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="font-display text-xl font-semibold text-ink-900">{app.full_name}</h2>
          <p className="mt-0.5 text-sm font-medium text-brand-600">{app.headline}</p>
        </div>
        <Badge tone={TONE[app.status]}>{app.status}</Badge>
      </div>

      <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-ink-600">{app.bio}</p>

      {app.expertise.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-1.5">
          {app.expertise.map((e) => (
            <span
              key={e}
              className="rounded-full border border-brand-200 bg-brand-50 px-3 py-1 text-xs font-medium text-brand-700"
            >
              {e}
            </span>
          ))}
        </div>
      )}

      <dl className="mt-5 grid gap-2 border-t border-ink-200 pt-4 text-sm sm:grid-cols-2">
        <div className="flex items-center gap-2 text-ink-700">
          <Mail size={14} className="shrink-0 text-ink-400" />
          <a href={`mailto:${app.email}`} className="truncate hover:text-brand-700">
            {app.email}
          </a>
        </div>
        {app.phone && (
          <div className="flex items-center gap-2 text-ink-700">
            <Phone size={14} className="shrink-0 text-ink-400" />
            {app.phone}
          </div>
        )}
        {app.location && (
          <div className="flex items-center gap-2 text-ink-700">
            <MapPin size={14} className="shrink-0 text-ink-400" />
            {app.location}
          </div>
        )}
        {app.linkedin_url && (
          <div className="flex items-center gap-2 text-ink-700">
            <Link2 size={14} className="shrink-0 text-ink-400" />
            <a
              href={app.linkedin_url}
              target="_blank"
              rel="noopener noreferrer"
              className="truncate hover:text-brand-700"
            >
              {app.linkedin_url.replace(/^https:\/\/(www\.)?linkedin\.com\//, '')}
            </a>
          </div>
        )}
      </dl>

      {app.motivation && (
        <div className="mt-4 rounded-xl bg-ink-100 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-ink-500">Motivation</p>
          <p className="mt-1.5 whitespace-pre-line text-sm leading-relaxed text-ink-700">
            {app.motivation}
          </p>
        </div>
      )}

      {app.review_note && (
        <p className="mt-4 text-xs text-ink-500">
          <span className="font-semibold">Note:</span> {app.review_note}
        </p>
      )}

      <div className="mt-5 flex flex-wrap items-center gap-2 border-t border-ink-200 pt-4">
        <p className="mr-auto text-xs text-ink-500">
          Applied {new Date(app.created_at).toLocaleDateString()}
        </p>

        {rejecting ? null : (
          <>
            {app.status !== 'approved' && (
              <Button size="sm" icon={Check} onClick={onApprove} disabled={busy}>
                {app.status === 'rejected' ? 'Approve instead' : 'Approve'}
              </Button>
            )}
            {app.status !== 'rejected' && (
              <Button
                size="sm"
                variant="secondary"
                icon={X}
                onClick={() => setRejecting(true)}
                disabled={busy}
              >
                Reject
              </Button>
            )}
          </>
        )}
      </div>

      {rejecting && (
        <div className="mt-3 space-y-3">
          <Textarea
            label="Reason (kept internal)"
            required={false}
            rows={2}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Not enough hands-on experience yet…"
          />
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="danger"
              disabled={busy}
              onClick={() => {
                onReject(note)
                setRejecting(false)
                setNote('')
              }}
            >
              Confirm reject
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setRejecting(false)} disabled={busy}>
              Cancel
            </Button>
          </div>
        </div>
      )}
    </article>
  )
}

/**
 * One published mentor. A listing only starts receiving student requests once
 * it's linked to the mentor's MySkills account, so an unlinked one carries a
 * warning and the form to fix it — that step used to be a hand-run SQL update.
 */
function ListedMentorCard({
  mentor,
  busy,
  onLink,
  onUnlink,
}: {
  mentor: ListedMentor
  busy: boolean
  onLink: (email: string) => void
  onUnlink: () => void
}) {
  const [email, setEmail] = useState('')
  const [confirming, setConfirming] = useState(false)

  return (
    <article className="card p-5 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="font-display text-xl font-semibold text-ink-900">{mentor.full_name}</h2>
          <p className="mt-0.5 text-sm font-medium text-brand-600">{mentor.headline}</p>
        </div>
        {mentor.linked ? (
          <div className="flex flex-wrap justify-end gap-1.5">
            <Badge tone="success" icon={Check}>
              Linked
            </Badge>
            {mentor.ready === false && <Badge tone="warning">Profile incomplete</Badge>}
            {mentor.ready && mentor.accepting === false && <Badge tone="neutral">Paused</Badge>}
          </div>
        ) : (
          <Badge tone="warning">Not linked yet</Badge>
        )}
      </div>

      {mentor.expertise.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {mentor.expertise.map((e) => (
            <span
              key={e}
              className="rounded-full border border-brand-200 bg-brand-50 px-3 py-1 text-xs font-medium text-brand-700"
            >
              {e}
            </span>
          ))}
        </div>
      )}

      {mentor.linked ? (
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl bg-ink-100 p-4">
          <p className="min-w-0 text-sm text-ink-700">
            <span className="text-ink-500">Account: </span>
            <span className="break-all font-medium text-ink-900">{mentor.account_email}</span>
            {mentor.account_name && <span className="text-ink-500"> · {mentor.account_name}</span>}
          </p>
          {mentor.ready === false && mentor.missing && mentor.missing.length > 0 && (
            <p className="w-full text-sm text-amber-800">
              Students can’t see them until they add: {mentor.missing.map((k) => MISSING_LABEL[k] ?? k).join(', ')}. They
              do this in their Mentor portal.
            </p>
          )}
          {confirming ? (
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="danger"
                disabled={busy}
                onClick={() => {
                  onUnlink()
                  setConfirming(false)
                }}
              >
                Confirm unlink
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setConfirming(false)} disabled={busy}>
                Cancel
              </Button>
            </div>
          ) : (
            <Button size="sm" variant="secondary" icon={Unlink} onClick={() => setConfirming(true)} disabled={busy}>
              Unlink
            </Button>
          )}
        </div>
      ) : (
        <form
          className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-4"
          onSubmit={(e) => {
            e.preventDefault()
            if (email.trim()) onLink(email)
          }}
        >
          <p className="text-sm text-amber-900">
            Students can’t ask this mentor yet, and they don’t get a My students page. Link the account they signed
            up to MySkills with.
          </p>
          <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-start">
            <div className="min-w-0 flex-1">
              <Input
                type="email"
                required={false}
                aria-label={`MySkills account email for ${mentor.full_name}`}
                placeholder="Their sign-up email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <Button type="submit" icon={Link2} disabled={busy || !email.trim()}>
              {busy ? 'Linking…' : 'Link account'}
            </Button>
          </div>
        </form>
      )}
    </article>
  )
}

function ListedMentors({
  mentors,
  loading,
  busyId,
  onLink,
  onUnlink,
}: {
  mentors: ListedMentor[]
  loading: boolean
  busyId?: string
  onLink: (id: string, email: string) => void
  onUnlink: (id: string) => void
}) {
  if (loading && mentors.length === 0) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-40 w-full" />
      </div>
    )
  }
  if (mentors.length === 0) {
    return (
      <EmptyState
        icon={UserCheck}
        title="No mentors are listed yet"
        description="Approve an application and the mentor will appear here."
      />
    )
  }
  // Unlinked first: those are the ones that need something done.
  const ordered = [...mentors].sort((a, b) => Number(a.linked) - Number(b.linked))
  return (
    <div className="space-y-4">
      {ordered.map((m) => (
        <ListedMentorCard
          key={m.id}
          mentor={m}
          busy={busyId === m.id}
          onLink={(email) => onLink(m.id, email)}
          onUnlink={() => onUnlink(m.id)}
        />
      ))}
    </div>
  )
}

function MentorReviewQueue() {
  const [tab, setTab] = useState<'applications' | 'listed'>('applications')
  const [filter, setFilter] = useState<ApplicationStatus | 'all'>('pending')
  const [apps, setApps] = useState<MentorApplication[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string>()
  const [busyId, setBusyId] = useState<string>()

  // Loaded on its own so a missing linking SQL can't break the applications tab.
  const [listed, setListed] = useState<ListedMentor[]>([])
  const [listedLoading, setListedLoading] = useState(true)
  const [listedError, setListedError] = useState<string>()
  const unlinked = listed.filter((m) => !m.linked).length

  const load = useCallback(async () => {
    setLoading(true)
    setError(undefined)
    try {
      setApps(await fetchMentorApplications(filter === 'all' ? undefined : filter))
    } catch (e) {
      setError(errorMessage(e))
    } finally {
      setLoading(false)
    }
  }, [filter])

  const loadListed = useCallback(async () => {
    try {
      setListed(await fetchListedMentors())
      setListedError(undefined)
    } catch (e) {
      setListedError(errorMessage(e))
    } finally {
      setListedLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  useEffect(() => {
    void loadListed()
  }, [loadListed])

  async function act(id: string, run: () => Promise<void>) {
    setBusyId(id)
    setError(undefined)
    try {
      await run()
      // An approval or rejection changes who is listed.
      await Promise.all([load(), loadListed()])
    } catch (e) {
      setError(errorMessage(e))
    } finally {
      setBusyId(undefined)
    }
  }

  async function actListed(id: string, run: () => Promise<void>) {
    setBusyId(id)
    setListedError(undefined)
    try {
      await run()
      await loadListed()
    } catch (e) {
      setListedError(errorMessage(e))
    } finally {
      setBusyId(undefined)
    }
  }

  return (
    <>
      <PageHeader
        eyebrow="Admin"
        title="Mentors"
        subtitle="Approve applications to publish a mentor, then link their MySkills account so students can ask them."
      />

      <div role="tablist" aria-label="Mentors" className="mb-5 flex gap-1 border-b border-ink-200">
        {(
          [
            { key: 'applications', label: 'Applications', count: 0 },
            { key: 'listed', label: 'Listed mentors', count: unlinked },
          ] as const
        ).map((t) => (
          <button
            key={t.key}
            type="button"
            role="tab"
            aria-selected={tab === t.key}
            onClick={() => setTab(t.key)}
            className={`-mb-px inline-flex items-center gap-2 border-b-2 px-4 py-2.5 text-sm font-semibold transition-colors ${
              tab === t.key
                ? 'border-brand-600 text-brand-700'
                : 'border-transparent text-ink-500 hover:text-ink-900'
            }`}
          >
            {t.label}
            {t.count > 0 && (
              <span
                className="rounded-full bg-amber-500 px-1.5 py-0.5 text-[11px] font-bold leading-none text-white"
                title={`${t.count} not linked yet`}
              >
                {t.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {tab === 'listed' ? (
        <>
          {listedError && (
            <div className="mb-5">
              <Alert tone="danger" title="Something went wrong">
                <p>{listedError}</p>
              </Alert>
            </div>
          )}
          <ListedMentors
            mentors={listed}
            loading={listedLoading}
            busyId={busyId}
            onLink={(id, email) => void actListed(id, () => linkMentorAccount(id, email))}
            onUnlink={(id) => void actListed(id, () => unlinkMentorAccount(id))}
          />
        </>
      ) : (
        <>
          {unlinked > 0 && (
            <button
              type="button"
              onClick={() => setTab('listed')}
              className="mb-5 flex w-full items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-left text-sm text-amber-900 hover:bg-amber-100"
            >
              <UserCheck size={16} className="shrink-0" />
              <span>
                <strong>{unlinked}</strong> listed {unlinked === 1 ? 'mentor isn’t' : 'mentors aren’t'} linked to an
                account yet, so students can’t ask them. Link now →
              </span>
            </button>
          )}

          <div className="mb-5 flex flex-wrap gap-2">
            {FILTERS.map((f) => (
              <Chip key={f.value} active={filter === f.value} onClick={() => setFilter(f.value)}>
                {f.label}
              </Chip>
            ))}
          </div>

          {error && (
            <div className="mb-5">
              <Alert tone="danger" title="Something went wrong">
                <p>{error}</p>
              </Alert>
            </div>
          )}

          {loading ? (
            <div className="space-y-4">
              <Skeleton className="h-52 w-full" />
              <Skeleton className="h-52 w-full" />
            </div>
          ) : apps.length === 0 ? (
            <EmptyState
              icon={Inbox}
              title={filter === 'pending' ? 'Nothing to review' : 'No applications here'}
              description={
                filter === 'pending'
                  ? 'New mentor applications will appear here as they come in.'
                  : 'Try a different filter.'
              }
            />
          ) : (
            <div className="space-y-4">
              {apps.map((app) => (
                <ApplicationCard
                  key={app.id}
                  app={app}
                  busy={busyId === app.id}
                  onApprove={() => act(app.id, () => approveMentorApplication(app.id))}
                  onReject={(note) => act(app.id, () => rejectMentorApplication(app.id, note))}
                />
              ))}
            </div>
          )}
        </>
      )}
    </>
  )
}
