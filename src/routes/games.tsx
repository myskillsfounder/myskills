import { createFileRoute } from '@tanstack/react-router'
import { Gamepad2 } from 'lucide-react'
import { requireOnboarded } from '@/lib/guards'
import { AppShell, PagePlaceholder } from '@/components/app/AppShell'

export const Route = createFileRoute('/games')({
  beforeLoad: requireOnboarded,
  component: GamesPage,
})

function GamesPage() {
  return (
    <AppShell>
      <PagePlaceholder
        title="Games"
        description="Play quick marketing games to build instincts and speed."
        icon={Gamepad2}
      />
    </AppShell>
  )
}
