import { createFileRoute, redirect } from '@tanstack/react-router'

// The live support chat has been retired. A student who came here for a
// mentor finds them in the Community, where they ask one to work with them.
export const Route = createFileRoute('/support')({
  beforeLoad: () => {
    throw redirect({ to: '/community', search: { category: 'mentors' } })
  },
})
