import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { APTITUDES, levelFor as marketingLevel } from '@/lib/dmAptitude'
import { SKILLS, levelFor as personalLevel } from '@/lib/careerReadinessAssessment'
import { RequireSection } from '@/components/admin/AdminSectionGate'
import { AptitudeResults } from '@/components/admin/AptitudeResults'

type Programme = 'digital-marketing' | 'career-readiness'

// One page for both aptitude assessments (they were two sidebar links). The
// programme is in the address, so /admin/aptitude?programme=career-readiness
// can be linked to; the old /admin/dm-aptitude and /admin/cr-aptitude forward here.
export const Route = createFileRoute('/admin/_layout/aptitude')({
  validateSearch: (s: Record<string, unknown>): { programme?: Programme } => ({
    programme: s.programme === 'career-readiness' || s.programme === 'digital-marketing' ? s.programme : undefined,
  }),
  component: () => (
    <RequireSection section="users">
      <AptitudePage />
    </RequireSection>
  ),
})

const TABS: { id: Programme; label: string }[] = [
  { id: 'digital-marketing', label: 'Marketing aptitude' },
  { id: 'career-readiness', label: 'Personal aptitude' },
]

function AptitudePage() {
  const { programme = 'digital-marketing' } = Route.useSearch()
  const navigate = useNavigate({ from: '/admin/aptitude' })
  return (
    <>
      <div role="tablist" aria-label="Aptitude assessment" className="mb-5 flex flex-wrap gap-2">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            role="tab"
            aria-selected={programme === t.id}
            onClick={() => void navigate({ search: { programme: t.id }, replace: true })}
            className={`rounded-full border px-4 py-1.5 text-sm font-medium transition-colors ${
              programme === t.id ? 'border-brand-500 bg-brand-50 text-brand-800' : 'border-ink-300 text-ink-600 hover:bg-ink-100'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>
      {programme === 'digital-marketing' ? (
        <AptitudeResults
          key="dm"
          programme="digital-marketing"
          eyebrow="Digital Marketing"
          title="Marketing aptitude results"
          subtitle="How marketing already shows up in students’ lives, before they practise. Each aptitude is scored 4–16."
          dimensions={APTITUDES}
          levelFor={marketingLevel}
          reflectionLabel="In their words"
        />
      ) : (
        <AptitudeResults
          key="cr"
          programme="career-readiness"
          eyebrow="Career Readiness"
          title="Personal aptitude results"
          subtitle="Where students start on the five skills the programme builds. Each skill is scored 4–16."
          dimensions={SKILLS}
          levelFor={personalLevel}
          reflectionLabel="Skill they most want to improve"
        />
      )}
    </>
  )
}
