import { ArrowRight, HeartHandshake } from 'lucide-react'
import { ButtonLink, Card } from '@/components/ui'

/**
 * Dashboard doorway to /wellness — counselling and career-guidance requests.
 * Sits in the aside where Prompt Library used to (see dashboard.tsx); Prompt
 * Library moved to the sidebar nav instead of losing its only entry point.
 */
export function WellnessSupportCard() {
  return (
    <Card className="p-5">
      <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-500 to-brand-700 text-white shadow-sm">
        <HeartHandshake size={18} />
      </span>
      <p className="mt-3 font-display text-lg font-semibold text-ink-900">Wellness Support</p>
      <p className="mt-1 text-sm leading-relaxed text-ink-600">
        Confidential counselling and career guidance — because doing well starts with feeling
        well.
      </p>
      <ButtonLink to="/wellness" variant="secondary" size="sm" className="mt-3" iconRight={ArrowRight}>
        Explore
      </ButtonLink>
    </Card>
  )
}
