/**
 * Which programme Practice opens on, when a link has asked for one: a Global
 * Leadership module, its assessment, a dashboard card. The link sets it just
 * before going to Practice, and Practice uses it once, so "Back to Practice"
 * still lands on the right programme while a plain visit shows every
 * programme the student has joined (components/practice/ProgrammeCards.tsx).
 */
export type Programme = 1 | 2

const KEY = 'practice-programme'

/** The programme a link asked for; null for Practice's programme cards. */
export function savedProgramme(): Programme | null {
  try {
    const v = sessionStorage.getItem(KEY)
    return v === '1' ? 1 : v === '2' ? 2 : null
  } catch {
    return null
  }
}

/** Used once: Practice clears it after reading (in an effect, not in render). */
export function clearSavedProgramme(): void {
  try {
    sessionStorage.removeItem(KEY)
  } catch {
    /* nothing to clear */
  }
}

export function rememberProgramme(p: Programme): void {
  try {
    sessionStorage.setItem(KEY, String(p))
  } catch {
    /* Practice will open on the programme cards instead */
  }
}
