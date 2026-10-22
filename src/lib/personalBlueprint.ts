/**
 * The Personal Blueprint (docs/supabase-personal-blueprint.sql): a student's
 * vision, mission, purpose, values and goals, on their profile. And their
 * Personal Records, counted from what they have done in MySkills.
 */
import { useCallback, useEffect, useState } from 'react'
import { supabase } from './supabase'

export interface BlueprintGoal {
  id: string
  text: string
  done: boolean
}

export interface Blueprint {
  vision: string
  mission: string
  purpose: string
  core_values: string[]
  goals: BlueprintGoal[]
  goals_year: number
}

export const emptyBlueprint = (): Blueprint => ({
  vision: '',
  mission: '',
  purpose: '',
  core_values: [],
  goals: [],
  goals_year: new Date().getFullYear(),
})

export const blueprintStarted = (b: Blueprint) =>
  Boolean(b.vision || b.mission || b.purpose || b.core_values.length || b.goals.length)

async function userId(): Promise<string | null> {
  const { data } = await supabase.auth.getSession()
  return data.session?.user.id ?? null
}

/** The student's blueprint (empty if none yet, or before the SQL is run). */
export function useBlueprint() {
  const [blueprint, setBlueprint] = useState<Blueprint | null>(null)
  const load = useCallback(async () => {
    const { data, error } = await supabase
      .from('personal_blueprints')
      .select('vision, mission, purpose, core_values, goals, goals_year')
      .maybeSingle()
    if (error || !data) {
      setBlueprint(emptyBlueprint())
      return
    }
    setBlueprint({
      vision: data.vision ?? '',
      mission: data.mission ?? '',
      purpose: data.purpose ?? '',
      core_values: data.core_values ?? [],
      goals: (data.goals ?? []) as BlueprintGoal[],
      goals_year: data.goals_year ?? new Date().getFullYear(),
    })
  }, [])
  useEffect(() => {
    void load()
  }, [load])

  const save = useCallback(async (b: Blueprint) => {
    const id = await userId()
    if (!id) throw new Error('Sign in again to save.')
    const clean = {
      user_id: id,
      vision: b.vision.trim() || null,
      mission: b.mission.trim() || null,
      purpose: b.purpose.trim() || null,
      core_values: b.core_values.map((v) => v.trim()).filter(Boolean).slice(0, 7),
      goals: b.goals.filter((g) => g.text.trim()).slice(0, 10).map((g) => ({ ...g, text: g.text.trim() })),
      goals_year: b.goals_year,
      updated_at: new Date().toISOString(),
    }
    const { error } = await supabase.from('personal_blueprints').upsert(clean)
    if (error) {
      throw new Error(error.code === '42P01' || error.code === 'PGRST205' ? 'Your blueprint can’t be saved yet. Please try again later.' : error.message)
    }
    setBlueprint({ ...b, core_values: clean.core_values, goals: clean.goals })
  }, [])

  return { blueprint, save }
}

export interface Records {
  /** The longest run of days in a row the student has used MySkills. */
  bestStreak: number
  /** Total hours in MySkills. */
  hours: number
  /** Days the student has used MySkills. */
  daysActive: number
}

function dayAfter(day: string): string {
  const d = new Date(`${day}T00:00:00`)
  d.setDate(d.getDate() + 1)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

/** All-time activity records, from the days the account has used MySkills. */
export function useRecords(): Records | null {
  const [records, setRecords] = useState<Records | null>(null)
  useEffect(() => {
    let active = true
    void (async () => {
      const id = await userId()
      if (!id) return
      const { data, error } = await supabase.from('activity_days').select('day, seconds').eq('user_id', id).order('day')
      if (!active) return
      if (error) {
        setRecords({ bestStreak: 0, hours: 0, daysActive: 0 })
        return
      }
      const rows = (data ?? []) as { day: string; seconds: number }[]
      let best = 0
      let run = 0
      let prev: string | null = null
      for (const r of rows) {
        run = prev && dayAfter(prev) === r.day ? run + 1 : 1
        best = Math.max(best, run)
        prev = r.day
      }
      setRecords({ bestStreak: best, hours: rows.reduce((s, r) => s + (r.seconds || 0), 0) / 3600, daysActive: rows.length })
    })()
    return () => {
      active = false
    }
  }, [])
  return records
}
