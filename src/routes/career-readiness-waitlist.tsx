import { createFileRoute, redirect } from '@tanstack/react-router'

// The waitlist is retired — the programme is open. Old links and bookmarks
// (and the leads already collected, in career_readiness_leads) still resolve.
export const Route = createFileRoute('/career-readiness-waitlist')({
  beforeLoad: () => {
    throw redirect({ to: '/career-readiness' })
  },
})
