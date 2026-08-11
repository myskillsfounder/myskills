import { createFileRoute, Link } from '@tanstack/react-router'
import { ArrowLeft, GraduationCap } from 'lucide-react'
import { AppShell, PagePlaceholder } from '@/components/app/AppShell'

export const Route = createFileRoute('/community/mentors')({
  component: MentorsPage,
})

function MentorsPage() {
  return (
    <AppShell>
      <Link
        to="/community"
        className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-ink-500 hover:text-ink-900"
      >
        <ArrowLeft size={16} /> Back to Community
      </Link>
      <PagePlaceholder
        title="Mentors"
        description="Connect with experienced marketing mentors."
        icon={GraduationCap}
      />
    </AppShell>
  )
}
