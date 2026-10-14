import { createFileRoute, redirect } from '@tanstack/react-router'

// This was where flagged accounts answered the live support chat, which has
// been retired. Mentors work with their students in the Community portal.
export const Route = createFileRoute('/mentor')({
  beforeLoad: () => {
    throw redirect({ to: '/community-portal' })
  },
})
