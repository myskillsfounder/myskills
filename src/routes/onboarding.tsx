import { useEffect, useRef, useState } from 'react'
import { createFileRoute, useRouter } from '@tanstack/react-router'
import { Loader2 } from 'lucide-react'
import { trackEvent, trackSignUp } from '@/lib/analytics'
import { completeOnboarding, signOut } from '@/lib/auth'
import { ensureProfile } from '@/lib/profile'
import { requireSession } from '@/lib/guards'
import { homePath } from '@/lib/device'
import { takeAfterOnboarding } from '@/lib/afterOnboarding'
import { planFor, START_PROGRAMME } from '@/lib/onboardingContent'
import { setProgrammePath } from '@/lib/foundationPath'
import { clearGuideAnswers, peekGuideAnswers } from '@/lib/guideAnswers'
import { GlowOrb, GridBackdrop } from '@/components/landing/GridBackdrop'

export const Route = createFileRoute('/onboarding')({
  beforeLoad: requireSession,
  component: OnboardingPage,
})

/**
 * A new account's first stop, which asks nothing (Paul, 3 Nov 2026: "let
 * student start online with a simple sign in"). It marks the account
 * onboarded, creates the profile row, counts the sign-up, and goes on: to the
 * test they were heading for, or home, to Study rooms. Where they are and their
 * goal are optional now, on the profile (components/profile/AboutYouCard.tsx).
 *
 * The AI guide (routes/start.tsx) may already have asked those before sign-up:
 * its answers are kept, as onboarding's used to be.
 */
function OnboardingPage() {
  const router = useRouter()
  const [error, setError] = useState<string>()
  const started = useRef(false)

  async function finish() {
    setError(undefined)
    try {
      const guide = peekGuideAnswers()
      const level = guide?.level === 'experienced' ? 'experienced' : 'beginner'
      const method = await completeOnboarding(
        guide ? { career_stage: guide.stage, goals: [guide.goal], start_level: level } : undefined,
      )
      if (guide) {
        clearGuideAnswers()
        // Their starting point in Digital Marketing, kept per programme; before
        // the Foundation SQL is run this can't be saved, and that page asks again.
        if (planFor(guide.stage, guide.goal, guide.focus, level).start === 'marketing') {
          await setProgrammePath(START_PROGRAMME.marketing, level).catch(() => {})
        }
      }
      // Create their profile row now: an assessment result points at it. If
      // this fails, whatever needs it next creates it.
      await ensureProfile().catch(() => {})
      trackSignUp(method)
      trackEvent('onboarding_finish', { start: guide ? 'guide' : 'sign-in' })
      router.navigate({ href: takeAfterOnboarding() ?? homePath(), replace: true })
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not set up your account. Please try again.')
    }
  }

  useEffect(() => {
    if (started.current) return
    started.current = true
    void finish()
    // finish runs once, when the page opens.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function handleSignOut() {
    await signOut()
    router.navigate({ to: '/login' })
  }

  return (
    <div className="surface-wood-dark relative flex min-h-screen items-center justify-center overflow-hidden px-6">
      <GridBackdrop mask="ellipse 80% 60% at 50% 0%" />
      <GlowOrb className="-left-24 top-24 h-72 w-72" />
      <div className="relative max-w-sm text-center text-white">
        {error ? (
          <>
            <p className="font-display text-2xl font-semibold">Something went wrong</p>
            <p className="mt-2 text-sm text-white/70">{error}</p>
            <div className="mt-6 flex items-center justify-center gap-4">
              <button
                type="button"
                onClick={() => void finish()}
                className="rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-ink-900"
              >
                Try again
              </button>
              <button type="button" onClick={() => void handleSignOut()} className="text-sm font-medium text-white/70 hover:text-white">
                Sign out
              </button>
            </div>
          </>
        ) : (
          <p className="inline-flex items-center gap-2 text-base text-white/80">
            <Loader2 size={18} className="animate-spin" /> Getting MySkills ready for you…
          </p>
        )}
      </div>
    </div>
  )
}
