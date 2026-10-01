import { createFileRoute } from '@tanstack/react-router'
import { Lock } from 'lucide-react'
import { RESOURCE_LABEL, isGrantedResource } from '@/lib/communityPortal'
import { usePortalAccess } from '@/components/mentoring/MentorPortalContext'
import { ResourcePanel } from '@/components/mentoring/ResourcePanel'
import { MentorsOverview } from '@/components/mentoring/MentorsOverview'
import { EmptyState, PageHeader } from '@/components/ui'

// /community-portal/wellness, /guidance, /internships, /institutions — and
// /mentors for an account with the Mentors overview. The
// server decides what an account may read; this only avoids showing a page
// that would come back empty-handed.
export const Route = createFileRoute('/community-portal/_layout/$resource')({
  component: ResourcePage,
})

function ResourcePage() {
  const { resource } = Route.useParams()
  const access = usePortalAccess()
  const mine = access.find((a) => a.resource === resource)

  if (resource === 'mentors' && mine?.sees_all) {
    return (
      <>
        <PageHeader eyebrow="Community portal" title="Mentors" />
        <MentorsOverview />
      </>
    )
  }

  if (!isGrantedResource(resource) || !mine) {
    return (
      <EmptyState
        icon={Lock}
        title="You don’t have access to this section"
        description="Each part of the Community portal is opened separately. If you should have this one, ask the MySkills team."
      />
    )
  }

  return (
    <>
      <PageHeader eyebrow="Community portal" title={RESOURCE_LABEL[resource]} />
      <ResourcePanel
        key={resource}
        resource={resource}
        organisation={mine.organisation}
        seesAll={mine.sees_all === true}
      />
    </>
  )
}
