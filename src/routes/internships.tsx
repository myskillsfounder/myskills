import { createFileRoute } from '@tanstack/react-router'
import { Handshake } from 'lucide-react'
import { requireOnboarded } from '@/lib/guards'
import { AppShell, PagePlaceholder } from '@/components/app/AppShell'

export const Route = createFileRoute('/internships')({
  beforeLoad: requireOnboarded,
  component: InternshipsPage,
})

function InternshipsPage() {
  return (
    <AppShell>
      <PagePlaceholder
        title="Internships"
        description="Apply your skills on real briefs with partner companies."
        icon={Handshake}
      />
    </AppShell>
  )
}
