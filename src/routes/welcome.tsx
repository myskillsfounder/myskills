import { createFileRoute, Link } from '@tanstack/react-router'
import { ArrowRight } from 'lucide-react'
import { trackEvent } from '@/lib/analytics'
import { requirePhoneWelcome } from '@/lib/guards'
import { FRONT_DOOR_LINE, FrontDoorCards, FrontDoorHeadline, FrontDoorTagline, StudentsRow } from '@/components/landing/FrontDoor'

/**
 * The phone's front door, for someone signed out (Paul, 4 Nov 2026: "remove
 * the room preview, keep students across India studying together", then
 * "bring the cards down, move H1 to the top"). The headline, what MySkills
 * offers, and one thing to do. "Study Online" signs them up, and a new account lands in Study rooms
 * (lib/device.ts). Anyone signed in is sent on by the guard.
 *
 * The words and cards are shared with the computer home (components/landing/FrontDoor.tsx).
 */
export const Route = createFileRoute('/welcome')({
  beforeLoad: requirePhoneWelcome,
  component: WelcomePage,
})

function WelcomePage() {
  return (
    <div className="relative min-h-[100dvh] overflow-x-clip bg-[#0b0a1f]">
      {/* Soft purple light, like the computer home page */}
      <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-[70dvh] bg-[radial-gradient(ellipse_at_50%_0%,rgba(106,85,230,0.35),transparent_65%)]" />
      <div className="relative mx-auto flex min-h-[100dvh] w-full max-w-md flex-col px-5 pt-6">
        <header className="flex items-center justify-between">
          <span className="font-display text-lg font-semibold tracking-tight text-white">MySkills</span>
          <Link to="/login" className="rounded-full bg-white/10 px-3.5 py-1.5 text-sm font-semibold text-white ring-1 ring-white/20 backdrop-blur">
            Log In
          </Link>
        </header>

        <main className="flex flex-1 flex-col pb-2 pt-5">
          <StudentsRow />
          <h1 className="mt-3 font-display text-[2.25rem] font-semibold leading-[1.08] tracking-tight text-white">
            <FrontDoorHeadline />
          </h1>
          <FrontDoorTagline className="mt-3 text-lg leading-snug" />
          <p className="mt-2 text-[15px] leading-relaxed text-white/70">{FRONT_DOOR_LINE}</p>
          <div className="mt-5">
            <FrontDoorCards place="welcome" />
          </div>
        </main>

        <footer className="sticky bottom-0 -mx-5 space-y-2 bg-gradient-to-t from-[#0b0a1f] via-[#0b0a1f]/95 to-transparent px-5 pb-[calc(1rem+env(safe-area-inset-bottom))] pt-5">
          <Link
            to="/signup"
            onClick={() => trackEvent('welcome_cta', { cta: 'study_online' })}
            className="press flex min-h-[3.5rem] w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#7b6cf6] to-[#4f46e5] text-lg font-bold text-white shadow-[0_10px_30px_-8px_rgba(123,108,246,0.8)]"
          >
            Study Online <ArrowRight size={20} />
          </Link>
          <p className="text-center text-xs text-white/60">Free. Sign up in seconds with Google or your email.</p>
        </footer>
      </div>
    </div>
  )
}
