import { createFileRoute, Link } from '@tanstack/react-router'
import { ArrowRight } from 'lucide-react'
import { trackEvent } from '@/lib/analytics'
import { requirePhoneWelcome } from '@/lib/guards'
import { GlowOrb, GridBackdrop } from '@/components/landing/GridBackdrop'

/**
 * The phone's front door, for someone signed out. Just the headline and one
 * thing to do (Paul, 4 Nov 2026: "remove the tiles, keep the CTA and H1").
 * "Study Online" signs them up, and a new account lands in Study rooms
 * (lib/device.ts). Anyone signed in is sent on by the guard.
 */
export const Route = createFileRoute('/welcome')({
  beforeLoad: requirePhoneWelcome,
  component: WelcomePage,
})

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

        <main className="flex flex-1 flex-col justify-center py-10">
          <h1 className="font-display text-[2.5rem] font-semibold leading-[1.08] tracking-tight text-white">
            Study online with the biggest online community of learners
          </h1>
          <p className="mt-3 text-base leading-relaxed text-white/70">Join a live study room, ask your doubts, and get it done together.</p>
        </main>

        <footer className="space-y-2 pb-[calc(1.5rem+env(safe-area-inset-bottom))]">
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
