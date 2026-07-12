import { createFileRoute } from '@tanstack/react-router'
import { FileText } from 'lucide-react'
import { requireOnboarded } from '@/lib/guards'
import { AppShell, PagePlaceholder } from '@/components/app/AppShell'

export const Route = createFileRoute('/tests')({
  beforeLoad: requireOnboarded,
  component: TestsPage,
})

function TestsPage() {
  return (
    <AppShell>
      <PagePlaceholder
        title="Tests"
        description="Timed knowledge tests to benchmark where you stand."
        icon={FileText}
      />
    </AppShell>
  )
}
