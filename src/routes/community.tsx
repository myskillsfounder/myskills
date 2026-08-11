import { createFileRoute, Outlet } from '@tanstack/react-router'
import { requireOnboarded } from '@/lib/guards'

/** Layout for /community and its sub-pages (e.g. /community/mentors). The
 * onboarding guard here covers every child route. */
export const Route = createFileRoute('/community')({
  beforeLoad: requireOnboarded,
  component: CommunityLayout,
})

function CommunityLayout() {
  return <Outlet />
}
