import { createFileRoute } from '@tanstack/react-router'
import { APTITUDES, levelFor } from '@/lib/dmAptitude'
import { RequireSection } from '@/components/admin/AdminSectionGate'
import { AptitudeResults } from '@/components/admin/AptitudeResults'

export const Route = createFileRoute('/admin/_layout/dm-aptitude')({
  component: () => (
    <RequireSection section="users">
      <AptitudeResults
        programme="digital-marketing"
        eyebrow="Digital Marketing"
        title="Aptitude results"
        subtitle="How marketing already shows up in students’ lives, before they practise. Each aptitude is scored 4–16."
        dimensions={APTITUDES}
        levelFor={levelFor}
        reflectionLabel="In their words"
      />
    </RequireSection>
  ),
})
