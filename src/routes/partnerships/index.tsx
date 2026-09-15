import { createFileRoute, redirect } from '@tanstack/react-router'

export const Route = createFileRoute('/partnerships/')({
  beforeLoad: () => {
    throw redirect({ to: '/partnerships/mentors' })
  },
})
