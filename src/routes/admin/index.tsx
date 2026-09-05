import { createFileRoute, redirect } from '@tanstack/react-router'

// Mentors is the only review queue so far; institutions and internships will
// join it, at which point this should become a hub instead of a redirect.
export const Route = createFileRoute('/admin/')({
  beforeLoad: () => {
    throw redirect({ to: '/admin/mentors' })
  },
  component: () => null,
})
