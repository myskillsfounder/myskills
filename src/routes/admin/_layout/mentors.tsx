import { useCallback, useEffect, useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { BadgeCheck, Check, Mail, MailCheck, Pencil, ShieldCheck, Trash2, UserCheck, UserPlus } from 'lucide-react'
import { errorMessage } from '@/lib/errors'
import {
  fetchListedMentors,
  fetchMentorApplications,
  removeMentor,
  type ListedMentor,
  type MentorApplication,
} from '@/lib/mentors'
import { useStaffAccessContext } from '@/lib/staffAccess'
import { RequireSection } from '@/components/admin/AdminSectionGate'
import { InviteLink } from '@/components/admin/InviteLink'
import { MentorEditor } from '@/components/admin/MentorEditor'
import { PortalRequestsPanel } from '@/components/admin/PortalRequestsPanel'
import { Alert, Badge, Button, EmptyState, PageHeader, Skeleton } from '@/components/ui'

/**
 * Mentors — and the one way to become one. A mentor is an account with a
 * confirmed email that the team has verified (docs/supabase-mentors-verified-only.sql).
 * This page is where that verification happens and where mentors are looked
 * after; there is no application to approve and no listing to link any more.
 */
export const Route = createFileRoute('/admin/_layout/mentors')({
  component: () => (
    <RequireSection section="mentors">
      <MentorsPage />
    </RequireSection>
  ),
})

const MISSING_LABEL: Record<string, string> = {
  headline: 'a professional title',
  bio: 'a bio',
  expertise: 'areas of expertise',
  linkedin: 'their LinkedIn',
  phone: 'a phone number',
}

/** The only route to being a mentor, so nobody has to remember it. */
function TheRule() {
  const steps = [
    { icon: UserPlus, title: 'Signs up', body: 'At the Community portal, as a mentor.' },
    { icon: MailCheck, title: 'Confirms their email', body: 'With the code we send them.' },
    { icon: ShieldCheck, title: 'Verified by the team', body: 'Here. This is what makes them a mentor.' },
    { icon: BadgeCheck, title: 'Finishes their profile', body: 'Then students can see and ask them.' },
  ]
  return (
    <ol className="mb-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {steps.map(({ icon: Icon, title, body }, i) => (
        <li key={title} className="flex items-start gap-3 rounded-2xl border border-ink-900/[0.07] bg-white p-4">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-700">
            <Icon size={17} />
          </span>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-ink-900">
              {i + 1}. {title}
            </p>
            <p className="text-xs leading-relaxed text-ink-600">{body}</p>
          </div>
        </li>
      ))}
    </ol>
  )
}

/** Inviting a mentor: the link for someone new, or for someone who already has
 *  an account. Both lead to the same place: the queue at the top of this page. */
function InviteMentor() {
  return (
    <section className="card p-5 sm:p-6">
      <h2 className="flex items-center gap-2 font-display text-lg font-semibold text-ink-900">
        <UserPlus size={18} className="text-brand-700" /> Invite a mentor
      </h2>
      <p className="mt-1 text-sm text-ink-600">
        Nobody is made a mentor directly. Whoever they are, they ask, and you verify them at the top of this page.
      </p>

      <div className="mt-4 grid gap-6 lg:grid-cols-2">
        <div>
          <p className="text-sm font-semibold text-ink-900">They don’t have an account</p>
          <p className="mt-0.5 text-sm text-ink-600">
            Send the sign-up link. Once they’ve signed up and confirmed their email, they appear here to verify.
          </p>
          <div className="mt-3">
            <InviteLink role="mentor" />
          </div>
        </div>

        <div className="lg:border-l lg:border-ink-900/[0.06] lg:pl-6">
          <p className="text-sm font-semibold text-ink-900">They already have a MySkills account</p>
          <p className="mt-0.5 text-sm text-ink-600">
            Send the portal sign-in. They sign in with the account they have, choose Mentor, and appear here to verify.
            They can’t sign up again with the same email.
          </p>
          <div className="mt-3">
            <InviteLink existing />
          </div>
        </div>
      </div>
    </section>
  )
}

function MentorCard({ mentor, busy, onRemove, onEdited }: { mentor: ListedMentor; busy: boolean; onRemove: () => void; onEdited: () => void }) {
  const [editing, setEditing] = useState(false)
  const [confirming, setConfirming] = useState(false)
  const live = mentor.linked && mentor.ready && mentor.accepting !== false

  return (
    <article className="card p-5 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="font-display text-xl font-semibold text-ink-900">{mentor.full_name}</h3>
          <p className="mt-0.5 text-sm font-medium text-brand-600">{mentor.headline}</p>
          {mentor.account_email && (
            <p className="mt-1 inline-flex items-center gap-1.5 break-all text-sm text-ink-600">
              <Mail size={13} className="shrink-0" /> {mentor.account_email}
            </p>
          )}
        </div>
        <div className="flex flex-wrap items-center justify-end gap-1.5">
          {!mentor.linked ? (
            <Badge tone="danger">No account · not shown to students</Badge>
          ) : live ? (
            <Badge tone="success" icon={Check}>
              Live for students
            </Badge>
          ) : mentor.ready ? (
            <Badge tone="neutral">Paused</Badge>
          ) : (
            <Badge tone="warning">Profile not finished</Badge>
          )}
        </div>
      </div>

      {!mentor.linked ? (
        <p className="mt-3 rounded-xl bg-red-50 p-3 text-sm text-red-900">
          Left over from the old way of adding mentors: nobody has signed up as this person, so students no longer see
          them. Remove this, then invite them to sign up.
        </p>
      ) : (
        mentor.ready === false && (
          <p className="mt-3 rounded-xl bg-amber-50 p-3 text-sm text-amber-900">
            Verified, but students can’t see them yet. They still need to add{' '}
            {mentor.missing && mentor.missing.length > 0
              ? mentor.missing.map((k) => MISSING_LABEL[k] ?? k).join(', ')
              : 'the rest of their profile'}{' '}
            in their Community portal.
          </p>
        )
      )}

      {mentor.expertise.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {mentor.expertise.map((e) => (
            <span key={e} className="rounded-full border border-brand-200 bg-brand-50 px-3 py-1 text-xs font-medium text-brand-700">
              {e}
            </span>
          ))}
        </div>
      )}

      {editing ? (
        <MentorEditor
          mentorId={mentor.id}
          onCancel={() => setEditing(false)}
          onSaved={() => {
            setEditing(false)
            onEdited()
          }}
        />
      ) : confirming ? (
        <div className="mt-4 flex flex-wrap items-center gap-3 rounded-xl bg-red-50 p-3">
          <p className="min-w-0 flex-1 text-sm text-red-900">
            Remove {mentor.full_name} as a mentor? Their card and their mentor section go; their account stays. This
            can’t be undone.
          </p>
          <Button size="sm" variant="danger" disabled={busy} onClick={onRemove}>
            {busy ? 'Removing…' : 'Yes, remove'}
          </Button>
          <Button size="sm" variant="ghost" disabled={busy} onClick={() => setConfirming(false)}>
            Keep
          </Button>
        </div>
      ) : (
        <div className="mt-4 flex flex-wrap gap-2 border-t border-ink-900/[0.06] pt-4">
          {mentor.linked && (
            <Button size="sm" variant="secondary" icon={Pencil} onClick={() => setEditing(true)}>
              Edit profile
            </Button>
          )}
          <Button size="sm" variant="ghost" icon={Trash2} onClick={() => setConfirming(true)}>
            Remove
          </Button>
        </div>
      )}
    </article>
  )
}

/** People who applied through the retired form and never got an answer: not
 *  a way in any more, just a list of who to invite. Gone once there are none. */
function EarlierApplications({ apps }: { apps: MentorApplication[] }) {
  if (apps.length === 0) return null
  return (
    <section className="mt-8">
      <h2 className="text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-500">
        Applied through the old form · {apps.length}
      </h2>
      <p className="mt-1 text-sm text-ink-600">
        That form is retired and an application no longer makes anyone a mentor. Email them the sign-up link instead.
      </p>
      <ul className="mt-3 space-y-2">
        {apps.map((a) => (
          <li key={a.id} className="card p-4">
            <p className="font-semibold text-ink-900">
              {a.full_name} <span className="font-normal text-ink-500">· {a.headline}</span>
            </p>
            <p className="break-all text-sm text-ink-600">{a.email}</p>
            <div className="mt-2.5">
              <InviteLink role="mentor" email={a.email} />
            </div>
          </li>
        ))}
      </ul>
    </section>
  )
}

function MentorsPage() {
  const { isAdmin, sections } = useStaffAccessContext()
  // Verifying a sign-up belongs to Portal access & usage; show it here too for anyone who has both.
  const canVerify = isAdmin === true || (sections?.includes('portal-access') ?? false)

  const [mentors, setMentors] = useState<ListedMentor[]>([])
  const [apps, setApps] = useState<MentorApplication[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string>()
  const [busyId, setBusyId] = useState<string>()

  const load = useCallback(async () => {
    try {
      setMentors(await fetchListedMentors())
      setError(undefined)
    } catch (e) {
      setError(errorMessage(e))
    } finally {
      setLoading(false)
    }
    // Only as a list of who to invite: never a reason for the page to fail.
    fetchMentorApplications('pending').then(setApps, () => setApps([]))
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  async function remove(id: string) {
    setBusyId(id)
    setError(undefined)
    try {
      await removeMentor(id)
      await load()
    } catch (e) {
      setError(errorMessage(e))
    } finally {
      setBusyId(undefined)
    }
  }

  // The ones needing something first: no account, then an unfinished profile.
  const rank = (m: ListedMentor) => (!m.linked ? 0 : m.ready === false ? 1 : 2)
  const ordered = [...mentors].sort((a, b) => rank(a) - rank(b))
  const live = mentors.filter((m) => m.linked && m.ready && m.accepting !== false).length

  return (
    <>
      <PageHeader
        eyebrow="Community"
        title="Mentors"
        subtitle="A mentor is someone with a confirmed email whom the team has verified. Nothing else makes a mentor."
      />

      <TheRule />

      {canVerify ? (
        <PortalRequestsPanel only="mentor" onChanged={() => void load()} />
      ) : (
        <p className="mb-6 rounded-xl bg-ink-100 p-3 text-sm text-ink-700">
          Mentors who have signed up are verified under Community &gt; Portal access &amp; usage, which isn’t part of your
          access.
        </p>
      )}

      <InviteMentor />

      {error && (
        <div className="mt-5">
          <Alert tone="danger" title="Something went wrong">
            <p>{error}</p>
          </Alert>
        </div>
      )}

      <h2 className="mb-3 mt-8 flex items-center gap-2 font-display text-lg font-semibold text-ink-900">
        <UserCheck size={18} className="text-ink-500" /> Mentors · {mentors.length}
        {mentors.length > 0 && <span className="text-sm font-normal text-ink-500">({live} live for students)</span>}
      </h2>
      {loading ? (
        <div className="space-y-4">
          <Skeleton className="h-36 w-full" />
          <Skeleton className="h-36 w-full" />
        </div>
      ) : mentors.length === 0 ? (
        <EmptyState
          icon={UserCheck}
          title="No mentors yet"
          description="Invite a mentor above. Once they have asked and you have verified them, they appear here."
        />
      ) : (
        <div className="space-y-4">
          {ordered.map((m) => (
            <MentorCard key={m.id} mentor={m} busy={busyId === m.id} onRemove={() => void remove(m.id)} onEdited={() => void load()} />
          ))}
        </div>
      )}

      <EarlierApplications apps={apps} />
    </>
  )
}
