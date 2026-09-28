/**
 * Projects recorded by mentors — see docs/supabase-mentor-projects.sql. The
 * student can't add projects to their own profile; a mentor records work they
 * saw the student do, so every project shown has someone vouching for it.
 */
import { useEffect, useState } from 'react'
import { supabase } from './supabase'

function fail(error: { message?: string }): never {
  throw new Error(error.message?.trim() || 'Something went wrong.')
}

export interface MentorProject {
  id: string
  created_at: string
  programme?: 'digital-marketing' | 'career-readiness'
  title: string
  description: string | null
  link: string | null
  year: string | null
  mentor?: { full_name: string } | null
}

/** The signed-in student's projects, newest first. Empty if the SQL isn't run yet. */
export function useMyProjects() {
  const [projects, setProjects] = useState<MentorProject[]>([])
  useEffect(() => {
    let active = true
    void supabase
      .from('mentor_projects')
      .select('id, created_at, programme, title, description, link, year, mentor:mentors(full_name)')
      .order('created_at', { ascending: false })
      .then(({ data, error }) => {
        if (active && !error) setProjects((data ?? []) as unknown as MentorProject[])
      })
    return () => {
      active = false
    }
  }, [])
  return projects
}

/* -- mentor --------------------------------------------------------------- */

export async function fetchMenteeProjects(matchId: string): Promise<MentorProject[]> {
  const { data, error } = await supabase.rpc('mentee_projects', { p_match: matchId })
  if (error) fail(error)
  return (data ?? []) as MentorProject[]
}

export async function addMenteeProject(
  matchId: string,
  p: { title: string; description: string; link: string; year: string },
): Promise<void> {
  const { error } = await supabase.rpc('add_mentee_project', {
    p_match: matchId,
    p_title: p.title,
    p_description: p.description,
    p_link: p.link,
    p_year: p.year,
  })
  if (error) fail(error)
}

export async function removeMenteeProject(projectId: string): Promise<void> {
  const { error } = await supabase.rpc('remove_mentee_project', { p_project: projectId })
  if (error) fail(error)
}
