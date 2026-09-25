import { useEffect } from 'react'
import { createFileRoute, Link } from '@tanstack/react-router'
import { ArrowLeft } from 'lucide-react'
import { requireOnboarded } from '@/lib/guards'
import { moduleContent } from '@/lib/careerReadinessContent'
import { useCareerReadinessProgress } from '@/lib/careerReadinessProgramme'
import { PERSONAL_DEVELOPMENT_MODULES } from '@/lib/programmes'
import { rememberProgramme } from '@/lib/practiceProgramme'
import { AppShell } from '@/components/app/AppShell'
import { PageHeader } from '@/components/app/PageHeader'
import { ModuleFlow } from '@/components/career-readiness/ModuleFlow'

// Not in PAGE_SEO on purpose — it's behind sign-in.
export const Route = createFileRoute('/career-module/$slug')({
  beforeLoad: requireOnboarded,
  component: CareerModulePage,
})

function CareerModulePage() {
  const { slug } = Route.useParams()
  const { responses, progress, loading, save } = useCareerReadinessProgress()
  const content = moduleContent(slug)
  const index = PERSONAL_DEVELOPMENT_MODULES.findIndex((m) => m.slug === slug)
  const meta = PERSONAL_DEVELOPMENT_MODULES[index]

  // Practice opens on the programme last used; coming from a module, that's this one.
  useEffect(() => rememberProgramme(2), [])

  return (
    <AppShell wide>
      <Link
        to="/practice"
        className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-ink-600 hover:text-ink-900"
      >
        <ArrowLeft size={16} /> Back to Practice
      </Link>

      {!content || !meta ? (
        <p className="text-sm text-ink-600">We couldn’t find that module.</p>
      ) : (
        <div className="mx-auto max-w-3xl">
          <PageHeader
            eyebrow={`Career Readiness · Module ${index + 1} of ${PERSONAL_DEVELOPMENT_MODULES.length}`}
            title={meta.title}
            description={content.outcome}
          />
          {loading ? (
            <p className="text-sm text-ink-600">Loading…</p>
          ) : (
            <ModuleFlow
              // Reset the flow when moving to another module.
              key={slug}
              content={content}
              index={index}
              total={PERSONAL_DEVELOPMENT_MODULES.length}
              responses={responses}
              progress={progress}
              onSave={(item, text) => save(content.slug, item, text)}
            />
          )}
        </div>
      )}
    </AppShell>
  )
}
