/**
 * The Career Readiness Programme, live: a learner's written responses to the
 * five modules and the progress made from them. Storage and the save rules are
 * in docs/supabase-career-readiness-programme.sql; what each module asks is in
 * careerReadinessContent.ts.
 *
 * A module is done when all four of its items (three tasks and a reflection)
 * have a saved response. There is no machine grading — the responses are what
 * a mentor reads in the review stage.
 */
import { useCallback, useEffect, useMemo, useState } from 'react'
import { supabase } from './supabase'
import { PERSONAL_DEVELOPMENT_MODULES, type ModuleSlug } from './programmes'
import { ITEM_KEYS, MODULE_CONTENT, type ItemKey } from './careerReadinessContent'

/** `${module}:${item}` -> the saved text. */
export type ResponseMap = Record<string, string>

export const responseKey = (module: ModuleSlug, item: ItemKey) => `${module}:${item}`

function fail(error: { message?: string }): never {
  throw new Error(error.message?.trim() || 'Something went wrong.')
}

export async function fetchMyResponses(): Promise<ResponseMap> {
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
}

/* -- progress ------------------------------------------------------------- */

export interface ModuleProgress {
  slug: ModuleSlug
  title: string
  /** Items saved, of ITEM_KEYS.length. */
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
  /** Every item of every module is in — what the mentor review needs. */
  complete: boolean
  started: boolean
  /** The first module not yet complete, or null when all are. */
  next: ModuleProgress | null
}

export function progressFrom(responses: ResponseMap): ProgrammeProgress {
  const modules = PERSONAL_DEVELOPMENT_MODULES.map((m): ModuleProgress => {
    const done = ITEM_KEYS.filter((k) => Boolean(responses[responseKey(m.slug, k)])).length
    return {
      slug: m.slug,
      title: m.title,
      done,
      total: ITEM_KEYS.length,
      complete: done === ITEM_KEYS.length,
      started: done > 0,
    }
  })
  const modulesDone = modules.filter((m) => m.complete).length
  const itemsDone = modules.reduce((s, m) => s + m.done, 0)
  return {
    modules,
    modulesDone,
    modulesTotal: modules.length,
    itemsDone,
    itemsTotal: MODULE_CONTENT.length * ITEM_KEYS.length,
    complete: modulesDone === modules.length,
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
