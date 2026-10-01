import { createFileRoute } from '@tanstack/react-router'
import { useMentorPortalOptional, usePortalAccess, usePortalName } from '@/components/mentoring/MentorPortalContext'
import { PortalHome } from '@/components/mentoring/PortalHome'

export const Route = createFileRoute('/community-portal/_layout/')({
  component: HomePage,
})

/** The portal's front page: totals, what needs attention, and a card per section. */
function HomePage() {
  const mentor = useMentorPortalOptional()
  return (
    <PortalHome
      name={usePortalName()}
      access={usePortalAccess()}
      mentorRows={mentor?.rows ?? []}
      isMentor={Boolean(mentor)}
    />
  )
}
