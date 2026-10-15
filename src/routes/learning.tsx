import { createFileRoute, redirect } from '@tanstack/react-router'

// An early page that was never linked, with a "coming soon" button; Practice replaced it. The address is kept so an old link still
// lands somewhere useful.
export const Route = createFileRoute('/learning')({
  beforeLoad: () => {
    throw redirect({ to: '/practice' })
  },
})
