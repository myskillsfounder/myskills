import { createFileRoute, redirect } from '@tanstack/react-router'
import { requireOnboarded } from '@/lib/guards'

/**
 * There used to be a separate mentors page here. Mentors now live in the
 * Community page itself (each card opens its profile in place), so this
 * address only forwards there, filtered to mentors — which keeps old links,
 * bookmarks and the landing page's "meet the mentors" links working.
 * Signed-out visitors are still sent to sign in first, as before.
 */
export const Route = createFileRoute('/community/mentors')({
  beforeLoad: async () => {
    await requireOnboarded()
    throw redirect({ to: '/community', search: { category: 'mentors' }, replace: true })
  },
})
