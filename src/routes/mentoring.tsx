import { createFileRoute, redirect } from '@tanstack/react-router'

// The mentor portal became the Community portal at /community-portal, with its own sign-in. Emails
// already sent link here, so the old address forwards.
export const Route = createFileRoute('/mentoring')({
  beforeLoad: () => {
    throw redirect({ to: '/community-portal' })
  },
})
