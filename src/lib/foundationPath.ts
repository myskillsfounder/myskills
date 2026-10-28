/**
 * Where a student starts in a programme, and where they stand with its
 * Foundation assessment (docs/supabase-foundation-certificates.sql).
 *
 *   beginner     aptitude, the foundation modules, then the Foundation
 *                assessment: one attempt, always certified.
 *   experienced  the Foundation assessment straight away. 60%+ certifies;
 *                below 60 is a benchmark (no certificate, no score), then one
 *                more attempt, always certified, once the gaps are practised.
 *
 * The path can change until the first attempt.
 */
import { useCallback, useEffect, useState } from 'react'
import { supabase } from './supabase'

export type EntryPath = 'beginner' | 'experienced'

export interface SkillResult {
  correct: number
  total: number
  percent: number
}

export interface FoundationStatus {
  /** Null until chosen (treated as beginner). */
  path: EntryPath | null
  /** The path can still change: no attempt yet. */
  switchable: boolean
  benchmark: { percent: number; correct: number; total: number; by_skill: Record<string, SkillResult>; attempted_at: string } | null
  certificate_attempt: {
    percent: number
    correct: number
    total: number
    path: EntryPath
    kind: 'gold' | 'silver' | 'bronze'
    certificate_code: string | null
    attempted_at: string
  } | null
  /** Per-skill result of the first experienced attempt ({} while questions carry no skill). */
  placement: Record<string, SkillResult> | null
  /** Foundation module ids tested out (skill 70%+) and still to do (under 70%). */
  tested_out: string[]
  gaps: string[]
  /** The server would accept the next attempt now. */
  open: boolean
  skills: { id: string; name: string }[]
  modules: { id: string; title: string; skill: string }[]
}

function fail(error: { message?: string }): never {
  throw new Error(error.message?.trim() || 'Something went wrong.')
}

/** Null until the SQL is run. */
export async function fetchFoundationStatus(slug: string): Promise<FoundationStatus | null> {
  const { data, error } = await supabase.rpc('get_foundation_status', { p_slug: slug })
  if (error) {
    if (error.code === 'PGRST202') return null
    fail(error)
  }
  return data as FoundationStatus
}

export async function setProgrammePath(slug: string, path: EntryPath): Promise<void> {
  const { error } = await supabase.rpc('set_programme_path', { p_slug: slug, p_path: path })
  if (error) fail(error)
}

/** A programme's Foundation status; null when it can't be read (SQL not run, signed out). */
export function useFoundationStatus(slug: string) {
  const [status, setStatus] = useState<FoundationStatus | null>()
  const reload = useCallback(() => {
    fetchFoundationStatus(slug).then(setStatus, () => setStatus(null))
  }, [slug])
  useEffect(reload, [reload])
  return { status, reload }
}

export const PATH_LABEL: Record<EntryPath, { title: string; body: string }> = {
  beginner: { title: 'New to this', body: 'Start with the aptitude check and the beginner modules, then the Foundation assessment.' },
  experienced: {
    title: 'I already know some of this',
    body: 'Take the Foundation assessment now. 60% or more earns your certificate; below that, it shows what to practise first.',
  },
}
