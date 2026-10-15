import { createFileRoute, redirect } from '@tanstack/react-router'

// This page was only ever a placeholder; Practice has the material. The address is kept so an old link still
// lands somewhere useful.
export const Route = createFileRoute('/resources')({
  beforeLoad: () => {
    throw redirect({ to: '/practice' })
  },
})
