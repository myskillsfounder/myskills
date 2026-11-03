import { createFileRoute, redirect } from '@tanstack/react-router'
import { requireOnboarded } from '@/lib/guards'
import { homePath } from '@/lib/device'

// The LaunchPad's old address, and where Google sign-in comes back to
// (lib/auth.ts): on to Study rooms, the app's first tab (Paul, 4 Nov 2026).
// The LaunchPad itself is the profile's "My progress". The guard runs first:
// a test answered before signing up, or a page picked before Google sign-in,
// still wins.
export const Route = createFileRoute('/dashboard')({
  beforeLoad: async (ctx) => {
    await requireOnboarded(ctx)
    throw redirect({ to: homePath() })
  },
})
