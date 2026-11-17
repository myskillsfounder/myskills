import { Link } from '@tanstack/react-router'
import { MODULE_CONTENT } from '@/lib/careerReadinessContent'
import type { ProgrammeProgress } from '@/lib/careerReadinessProgramme'
import { PERSONAL_DEVELOPMENT_MODULES } from '@/lib/programmes'
import { SectionHeader } from '@/components/app/SectionHeader'
import { ModuleCard } from '@/components/lesson/ModuleCard'
import { GlobalLeadershipFoundation } from './GlobalLeadershipFoundation'
import { lifeSkillsForModule, skillKeyForModule } from '@/lib/lifeSkills'
import { CORE_MODULES } from '@/lib/careerReadinessContent'
import { isLifeSkills, levelFor, scaleFor, useMyAssessmentResult } from '@/lib/careerReadinessAssessment'

/**
 * The Global Leadership Programme's fourteen modules, live on /practice beside
 * Digital Marketing's. Each card shows how far the learner is through that
 * module and opens it. The list is shared with /career-readiness.
 */
export function CareerReadinessPractice({ progress }: { progress: ProgrammeProgress }) {
  // The student's starting level in each module's skill, from their Life
  // aptitude test (not shown for the earlier, five-skill version).
  const { result } = useMyAssessmentResult()
  const levelIn = (slug: (typeof CORE_MODULES)[number] | string) => {
    if (!result || !isLifeSkills(result.scores)) return null
    const key = skillKeyForModule(slug as (typeof CORE_MODULES)[number])
    const score = key ? (result.scores as Record<string, number>)[key] : undefined
    return score == null ? null : levelFor(score, scaleFor(result.scores).max)
  }
  return (
    <section>
      <SectionHeader
        eyebrow="Global Leadership"
        title="Modules"
        description="One for each skill in the Leadership Aptitude Test. Each is a short lesson: read it, practise it in writing, then reflect."
      />
      <ol className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {PERSONAL_DEVELOPMENT_MODULES.map((m, i) => {
          const p = progress.modules.find((x) => x.slug === m.slug)
          const content = MODULE_CONTENT.find((c) => c.slug === m.slug)
          const done = p?.done ?? 0
          const total = p?.total ?? 4
          const level = levelIn(m.slug)
          // One dot for each thing to write: the tasks, then the reflection.
          const steps = Array.from({ length: total }, (_, k) => ({ label: k === total - 1 ? 'Reflect' : `Task ${k + 1}`, done: k < done }))
          return (
            <li key={m.slug}>
              <ModuleCard
                n={i + 1}
                title={m.title}
                blurb={content?.outcome ?? m.body}
                meta={`Builds: ${lifeSkillsForModule(m.slug).join(' · ')}${level ? ` · you started at ${level}` : ''}`}
                minutes={content?.minutes ?? 45}
                steps={steps}
                tag={CORE_MODULES.includes(m.slug) ? 'Core' : undefined}
                link={(cls, inner) => (
                  <Link to="/career-module/$slug" params={{ slug: m.slug }} className={cls}>
                    {inner}
                  </Link>
                )}
              />
            </li>
          )
        })}
      </ol>
      <GlobalLeadershipFoundation />
    </section>
  )
}
