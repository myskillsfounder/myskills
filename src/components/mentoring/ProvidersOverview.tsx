import { useEffect, useState } from 'react'
import { Mail } from 'lucide-react'
import {
  fetchCommunityMentors,
  fetchCommunityProviders,
  type CommunityMentor,
  type CommunityProvider,
  type GrantedResource,
} from '@/lib/communityPortal'
import { Avatar, Badge, Skeleton } from '@/components/ui'

const plural = (n: number, one: string, many = `${one}s`) => `${n} ${n === 1 ? one : many}`
const day = (iso: string) =>
  new Date(`${iso}T00:00:00`).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })

const HEADING: Record<'mentors' | GrantedResource, string> = {
  mentors: 'Mentors',
  wellness: 'Counsellors',
  guidance: 'Career guides',
  internships: 'Partner companies',
  institutions: 'Partner institutions',
}

const EMPTY: Record<'mentors' | GrantedResource, string> = {
  mentors: 'No mentors are listed yet.',
  wellness: 'No counsellors have been given access yet. Add them in Admin > Community > Portal access.',
  guidance: 'No career guides have been given access yet. Add them in Admin > Community > Portal access.',
  internships: 'No companies have been given access yet. Add them in Admin > Community > Portal access.',
  institutions: 'No institutions have been given access yet. Add them in Admin > Community > Portal access.',
}

/** The numbers under each provider's name: who they are working with. */
function Counts({ active, sessions, waiting, ended }: { active: number; sessions?: number; waiting?: number; ended?: number }) {
  return (
    <div className="mt-3 flex flex-wrap items-baseline gap-x-4 gap-y-1 border-t border-ink-900/[0.06] pt-3">
      <p className="font-display text-2xl font-semibold tabular-nums text-ink-900">
        {active}
        <span className="ml-1.5 text-xs font-medium text-ink-500">active</span>
      </p>
      <p className="text-xs text-ink-500">
        {waiting ? `${waiting} waiting · ` : ''}
        {ended ? `${ended} finished · ` : ''}
        {plural(sessions ?? 0, 'session')} logged
      </p>
    </div>
  )
}

function MentorCard({ m }: { m: CommunityMentor }) {
  const status = !m.linked
    ? { label: 'No account linked', tone: 'neutral' as const }
    : !m.ready
      ? { label: 'Profile incomplete', tone: 'warning' as const }
      : m.accepting
        ? { label: 'Accepting students', tone: 'success' as const }
        : { label: 'Not accepting', tone: 'neutral' as const }
  return (
    <li className="card p-4 sm:p-5">
      <div className="flex items-start gap-3">
        <Avatar name={m.full_name} src={m.avatar_url ?? undefined} size={44} />
        <div className="min-w-0 flex-1">
          <p className="truncate font-display text-lg font-semibold text-ink-900">{m.full_name}</p>
          <p className="truncate text-sm text-brand-700">{m.headline}</p>
        </div>
        <Badge tone={status.tone}>{status.label}</Badge>
      </div>
      {m.expertise.length > 0 && (
        <p className="mt-2 truncate text-xs text-ink-500">{m.expertise.slice(0, 4).join(' · ')}</p>
      )}
      <Counts active={m.active} waiting={m.waiting} ended={m.ended} sessions={m.sessions} />
    </li>
  )
}

function ProviderCard({ p }: { p: CommunityProvider }) {
  const name = p.organisation || p.full_name || p.email || 'Account'
  return (
    <li className="card p-4 sm:p-5">
      <div className="flex items-start gap-3">
        <Avatar name={name} size={44} />
        <div className="min-w-0 flex-1">
          <p className="truncate font-display text-lg font-semibold text-ink-900">{name}</p>
          {p.organisation && p.full_name && <p className="truncate text-sm text-ink-600">{p.full_name}</p>}
          {p.email && (
            <a href={`mailto:${p.email}`} className="mt-0.5 inline-flex items-center gap-1.5 text-xs text-ink-500 hover:text-brand-700">
              <Mail size={12} /> {p.email}
            </a>
          )}
        </div>
        <Badge tone="success">Has access</Badge>
      </div>
      <p className="mt-2 text-xs text-ink-500">
        Since {day(p.since)}
        {p.last_session && ` · last session ${day(p.last_session)}`}
      </p>
      <Counts active={p.active} ended={p.ended} sessions={p.sessions} />
    </li>
  )
}

/**
 * The people and organisations behind a section, for an overview account:
 * every mentor, counsellor, career guide, company or institution, with their
 * status and how many students are active with each. It sits above the student
 * list so a section is never empty just because nobody has a student yet.
 * Stays out of the way (renders nothing) if the SQL for it hasn't been run.
 */
export function ProvidersOverview({ resource }: { resource: 'mentors' | GrantedResource }) {
  const [mentors, setMentors] = useState<CommunityMentor[] | null>(null)
  const [providers, setProviders] = useState<CommunityProvider[] | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true
    setLoading(true)
    const load =
      resource === 'mentors'
        ? fetchCommunityMentors().then((r) => active && setMentors(r))
        : fetchCommunityProviders(resource).then((r) => active && setProviders(r))
    load.finally(() => active && setLoading(false))
    return () => {
      active = false
    }
  }, [resource])

  if (loading) return <Skeleton className="h-36 w-full" />
  const list = resource === 'mentors' ? mentors : providers
  // null: the SQL isn't there yet, so say nothing.
  if (list === null) return null

  return (
    <section>
      <h2 className="text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-500">
        {HEADING[resource]} · {list.length}
      </h2>
      {list.length === 0 ? (
        <p className="card mt-2 p-5 text-sm text-ink-600">{EMPTY[resource]}</p>
      ) : (
        <ul className="mt-2 grid gap-3 sm:grid-cols-2">
          {resource === 'mentors'
            ? (mentors ?? []).map((m) => <MentorCard key={m.id} m={m} />)
            : (providers ?? []).map((p) => <ProviderCard key={p.user_id} p={p} />)}
        </ul>
      )}
    </section>
  )
}
