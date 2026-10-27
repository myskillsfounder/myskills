import { createFileRoute } from '@tanstack/react-router'
import { Megaphone } from 'lucide-react'
import { EngineCoursePage } from '@/components/landing/EngineCoursePage'
import { COURSES, DIGITAL_MARKETING } from '@/content/courses'

/**
 * The Digital Marketing Programme's own page, on the layout every course page
 * shares (Paul, 28 Oct 2026: similar things shouldn't look different).
 */
export const Route = createFileRoute('/digital-marketing')({
  component: DigitalMarketingPage,
})

const course = COURSES.find((c) => c.id === 'digital-marketing')!

function DigitalMarketingPage() {
  return (
    <EngineCoursePage
      course={course}
      content={DIGITAL_MARKETING}
      icon={Megaphone}
      accent={{ title: 'from-brand-300 to-sky-200', band: 'from-brand-500/25 to-sky-500/15' }}
      glow="rgba(143,133,238,0.18)"
      closing={{
        title: 'Start with what you already notice',
        body: 'The aptitude test shows the parts of marketing that come most naturally to you.',
      }}
    />
  )
}
