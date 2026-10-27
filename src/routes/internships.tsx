import { createFileRoute } from '@tanstack/react-router'
import { glimpseOr } from '@/lib/guards'
import { Glimpse } from '@/components/landing/Glimpse'
import { INTERNSHIPS_GLIMPSE } from '@/content/glimpses'

// Internships live in the Community, with the other things a student comes
// for: a signed-in student goes straight there. A visitor gets a glimpse of
// them first (Paul, 27 Oct 2026).
export const Route = createFileRoute('/internships')({
  beforeLoad: () => glimpseOr('/community?category=internships'),
  component: () => <Glimpse {...INTERNSHIPS_GLIMPSE} />,
})
