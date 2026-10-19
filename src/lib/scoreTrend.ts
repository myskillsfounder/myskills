/**
 * How the Global Readiness Score has moved (docs/supabase-score-trend.sql):
 * against a week ago when there is a score from then, otherwise against the
 * first day on record. Nothing until there is an earlier day to compare with.
 */
import { supabase } from './supabase'

interface TrendRow {
  now: number | null
  week_ago: number | null
  month_ago: number | null
  first_day: string | null
  first: number | null
}

export interface ScoreTrend {
  /** Points up (positive) or down (negative). */
  change: number
  /** "since last week", "since 19 Oct". */
  since: string
}

/** Null before the SQL is run, before there is anything to compare, or on any error. */
export async function fetchScoreTrend(current: number): Promise<ScoreTrend | null> {
  const { data, error } = await supabase.rpc('my_score_trend')
  if (error || !data) return null
  const t = data as TrendRow
  if (t.week_ago != null) return { change: current - t.week_ago, since: 'since last week' }
  const today = new Date().toISOString().slice(0, 10)
  if (t.first != null && t.first_day && t.first_day < today) {
    const d = new Date(`${t.first_day}T00:00:00`).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })
    return { change: current - t.first, since: `since ${d}` }
  }
  return null
}
