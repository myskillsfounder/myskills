import { useEffect, useState } from 'react'
/**
 * User feedback — one combined submission: app rating (1-10) + suggestions +
 * review. Stored in Supabase (own-row RLS). See docs/supabase-feedback.sql.
 */
import { supabase } from './supabase'

export interface Feedback {
  id: string
  rating: number | null
  suggestion: string
  review: string
  created_at: string
}

export interface FeedbackInput {
  rating: number | null
  suggestion?: string
  review?: string
}

export async function submitFeedback(input: FeedbackInput): Promise<void> {
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error('You are not signed in.')

  const { error } = await supabase.from('feedback').insert({
    profile_id: user.id,
    rating: input.rating,
    suggestion: (input.suggestion ?? '').trim(),
    review: (input.review ?? '').trim(),
  })
  if (error) throw error
  feedbackDoneCache = true
  writeDoneFlag(true)
}

export async function fetchMyFeedback(): Promise<Feedback[]> {
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return []
  const { data, error } = await supabase
    .from('feedback')
    .select('id, rating, suggestion, review, created_at')
    .eq('profile_id', user.id)
    .order('created_at', { ascending: false })
  if (error) throw error
  return (data ?? []) as Feedback[]
}


/**
 * Has this user already left feedback? Used to stop nagging them with the
 * "rate & review" prompts. Cached (module + localStorage) so the prompt never
 * flashes in for a split second before we know the answer.
 */
const DONE_KEY = 'myskills.feedbackDone'
let feedbackDoneCache: boolean | null = null

function readDoneFlag(): boolean | null {
  try {
    const v = localStorage.getItem(DONE_KEY)
    return v === null ? null : v === 'true'
  } catch {
    return null
  }
}

function writeDoneFlag(done: boolean) {
  try {
    localStorage.setItem(DONE_KEY, done ? 'true' : 'false')
  } catch {
    /* ignore */
  }
}

export function clearFeedbackCache() {
  feedbackDoneCache = null
  try {
    localStorage.removeItem(DONE_KEY)
  } catch {
    /* ignore */
  }
}

export async function hasSubmittedFeedback(): Promise<boolean> {
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return false
  const { count, error } = await supabase
    .from('feedback')
    .select('id', { count: 'exact', head: true })
    .eq('profile_id', user.id)
  if (error) return false
  const done = (count ?? 0) > 0
  feedbackDoneCache = done
  writeDoneFlag(done)
  return done
}

/** `null` while unknown, then true/false. */
export function useHasFeedback(): boolean | null {
  const [done, setDone] = useState<boolean | null>(
    () => (feedbackDoneCache !== null ? feedbackDoneCache : readDoneFlag()),
  )

  useEffect(() => {
    let active = true
    void hasSubmittedFeedback().then((d) => active && setDone(d))
    return () => {
      active = false
    }
  }, [])

  return done
}
