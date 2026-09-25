/**
 * The Foundation assessment — today's knowledge test (the old "initial
 * assessment"), now the SECOND step of the Digital Marketing programme. It
 * only unlocks once a learner has worked through the Beginner vocabulary.
 *
 * Vocabulary progress lives on the device (lib/vocabularyProgress.ts — there's
 * no backend table for it), so this is a real gate in the interface but not
 * something the server can enforce. The assessment itself is still graded
 * server-side and one attempt, so a learner who gets around the lock only
 * gets the same test, once.
 */
import { useMemo } from 'react'
import { useAuthUser } from './useAuth'
import { vocabularyTerms } from './vocabulary'
import { VOCAB_UNLOCK_PERCENT, countLearnedNow } from './vocabularyProgress'

export interface FoundationUnlock {
  /** Beginner terms learned, and how many there are. */
  learned: number
  total: number
  /** 0-100. */
  percent: number
  /** The percentage that has to be reached. */
  required: number
  unlocked: boolean
}

/** Where the learner stands against the vocabulary requirement. Read
 *  synchronously, so a lock screen never flashes the wrong state. */
export function useFoundationUnlock(): FoundationUnlock {
  const { user } = useAuthUser()
  const userKey = user?.id ?? 'guest'
  return useMemo(() => {
    const beginner = vocabularyTerms.filter((t) => t.level === 'beginner')
    const learned = countLearnedNow(userKey, beginner)
    const percent = beginner.length ? Math.round((learned / beginner.length) * 100) : 0
    return {
      learned,
      total: beginner.length,
      percent,
      required: VOCAB_UNLOCK_PERCENT,
      unlocked: percent >= VOCAB_UNLOCK_PERCENT,
    }
  }, [userKey])
}
