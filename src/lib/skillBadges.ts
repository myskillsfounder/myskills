/**
 * Skill badges, awarded by mentors — see docs/supabase-skill-badges.sql. A
 * mentor can award a badge for one of their programme's skills (a Digital
 * Marketing track or a Career Readiness module) to a student they mentor,
 * once the student has earned it in practice.
 */
import { useEffect, useState } from 'react'
import { supabase } from './supabase'
import { skillTracks } from './skillTracks'
import { PERSONAL_DEVELOPMENT_MODULES } from './programmes'

export type BadgeProgramme = 'digital-marketing' | 'career-readiness'

/** Display name for every skill a badge can be awarded for. */
export const SKILL_NAMES: Record<string, string> = Object.fromEntries([
  ...skillTracks.map((t) => [t.slug, t.name]),
  ...PERSONAL_DEVELOPMENT_MODULES.map((m) => [m.slug, m.title]),
])

export const skillName = (key: string) => SKILL_NAMES[key] ?? key

function fail(error: { message?: string }): never {
  throw new Error(error.message?.trim() || 'Something went wrong.')
}

/* -- student -------------------------------------------------------------- */

export interface SkillBadge {
  id: string
  awarded_at: string
  programme: BadgeProgramme
  skill: string
  note: string | null
  mentor: { full_name: string } | null
}

/** The signed-in student's badges, newest first. Empty if the SQL isn't run yet. */
export function useMyBadges() {
  const [badges, setBadges] = useState<SkillBadge[]>([])
  useEffect(() => {
    let active = true
    void supabase
      .from('skill_badges')
      .select('id, awarded_at, programme, skill, note, mentor:mentors(full_name)')
      .order('awarded_at', { ascending: false })
      .then(({ data, error }) => {
        if (active && !error) setBadges((data ?? []) as unknown as SkillBadge[])
      })
    return () => {
      active = false
    }
  }, [])
  return badges
}

/* -- mentor --------------------------------------------------------------- */

export interface MenteeSkill {
  skill: string
  /** Has the student done the work (60%+ on the track, or all 4 items written)? */
  earned: boolean
  /** e.g. "82%" or "3 of 4 written". */
  result: string
  awarded: boolean
  badge_id: string | null
}

export async function fetchMenteeSkills(matchId: string): Promise<MenteeSkill[]> {
  const { data, error } = await supabase.rpc('mentee_skills', { p_match: matchId })
  if (error) fail(error)
  return (data ?? []) as MenteeSkill[]
}

export async function awardBadge(matchId: string, skill: string, note = ''): Promise<void> {
  const { error } = await supabase.rpc('award_skill_badge', { p_match: matchId, p_skill: skill, p_note: note })
  if (error) fail(error)
}

export async function removeBadge(badgeId: string): Promise<void> {
  const { error } = await supabase.rpc('remove_skill_badge', { p_badge: badgeId })
  if (error) fail(error)
}
