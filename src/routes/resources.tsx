import { createFileRoute } from '@tanstack/react-router'
import { Library } from 'lucide-react'
import { requireOnboarded } from '@/lib/guards'
import { AppShell, PagePlaceholder } from '@/components/app/AppShell'

export const Route = createFileRoute('/resources')({
  beforeLoad: requireOnboarded,
  component: ResourcesPage,
})

function ResourcesPage() {
  return (
    <AppShell>
      <PagePlaceholder
        title="Resources"
        description="Guides, templates, and references for every marketing track."
        icon={Library}
      />
    </AppShell>
  )
}
