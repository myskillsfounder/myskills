/**
 * Live sessions with a trainer, mentor or institution — see docs/supabase-
 * live-sessions.sql. Attendance is confirmed by the person who ran the session
 * (or the team on their behalf), never added by the student, and is worth 2
 * points each toward the Career Readiness Score, up to 10.
 */
import { useEffect, useState } from 'react'
import { supabase } from './supabase'

export type HostKind = 'mentor' | 'trainer' | 'institution'

export const HOST_KINDS: { value: HostKind; label: string }[] = [
  { value: 'mentor', label: 'Mentor' },
  { value: 'trainer', label: 'Trainer' },
  { value: 'institution', label: 'Institution' },
]

export interface LiveSession {
  id: string
  held_on: string
  host_kind: HostKind
  host_name: string
  title: string
}

/** The signed-in student's confirmed sessions, newest first. Empty if the SQL
 *  hasn't been run yet, so Practice and LaunchPad keep working. */
export async function fetchMyLiveSessions(): Promise<LiveSession[]> {
  const { data, error } = await supabase
    .from('live_session_attendance')
    .select('id, held_on, host_kind, host_name, title')
    .order('held_on', { ascending: false })
  if (error) return []
  return (data ?? []) as LiveSession[]
}

export function useMyLiveSessions() {
  const [sessions, setSessions] = useState<LiveSession[]>([])
  const [loading, setLoading] = useState(true)
  useEffect(() => {
    let active = true
    fetchMyLiveSessions()
      .then((s) => active && setSessions(s))
      .finally(() => active && setLoading(false))
    return () => {
      active = false
    }
  }, [])
  return { sessions, loading }
}

/* -- staff ---------------------------------------------------------------- */

export interface AdminLiveSession extends LiveSession {
  created_at: string
  student_name: string | null
  student_email: string | null
  recorded_by_name: string | null
}

export async function fetchAdminLiveSessions(): Promise<AdminLiveSession[]> {
  const { data, error } = await supabase.rpc('admin_live_sessions')
  if (error) throw new Error(error.message?.trim() || 'Something went wrong.')
  return (data ?? []) as AdminLiveSession[]
}

export async function recordLiveSession(input: {
  studentEmail: string
  hostKind: HostKind
  hostName: string
  title: string
  heldOn: string
}): Promise<void> {
  const { error } = await supabase.rpc('record_live_session_attendance', {
    p_student_email: input.studentEmail,
    p_host_kind: input.hostKind,
    p_host_name: input.hostName,
    p_title: input.title,
    p_held_on: input.heldOn,
  })
  if (error) throw new Error(error.message?.trim() || 'Something went wrong.')
}
