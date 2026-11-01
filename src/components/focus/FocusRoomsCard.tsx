import { useState } from 'react'
import { Link } from '@tanstack/react-router'
import { ArrowRight, Loader2, MessageSquareText, MicOff, MoonStar, PencilLine, Video } from 'lucide-react'
import { fetchMyFocusRooms, type FocusRoom } from '@/lib/focusRooms'

const STEPS = [
  { icon: MoonStar, title: 'Pick a room', body: 'One for each programme you’re in.' },
  { icon: PencilLine, title: 'Say what you’re on', body: 'A module, a quiz, your project.' },
  { icon: Video, title: 'Camera on, no sound', body: 'Study side by side, quietly.' },
  { icon: MessageSquareText, title: 'Upvote topics', body: 'The doubts that matter rise to the top.' },
]

/**
 * The way into Focus Rooms (Paul, 1 Nov 2026: "a bigger card ... clearly
 * giving the user an idea about joining a room"). On the Community hub and the
 * Practice home, "Join now" lists the student's rooms to pick from; inside a
 * programme on Practice, `room` sends them straight to that programme's room.
 */
export function FocusRoomsCard({ room }: { room?: { slug: string; title: string } }) {
  const [rooms, setRooms] = useState<FocusRoom[] | 'loading'>()

  const open = () => {
    if (rooms) return
    setRooms('loading')
    fetchMyFocusRooms().then(setRooms)
  }

  const join = 'inline-flex items-center gap-2 rounded-full bg-amber-400 px-5 py-2.5 text-sm font-semibold text-[#1e1b4b] shadow-e1 transition-colors hover:bg-amber-300'

  return (
    <section className="theme-light relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#0f172a] via-[#1e1b4b] to-[#92400e] p-6 text-white shadow-e2 sm:p-8">
      <span aria-hidden className="absolute -right-16 -top-20 h-72 w-72 rounded-full bg-amber-400/25 blur-3xl" />
      <MoonStar aria-hidden size={200} strokeWidth={1} className="absolute -bottom-8 right-6 hidden text-white/[0.07] sm:block" />
      <div className="relative">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="max-w-xl">
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-amber-200">Focus Rooms · Live now</p>
            <h2 className="mt-2 font-display text-2xl font-bold leading-tight sm:text-3xl">
              {room ? `Study ${room.title} with others` : 'Study live with others in your programme'}
            </h2>
            <p className="mt-2 text-[15px] leading-relaxed text-white/80">
              Join a room, turn your camera on and get on with your work alongside students learning the same thing. No
              sound, nothing recorded.
            </p>
          </div>
          {room ? (
            <Link to="/community/focus-rooms/$room" params={{ room: room.slug }} className={join}>
              Join now <ArrowRight size={16} />
            </Link>
          ) : (
            !rooms && (
              <button type="button" onClick={open} className={join}>
                Join now <ArrowRight size={16} />
              </button>
            )
          )}
        </div>

        {/* Which room: shown once the student asks to join. */}
        {!room && rooms && (
          <div className="mt-6 rounded-2xl bg-white/10 p-4 ring-1 ring-white/15 backdrop-blur">
            <p className="text-sm font-semibold text-white">Which room?</p>
            {rooms === 'loading' && (
              <p className="mt-2 inline-flex items-center gap-2 text-sm text-white/70">
                <Loader2 size={14} className="animate-spin" /> Finding your rooms…
              </p>
            )}
            {rooms !== 'loading' && rooms.length === 0 && (
              <p className="mt-2 text-sm text-white/75">
                Rooms open for the programmes you’re in. Start a programme on{' '}
                <Link to="/practice" className="font-semibold text-amber-200 underline">
                  Practice
                </Link>{' '}
                and its room appears here.
              </p>
            )}
            {rooms !== 'loading' && rooms.length > 0 && (
              <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {rooms.map((r) => (
                  <Link
                    key={r.slug}
                    to="/community/focus-rooms/$room"
                    params={{ room: r.slug }}
                    className="group flex items-center justify-between gap-3 rounded-xl bg-white px-4 py-3 text-ink-900 transition-colors hover:bg-amber-50"
                  >
                    <span className="min-w-0">
                      <span className="block truncate font-semibold">{r.title}</span>
                      <span className="block text-xs text-ink-500">
                        {r.topics > 0 ? `${r.topics} topic${r.topics === 1 ? '' : 's'} on the board` : 'Open now'}
                      </span>
                    </span>
                    <ArrowRight size={16} className="shrink-0 text-brand-700 transition-transform group-hover:translate-x-0.5" />
                  </Link>
                ))}
              </div>
            )}
          </div>
        )}

        <ol className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map((s, i) => (
            <li key={s.title} className="flex gap-3 rounded-2xl bg-white/[0.06] p-3 ring-1 ring-white/10">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-amber-400/20 text-amber-100">
                <s.icon size={15} />
              </span>
              <span>
                <span className="block text-sm font-semibold text-white">
                  {i + 1}. {s.title}
                </span>
                <span className="block text-xs leading-snug text-white/65">{s.body}</span>
              </span>
            </li>
          ))}
        </ol>
        <p className="mt-4 inline-flex items-center gap-1.5 text-xs text-white/55">
          <MicOff size={12} /> Camera only. There’s no microphone in Focus Rooms.
        </p>
      </div>
    </section>
  )
}
