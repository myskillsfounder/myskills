import { createFileRoute, redirect } from '@tanstack/react-router'
import { requireOnboarded } from '@/lib/guards'

// The LaunchPad became the profile's "My progress" tab, and Study rooms the
// app's first tab (Paul, 3 Nov 2026). The guard runs first: a test answered
// before signing up, or a page picked before Google sign-in, still wins.
export const Route = createFileRoute('/dashboard')({
  beforeLoad: async (ctx) => {
    await requireOnboarded(ctx)
    throw redirect({ to: '/profile' })
  },
})
