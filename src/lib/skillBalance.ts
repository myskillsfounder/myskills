/**
 * Skill balance: five areas a student is building, each 0-1, measured two
 * ways for the LaunchPad's radar.
 *
 *   aptitude  where they started: their aptitude tests (self-assessed, never
 *             scored). Marketing from the marketing aptitude test; the other
 *             four from the Leadership Aptitude Test, grouped by area.
 *   progress  the work they have done since: Marketing is the average best
 *             score across the 8 practice tracks (untried tracks count 0); each
 *             other area is the share of its modules' tasks written.
 *
 * The two are different measures on purpose, and the card says so: one is
 * where they began, the other how far they have gone.
 */
import type { ModuleSlug } from './programmes'
import type { AptitudeKey } from './dmAptitude'
import type { SkillKey } from './careerReadinessAssessment'
import { skillsFor } from './careerReadinessAssessment'
import { skillKeyForModule } from './lifeSkills'
import type { ModuleProgress } from './careerReadinessProgramme'

export type BalanceArea = 'marketing' | 'leadership' | 'thinking' | 'people' | 'self'

export const BALANCE_AREAS: { key: BalanceArea; label: string; modules: ModuleSlug[] }[] = [
  { key: 'leadership', label: 'Leadership', modules: ['goal-setting', 'leadership', 'agile', 'growth-mindset'] },
  { key: 'marketing', label: 'Marketing', modules: [] },
  { key: 'people', label: 'People', modules: ['communication', 'empathy', 'relationships'] },
  { key: 'self', label: 'Self', modules: ['self-awareness', 'coping-stress', 'coping-emotions'] },
  { key: 'thinking', label: 'Thinking', modules: ['critical-thinking', 'creative-thinking', 'decision-making', 'problem-solving'] },
]

export type Balance = Record<BalanceArea, number | null>

const clamp = (n: number) => Math.max(0, Math.min(1, n))
const mean = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : null)

/** Where they started. Null for an area whose test they haven't taken. */
export function aptitudeBalance(
  dmScores: Partial<Record<AptitudeKey, number>> | null,
  crScores: Partial<Record<SkillKey, number>> | null,
): Balance {
  const out: Balance = { marketing: null, leadership: null, thinking: null, people: null, self: null }
  if (dmScores) {
    // Each marketing aptitude is 4-16.
    out.marketing = mean(Object.values(dmScores).filter((v): v is number => typeof v === 'number').map((v) => clamp((v - 4) / 12)))
  }
  if (crScores) {
    const skills = skillsFor(crScores)
    for (const a of BALANCE_AREAS) {
      if (a.key === 'marketing') continue
      const vals = a.modules.flatMap((m) => {
        const s = skills.find((x) => x.key === skillKeyForModule(m))
        if (!s) return []
        // A quarter of the maximum is the floor (3 of 12, 4 of 16).
        const min = s.max / 4
        return [clamp((s.score - min) / (s.max - min))]
      })
      out[a.key] = mean(vals)
    }
  }
  return out
}

/** The work done since. Always a number: nothing done is 0. */
export function progressBalance(trackPercents: number[], totalTracks: number, modules: ModuleProgress[]): Balance {
  const out: Balance = { marketing: 0, leadership: 0, thinking: 0, people: 0, self: 0 }
  out.marketing = totalTracks ? clamp(trackPercents.reduce((a, p) => a + p / 100, 0) / totalTracks) : 0
  for (const a of BALANCE_AREAS) {
    if (a.key === 'marketing') continue
    const ms = modules.filter((m) => a.modules.includes(m.slug as ModuleSlug))
    const total = ms.reduce((n, m) => n + m.total, 0)
    out[a.key] = total ? ms.reduce((n, m) => n + m.done, 0) / total : 0
  }
  return out
}

export const hasAny = (b: Balance) => Object.values(b).some((v) => v != null && v > 0)
