import { useEffect, useState } from 'react'
import { createFileRoute, Link } from '@tanstack/react-router'
import { Award, Compass, GraduationCap, MessageSquare, Search, UserCheck } from 'lucide-react'
import { requireOnboarded } from '@/lib/guards'
import { fetchMentors } from '@/lib/mentors'
import { useMyMatch } from '@/lib/mentorMatches'
import { AppShell } from '@/components/app/AppShell'
import { Skeleton } from '@/components/ui'
import { CommunityHero, HowItWorks } from '@/components/community/CommunityHero'
import { YourMentors } from '@/components/community/YourMentors'
import { MentorListingCard, marketGrid, toMentorListing, type MentorListing } from '@/components/community/Marketplace'

/**
 * Mentors, on a page of their own (Paul, 27 Oct 2026): one-to-one sessions
 * and expert guidance. The student's own mentor first, then every published
 * mentor (each card opens their profile, where they ask to be mentored).
 */
export const Route = createFileRoute('/community/mentors')({
  beforeLoad: requireOnboarded,
  component: MentorsPage,
})

const has = (q: string, m: MentorListing) =>
  !q || [m.name, m.role, m.location, m.bio, ...m.expertise].some((f) => (f ?? '').toLowerCase().includes(q))

function MentorsPage() {
  const [mentors, setMentors] = useState<MentorListing[]>()
  const [query, setQuery] = useState('')
  const dmMatch = useMyMatch('digital-marketing')
  const crMatch = useMyMatch('career-readiness')

  useEffect(() => {
    let live = true
    fetchMentors().then(
      (l) => live && setMentors(l.map(toMentorListing)),
      () => live && setMentors([]),
    )
    return () => {
      live = false
    }
  }, [])

  const q = query.trim().toLowerCase()
  const shown = (mentors ?? []).filter((m) => has(q, m))

  return (
    <AppShell wide>
      <div className="space-y-6">
        <CommunityHero
          tone="mentors"
          icon={GraduationCap}
          eyebrow="Mentors"
          title="One to one,"
          accent="with people who have done it."
          body="AI can answer a question. A mentor knows you: an expert who meets you one to one, guides your choices and grades the real project you build."
          points={[
            { icon: MessageSquare, label: '1:1 sessions' },
            { icon: Compass, label: 'Expert guidance' },
            { icon: Award, label: 'Your project, graded' },
          ]}
        />

        <YourMentors
          matches={[
            { match: dmMatch.match, programme: 1, label: 'Digital Marketing' },
            { match: crMatch.match, programme: 2, label: 'Global Leadership' },
          ]}
        />

        <HowItWorks
          tone="mentors"
          steps={[
            { title: 'Choose a mentor', body: 'Open a profile to see their experience and what they help with.' },
            { title: 'Ask them to mentor you', body: 'They accept, and you are matched for your programme.' },
            { title: 'Meet one to one', body: 'Live sessions on what you are stuck on, at your pace.' },
            { title: 'Get your project graded', body: 'Your mentor grades it, and it counts towards your score.' },
          ]}
        />

        <section>
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 className="font-display text-xl font-semibold text-ink-900">Every mentor</h2>
              <p className="mt-0.5 text-sm text-ink-600">Open a profile to ask them to mentor you.</p>
            </div>
            <label className="relative w-full sm:w-72">
              <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-400" />
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search by skill or name"
                aria-label="Search mentors"
                className="h-10 w-full rounded-xl border border-ink-900/10 bg-white pl-9 pr-3 text-sm outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100"
              />
            </label>
          </div>
          <div className="mt-4">
            {mentors === undefined ? (
              <div className={marketGrid}>
                {[0, 1, 2].map((i) => (
                  <Skeleton key={i} className="h-44 w-full rounded-2xl" />
                ))}
              </div>
            ) : shown.length === 0 ? (
              <p className="card p-6 text-sm text-ink-600">
                {q ? `No mentors match “${query.trim()}”.` : 'No mentors are listed yet. Check back soon.'}
              </p>
            ) : (
              <div className={marketGrid}>
                {shown.map((m) => (
                  <MentorListingCard key={m.id} mentor={m} />
                ))}
              </div>
            )}
          </div>
          <p className="mt-5 flex items-center gap-1.5 text-sm text-ink-600">
            <UserCheck size={15} className="text-violet-600" /> Done the work yourself?{' '}
            <Link to="/become-a-mentor" className="font-semibold text-violet-700 hover:underline">
              Become a mentor
            </Link>
          </p>
        </section>
      </div>
    </AppShell>
  )
}
