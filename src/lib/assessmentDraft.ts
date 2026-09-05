/**
 * Device-local draft of an in-progress initial assessment.
 *
 * The assessment is one attempt and has no time limit, so users are told to
 * take their time — but progress lived only in component state, meaning a
 * refresh, a backgrounded mobile tab, or an accidental back gesture wiped
 * every answer with no way to recover them. This keeps the draft on the device
 * until the attempt is actually saved to Supabase.
 *
 * Not synced to the server on purpose: an unsubmitted attempt isn't a result,
 * and writing partial answers to `assessment_results` would make a half-finished
 * quiz look like a completed one to every query that reads that table.
 */
import type { AssessmentQuestion } from './initialAssessment'

const KEY = 'myskills.assessmentDraft'

interface Draft {
  /** Drafts are per-account: shared devices are common, and restoring someone
   *  else's answers into a one-attempt quiz would be destructive. */
  userId: string
  /** Question ids, in order. A changed question set invalidates the draft —
   *  answers are stored positionally, so restoring them onto different
   *  questions would silently mis-attribute them. */
  signature: string
  index: number
  answers: (number | null)[]
}

const signatureOf = (questions: AssessmentQuestion[]) => questions.map((q) => q.id).join(',')

export function loadDraft(
  userId: string | undefined,
  questions: AssessmentQuestion[],
): { index: number; answers: (number | null)[] } | null {
  if (!userId) return null
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return null
    const draft = JSON.parse(raw) as Draft
    if (draft.userId !== userId) return null
    if (draft.signature !== signatureOf(questions)) return null
    if (!Array.isArray(draft.answers) || draft.answers.length !== questions.length) return null
    if (draft.answers.every((a) => a === null)) return null

    return {
      index: Math.min(Math.max(draft.index, 0), questions.length - 1),
      answers: draft.answers,
    }
  } catch {
    return null
  }
}

export function saveDraft(
  userId: string | undefined,
  questions: AssessmentQuestion[],
  index: number,
  answers: (number | null)[],
) {
  if (!userId) return
  try {
    const draft: Draft = { userId, signature: signatureOf(questions), index, answers }
    localStorage.setItem(KEY, JSON.stringify(draft))
  } catch {
    /* private mode / quota — the quiz still works, it just won't resume */
  }
}

export function clearDraft() {
  try {
    localStorage.removeItem(KEY)
  } catch {
    /* ignore */
  }
}
