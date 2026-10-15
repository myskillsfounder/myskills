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
 *
 * Kept with the account (vocab_learned, docs/supabase-learning-progress.sql)
 * so a phone and a computer agree; the browser keeps a copy, which is what a
 * page reads first and what is used if the account can't be reached (or
 * before that SQL is run).
 */
import { useEffect, useState } from 'react'
import { supabase } from './supabase'
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

const syncs = new Map<string, Promise<Set<string>>>()

/**
 * The account's learned words together with this browser's: what only the
 * browser had is added to the account (so nothing learned before is lost),
 * and the browser's copy is brought up to date. Once per page load and
 * account. Falls back to the browser's words if the account can't be read.
 */
export function syncLearned(userKey: string): Promise<Set<string>> {
  const local = new Set(readLearned(userKey))
  if (userKey === 'guest') return Promise.resolve(local)
  let p = syncs.get(userKey)
  if (!p) {
    p = (async () => {
      const { data, error } = await supabase.from('vocab_learned').select('term_id').eq('user_id', userKey)
      if (error) return local
      const all = new Set((data ?? []).map((r: { term_id: string }) => r.term_id))
      const onlyHere = [...local].filter((id) => !all.has(id))
      if (onlyHere.length) {
        await supabase
          .from('vocab_learned')
          .upsert(onlyHere.map((term_id) => ({ user_id: userKey, term_id })), { onConflict: 'user_id,term_id', ignoreDuplicates: true })
      }
      for (const id of local) all.add(id)
      writeLearned(userKey, [...all])
      return all
    })()
    syncs.set(userKey, p)
  }
  return p.then((all) => new Set([...all, ...readLearned(userKey)]))
}

/** The share of the Beginner vocabulary a learner must have learned before
 *  the next thing unlocks: the Advanced level, and the Foundation assessment.
 *  One number, so the two can't drift apart. */
export const VOCAB_UNLOCK_PERCENT = 70

/** How many of `bank`'s terms this learner has learned, read straight from
 *  storage. For places that need the answer on first render (a lock screen)
 *  rather than after the hook's effect has run. */
export function countLearnedNow(userKey: string, bank: VocabTerm[]): number {
  const learned = new Set(readLearned(userKey))
  return bank.reduce((n, t) => (learned.has(t.id) ? n + 1 : n), 0)
}

export function useVocabProgress(userKey: string) {
  const [learnedIds, setLearnedIds] = useState<Set<string>>(() => new Set())

  useEffect(() => {
    let active = true
    setLearnedIds(new Set(readLearned(userKey)))
    // Then what the account knows, from any device.
    void syncLearned(userKey).then((all) => {
      if (active) setLearnedIds((prev) => new Set([...prev, ...all]))
    })
    return () => {
      active = false
    }
  }, [userKey])

  function markLearned(id: string) {
    setLearnedIds((prev) => {
      if (prev.has(id)) return prev
      const next = new Set(prev)
      next.add(id)
      writeLearned(userKey, [...next])
      return next
    })
    if (userKey !== 'guest') {
      void supabase
        .from('vocab_learned')
        .upsert({ user_id: userKey, term_id: id }, { onConflict: 'user_id,term_id', ignoreDuplicates: true })
    }
  }

  /** How many terms IN THIS BANK are learned — pass the full list for an
   *  overall count, or one level's subset for that level's count. */
  function countLearned(bank: VocabTerm[]): number {
    return bank.reduce((n, t) => (learnedIds.has(t.id) ? n + 1 : n), 0)
  }

  return { learnedIds, markLearned, countLearned }
}
