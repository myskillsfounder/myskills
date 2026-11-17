/**
 * Applying to a kind of internship with a CV (docs/supabase-internship-interest.sql).
 *
 * The cards on Home (Performance Marketing Intern, and so on) are kinds of role, not
 * a company's posting. A student applies with a CV and a short note; MySkills holds the
 * application and shares it with a partner company when that kind of internship opens.
 * The CV goes to a private bucket, in a folder named for the student. A role a company
 * posts keeps its own application (lib/internships.ts).
 */
import { useEffect, useState } from 'react'
import { supabase } from './supabase'
import { sessionUser } from './sessionUser'
import { shared } from './shared'

export type InterestStatus = 'new' | 'contacted' | 'shared' | 'closed'

export interface MyInterest {
  id: string
  track_slug: string
  track_title: string
  note: string | null
  cv_name: string
  cv_path: string
  status: InterestStatus
  created_at: string
}

export const CV_MAX_BYTES = 5 * 1024 * 1024
export const CV_ACCEPT = '.pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document'
export const NOTE_MAX = 600

/** Thrown when the database part has not been set up yet. */
export const NOT_READY = 'This isn’t ready yet. Please try again in a little while.'

const TYPES: Record<string, { mime: string; ext: string }> = {
  pdf: { mime: 'application/pdf', ext: 'pdf' },
  doc: { mime: 'application/msword', ext: 'doc' },
  docx: { mime: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', ext: 'docx' },
}

const extOf = (name: string) => name.split('.').pop()?.toLowerCase() ?? ''

/** What is wrong with a CV file, or null when it is fine. */
export function checkCv(file: File | null | undefined): string | null {
  if (!file) return 'Choose your CV first.'
  if (!TYPES[extOf(file.name)]) return 'Your CV must be a PDF or a Word file (.pdf, .doc or .docx).'
  if (file.size === 0) return 'That file is empty. Choose your CV again.'
  if (file.size > CV_MAX_BYTES) return 'Your CV is over 5 MB. Save a smaller copy and try again.'
  return null
}

const looksNotReady = (message: string) => /bucket not found|could not find|does not exist|schema cache|relation .* does not exist/i.test(message)

/* --------------------------------------------------------------- the store */

let cache: MyInterest[] | null = null
const listeners = new Set<() => void>()

export async function fetchMyInterest(): Promise<MyInterest[]> {
  const { data, error } = await supabase
    .from('internship_interest')
    .select('id, track_slug, track_title, note, cv_name, cv_path, status, created_at')
    .order('created_at', { ascending: false })
  // Before the SQL has been run there is nothing to show: no applications.
  if (error) return []
  return (data ?? []) as MyInterest[]
}

export async function reloadInterest() {
  // Cards that mount together share one request.
  cache = await shared('myInterest', fetchMyInterest)
  listeners.forEach((l) => l())
}

/**
 * This student's applications, shared by every card on the page. Always asked for
 * again when a card appears, and never shown before that answer, so one student's
 * applications can't be handed to the next person to sign in on the same screen.
 */
export function useMyInterest() {
  const [rows, setRows] = useState<MyInterest[] | null>(null)
  useEffect(() => {
    const on = () => setRows(cache)
    listeners.add(on)
    void reloadInterest()
    return () => {
      listeners.delete(on)
    }
  }, [])
  return rows
}

/* ------------------------------------------------------------------ actions */

export async function applyWithCv(args: {
  trackSlug: string
  trackTitle: string
  file: File
  note: string
  /** Their earlier application for this kind of role, when they are changing it. */
  existing?: MyInterest
}): Promise<void> {
  const problem = checkCv(args.file)
  if (problem) throw new Error(problem)
  const user = await sessionUser()
  if (!user) throw new Error('Please sign in to apply.')

  const type = TYPES[extOf(args.file.name)]
  const path = `${user.id}/${args.trackSlug}-${Date.now()}.${type.ext}`
  const up = await supabase.storage.from('cvs').upload(path, args.file, { contentType: type.mime, upsert: false })
  if (up.error) throw new Error(looksNotReady(up.error.message) ? NOT_READY : up.error.message)

  const note = args.note.trim().slice(0, NOTE_MAX) || null
  const write = args.existing
    ? await supabase
        .from('internship_interest')
        .update({ note, cv_path: path, cv_name: args.file.name.slice(0, 160), updated_at: new Date().toISOString() })
        .eq('id', args.existing.id)
    : await supabase.from('internship_interest').insert({
        student_id: user.id,
        track_slug: args.trackSlug,
        track_title: args.trackTitle,
        note,
        cv_path: path,
        cv_name: args.file.name.slice(0, 160),
      })
  if (write.error) {
    // Don't leave a CV behind that no application points at.
    await supabase.storage.from('cvs').remove([path])
    throw new Error(looksNotReady(write.error.message) ? NOT_READY : write.error.message)
  }
  // The CV they replaced is no longer needed.
  if (args.existing) await supabase.storage.from('cvs').remove([args.existing.cv_path])
  await reloadInterest()
}

export async function withdrawInterest(row: MyInterest): Promise<void> {
  const { error } = await supabase.from('internship_interest').delete().eq('id', row.id)
  if (error) throw new Error(error.message)
  await supabase.storage.from('cvs').remove([row.cv_path])
  await reloadInterest()
}

/* ------------------------------------------------------------ the team's side */

export interface AdminInterest {
  id: string
  student_id: string
  student_name: string | null
  student_email: string | null
  student_phone: string | null
  track_slug: string
  track_title: string
  note: string | null
  cv_path: string
  cv_name: string
  status: InterestStatus
  created_at: string
}

/** Null before the SQL has been run: the admin page leaves the section out. */
export async function fetchAdminInterest(): Promise<AdminInterest[] | null> {
  const { data, error } = await supabase.rpc('admin_internship_interest')
  if (error) return null
  return (data ?? []) as AdminInterest[]
}

export async function setInterestStatus(id: string, status: InterestStatus): Promise<void> {
  const { error } = await supabase.rpc('admin_set_interest_status', { p_id: id, p_status: status })
  if (error) throw new Error(error.message)
}

/** A short-lived link to a CV, for the team. */
export async function cvLink(path: string): Promise<string> {
  const { data, error } = await supabase.storage.from('cvs').createSignedUrl(path, 300)
  if (error || !data?.signedUrl) throw new Error(error?.message ?? 'Couldn’t open that CV.')
  return data.signedUrl
}
