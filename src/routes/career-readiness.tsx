import { createFileRoute } from '@tanstack/react-router'
import { Globe2 } from 'lucide-react'
import { EngineCoursePage } from '@/components/landing/EngineCoursePage'
import { COURSES, GLOBAL_LEADERSHIP } from '@/content/courses'

// Indexed: it has its own entry in PAGE_SEO and SITEMAP_ROUTES (src/lib/seo.ts)
// and is prerendered by scripts/generate-seo.mjs from
// src/content/career-readiness.json. On the layout every course page shares
// (Paul, 28 Oct 2026: similar things shouldn't look different).
export const Route = createFileRoute('/career-readiness')({
  component: GlobalLeadershipPage,
})

const course = COURSES.find((c) => c.id === 'global-leadership')!

function GlobalLeadershipPage() {
  return (
    <EngineCoursePage
      course={course}
      content={GLOBAL_LEADERSHIP}
      icon={Globe2}
      accent={{ title: 'from-amber-200 to-orange-300', band: 'from-amber-500/20 to-brand-500/20' }}
      glow="rgba(251,191,36,0.14)"
      closing={{
        title: 'Start with what you’re already good at',
        body: 'The Leadership Aptitude Test shows your strongest skills; your modules start with the rest.',
      }}
    />
  )
}
