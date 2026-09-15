import { createFileRoute, redirect } from '@tanstack/react-router'

/**
 * /partnerships was folded into /admin (see docs/supabase-staff-permissions.sql
 * and src/routes/admin/_layout.tsx) — Mentors, Institution Partners and Demo
 * Requests are now three more grantable sections there instead of their own
 * bundled portal. Kept as a redirect stub, not deleted outright, so an
 * existing bookmark or saved password-manager entry still lands somewhere
 * correct instead of 404ing.
 */
export const Route = createFileRoute('/partnerships')({
  beforeLoad: () => {
    throw redirect({ to: '/admin' })
  },
})
