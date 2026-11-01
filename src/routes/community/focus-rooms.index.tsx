import { useEffect, useState } from 'react'
import { createFileRoute, Link } from '@tanstack/react-router'
import { ArrowRight, BookOpen, MessageSquareText, MicOff, MoonStar, Video } from 'lucide-react'
import { requireOnboarded } from '@/lib/guards'
import { fetchMyFocusRooms, type FocusRoom } from '@/lib/focusRooms'
import { AppShell } from '@/components/app/AppShell'
import { CommunityHero, HowItWorks } from '@/components/community/CommunityHero'
import { ButtonLink, EmptyState, Skeleton } from '@/components/ui'

// Behind sign-in like the other Community pages: the /community layout lets
// visitors through for its public index, so this leaf guards itself.
export const Route = createFileRoute('/community/focus-rooms/')({
  beforeLoad: requireOnboarded,
  component: FocusRoomsPage,
})

/** One room for each programme the student is in. */
function FocusRoomsPage() {
  const [rooms, setRooms] = useState<FocusRoom[]>()
  useEffect(() => {
    fetchMyFocusRooms().then(setRooms)
  }, [])

  return (
    <AppShell wide>
      <div className="space-y-6">
        <CommunityHero
          tone="focus"
          icon={MoonStar}
          eyebrow="Focus Rooms"
          title="Study together,"
          accent="wherever you are."
          body="A live room for each programme you’re in. Turn your camera on, say what you’re working on, and upvote the topics that matter. Others studying the same thing are right there with you."
          points={[
            { icon: Video, label: 'Camera on' },
            { icon: MicOff, label: 'No sound' },
            { icon: MessageSquareText, label: 'Upvote topics' },
          ]}
        />

        <section>
          <h2 className="mb-3 font-display text-xl font-semibold text-ink-900">Your rooms</h2>
          {rooms === undefined && <Skeleton className="h-28 w-full" />}
          {rooms?.length === 0 && (
            <EmptyState
              icon={BookOpen}
              title="Start a programme to get its room"
              description="Each programme has its own Focus Room, open to the students in it."
              action={<ButtonLink to="/practice">See programmes</ButtonLink>}
            />
          )}
          {rooms && rooms.length > 0 && (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {rooms.map((r) => (
                <Link key={r.slug} to="/community/focus-rooms/$room" params={{ room: r.slug }} className="card lift group flex items-center gap-4 p-5">
                  <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-amber-500 text-white shadow-e1">
                    <MoonStar size={22} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-display text-lg font-semibold text-ink-900">{r.title}</span>
                    <span className="block text-sm text-ink-500">
                      {r.topics > 0 ? `${r.topics} topic${r.topics === 1 ? '' : 's'} on the board` : 'Be the first to post a topic'}
                    </span>
                  </span>
                  <ArrowRight size={18} className="shrink-0 text-brand-700 transition-transform group-hover:translate-x-1" />
                </Link>
              ))}
            </div>
          )}
        </section>

        <HowItWorks
          tone="focus"
          steps={[
            { title: 'Pick your programme', body: 'Each programme you’re in has its own room.' },
            { title: 'Say what you’re on', body: 'A module, a quiz, your project: others see it under your camera.' },
            { title: 'Study side by side', body: 'Camera on, no sound. Everyone gets on with their work.' },
            { title: 'Upvote topics', body: 'Post a doubt; the most upvoted ones go to the top.' },
          ]}
        />
      </div>
    </AppShell>
  )
}
