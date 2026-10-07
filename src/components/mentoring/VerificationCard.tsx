import { BadgeCheck, Check, Clock, Mail, PauseCircle, ShieldCheck, type LucideIcon } from 'lucide-react'
import { RESOURCE_LABEL, type CommunityAccess } from '@/lib/communityPortal'
import type { MyMentorProfile } from '@/lib/mentorPortal'
import type { MyPortalRequest } from '@/lib/portalAccess'

const day = (iso: string) =>
  new Date(iso).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })

type Tone = 'done' | 'wait' | 'paused'

function Row({ icon: Icon, tone, title, detail }: { icon: LucideIcon; tone: Tone; title: string; detail: string }) {
  const tones: Record<Tone, string> = {
    done: 'bg-emerald-50 text-emerald-700',
    wait: 'bg-amber-50 text-amber-700',
    paused: 'bg-ink-100 text-ink-600',
  }
  return (
    <li className="flex items-start gap-3">
      <span className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${tones[tone]}`}>
        <Icon size={14} strokeWidth={2.5} />
      </span>
      <div className="min-w-0">
        <p className="text-sm font-semibold text-ink-900">{title}</p>
        <p className="break-words text-xs leading-relaxed text-ink-600">{detail}</p>
      </div>
    </li>
  )
}

/**
 * Where this account's verification stands, and what it opens. Anyone who can
 * see this page has been verified (the portal shows nothing else until then),
 * so this is the proof of it: the confirmed email, who verified them and when,
 * what they were verified as, and, for a mentor, whether students can see and
 * ask them right now.
 */
export function VerificationCard({
  email,
  mentor,
  access,
  request,
}: {
  email?: string
  mentor: MyMentorProfile | null
  access: CommunityAccess[]
  /** Their sign-up request, when they came in through the sign-up. */
  request: MyPortalRequest | null
}) {
  const roles = [
    ...(mentor ? ['Mentor'] : []),
    ...access
      .filter((a) => !(a.resource === 'mentors' && mentor))
      .map((a) => (a.sees_all ? `${RESOURCE_LABEL[a.resource]} · overview` : RESOURCE_LABEL[a.resource])),
  ]
  const organisation = access.find((a) => a.organisation)?.organisation ?? request?.organisation
  const verifiedOn = request?.status === 'approved' && request.reviewed_at ? day(request.reviewed_at) : null

  return (
    <section className="card overflow-hidden">
      <div className="flex flex-wrap items-center gap-4 bg-emerald-50/70 p-5 sm:p-6">
        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-600 text-white shadow-e1">
          <ShieldCheck size={24} />
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="font-display text-lg font-semibold text-ink-900">Verified partner</h2>
          <p className="text-sm text-ink-600">
            {organisation ? `${organisation} · ` : ''}
            {roles.join(' · ')}
          </p>
        </div>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-600/20">
          <BadgeCheck size={14} />
          Verified
        </span>
      </div>

      <ul className="grid gap-4 p-5 sm:grid-cols-2 sm:p-6">
        <Row icon={Mail} tone="done" title="Email confirmed" detail={email ?? 'The address you sign in with.'} />
        <Row
          icon={Check}
          tone="done"
          title="Verified by the MySkills team"
          detail={
            verifiedOn
              ? `Approved on ${verifiedOn}.`
              : request
                ? 'Your request was checked and approved by a real person.'
                : 'Your account was set up and checked by the team.'
          }
        />
        {mentor &&
          (mentor.ready ? (
            <Row
              icon={BadgeCheck}
              tone="done"
              title="Shown in Community"
              detail="Students see your card with a verified tick beside your name."
            />
          ) : (
            <Row
              icon={Clock}
              tone="wait"
              title="Profile not finished"
              detail="Students can’t see or ask you yet. Finish and save the items below and your card goes live."
            />
          ))}
        {mentor &&
          mentor.ready &&
          (mentor.accepting ? (
            <Row icon={Check} tone="done" title="Taking new students" detail="Students can send you a request from Practice." />
          ) : (
            <Row
              icon={PauseCircle}
              tone="paused"
              title="Paused"
              detail="Students still see your card but can’t send new requests."
            />
          ))}
      </ul>
    </section>
  )
}
