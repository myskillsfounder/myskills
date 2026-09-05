import { createFileRoute, Outlet } from '@tanstack/react-router'
import { ShieldAlert } from 'lucide-react'
import { requireOnboarded } from '@/lib/guards'
import { useIsAdmin } from '@/lib/mentors'
import { AppShell } from '@/components/app/AppShell'
import { EmptyState, Skeleton } from '@/components/ui'

/**
 * Layout for /admin and its children. The guard here only keeps signed-out
 * users away; the admin check below decides what renders.
 *
 * Neither is a security boundary — the client can't be trusted with that.
 * Every admin table and function enforces `is_admin()` in Postgres, so a
 * non-admin who forces this route sees empty lists and failed writes.
 */
export const Route = createFileRoute('/admin')({
  beforeLoad: requireOnboarded,
  component: AdminLayout,
})

function AdminLayout() {
  const admin = useIsAdmin()

  if (admin === null) {
    return (
      <AppShell wide>
        <Skeleton className="h-8 w-48" />
        <Skeleton className="mt-4 h-40 w-full" />
      </AppShell>
    )
  }

  if (!admin) {
    return (
      <AppShell wide>
        <EmptyState
          icon={ShieldAlert}
          title="Not available"
          description="This area is limited to MySkills administrators."
        />
      </AppShell>
    )
  }

  return <Outlet />
}
