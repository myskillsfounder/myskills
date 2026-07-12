import { createFileRoute } from '@tanstack/react-router'
import { Users } from 'lucide-react'
import { requireOnboarded } from '@/lib/guards'
import { AppShell, PagePlaceholder } from '@/components/app/AppShell'

export const Route = createFileRoute('/community')({
  beforeLoad: requireOnboarded,
  component: CommunityPage,
})

function CommunityPage() {
  return (
    <AppShell>
      <PagePlaceholder title="Community" description="Connect with other marketing learners." icon={Users} />
    </AppShell>
  )
}
