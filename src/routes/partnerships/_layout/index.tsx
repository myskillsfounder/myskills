import { createFileRoute, redirect } from '@tanstack/react-router'

export const Route = createFileRoute('/partnerships/_layout/')({
  beforeLoad: () => {
    throw redirect({ to: '/partnerships/mentors' })
  },
})
