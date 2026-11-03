import { createFileRoute, Link } from '@tanstack/react-router'
import { ArrowRight, ChevronUp, MessageCircleQuestion, MicOff, Users, Video } from 'lucide-react'
import { trackEvent } from '@/lib/analytics'
import { STUDY_TILES, studyPhoto } from '@/lib/studyPhotos'
import { requirePhoneWelcome } from '@/lib/guards'
import { GlowOrb, GridBackdrop } from '@/components/landing/GridBackdrop'

/**
 * The phone's front door, for someone signed out (Paul, 4 Nov 2026: "the CTA
 * should be study online, take them to the study room, remove everything
 * else, mention ask your doubts"). One screen, one thing to do: study online
 * with others. "Study online" signs them up, and a new account lands in Study
 * rooms (lib/device.ts). Anyone signed in is sent on by the guard.
 */
export const Route = createFileRoute('/welcome')({
  beforeLoad: requirePhoneWelcome,
  component: WelcomePage,
})

function RoomPreview() {
  return (
    <div aria-hidden className="relative rounded-3xl bg-[#14122b] p-3 ring-1 ring-white/10">
      <div className="mb-2.5 flex items-center justify-between px-1">
        <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-emerald-200">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" /> Study room · Live
        </span>
        <span className="inline-flex items-center gap-1 text-[11px] text-white/60">
          <MicOff size={11} /> No sound
        </span>
      </div>
      <div className="grid grid-cols-2 gap-2">
        {STUDY_TILES.map((t) => (
          <div key={t.on} className="relative aspect-[4/3] overflow-hidden rounded-xl bg-white/10">
            <img
              src={studyPhoto(t.photo)}
              alt=""
              className="absolute inset-0 h-full w-full object-cover"
              style={{ objectPosition: t.focus }}
            />
            <span className="absolute left-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-emerald-400 ring-2 ring-black/30" />
            <span className="absolute inset-x-1.5 bottom-1.5 truncate rounded-md bg-black/55 px-1.5 py-0.5 text-[10px] font-medium text-white">{t.on}</span>
          </div>
        ))}
      </div>
      {/* the doubts board, under the cameras */}
      <div className="mt-2.5 flex items-center gap-2 rounded-xl bg-white/[0.06] px-3 py-2.5">
        <MessageCircleQuestion size={16} className="shrink-0 text-amber-200" />
        <span className="min-w-0 flex-1 truncate text-xs text-white/85">“How do I revise a whole chapter in an hour?”</span>
        <span className="inline-flex shrink-0 items-center gap-0.5 rounded-full bg-amber-400/20 px-2 py-0.5 text-[10px] font-semibold text-amber-100">
          <ChevronUp size={12} /> Upvote
        </span>
      </div>
    </div>
  )
}

const POINTS = [
  { icon: Users, title: 'Study with others, live', body: 'Join a room and get your work done alongside students like you.' },
  { icon: MessageCircleQuestion, title: 'Ask your doubts', body: 'Post a question; the room upvotes the ones that matter most.' },
  { icon: Video, title: 'Camera on, no sound', body: 'Quiet focus, any subject, any time. Nothing is recorded.' },
]

function WelcomePage() {
  return (
    <div className="surface-wood-dark relative min-h-[100dvh] overflow-x-clip">
      <GridBackdrop mask="ellipse 90% 55% at 50% 0%" />
      <GlowOrb className="-left-24 top-16 h-64 w-64" />
      <GlowOrb className="-right-24 bottom-10 h-64 w-64" color="rgba(211,164,65,0.12)" />
      <div className="relative mx-auto flex min-h-[100dvh] w-full max-w-md flex-col px-5 pt-6">
        <header className="flex items-center justify-between">
          <span className="font-display text-lg font-semibold tracking-tight text-white">MySkills</span>
          <Link to="/login" className="text-sm font-semibold text-white/80">
            Sign in
          </Link>
        </header>

        <main className="flex flex-1 flex-col justify-center py-6">
          <h1 className="font-display text-[2rem] font-semibold leading-[1.1] tracking-tight text-white">
            Study online with the biggest online community of learners
          </h1>
          <p className="mt-2.5 text-[15px] leading-relaxed text-white/70">Join a live study room, ask your doubts, and get it done together.</p>

          <div className="mt-5">
            <RoomPreview />
          </div>

          <ul className="mt-5 space-y-3">
            {POINTS.map((p) => (
              <li key={p.title} className="flex gap-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-400/15 text-amber-200">
                  <p.icon size={18} />
                </span>
                <span>
                  <span className="block text-[15px] font-semibold text-white">{p.title}</span>
                  <span className="block text-sm leading-snug text-white/60">{p.body}</span>
                </span>
              </li>
            ))}
          </ul>
        </main>

        {/* The one thing to do: sign up, and land in Study rooms. Pinned to the
            bottom, so it is in reach without scrolling. */}
        <footer className="sticky bottom-0 -mx-5 space-y-2 bg-gradient-to-t from-[#1b1714] via-[#1b1714]/95 to-transparent px-5 pb-[calc(1rem+env(safe-area-inset-bottom))] pt-6">
          <Link
            to="/signup"
            onClick={() => trackEvent('welcome_cta', { cta: 'study_online' })}
            className="press flex min-h-[3.5rem] w-full items-center justify-center gap-2 rounded-full bg-amber-400 text-lg font-bold text-[#1e1b4b] shadow-e2"
          >
            Study Online <ArrowRight size={20} />
          </Link>
          <p className="text-center text-xs text-white/60">Free. Sign up in seconds with Google or your email.</p>
        </footer>
      </div>
    </div>
  )
}
