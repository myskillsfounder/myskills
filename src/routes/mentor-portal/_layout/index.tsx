import { createFileRoute, useRouter } from '@tanstack/react-router'
import { PageHeader } from '@/components/ui'
import { useMentorPortal } from '@/components/mentoring/MentorPortalContext'
import { StudentsPanel } from '@/components/mentoring/StudentsPanel'

export const Route = createFileRoute('/mentor-portal/_layout/')({
  component: StudentsPage,
})

function StudentsPage() {
  const router = useRouter()
  const { profile, rows, reload } = useMentorPortal()
  return (
    <>
      <PageHeader
        eyebrow="Mentor portal"
        title="Students & requests"
        subtitle="Students who asked you to mentor them, and the ones you’re working with. Arrange sessions your own way, then log each one here."
      />
      <StudentsPanel
        rows={rows}
        profile={profile}
        onChanged={() => void reload()}
        onOpenProfile={() => router.navigate({ to: '/mentor-portal/profile' })}
      />
    </>
  )
}
