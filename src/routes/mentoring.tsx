import { createFileRoute, redirect } from '@tanstack/react-router'

// The mentor portal moved to /mentor-portal, with its own sign-in. Emails
// already sent link here, so the old address forwards.
export const Route = createFileRoute('/mentoring')({
  beforeLoad: () => {
    throw redirect({ to: '/mentor-portal' })
  },
})
