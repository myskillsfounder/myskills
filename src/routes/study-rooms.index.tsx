import { useEffect, useState } from 'react'
import { createFileRoute, Link } from '@tanstack/react-router'
import { ArrowRight, BookOpen, Users } from 'lucide-react'
import { requireOnboarded } from '@/lib/guards'
import { fetchMyFocusRooms, OPEN_ROOM, type FocusRoom } from '@/lib/focusRooms'
import { AppShell } from '@/components/app/AppShell'
import { HowItWorks } from '@/components/community/CommunityHero'
import { StudyNowCard } from '@/components/focus/StudyNowCard'
import { ButtonLink, EmptyState } from '@/components/ui'

/**
 * Study rooms, the app's first tab and where a student lands after signing in
 * (Paul, 3 Nov 2026): students come together and study online. The Open study
 * room is for everyone signed in, so a new student is never met by an empty
 * page; each programme a student is in has its own room too.
 */
export const Route = createFileRoute('/study-rooms/')({
  beforeLoad: requireOnboarded,
  component: StudyRoomsPage,
})

const topicsLine = (r: FocusRoom, none: string) =>
  r.topics > 0 ? `${r.topics} topic${r.topics === 1 ? '' : 's'} on the board` : none

function StudyRoomsPage() {
  const [rooms, setRooms] = useState<FocusRoom[]>()
  useEffect(() => {
    fetchMyFocusRooms().then(setRooms)
  }, [])

  const open = rooms?.find((r) => r.slug === OPEN_ROOM)
  const programmeRooms = rooms?.filter((r) => r.slug !== OPEN_ROOM)

  return (
    <AppShell wide>
      <div className="space-y-6">
        {/* You on camera and the Open study room, one tap away. */}
        <StudyNowCard topics={open?.topics ?? null} />

        {programmeRooms && (
          <section>
            <h2 className="mb-1 font-display text-xl font-semibold text-ink-900">Your programme rooms</h2>
            <p className="mb-3 text-sm text-ink-600">Only for students in the same programme, so everyone there is on the same material.</p>
            {programmeRooms.length === 0 ? (
              <EmptyState
                icon={BookOpen}
                title="Start a programme to get its room"
                description="Each programme has its own study room, open to the students in it."
                action={<ButtonLink to="/practice">See programmes</ButtonLink>}
              />
            ) : (
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {programmeRooms.map((r) => (
                  <Link key={r.slug} to="/study-rooms/$room" params={{ room: r.slug }} className="card lift group flex items-center gap-4 p-5">
                    <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-amber-500 text-white shadow-e1">
                      <Users size={22} />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-display text-lg font-semibold text-ink-900">{r.title}</span>
                      <span className="block text-sm text-ink-500">{topicsLine(r, 'Be the first to post a topic')}</span>
                    </span>
                    <ArrowRight size={18} className="shrink-0 text-brand-700 transition-transform group-hover:translate-x-1" />
                  </Link>
                ))}
              </div>
            )}
          </section>
        )}

        <HowItWorks
          tone="focus"
          steps={[
            { title: 'Pick a room', body: 'The Open study room, or your programme’s own.' },
            { title: 'Say what you’re on', body: 'A module, a quiz, your project: others see it under your camera.' },
            { title: 'Study side by side', body: 'Camera on, no sound. Everyone gets on with their work.' },
            { title: 'Upvote topics', body: 'Post a doubt; the most upvoted ones go to the top.' },
          ]}
        />
      </div>
    </AppShell>
  )
}
