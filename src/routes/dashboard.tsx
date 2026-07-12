import { createFileRoute } from '@tanstack/react-router'
import { LayoutDashboard } from 'lucide-react'
import { requireOnboarded } from '@/lib/guards'
import { AppShell, PagePlaceholder } from '@/components/app/AppShell'

export const Route = createFileRoute('/dashboard')({
  beforeLoad: requireOnboarded,
  component: DashboardPage,
})

function DashboardPage() {
  return (
    <AppShell>
      <PagePlaceholder title="Dashboard" description="Your progress, scores, and skill mastery at a glance." icon={LayoutDashboard} />
    </AppShell>
  )
}
