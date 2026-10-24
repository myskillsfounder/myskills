import { strongestAptitude, type AptitudeKey } from './dmAptitude'
import { skillsFor, type SkillKey } from './careerReadinessAssessment'
import type { TestRoute } from './pendingAptitude'

/**
 * A visitor's strongest skill from a test taken before signing up: a taste of
 * the result, shown before the account that unlocks the rest. Worked out the
 * way the server scores it (a sum per skill, reversed statements as 5 - answer)
 * so the name matches the result they see after signing up.
 */
export function strongestFor(
  route: TestRoute,
  questions: { id: string; skill: string; reverse?: boolean }[],
  answers: Record<string, number>,
): string | undefined {
  const totals: Record<string, number> = {}
  for (const q of questions) {
    const v = answers[q.id]
    if (v === undefined) continue
    totals[q.skill] = (totals[q.skill] ?? 0) + (q.reverse ? 5 - v : v)
  }
  if (Object.keys(totals).length === 0) return undefined
  if (route === '/aptitude-assessment') return strongestAptitude(totals as Record<AptitudeKey, number>).name
  const skills = skillsFor(totals as Partial<Record<SkillKey, number>>)
  return skills.reduce((a, b) => (b.score > a.score ? b : a), skills[0])?.name
}
