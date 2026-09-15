import { createFileRoute, redirect } from '@tanstack/react-router'

/**
 * /partnerships/login was folded into /admin/login — see
 * src/routes/partnerships.tsx for why this is a redirect stub, not deleted
 * outright.
 */
export const Route = createFileRoute('/partnerships/login')({
  beforeLoad: () => {
    throw redirect({ to: '/admin/login' })
  },
})
