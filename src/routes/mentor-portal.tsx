import { createFileRoute, redirect } from '@tanstack/react-router'

// The mentor portal is now the Community portal. Emails already sent, and
// bookmarks, still point here, so this address forwards to the new one.
export const Route = createFileRoute('/mentor-portal')({
  beforeLoad: () => {
    throw redirect({ to: '/community-portal', replace: true })
  },
})
