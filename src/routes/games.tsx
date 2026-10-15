import { createFileRoute, redirect } from '@tanstack/react-router'

// This page was only ever a placeholder; Practice is where the practising is. The address is kept so an old link still
// lands somewhere useful.
export const Route = createFileRoute('/games')({
  beforeLoad: () => {
    throw redirect({ to: '/practice' })
  },
})
