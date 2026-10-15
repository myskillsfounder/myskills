import {
  LEVEL_TONE_DARK,
  isLifeSkills,
  scaleFor,
  skillsFor,
  suggestedStart,
  type AssessmentResult as Result,
} from '@/lib/careerReadinessAssessment'
import { SkillProfile } from '@/components/self-assessment/Profile'

/**
 * A learner's Global Leadership starting point, in the shared dark result view:
 * their Leadership Aptitude Test (the 14 skills the programme builds), or, for someone who took
 * it before the profile existed, the earlier five skills. Where to start is
 * the module that builds their lowest skill: it's where the programme will
 * move the needle most.
 */
export function AssessmentResult({ result }: { result: Result }) {
  const start = suggestedStart(result.scores)
  const life = isLifeSkills(result.scores)
  const { min, max } = scaleFor(result.scores)
  return (
    <SkillProfile
      skills={skillsFor(result.scores).map((s) => ({
        key: s.key,
        name: s.name,
        score: s.score,
        level: s.level,
        readout: life ? `${s.readout} Built in: ${s.modules.join(', ')}.` : s.readout,
      }))}
      min={min}
      max={max}
      levelTone={LEVEL_TONE_DARK}
      start={{
        title: start.module,
        body: life
          ? `Your lowest starting point is ${start.skill}, and the ${start.module} module builds it, so it’s where the programme will move the needle most. The Global Leadership Programme is open — start here.`
          : 'It’s your lowest starting point, so it’s where the programme will move the needle most. The Global Leadership Programme is open — start here.',
        cta: { to: '/practice', label: 'Open the programme' },
      }}
      detail={{
        title: 'Where you are today',
        intro: life
          ? 'The 14 skills the programme builds, each read from how often you do the things that build it. A starting point, not a grade — it doesn’t change your Global Readiness Score.'
          : 'Each skill is read from how often you do the things that build it. A starting point, not a grade — it doesn’t change your Global Readiness Score.',
      }}
      reflection={result.reflection ? { label: 'The skill you want to improve', text: result.reflection } : null}
      footnote="Only you and the mentor working with you see this. Companies and institutions don’t."
    />
  )
}
