/**
 * Mentors for a student, best fit first: their expertise, headline and bio
 * against what the student has told us and done. No percentages: each
 * suggestion says why it was made, from the strongest reason found.
 *
 *   goal      the goal they picked at sign-up (find a job, start a business...)
 *   skills    their profile: skills, job titles, field of study, headline
 *   practice  the Digital Marketing tracks they practise, and the programmes started
 *   gap       the weakest area on their skill radar
 *
 * Mentors not taking students are left out; ties keep the team's order.
 */
import type { Mentor } from './mentors'
import type { Profile } from './profile'
import { resolveGoal, goalLabel } from './onboardingContent'

export interface MentorSuggestion {
  mentor: Mentor
  /** "Matches your goal: find a new job", "Knows SEO, like you". */
  reason: string
  score: number
}

/** Words that mark a mentor as fitting each kind of goal or area. */
const MARKETING = ['marketing', 'seo', 'aeo', 'ads', 'advertis', 'content', 'brand', 'social', 'growth', 'analytics', 'performance', 'digital', 'campaign', 'meta', 'google']
const CAREER = ['career', 'coach', 'leader', 'hr', 'recruit', 'hiring', 'talent', 'interview', 'professional development', 'communication', 'soft skill', 'mentor']
const BUSINESS = ['entrepreneur', 'founder', 'startup', 'business', 'freelanc', 'consult', 'agency', 'owner']

const GOAL_WORDS: Record<string, string[]> = {
  job: CAREER,
  grow: [...CAREER, 'manager', 'strategy'],
  confidence: CAREER,
  business: BUSINESS,
  freelance: [...BUSINESS, ...MARKETING],
  skill: MARKETING,
  practise: MARKETING,
  assess: MARKETING,
  mentor: [...CAREER, ...MARKETING],
}

const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9& ]+/g, ' ').trim()
const hasAny = (text: string, words: string[]) => words.some((w) => text.includes(w))

export function suggestMentors({
  mentors,
  profile,
  practisedTracks,
  dmStarted,
  crStarted,
  weakestArea,
  exclude,
  limit = 3,
}: {
  mentors: Mentor[]
  profile: Pick<Profile, 'goals' | 'skills' | 'experience' | 'education' | 'headline'> | null
  practisedTracks: string[]
  dmStarted: boolean
  crStarted: boolean
  /** The lowest area on the skill radar ('Marketing', 'Leadership'...), if any. */
  weakestArea: string | null
  /** Mentors the student already has. */
  exclude: string[]
  limit?: number
}): MentorSuggestion[] {
  const goalId = profile?.goals?.[0] ? resolveGoal(profile.goals[0])?.id ?? profile.goals[0] : null
  const goalWords = goalId ? GOAL_WORDS[goalId] ?? [] : []
  // What the student brings: their own words, to find a mentor who shares them.
  const studentTerms = [
    ...(profile?.skills ?? []),
    ...(profile?.experience ?? []).map((e) => e.title),
    ...(profile?.education ?? []).map((e) => e.field ?? ''),
    ...practisedTracks,
  ]
    .map(norm)
    .filter((t) => t.length >= 3)

  const out: MentorSuggestion[] = []
  for (const m of mentors) {
    if (m.accepting === false || exclude.includes(m.id)) continue
    const tags = m.expertise.map(norm)
    const text = norm([m.headline, m.bio, ...m.expertise].join(' '))
    const reasons: { score: number; reason: string }[] = []

    // Shared skills: an expertise tag that is one of theirs, or the other way round.
    const shared = m.expertise.find((_tag, i) => studentTerms.some((t) => tags[i].includes(t) || t.includes(tags[i])))
    if (shared) reasons.push({ score: 4, reason: `Knows ${shared}, like you` })

    if (goalWords.length && hasAny(text, goalWords)) {
      reasons.push({ score: 3, reason: `Matches your goal: ${goalLabel(goalId!).toLowerCase()}` })
    }
    if (weakestArea) {
      const words = weakestArea === 'Marketing' ? MARKETING : CAREER
      if (hasAny(text, words)) reasons.push({ score: 2, reason: `Can help with ${weakestArea.toLowerCase()}, your area to grow` })
    }
    if (dmStarted && hasAny(text, MARKETING)) reasons.push({ score: 1, reason: 'For your Digital Marketing practice' })
    if (crStarted && hasAny(text, CAREER)) reasons.push({ score: 1, reason: 'For your Global Leadership modules' })

    const score = reasons.reduce((n, r) => n + r.score, 0)
    const best = reasons.sort((a, b) => b.score - a.score)[0]
    out.push({ mentor: m, score, reason: best?.reason ?? 'Taking new students' })
  }
  // Best fit first; ties keep the order the team set.
  return out
    .map((s, i) => ({ s, i }))
    .sort((a, b) => b.s.score - a.s.score || a.i - b.i)
    .slice(0, limit)
    .map(({ s }) => s)
}
