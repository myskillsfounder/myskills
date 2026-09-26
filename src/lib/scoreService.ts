/**
 * The Career Readiness Score as the server issued it — see docs/supabase-
 * career-readiness-score.sql. The dashboard asks for it on load; the server
 * recomputes it from verified records, stores it with a date and the method
 * version, and hands it back. Resolves null when the SQL hasn't been run, so
 * the dashboard falls back to the browser's own calculation.
 */
import { supabase } from './supabase'
import { bandFor, type Readiness } from './readinessScore'

export interface ServerScore {
  method_version: string
  score: number
  verified_points: number
  self_reported_points: number
  computed_at?: string
  personal: { points: number; max: number }
  professional: { points: number; max: number }
  internship: { points: number; max: number }
}

export async function refreshMyScore(): Promise<ServerScore | null> {
  const { data, error } = await supabase.rpc('refresh_my_career_readiness_score')
  if (error || !data) return null
  return data as ServerScore
}

/**
 * Lay the server's numbers over the browser's guide. The server decides the
 * score, the split and each bar; the browser keeps the descriptions and the
 * "what next" suggestion, which need the profile's detail.
 */
export function withServerScore(local: Readiness, server: ServerScore): Readiness {
  if (server.score !== local.score) {
    console.warn(
      `Career Readiness Score: the server says ${server.score}, this browser calculated ${local.score}.`,
    )
  }
  return {
    ...local,
    score: server.score,
    band: bandFor(server.score),
    verifiedPoints: server.verified_points,
    selfReportedPoints: server.self_reported_points,
    source: 'server',
    computedAt: server.computed_at,
    personal: { ...local.personal, points: server.personal.points },
    professional: { ...local.professional, points: server.professional.points },
    internship: { ...local.internship, points: server.internship?.points ?? 0 },
  }
}
