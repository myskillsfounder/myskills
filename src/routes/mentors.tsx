import { createFileRoute } from '@tanstack/react-router'
import { glimpseOr } from '@/lib/guards'
import { Glimpse } from '@/components/landing/Glimpse'
import { MENTORS_GLIMPSE } from '@/content/glimpses'

// The mentors live in the Community: a signed-in student goes straight
// there. A visitor gets a glimpse of them first (Paul, 27 Oct 2026).
export const Route = createFileRoute('/mentors')({
  beforeLoad: () => glimpseOr('/community?category=mentors'),
  component: () => <Glimpse {...MENTORS_GLIMPSE} />,
})
