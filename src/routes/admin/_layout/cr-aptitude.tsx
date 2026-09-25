import { createFileRoute } from '@tanstack/react-router'
import { SKILLS, levelFor } from '@/lib/careerReadinessAssessment'
import { RequireSection } from '@/components/admin/AdminSectionGate'
import { AptitudeResults } from '@/components/admin/AptitudeResults'

export const Route = createFileRoute('/admin/_layout/cr-aptitude')({
  component: () => (
    <RequireSection section="users">
      <AptitudeResults
        programme="career-readiness"
        eyebrow="Career Readiness"
        title="Personal aptitude results"
        subtitle="Where students start on the five skills the programme builds. Each skill is scored 4–16."
        dimensions={SKILLS}
        levelFor={levelFor}
        reflectionLabel="Skill they most want to improve"
      />
    </RequireSection>
  ),
})
