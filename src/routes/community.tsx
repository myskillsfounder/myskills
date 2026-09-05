import { createFileRoute, Outlet } from '@tanstack/react-router'
import { requireOnboardedIfSignedIn } from '@/lib/guards'

/**
 * Layout for /community and its sub-pages.
 *
 * /community itself is dual-purpose: index.tsx renders a public marketing
 * page (become a mentor, etc.) for signed-out visitors, and the authenticated
 * Community hub for onboarded users — so the guard here only enforces the
 * onboarding gate, not sign-in itself. Sub-pages that ARE authenticated-only
 * (e.g. mentors.tsx) carry their own requireOnboarded guard.
 */
export const Route = createFileRoute('/community')({
  beforeLoad: requireOnboardedIfSignedIn,
  component: CommunityLayout,
})

function CommunityLayout() {
  return <Outlet />
}
