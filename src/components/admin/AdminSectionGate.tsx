import type { ReactNode } from 'react'
import { ShieldAlert } from 'lucide-react'
import { useStaffAccessContext, type StaffSection } from '@/lib/staffAccess'
import { EmptyState, Skeleton } from '@/components/ui'

function Loading() {
  return (
    <>
      <Skeleton className="h-8 w-48" />
      <Skeleton className="mt-4 h-40 w-full" />
    </>
  )
}

function Denied() {
  return (
    <EmptyState
      icon={ShieldAlert}
      title="Not available"
      description="You don't have access to this section."
    />
  )
}

/** Gates one /admin leaf page to a single section grant (or full admin,
 *  which passes every section). Each page wraps its existing body in this —
 *  the loading/denied states mirror the same three-way branch every other
 *  admin/staff gate in this app already uses. */
export function RequireSection({ section, children }: { section: StaffSection; children: ReactNode }) {
  const { isAdmin, sections } = useStaffAccessContext()

  if (isAdmin === null || sections === null) return <Loading />
  if (!isAdmin && !sections.includes(section)) return <Denied />
  return <>{children}</>
}

/** Gates a page to full admins only — today just Overview, which aggregates
 *  every section's stats in one call and isn't itself a grantable section. */
export function RequireAdmin({ children }: { children: ReactNode }) {
  const { isAdmin } = useStaffAccessContext()

  if (isAdmin === null) return <Loading />
  if (!isAdmin) return <Denied />
  return <>{children}</>
}
