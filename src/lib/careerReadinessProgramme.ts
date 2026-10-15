/**
 * The Life Readiness Programme, live: a learner's written responses to the
 * fourteen modules and the progress made from them. Storage and the save rules are
 * in docs/supabase-career-readiness-programme.sql; what each module asks is in
 * careerReadinessContent.ts.
 *
 * A module is done when all its items (its tasks and the reflection) have a
 * saved response. The project opens once the five core modules are done. There is no machine grading — the responses are what
 * a mentor reads in the review stage.
 */
import { useCallback, useEffect, useMemo, useState } from 'react'
import { supabase } from './supabase'
import { shared } from './shared'
import { forgetStarted } from './startedCache'
import { PERSONAL_DEVELOPMENT_MODULES, type ModuleSlug } from './programmes'
import { CORE_MODULES, itemsFor, type ItemKey } from './careerReadinessContent'

/** `${module}:${item}` -> the saved text. */
export type ResponseMap = Record<string, string>

export const responseKey = (module: ModuleSlug, item: ItemKey) => `${module}:${item}`

function fail(error: { message?: string }): never {
  throw new Error(error.message?.trim() || 'Something went wrong.')
}

export function fetchMyResponses(): Promise<ResponseMap> {
  return shared('fetchMyResponses', fetchMyResponsesOnce)
}

async function fetchMyResponsesOnce(): Promise<ResponseMap> {
  const { data, error } = await supabase
    .from('career_readiness_responses')
    .select('module, item, response')
  // Before the SQL is run the table doesn't exist — treat that as "nothing
  // yet" so Practice and LaunchPad keep working.
  if (error) return {}
  const map: ResponseMap = {}
  for (const r of (data ?? []) as { module: ModuleSlug; item: ItemKey; response: string }[]) {
    map[responseKey(r.module, r.item)] = r.response
  }
  return map
}

export async function saveResponse(module: ModuleSlug, item: ItemKey, response: string): Promise<void> {
  const { error } = await supabase.rpc('save_career_readiness_response', {
    p_module: module,
    p_item: item,
    p_response: response,
  })
  if (error) fail(error)
  forgetStarted()
}

/* -- progress ------------------------------------------------------------- */

export interface ModuleProgress {
  slug: ModuleSlug
  title: string
  /** Items saved, of the module's own (itemsFor). */
  done: number
  total: number
  complete: boolean
  started: boolean
}

export interface ProgrammeProgress {
  modules: ModuleProgress[]
  modulesDone: number
  modulesTotal: number
  itemsDone: number
  itemsTotal: number
  /** Every module is done: the programme's practice is finished. */
  complete: boolean
  /** The five core modules are done: what the project needs. */
  coreComplete: boolean
  coreDone: number
  coreTotal: number
  started: boolean
  /** The first module not yet complete, or null when all are. */
  next: ModuleProgress | null
}

export function progressFrom(responses: ResponseMap): ProgrammeProgress {
  const modules = PERSONAL_DEVELOPMENT_MODULES.map((m): ModuleProgress => {
    const items = itemsFor(m.slug)
    const done = items.filter((k) => Boolean(responses[responseKey(m.slug, k)])).length
    return {
      slug: m.slug,
      title: m.title,
      done,
      total: items.length,
      complete: done === items.length,
      started: done > 0,
    }
  })
  const modulesDone = modules.filter((m) => m.complete).length
  const itemsDone = modules.reduce((s, m) => s + m.done, 0)
  const coreDone = modules.filter((m) => m.complete && CORE_MODULES.includes(m.slug)).length
  return {
    modules,
    modulesDone,
    modulesTotal: modules.length,
    itemsDone,
    itemsTotal: modules.reduce((s, m) => s + m.total, 0),
    complete: modulesDone === modules.length,
    coreComplete: coreDone === CORE_MODULES.length,
    coreDone,
    coreTotal: CORE_MODULES.length,
    started: itemsDone > 0,
    next: modules.find((m) => !m.complete) ?? null,
  }
}

export function useCareerReadinessProgress() {
  const [responses, setResponses] = useState<ResponseMap>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true
    fetchMyResponses()
      .then((r) => active && setResponses(r))
      .finally(() => active && setLoading(false))
    return () => {
      active = false
    }
  }, [])

  /** Save, then reflect it locally — the server re-checks the length. */
  const save = useCallback(async (module: ModuleSlug, item: ItemKey, text: string) => {
    await saveResponse(module, item, text)
    setResponses((prev) => ({ ...prev, [responseKey(module, item)]: text.trim() }))
  }, [])

  const progress = useMemo(() => progressFrom(responses), [responses])
  return { responses, progress, loading, save }
}

/* -- staff ---------------------------------------------------------------- */

export interface LearnerResponse {
  module: ModuleSlug
  item: ItemKey
  response: string
  updated_at: string
}

/** One learner's written answers, for a mentor reviewing them. */
export async function fetchLearnerResponses(userId: string): Promise<LearnerResponse[]> {
  const { data, error } = await supabase.rpc('admin_career_readiness_responses', { p_user: userId })
  if (error) fail(error)
  return (data ?? []) as LearnerResponse[]
}
