/**
 * "Words learned" tracking for the Vocabulary Builder, shared by the
 * dashboard coach widget and the full quiz mode so progress from either one
 * counts toward the same total. Local to the device (like the dashboard's
 * streak/visit counters) — no backend table for this yet.
 */
import { useEffect, useState } from 'react'

function storageKey(userKey: string) {
  return `myskills.vocab.${userKey}`
}

function readLearned(userKey: string): string[] {
  try {
    const raw = localStorage.getItem(storageKey(userKey))
    return raw ? (JSON.parse(raw) as string[]) : []
  } catch {
    return []
  }
}

function writeLearned(userKey: string, ids: string[]) {
  try {
    localStorage.setItem(storageKey(userKey), JSON.stringify(ids))
  } catch {
    /* ignore */
  }
}

export function useVocabProgress(userKey: string) {
  const [learnedIds, setLearnedIds] = useState<Set<string>>(() => new Set())

  useEffect(() => {
    setLearnedIds(new Set(readLearned(userKey)))
  }, [userKey])

  function markLearned(id: string) {
    setLearnedIds((prev) => {
      if (prev.has(id)) return prev
      const next = new Set(prev)
      next.add(id)
      writeLearned(userKey, [...next])
      return next
    })
  }

  return { learnedIds, learnedCount: learnedIds.size, markLearned }
}
