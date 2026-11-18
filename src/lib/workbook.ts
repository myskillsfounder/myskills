import { supabase } from './supabase'
import { sessionUser } from './sessionUser'
import { enrol } from './programmeStudent'
import type { Course } from '@/content/courses'

/*
 * The Workbook: the programmes a student chose to study (docs/supabase-
 * workbook.sql). Digital Marketing and Global Leadership are built into the
 * site, so adding one writes a row; a course-engine programme is joined by
 * enrolling in it, as its own page always did.
 */

export type BuiltIn = 'digital-marketing' | 'global-leadership'

/** A course on the Learning page, and how it joins the Workbook. */
export const WORKBOOK_ENTRY: Record<Course['id'], { builtIn: BuiltIn } | { engine: string }> = {
  'digital-marketing': { builtIn: 'digital-marketing' },
  'global-leadership': { builtIn: 'global-leadership' },
  entrepreneurship: { engine: 'ai-powered-entrepreneurship' },
  'data-analytics': { engine: 'data-analytics' },
}

/** The built-in programmes the student added; empty before the SQL is run. */
export async function fetchMyWorkbook(): Promise<BuiltIn[]> {
  const { data, error } = await supabase.from('workbook_programmes').select('programme')
  if (error) return []
  return (data ?? []).map((r) => r.programme as BuiltIn)
}

/** Add a programme to the Workbook. It stays: there is no removing it. */
export async function addToWorkbook(course: Course['id']): Promise<void> {
  const entry = WORKBOOK_ENTRY[course]
  if ('engine' in entry) {
    await enrol(entry.engine)
    return
  }
  const user = await sessionUser()
  if (!user) throw new Error('Please sign in again.')
  const { error } = await supabase
    .from('workbook_programmes')
    .upsert({ student_id: user.id, programme: entry.builtIn }, { onConflict: 'student_id,programme', ignoreDuplicates: true })
  if (error) {
    throw new Error(/workbook_programmes/.test(error.message) ? 'This isn’t ready yet. Please try again in a little while.' : error.message)
  }
}
