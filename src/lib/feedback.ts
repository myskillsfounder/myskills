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
