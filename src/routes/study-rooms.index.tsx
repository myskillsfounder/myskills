import { useEffect, useState } from 'react'
import { createFileRoute, Link } from '@tanstack/react-router'
import { ArrowRight, BookOpen, Users } from 'lucide-react'
import { requireOnboarded } from '@/lib/guards'
import { fetchMyFocusRooms, useRoomsOnline, type FocusRoom } from '@/lib/focusRooms'
import { AppShell } from '@/components/app/AppShell'
import { HowItWorks } from '@/components/community/CommunityHero'
import { OnlineNow } from '@/components/focus/OnlineNow'
import { EmptyState, Skeleton } from '@/components/ui'

/**
 * Study rooms, the app's first tab and where a student lands after signing in.
 * One room per topic, open to every signed-in student (Paul, 17 Nov 2026).
 * Nothing starts here: no camera, no joining. A student opens a room, says what
 * they're on, and chooses camera on or off from the room's entry screen.
 */
export const Route = createFileRoute('/study-rooms/')({
  beforeLoad: requireOnboarded,
  component: StudyRoomsPage,
})

const ABOUT: Record<string, string> = {
  open: 'Any subject: revision, homework, reading or your own project.',
  'digital-marketing': 'Ads, SEO, content and analytics.',
  'career-readiness': 'Goals, communication, leadership and a growth mindset.',
  'ai-powered-entrepreneurship': 'Ideas, customers, pricing and money.',
  'data-analytics': 'Cleaning data, analysis and dashboards.',
}

const topicsLine = (r: FocusRoom) =>
  r.topics > 0 ? `${r.topics} topic${r.topics === 1 ? '' : 's'} on the board` : 'No topics yet'

function StudyRoomsPage() {
  const [rooms, setRooms] = useState<FocusRoom[]>()
  useEffect(() => {
    fetchMyFocusRooms().then(setRooms)
  }, [])

  // Who is in each room right now, without joining any of them.
  const online = useRoomsOnline(rooms?.map((r) => r.slug) ?? [])

  return (
    <AppShell wide>
      <div className="space-y-6">
        <header>
          <h1 className="font-display text-2xl font-semibold text-ink-900 sm:text-3xl">Study rooms</h1>
          <p className="mt-1 text-sm text-ink-600">Pick a topic and study alongside others. Your camera stays off until you join a room.</p>
        </header>

        {rooms === undefined && (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {[0, 1, 2].map((i) => (
              <Skeleton key={i} className="h-36 w-full" />
            ))}
          </div>
        )}

        {rooms?.length === 0 && (
          <EmptyState icon={BookOpen} title="No study rooms yet" description="Check back soon, or reload the page." />
        )}

        {rooms && rooms.length > 0 && (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {rooms.map((r) => (
              <Link key={r.slug} to="/study-rooms/$room" params={{ room: r.slug }} className="card lift group flex flex-col gap-4 p-5">
                <span className="flex items-center gap-4">
                  <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-amber-500 text-white shadow-e1">
                    <Users size={22} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-display text-lg font-semibold text-ink-900">{r.title}</span>
                    <span className="block text-sm text-ink-500">{topicsLine(r)}</span>
                  </span>
                </span>
                <span className="text-sm text-ink-600">{ABOUT[r.slug] ?? 'Study with others on this topic.'}</span>
                <span className="mt-auto flex items-center justify-between gap-3">
                  <OnlineNow people={online[r.slug]} max={4} />
                  <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-brand-600 px-4 py-2 text-sm font-semibold text-white shadow-e1 transition-colors group-hover:bg-brand-700">
                    Open room <ArrowRight size={15} />
                  </span>
                </span>
              </Link>
            ))}
          </div>
        )}

        <HowItWorks
          tone="focus"
          steps={[
            { title: 'Pick a topic', body: 'Each room is for one topic, so everyone there is on the same thing.' },
            { title: 'Say what you’re on', body: 'A module, a quiz, your project: choose camera on or off, then join.' },
            { title: 'Study side by side', body: 'Camera on, no sound. Everyone gets on with their work.' },
            { title: 'Upvote topics', body: 'Post a doubt; the most upvoted ones go to the top.' },
          ]}
        />
      </div>
    </AppShell>
  )
}
