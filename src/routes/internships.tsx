import { createFileRoute, redirect } from '@tanstack/react-router'

// Internships live in the Community, with the other things a student comes
// for. This address is kept so an old link still lands on them.
export const Route = createFileRoute('/internships')({
  beforeLoad: () => {
    throw redirect({ to: '/community', search: { category: 'internships' } })
  },
})
