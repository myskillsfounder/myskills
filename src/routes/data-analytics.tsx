import { createFileRoute } from '@tanstack/react-router'
import { BarChart3 } from 'lucide-react'
import { EngineCoursePage } from '@/components/landing/EngineCoursePage'
import { COURSES, DATA_ANALYTICS } from '@/content/courses'

/**
 * AI-Powered Data Analytics' public page (Paul, 27 Oct 2026: "open data
 * analytics on the website"), like /entrepreneurship. Its lessons run on the
 * course engine (/programmes/data-analytics, signed in); this page is the way
 * in, and its button opens the aptitude test, which a visitor can take before
 * signing up.
 */
export const Route = createFileRoute('/data-analytics')({
  component: DataAnalyticsPage,
})

const course = COURSES.find((c) => c.id === 'data-analytics')!

function DataAnalyticsPage() {
  return (
    <EngineCoursePage
      course={course}
      content={DATA_ANALYTICS}
      icon={BarChart3}
      accent={{ title: 'from-emerald-300 to-teal-200', band: 'from-emerald-500/20 to-brand-500/20' }}
      glow="rgba(52,211,153,0.14)"
      closing={{
        title: 'Start with what you’re already good at',
        body: 'The aptitude test shows your strongest analyst skill; your modules start with the rest.',
      }}
    />
  )
}
