import { useEffect, useState } from 'react'
import { createFileRoute, Link } from '@tanstack/react-router'
import { ArrowLeft, BadgeCheck, MapPin, Sparkles } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { AppShell } from '@/components/app/AppShell'

export const Route = createFileRoute('/community/mentors')({
  component: MentorsPage,
})

function LinkedInIcon({ size = 16, className }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className={className}>
      <path d="M20.45 20.45h-3.56v-5.57c0-1.33-.02-3.04-1.85-3.04-1.85 0-2.14 1.45-2.14 2.94v5.67H9.34V9h3.42v1.56h.05c.48-.9 1.64-1.85 3.37-1.85 3.6 0 4.27 2.37 4.27 5.46v6.28zM5.34 7.43a2.07 2.07 0 1 1 0-4.14 2.07 2.07 0 0 1 0 4.14zM7.12 20.45H3.55V9h3.57v11.45zM22.22 0H1.77C.79 0 0 .77 0 1.73v20.54C0 23.22.79 24 1.77 24h20.45c.98 0 1.78-.78 1.78-1.73V1.73C24 .77 23.2 0 22.22 0z" />
    </svg>
  )
}

interface Mentor {
  id: string
  name: string
  role: string
  bio: string
  initials: string
  location: string
  expertise: string[]
  linkedin: string
}

const MENTORS: Mentor[] = [
  {
    id: 'b15eb398-053b-4fb1-b33a-7f1903bcabf8',
    name: 'Paul Thomas',
    role: 'Edupreneur & Professional Development Coach',
    bio: 'Helping learners turn digital marketing skills into real, job-ready careers through practical coaching and mentorship.',
    initials: 'PT',
    location: '',
    expertise: ['Digital Marketing', 'Career Coaching', 'Professional Development'],
    linkedin: 'https://www.linkedin.com/in/paul-thomas-edupreneur-professional-development-coach/',
  },
]

interface DbProfile {
  full_name: string | null
  headline: string | null
  about: string | null
  avatar_url: string | null
  location: string | null
  skills: string[] | null
}

function FeaturedMentor({ mentor, db }: { mentor: Mentor; db?: DbProfile }) {
  const name = db?.full_name?.trim() || mentor.name
  const role = db?.headline?.trim() || mentor.role
  const bio = db?.about?.trim() || mentor.bio
  const avatar = db?.avatar_url || null
  const location = db?.location?.trim() || mentor.location
  const expertise = db?.skills && db.skills.length ? db.skills : mentor.expertise

  return (
    <div className="rounded-3xl border border-ink-100 bg-white p-6 shadow-sm">
      <div className="flex items-start gap-4">
        {avatar ? (
          <img src={avatar} alt={name} className="h-20 w-20 shrink-0 rounded-full object-cover ring-2 ring-brand-100" />
        ) : (
          <span className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full bg-brand-600 text-2xl font-semibold text-white">
            {mentor.initials}
          </span>
        )}
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <h2 className="text-xl font-semibold tracking-tight text-ink-900">{name}</h2>
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-700">
              <BadgeCheck size={12} /> Verified
            </span>
          </div>
          <p className="mt-0.5 text-sm font-medium text-brand-600">{role}</p>
          {location && (
            <p className="mt-1 inline-flex items-center gap-1 text-xs text-ink-400">
              <MapPin size={12} /> {location}
            </p>
          )}
        </div>
      </div>

      <p className="mt-4 text-sm leading-relaxed text-ink-600">{bio}</p>

      {expertise.length > 0 && (
        <div className="mt-5">
          <p className="mb-2 inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-ink-400">
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

      <a
        href={mentor.linkedin}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-6 flex w-full items-center justify-center gap-2 rounded-full bg-brand-600 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-brand-700 sm:w-auto sm:px-8"
      >
        <LinkedInIcon size={17} /> Connect on LinkedIn
      </a>
    </div>
  )
}

function MentorsPage() {
  const [profiles, setProfiles] = useState<Record<string, DbProfile>>({})

  useEffect(() => {
    const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    const ids = MENTORS.map((m) => m.id).filter((id) => UUID.test(id))
    if (ids.length === 0) return
    supabase
      .from('profiles')
      .select('id, full_name, headline, about, avatar_url, location, skills')
      .in('id', ids)
      .then(({ data }) => {
        if (!data) return
        const map: Record<string, DbProfile> = {}
        for (const r of data as (DbProfile & { id: string })[]) map[r.id] = r
        setProfiles(map)
      })
  }, [])

  const [featured, ...rest] = MENTORS

  return (
    <AppShell>
      <div className="mx-auto max-w-2xl">
        <Link
          to="/community"
          className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-ink-500 hover:text-ink-900"
        >
          <ArrowLeft size={16} /> Back to Community
        </Link>

        <div className="mb-5">
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl font-semibold tracking-tight text-ink-900">Mentors</h1>
            <span className="rounded-full border border-amber-200 bg-amber-50 px-2.5 py-0.5 text-[11px] font-medium text-amber-700">
              More coming soon
            </span>
          </div>
          <p className="mt-1 text-sm text-ink-500">
            Learn from people who’ve done it. Full mentorship is on the way — meet our featured mentor.
          </p>
        </div>

        <FeaturedMentor mentor={featured} db={profiles[featured.id]} />

        {rest.length > 0 && (
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            {rest.map((m) => (
              <FeaturedMentor key={m.id} mentor={m} db={profiles[m.id]} />
            ))}
          </div>
        )}

        <p className="mt-6 text-center text-xs text-ink-400">More mentors are joining MySkills soon.</p>
      </div>
    </AppShell>
  )
}
