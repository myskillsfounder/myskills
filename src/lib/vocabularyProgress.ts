/**
 * "Words learned" tracking for the Vocabulary Builder, shared by the
 * dashboard coach widget and the full quiz mode so progress from either one
 * counts toward the same total. Local to the device (like the dashboard's
 * streak/visit counters) — no backend table for this yet.
 *
 * One flat set of learned term ids per user — Beginner/Advanced isn't a
 * separate store, just a different bank to count against (see
 * countLearned), so a term learned via one surface counts everywhere it
 * appears.
 */
import { useEffect, useState } from 'react'
import type { VocabTerm } from './vocabulary'

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

  /** How many terms IN THIS BANK are learned — pass the full list for an
   *  overall count, or one level's subset for that level's count. */
  function countLearned(bank: VocabTerm[]): number {
    return bank.reduce((n, t) => (learnedIds.has(t.id) ? n + 1 : n), 0)
  }

  return { learnedIds, markLearned, countLearned }
}
