import { useEffect, useState } from 'react'
import { createFileRoute, Link } from '@tanstack/react-router'
import { ArrowRight, BookOpen, MessageSquareText, MicOff, MoonStar, Users, Video } from 'lucide-react'
import { requireOnboarded } from '@/lib/guards'
import { fetchMyFocusRooms, OPEN_ROOM, type FocusRoom } from '@/lib/focusRooms'
import { AppShell } from '@/components/app/AppShell'
import { CommunityHero, HowItWorks } from '@/components/community/CommunityHero'
import { ButtonLink, EmptyState, Skeleton } from '@/components/ui'

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
        <CommunityHero
          tone="focus"
          back={null}
          icon={MoonStar}
          eyebrow="Study rooms"
          title="Study together,"
          accent="wherever you are."
          body="Join a live room, turn your camera on, say what you’re working on and get going alongside other students. Upvote the topics that matter. No sound, nothing recorded."
          points={[
            { icon: Video, label: 'Camera on' },
            { icon: MicOff, label: 'No sound' },
            { icon: MessageSquareText, label: 'Upvote topics' },
          ]}
        />

        {rooms === undefined && <Skeleton className="h-40 w-full" />}

        {/* Everyone's room, first and biggest: the way in on day one. */}
        {open && (
          <Link
            to="/study-rooms/$room"
            params={{ room: open.slug }}
            className="theme-light group relative block overflow-hidden rounded-3xl bg-gradient-to-br from-[#0f172a] via-[#1e1b4b] to-[#92400e] p-6 text-white shadow-e2 sm:p-8"
          >
            <span aria-hidden className="absolute -right-16 -top-20 h-72 w-72 rounded-full bg-amber-400/25 blur-3xl" />
            <span className="relative flex flex-wrap items-center justify-between gap-4">
              <span className="min-w-0 max-w-xl">
                <span className="block text-[11px] font-semibold uppercase tracking-[0.22em] text-amber-200">Open to everyone · Live now</span>
                <span className="mt-2 block font-display text-2xl font-bold leading-tight sm:text-3xl">{open.title}</span>
                <span className="mt-2 block text-[15px] leading-relaxed text-white/80">
                  Any subject, any programme. Come in, say what you’re studying and work alongside others. {topicsLine(open, '')}
                </span>
              </span>
              <span className="inline-flex shrink-0 items-center gap-2 rounded-full bg-amber-400 px-5 py-2.5 text-sm font-semibold text-[#1e1b4b] shadow-e1 transition-colors group-hover:bg-amber-300">
                Join now <ArrowRight size={16} />
              </span>
            </span>
          </Link>
        )}

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
