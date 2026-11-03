import { useEffect, useState } from 'react'
import { createFileRoute, Link } from '@tanstack/react-router'
import { ArrowRight, BookOpen, Users } from 'lucide-react'
import { requireOnboarded } from '@/lib/guards'
import { fetchMyFocusRooms, OPEN_ROOM, useRoomsOnline, type FocusRoom } from '@/lib/focusRooms'
import { AppShell } from '@/components/app/AppShell'
import { HowItWorks } from '@/components/community/CommunityHero'
import { StudyNowCard } from '@/components/focus/StudyNowCard'
import { OnlineNow } from '@/components/focus/OnlineNow'
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
  // Who is in each room right now, without joining any of them.
  const online = useRoomsOnline(rooms?.map((r) => r.slug) ?? [])

  return (
    <AppShell wide>
      <div className="space-y-6">
        {/* You on camera and the Open study room, one tap away. */}
        <StudyNowCard topics={open?.topics ?? null} people={open ? online[open.slug] : undefined} />

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
                  // One tap in, camera on: what they're on can be added inside.
                  <Link
                    key={r.slug}
                    to="/study-rooms/$room"
                    params={{ room: r.slug }}
                    search={{ on: '', cam: 1 }}
                    className="card lift group flex flex-col gap-4 p-5"
                  >
                    <span className="flex items-center gap-4">
                      <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-amber-500 text-white shadow-e1">
                        <Users size={22} />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate font-display text-lg font-semibold text-ink-900">{r.title}</span>
                        <span className="block text-sm text-ink-500">{topicsLine(r, 'No topics yet')}</span>
                      </span>
                    </span>
                    <span className="flex items-center justify-between gap-3">
                      <OnlineNow people={online[r.slug]} max={4} />
                      <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-brand-600 px-4 py-2 text-sm font-semibold text-white shadow-e1 transition-colors group-hover:bg-brand-700">
                        Join <ArrowRight size={15} />
                      </span>
                    </span>
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
