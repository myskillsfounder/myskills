import { createFileRoute, redirect } from '@tanstack/react-router'

// Both aptitude results now live on /admin/aptitude; this keeps old links working.
export const Route = createFileRoute('/admin/_layout/dm-aptitude')({
  beforeLoad: () => {
    throw redirect({ to: '/admin/aptitude', search: { programme: 'digital-marketing' }, replace: true })
  },
})
