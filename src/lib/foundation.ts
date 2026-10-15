/**
 * The Foundation assessment — today's knowledge test (the old "initial
 * assessment"), now the SECOND step of the Digital Marketing programme. It
 * only unlocks once a learner has worked through the Beginner vocabulary.
 *
 * Vocabulary progress is kept with the account (lib/vocabularyProgress.ts),
 * but written by the browser, so this is a real gate in the interface rather
 * than something the server enforces. The assessment itself is still graded
 * server-side and one attempt, so a learner who gets around the lock only
 * gets the same test, once.
 */
import { useEffect, useState } from 'react'
import { useAuthUser } from './useAuth'
import { vocabularyTerms } from './vocabulary'
import { VOCAB_UNLOCK_PERCENT, countLearnedNow, syncLearned } from './vocabularyProgress'

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

const beginner = vocabularyTerms.filter((t) => t.level === 'beginner')

function unlockFor(learned: number): FoundationUnlock {
  const percent = beginner.length ? Math.round((learned / beginner.length) * 100) : 0
  return {
    learned,
    total: beginner.length,
    percent,
    required: VOCAB_UNLOCK_PERCENT,
    unlocked: percent >= VOCAB_UNLOCK_PERCENT,
  }
}

/** Where the learner stands against the vocabulary requirement. Read from the
 *  browser first, so a lock screen never flashes the wrong state, then from
 *  the account, which knows the words learned on another device too. */
export function useFoundationUnlock(): FoundationUnlock {
  const { user } = useAuthUser()
  const userKey = user?.id ?? 'guest'
  const [learned, setLearned] = useState(() => countLearnedNow(userKey, beginner))
  useEffect(() => {
    let active = true
    setLearned(countLearnedNow(userKey, beginner))
    void syncLearned(userKey).then((all) => {
      if (active) setLearned(beginner.reduce((n, t) => (all.has(t.id) ? n + 1 : n), 0))
    })
    return () => {
      active = false
    }
  }, [userKey])
  return unlockFor(learned)
}
