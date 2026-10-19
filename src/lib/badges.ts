/**
 * Badges: milestones a student has reached, worked out from what the app
 * already records (no table of their own). Each is earned once.
 *
 *   First step          an aptitude test taken
 *   <Track>             a Digital Marketing track at 60% or more (one each)
 *   <Module>            a Global Leadership module finished (one each)
 *   Foundation          the Foundation assessment passed
 *   Project passed      each programme's project passed by a mentor
 *   Mentor              working with a mentor
 *   First internship    an internship confirmed by MySkills
 *   7-day / 30-day streak
 */
export interface Badge {
  key: string
  name: string
}

export function earnedBadges(p: {
  aptitudeTaken: boolean
  trackPercents: { name: string; percent: number }[]
  modulesDone: { title: string }[]
  foundationPassed: boolean
  dmProjectPassed: boolean
  crProjectPassed: boolean
  hasMentor: boolean
  internshipDone: boolean
  bestStreak: number
}): Badge[] {
  const out: Badge[] = []
  if (p.aptitudeTaken) out.push({ key: 'first-step', name: 'First step' })
  for (const t of p.trackPercents) if (t.percent >= 60) out.push({ key: `track:${t.name}`, name: t.name })
  for (const m of p.modulesDone) out.push({ key: `module:${m.title}`, name: m.title })
  if (p.foundationPassed) out.push({ key: 'foundation', name: 'Foundation' })
  if (p.dmProjectPassed) out.push({ key: 'dm-project', name: 'Digital Marketing project' })
  if (p.crProjectPassed) out.push({ key: 'cr-project', name: 'Global Leadership project' })
  if (p.hasMentor) out.push({ key: 'mentor', name: 'Mentor' })
  if (p.internshipDone) out.push({ key: 'internship', name: 'First internship' })
  if (p.bestStreak >= 7) out.push({ key: 'streak-7', name: '7-day streak' })
  if (p.bestStreak >= 30) out.push({ key: 'streak-30', name: '30-day streak' })
  return out
}

/** Every badge there is: 1 + 8 tracks + 14 modules + Foundation + 2 projects + mentor + internship + 2 streaks. */
export const BADGES_TOTAL = 1 + 8 + 14 + 1 + 2 + 1 + 1 + 2
