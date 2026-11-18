import { createFileRoute, redirect } from '@tanstack/react-router'

// The old programme catalogue. Since 18 Nov 2026 a student chooses what to
// study in the Workbook ("Add a programme"), so this address goes there.
export const Route = createFileRoute('/programmes/')({
  beforeLoad: () => {
    throw redirect({ to: '/practice' })
  },
})
