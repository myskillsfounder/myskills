/**
 * Which of the two programmes Practice opens on. Remembered on the device so
 * coming back lands where you left, and set by pages that belong to one
 * programme (a Career Readiness module, its assessment) so "Back to Practice"
 * returns to the right tab.
 */
export type Programme = 1 | 2

const KEY = 'practice-programme'

export function savedProgramme(): Programme {
  try {
    return localStorage.getItem(KEY) === '2' ? 2 : 1
  } catch {
    return 1
  }
}

export function rememberProgramme(p: Programme): void {
  try {
    localStorage.setItem(KEY, String(p))
  } catch {
    /* the choice just won't be remembered */
  }
}
