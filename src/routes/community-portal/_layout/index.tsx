import { createFileRoute, useRouter } from '@tanstack/react-router'
import { PageHeader } from '@/components/ui'
import { useMentorPortalOptional } from '@/components/mentoring/MentorPortalContext'
import { StudentsPanel } from '@/components/mentoring/StudentsPanel'

export const Route = createFileRoute('/community-portal/_layout/')({
  component: StudentsPage,
})

function StudentsPage() {
  const router = useRouter()
  // A counsellor or a company has no mentor page; the layout sends them on.
  const mentor = useMentorPortalOptional()
  if (!mentor) return null
  const { profile, rows, reload } = mentor
  return (
    <>
      <PageHeader
        eyebrow="Community portal"
        title="Students & requests"
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
