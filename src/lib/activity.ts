/**
 * Days used and time spent, kept with the account (docs/supabase-learning-
 * progress.sql), so a student on a phone and a computer sees one streak and
 * one number of hours. Neither feeds the Global Readiness Score.
 *
 * Time is counted while the app is open and visible, a few seconds at a time,
 * and sent every few minutes and when the tab is hidden. Before the SQL is
 * run, everything here quietly does nothing and the LaunchPad falls back to
 * the browser's own numbers (lib/timeTracker.ts).
 */
import { useEffect, useState } from 'react'
import { supabase } from './supabase'
import { sessionUser } from './sessionUser'

const TICK_SECONDS = 15
const FLUSH_EVERY_MS = 5 * 60 * 1000

const pad = (n: number) => String(n).padStart(2, '0')
/** The student's own calendar day, not the server's. */
export const localDay = (d = new Date()) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`

let pending = 0

async function flush() {
  if (pending <= 0) return
  const seconds = Math.min(pending, 900)
  pending -= seconds
  const user = await sessionUser()
  if (!user) {
    pending = 0
    return
  }
  const { error } = await supabase.rpc('record_activity', { p_day: localDay(), p_seconds: seconds })
  // Not there yet (the SQL hasn't been run): stop counting rather than retry forever.
  if (error) pending = 0
}

/**
 * What this browser recorded before the account kept it: added once per
 * browser and account, so moving to the server doesn't reset anyone's hours.
 */
async function importLocalHistory() {
  const user = await sessionUser()
  if (!user) return
  const flag = `myskills.activityImported.${user.id}`
  try {
    if (localStorage.getItem(flag)) return
    const raw = JSON.parse(localStorage.getItem('myskills.timeSpent') || '{}') as Record<string, number>
    const today = localDay()
    const days: Record<string, number> = {}
    for (const [k, v] of Object.entries(raw)) {
      const day = k.slice(0, 10)
      // Today's own time is still being counted live.
      if (day < today) days[day] = (days[day] ?? 0) + Math.round(v)
    }
    const { error } = await supabase.rpc('import_activity', { p_days: days })
    if (!error) localStorage.setItem(flag, '1')
  } catch {
    /* ignore: it can be tried again next time */
  }
}

/** Count time while the app is visible. Call once at the app root. */
export function startActivitySync(): () => void {
  void importLocalHistory()
  const tick = window.setInterval(() => {
    if (document.visibilityState === 'visible') pending += TICK_SECONDS
  }, TICK_SECONDS * 1000)
  const send = window.setInterval(() => void flush(), FLUSH_EVERY_MS)
  const onHide = () => {
    if (document.visibilityState === 'hidden') void flush()
  }
  document.addEventListener('visibilitychange', onHide)
  return () => {
    window.clearInterval(tick)
    window.clearInterval(send)
    document.removeEventListener('visibilitychange', onHide)
  }
}

export interface Activity {
  /** Days in a row, ending today (or yesterday, if today hasn't been counted). */
  streak: number
  /** Days the student has used MySkills (in the last 90). */
  visits: number
  /** Hours in the last 30 days. */
  hours30: number
}

/** Days back to back, ending today or yesterday. */
function streakOf(days: Set<string>): number {
  const d = new Date()
  if (!days.has(localDay(d))) d.setDate(d.getDate() - 1)
  let n = 0
  while (days.has(localDay(d))) {
    n++
    d.setDate(d.getDate() - 1)
  }
  return n
}

/**
 * Today counts as a visit, then the account's days and time are read back.
 * Null until known, and null for good if the account can't keep them yet (the
 * caller then uses the browser's own numbers).
 */
export function useActivity(): Activity | null {
  const [activity, setActivity] = useState<Activity | null>(null)
  useEffect(() => {
    let active = true
    void (async () => {
      const user = await sessionUser()
      if (!user) return
      const visit = await supabase.rpc('record_activity', { p_day: localDay(), p_seconds: 0 })
      if (visit.error) return
      const since = new Date()
      since.setDate(since.getDate() - 90)
      const { data, error } = await supabase
        .from('activity_days')
        .select('day, seconds')
        .eq('user_id', user.id)
        .gte('day', localDay(since))
      if (error || !active) return
      const rows = (data ?? []) as { day: string; seconds: number }[]
      const cutoff = new Date()
      cutoff.setDate(cutoff.getDate() - 29)
      const from = localDay(cutoff)
      setActivity({
        streak: streakOf(new Set(rows.map((r) => r.day))),
        visits: rows.length,
        hours30: rows.filter((r) => r.day >= from).reduce((s, r) => s + r.seconds, 0) / 3600,
      })
    })()
    return () => {
      active = false
    }
  }, [])
  return activity
}
