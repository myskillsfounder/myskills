import { useEffect, useState } from 'react'
import { createFileRoute, Link } from '@tanstack/react-router'
import { ArrowLeft, BadgeCheck, MapPin, Sparkles, UserPlus, Users } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { fetchMentors, type Mentor } from '@/lib/mentors'
import { requireOnboarded } from '@/lib/guards'
import { AppShell } from '@/components/app/AppShell'
import { Alert, EmptyState, Skeleton } from '@/components/ui'

// The parent /community layout allows signed-out visitors through (its index
// page is a public marketing page), so this leaf needs its own guard to stay
// authenticated-only — it renders inside AppShell, which assumes a session.
export const Route = createFileRoute('/community/mentors')({
  beforeLoad: requireOnboarded,
  component: MentorsPage,
})

function LinkedInIcon({ size = 16, className }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className={className}>
      <path d="M20.45 20.45h-3.56v-5.57c0-1.33-.02-3.04-1.85-3.04-1.85 0-2.14 1.45-2.14 2.94v5.67H9.34V9h3.42v1.56h.05c.48-.9 1.64-1.85 3.37-1.85 3.6 0 4.27 2.37 4.27 5.46v6.28zM5.34 7.43a2.07 2.07 0 1 1 0-4.14 2.07 2.07 0 0 1 0 4.14zM7.12 20.45H3.55V9h3.57v11.45zM22.22 0H1.77C.79 0 0 .77 0 1.73v20.54C0 23.22.79 24 1.77 24h20.45c.98 0 1.78-.78 1.78-1.73V1.73C24 .77 23.2 0 22.22 0z" />
    </svg>
  )
}

interface DbProfile {
  full_name: string | null
  headline: string | null
  avatar_url: string | null
  location: string | null
  skills: string[] | null
}

const initialsOf = (name: string) =>
  name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join('')

/**
 * A mentor who is also a platform user keeps their card in sync with their own
 * profile, so editing it in-app updates the listing without an admin round trip.
 */
function MentorCard({ mentor, db }: { mentor: Mentor; db?: DbProfile }) {
  const name = db?.full_name?.trim() || mentor.full_name
  const role = db?.headline?.trim() || mentor.headline
  const avatar = db?.avatar_url || mentor.avatar_url
  const location = db?.location?.trim() || mentor.location
  const expertise = db?.skills?.length ? db.skills : mentor.expertise

  return (
    <div className="rounded-2xl card p-6 shadow-sm">
      <div className="flex items-start gap-4">
        {avatar ? (
          <img src={avatar} alt={name} className="h-20 w-20 shrink-0 rounded-full object-cover ring-2 ring-brand-100" />
        ) : (
          <span className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full bg-brand-600 text-2xl font-semibold text-white">
            {initialsOf(name)}
          </span>
        )}
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <h2 className="font-display text-2xl font-semibold tracking-tight text-ink-900">{name}</h2>
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-700">
              <BadgeCheck size={12} /> Verified
            </span>
          </div>
          <p className="mt-0.5 text-sm font-medium text-brand-600">{role}</p>
          {location && (
            <p className="mt-1 inline-flex items-center gap-1 text-xs text-ink-500">
              <MapPin size={12} /> {location}
            </p>
          )}
        </div>
      </div>

      <p className="mt-4 text-sm leading-relaxed text-ink-600">{mentor.bio}</p>

      {expertise.length > 0 && (
        <div className="mt-5">
          <p className="mb-2 inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-ink-500">
            <Sparkles size={13} className="text-brand-500" /> Expertise
          </p>
          <div className="flex flex-wrap gap-1.5">
            {expertise.map((e) => (
              <span key={e} className="rounded-full border border-brand-200 bg-brand-50 px-3 py-1 text-xs font-medium text-brand-700">
                {e}
              </span>
            ))}
          </div>
        </div>
      )}

      {mentor.linkedin_url && (
        <a
          href={mentor.linkedin_url}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-6 flex w-full items-center justify-center gap-2 rounded-full bg-brand-600 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-brand-700 sm:w-auto sm:px-8"
        >
          <LinkedInIcon size={17} /> Connect on LinkedIn
        </a>
      )}
    </div>
  )
}

function MentorsPage() {
  const [mentors, setMentors] = useState<Mentor[]>([])
  const [profiles, setProfiles] = useState<Record<string, DbProfile>>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string>()

  useEffect(() => {
    let active = true

    fetchMentors()
      .then(async (list) => {
        if (!active) return
        setMentors(list)

        const ids = list.map((m) => m.profile_id).filter((id): id is string => Boolean(id))
        if (ids.length === 0) return

        const { data } = await supabase
          .from('profiles')
          .select('id, full_name, headline, avatar_url, location, skills')
          .in('id', ids)
        if (!active || !data) return

        const map: Record<string, DbProfile> = {}
        for (const r of data as (DbProfile & { id: string })[]) map[r.id] = r
        setProfiles(map)
      })
      .catch((e) => active && setError(e instanceof Error ? e.message : String(e)))
      .finally(() => active && setLoading(false))

    return () => {
      active = false
    }
  }, [])

  const [featured, ...rest] = mentors

  return (
    <AppShell>
      <div className="mx-auto max-w-2xl">
        <Link
          to="/community"
          className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-ink-600 hover:text-ink-900"
        >
          <ArrowLeft size={16} /> Back to Community
        </Link>

        <div className="mb-5">
          <h1 className="font-display text-2xl font-semibold tracking-tight text-ink-900">Mentors</h1>
          <p className="mt-1 text-sm text-ink-600">
            Learn from people who’ve done it — marketers who’ve offered their time to help you
            get unstuck.
          </p>
        </div>

        {error && (
          <Alert tone="danger" title="Couldn’t load mentors">
            <p>{error}</p>
          </Alert>
        )}

        {loading ? (
          <Skeleton className="h-72 w-full" />
        ) : mentors.length === 0 ? (
          <EmptyState
            icon={Users}
            title="No mentors yet"
            description="We’re onboarding the first mentors now. Know someone who’d be great — or is that you?"
          />
        ) : (
          <>
            <MentorCard mentor={featured} db={featured.profile_id ? profiles[featured.profile_id] : undefined} />
            {rest.length > 0 && (
              <div className="mt-5 space-y-5">
                {rest.map((m) => (
                  <MentorCard key={m.id} mentor={m} db={m.profile_id ? profiles[m.profile_id] : undefined} />
                ))}
              </div>
            )}
          </>
        )}

        <Link
          to="/become-a-mentor"
          className="lift mt-6 flex items-center justify-between gap-4 rounded-2xl border border-brand-200 bg-brand-50 p-5"
        >
          <div className="min-w-0">
            <p className="font-display text-base font-semibold text-brand-900">Become a mentor</p>
            <p className="mt-0.5 text-sm text-brand-800/80">
              Done the work? Share what you know with students starting out.
            </p>
          </div>
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-600 text-white">
            <UserPlus size={18} />
          </span>
        </Link>
      </div>
    </AppShell>
  )
}
