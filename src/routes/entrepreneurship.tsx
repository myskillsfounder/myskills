import { createFileRoute } from '@tanstack/react-router'
import { Rocket } from 'lucide-react'
import { EngineCoursePage } from '@/components/landing/EngineCoursePage'
import { COURSES, ENTREPRENEURSHIP } from '@/content/courses'

/**
 * AI-Powered Entrepreneurship's public page, like /digital-marketing and
 * /career-readiness for the built-in courses. Its lessons run on the course
 * engine (/programmes/ai-powered-entrepreneurship, signed in); this page is
 * the way in, and its button opens the aptitude test, which a visitor can take
 * before signing up.
 */
export const Route = createFileRoute('/entrepreneurship')({
  component: EntrepreneurshipPage,
})

const course = COURSES.find((c) => c.id === 'entrepreneurship')!

function EntrepreneurshipPage() {
  return (
    <EngineCoursePage
      course={course}
      content={ENTREPRENEURSHIP}
      icon={Rocket}
      accent={{ title: 'from-rose-300 to-brand-300', band: 'from-rose-500/20 to-brand-500/20' }}
      glow="rgba(244,114,182,0.14)"
      closing={{
        title: 'Start with what you’re already good at',
        body: 'The aptitude test shows your strongest founder skill; your modules start with the rest.',
      }}
    />
  )
}
