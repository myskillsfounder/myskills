import { createFileRoute, redirect } from '@tanstack/react-router'

// The Tests page was removed. Keep the path working by redirecting.
export const Route = createFileRoute('/tests')({
  beforeLoad: () => {
    throw redirect({ to: '/dashboard' })
  },
  component: () => null,
})
