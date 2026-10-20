/**
 * Global Leadership and Digital Marketing are edited in the course engine
 * (docs/supabase-builtin-programmes.sql). Their pages still read the content
 * modules in src/lib (careerReadinessContent, decisionLabs, skillTracks…);
 * this brings the published wording into those modules before a signed-in
 * page renders, so publishing in the editor changes what students see.
 *
 * - The wording is kept in the browser with its version: the server only
 *   sends a programme again when a newer version has been published.
 * - It waits at most 2.5 seconds. If it can't load, the pages show the
 *   wording built into the app, which is what version 1 was imported from.
 * - Answers never come this way; grading reads them on the server.
 *
 * The content modules are loaded lazily, so pages that don't use them pay
 * nothing for this.
 */
import { supabase } from './supabase'

export interface BuiltinProgramme {
  version: number
  title: string
  content: unknown
}

const KEY = 'myskills.builtin-programmes.v1'
const WAIT_MS = 2500
const FRESH_MS = 10 * 60 * 1000

let running: Promise<void> | null = null
let startedAt = 0

function readCache(): Record<string, BuiltinProgramme> {
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? '{}') as Record<string, BuiltinProgramme>
  } catch {
    return {}
  }
}

function writeCache(c: Record<string, BuiltinProgramme>) {
  try {
    localStorage.setItem(KEY, JSON.stringify(c))
  } catch {
    // Private mode or full storage: it simply loads again next time.
  }
}

async function load(): Promise<void> {
  const cache = readCache()
  const known = Object.fromEntries(Object.entries(cache).map(([slug, p]) => [slug, p.version]))
  const { data, error } = await supabase.rpc('get_builtin_programmes', { p_known: known })
  // No SQL yet, or offline: keep whatever the browser has (or the built-in wording).
  const reply = error ? null : (data as { versions: Record<string, number>; changed: Record<string, BuiltinProgramme> } | null)
  const next: Record<string, BuiltinProgramme> = {}
  if (reply) {
    for (const [slug, version] of Object.entries(reply.versions)) {
      const p = reply.changed[slug] ?? cache[slug]
      if (p && p.version === version) next[slug] = p
    }
    writeCache(next)
  }
  const use = reply ? next : cache
  if (Object.keys(use).length === 0) return
  const { applyBuiltinProgrammes } = await import('./liveContentApply')
  applyBuiltinProgrammes(use)
}

/** Load the published wording once (again after 10 minutes); never wait longer than 2.5 s. */
export function ensureLiveContent(): Promise<void> {
  if (!running || Date.now() - startedAt > FRESH_MS) {
    startedAt = Date.now()
    running = load().catch(() => {})
  }
  return Promise.race([running, new Promise<void>((r) => setTimeout(r, WAIT_MS))])
}
