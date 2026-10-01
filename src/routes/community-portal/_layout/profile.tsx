import { createFileRoute } from '@tanstack/react-router'
import { PageHeader } from '@/components/ui'
import { useMentorPortal } from '@/components/mentoring/MentorPortalContext'
import { MentorProfilePanel } from '@/components/mentoring/MentorProfilePanel'

export const Route = createFileRoute('/community-portal/_layout/profile')({
  component: ProfilePage,
})

function ProfilePage() {
  const { profile, reload } = useMentorPortal()
  return (
    <>
      <PageHeader
        eyebrow="Community portal"
        title="My profile"
        subtitle="What students see, how we reach you, and whether you’re taking new students."
      />
      <div className="max-w-2xl">
        <MentorProfilePanel profile={profile} onSaved={() => void reload()} />
      </div>
    </>
  )
}
