import { createFileRoute, redirect } from '@tanstack/react-router'

// Assessments were merged into the Practice page. Keep this path working.
export const Route = createFileRoute('/assessment')({
  beforeLoad: () => {
    throw redirect({ to: '/practice' })
  },
  component: () => null,
})
