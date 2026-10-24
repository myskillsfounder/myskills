/**
 * What a visitor told the AI guide (routes/start.tsx) before they had an
 * account: the onboarding sentence, filled in. Onboarding uses it instead of
 * asking again, so signing up comes after onboarding, not before.
 *
 * localStorage for the same reason as lib/pendingAptitude.ts: confirming an
 * email address opens a new tab. A week later the answers are stale.
 */
export interface GuideAnswers {
  stage: string
  goal: string
  /** 'marketing' (Digital Marketing) or 'personal' (Global Leadership). */
  focus: 'marketing' | 'personal'
  level: 'beginner' | 'experienced'
  at: number
}

const KEY = 'myskills.guideAnswers'
const WEEK = 7 * 24 * 60 * 60 * 1000

export function saveGuideAnswers(a: Omit<GuideAnswers, 'at'>): void {
  try {
    localStorage.setItem(KEY, JSON.stringify({ ...a, at: Date.now() } satisfies GuideAnswers))
  } catch {
    // Storage blocked: onboarding asks again after sign-up.
  }
}

export function peekGuideAnswers(): GuideAnswers | null {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return null
    const a = JSON.parse(raw) as GuideAnswers
    if (!a.stage || !a.goal || (a.focus !== 'marketing' && a.focus !== 'personal') || Date.now() - a.at > WEEK) return null
    return a
  } catch {
    return null
  }
}

export function clearGuideAnswers(): void {
  try {
    localStorage.removeItem(KEY)
  } catch {
    /* nothing to clear */
  }
}
