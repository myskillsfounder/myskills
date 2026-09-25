import {
  LEVEL_TONE_DARK,
  READOUT,
  SKILL_MAX,
  SKILL_MIN,
  orderedSkills,
  suggestedStart,
  type AssessmentResult as Result,
} from '@/lib/careerReadinessAssessment'
import { SkillProfile } from '@/components/self-assessment/Profile'

/**
 * A learner's Career Readiness starting point — the shared dark result view
 * fed with the five programme skills. The module to start with is the lowest
 * skill: it's where the programme will move the needle most.
 */
export function AssessmentResult({ result }: { result: Result }) {
  const start = suggestedStart(result.scores)
  return (
    <SkillProfile
      skills={orderedSkills(result.scores).map((s) => ({
        key: s.key,
        name: s.name,
        score: s.score,
        level: s.level,
        readout: READOUT[s.key][s.level],
      }))}
      min={SKILL_MIN}
      max={SKILL_MAX}
      levelTone={LEVEL_TONE_DARK}
      start={{
        title: start.module,
        body: 'It’s your lowest starting point, so it’s where the programme will move the needle most. The Career Readiness Programme is open — start here.',
        cta: { to: '/practice', label: 'Open the programme' },
      }}
      detail={{
        title: 'Where you are today',
        intro:
          'Each skill is read from how often you do the things that build it. A starting point, not a grade — it doesn’t change your Career Readiness Score.',
      }}
      reflection={result.reflection ? { label: 'The skill you want to improve', text: result.reflection } : null}
      footnote="Mentors see this summary when they review your Career Readiness progress. You get one attempt at this assessment."
    />
  )
}
