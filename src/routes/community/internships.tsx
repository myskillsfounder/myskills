import { useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { BadgeCheck, Briefcase, Building2, ClipboardCheck, Search, Trophy, Users } from 'lucide-react'
import { requireOnboarded } from '@/lib/guards'
import { AppShell } from '@/components/app/AppShell'
import { Skeleton } from '@/components/ui'
import { CommunityHero, HowItWorks } from '@/components/community/CommunityHero'
import { InternshipRoleCard, InternshipRoleDialog, YourInternships, useInternships } from '@/components/community/Internships'
import { INTERNSHIP_TRACKS, InternshipCard, marketGrid } from '@/components/community/Marketplace'

/**
 * Internships, on a page of their own (Paul, 27 Oct 2026): the student's first
 * hands-on corporate experience. Their applications first, then every open
 * role (each opens a dialog to apply), and what a first internship is like.
 * MySkills offers internships, never jobs.
 */
export const Route = createFileRoute('/community/internships')({
  beforeLoad: requireOnboarded,
  component: InternshipsPage,
})

/** What a first internship is like, said plainly. */
const EXPECT: { icon: typeof Briefcase; title: string; body: string }[] = [
  { icon: Building2, title: 'A real company', body: 'Partner companies our team has reviewed, with a team you work alongside.' },
  { icon: ClipboardCheck, title: 'Real deliverables', body: 'Work the company uses: campaigns, research, content, reports.' },
  { icon: Users, title: 'Workplace habits', body: 'Deadlines, feedback and stand-ups: how a team actually works.' },
  { icon: Trophy, title: 'It counts', body: 'Signed off by the company and confirmed by MySkills, it adds 20 points to your score.' },
]

function InternshipsPage() {
  const internships = useInternships()
  const [openRoleId, setOpenRoleId] = useState<string | null>(null)
  const openRole = internships.roles.find((r) => r.id === openRoleId)
  const [query, setQuery] = useState('')
  const q = query.trim().toLowerCase()
  const roles = internships.roles
    .filter((r) => !q || [r.title, r.organisation, r.description, r.location ?? '', ...r.skills].some((f) => f.toLowerCase().includes(q)))
    .sort((a, b) => b.posted_on.localeCompare(a.posted_on))
  const hasRoles = internships.roles.length > 0

  return (
    <AppShell wide>
      <div className="space-y-6">
        <CommunityHero
          tone="internships"
          icon={Briefcase}
          eyebrow="Internships"
          title="Your first corporate experience,"
          accent="hands-on and real."
          body="Step inside a real company: work on what the team needs, learn how a workplace runs, and leave with work you can show, signed off by the company."
          points={[
            { icon: Building2, label: 'Partner companies' },
            { icon: ClipboardCheck, label: 'Real deliverables' },
            { icon: BadgeCheck, label: 'Signed off · +20 points' },
          ]}
        />

        <YourInternships applications={internships.applications} onChanged={() => void internships.reload()} />

        <section>
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 className="font-display text-xl font-semibold text-ink-900">{hasRoles ? 'Open internships' : 'Internships opening soon'}</h2>
              <p className="mt-0.5 text-sm text-ink-600">
                {hasRoles ? 'Open a role to read it and apply. The company sees your Global Readiness Score.' : 'The kinds of role partner companies post. None is open right now.'}
              </p>
            </div>
            {hasRoles && (
              <label className="relative w-full sm:w-72">
                <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-400" />
                <input
                  type="search"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search by role, skill or company"
                  aria-label="Search internships"
                  className="h-10 w-full rounded-xl border border-ink-900/10 bg-white pl-9 pr-3 text-sm outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100"
                />
              </label>
            )}
          </div>
          <div className="mt-4">
            {internships.loading ? (
              <div className={marketGrid}>
                {[0, 1, 2].map((i) => (
                  <Skeleton key={i} className="h-44 w-full rounded-2xl" />
                ))}
              </div>
            ) : hasRoles ? (
              roles.length ? (
                <div className={marketGrid}>
                  {roles.map((r) => (
                    <InternshipRoleCard key={r.id} role={r} onOpen={() => setOpenRoleId(r.id)} />
                  ))}
                </div>
              ) : (
                <p className="card p-6 text-sm text-ink-600">No internships match “{query.trim()}”.</p>
              )
            ) : (
              <div className={marketGrid}>
                {INTERNSHIP_TRACKS.map((t) => (
                  <InternshipCard key={t.title} track={t} />
                ))}
              </div>
            )}
          </div>
        </section>

        <section>
          <h2 className="font-display text-xl font-semibold text-ink-900">What your first internship is like</h2>
          <ul className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {EXPECT.map((e) => (
              <li key={e.title} className="card p-5">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-50 text-teal-700 ring-1 ring-teal-100">
                  <e.icon size={19} />
                </span>
                <p className="mt-3 font-semibold text-ink-900">{e.title}</p>
                <p className="mt-1 text-sm leading-relaxed text-ink-600">{e.body}</p>
              </li>
            ))}
          </ul>
        </section>

        <HowItWorks
          tone="internships"
          steps={[
            { title: 'Apply', body: 'Send a short note; the company sees your score and certificates.' },
            { title: 'Get an offer', body: 'If they pick you, accept the offer and agree a start date.' },
            { title: 'Do the work', body: 'Work with the team for the weeks the role runs.' },
            { title: 'Signed off', body: 'The company signs it off, MySkills confirms it, and it counts.' },
          ]}
        />
      </div>
      {openRole && (
        <InternshipRoleDialog role={openRole} onClose={() => setOpenRoleId(null)} onChanged={() => void internships.reload()} />
      )}
    </AppShell>
  )
}
