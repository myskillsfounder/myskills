import { createFileRoute, Navigate, useRouter } from '@tanstack/react-router'
import { PageHeader } from '@/components/ui'
import { useMentorPortalOptional } from '@/components/mentoring/MentorPortalContext'
import { StudentsPanel } from '@/components/mentoring/StudentsPanel'

export const Route = createFileRoute('/community-portal/_layout/students')({
  component: StudentsPage,
})

function StudentsPage() {
  const router = useRouter()
  // Only a mentor has students of their own to answer; anyone else is sent home.
  const mentor = useMentorPortalOptional()
  if (!mentor) return <Navigate to="/community-portal" replace />
  const { profile, rows, reload } = mentor
  return (
    <>
      <PageHeader
        eyebrow="Community portal"
        title="My students"
        subtitle="Students who asked you to mentor them, and the ones you’re working with. Arrange sessions your own way, then log each one here."
      />
      <StudentsPanel
        rows={rows}
        profile={profile}
        onChanged={() => void reload()}
        onOpenProfile={() => router.navigate({ to: '/community-portal/profile' })}
      />
    </>
  )
}
