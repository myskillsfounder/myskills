/**
 * The Admin Inbox — everything waiting on the team, in one list. See
 * docs/supabase-admin-inbox.sql: one row per waiting item with when it started
 * waiting, limited to the sections the signed-in person has.
 */
import { useEffect, useState } from 'react'
import { supabase } from './supabase'
import { shared } from './shared'

export type InboxKind =
  | 'project'
  | 'verification'
  | 'mentor-application'
  | 'institution-application'
  | 'demo-request'
  | 'support-request'
  | 'internship-lead'
  | 'cr-lead'
  | 'unlinked-mentor'

export interface InboxItem {
  kind: InboxKind
  ref: string
  title: string
  detail: string | null
  created_at: string
}

/** What each kind is called, and which admin page deals with it. */
export const INBOX_KINDS: Record<InboxKind, { label: string; plural: string; to: string }> = {
  project: { label: 'Project to grade', plural: 'Projects to grade', to: '/admin/mentor-reviews' },
  verification: { label: 'Verification', plural: 'Verification requests', to: '/admin/verification' },
  'mentor-application': { label: 'Mentor application', plural: 'Mentor applications', to: '/admin/mentors' },
  'institution-application': {
    label: 'Institution application',
    plural: 'Institution applications',
    to: '/admin/institution-partners',
  },
  'demo-request': { label: 'Demo request', plural: 'Demo requests', to: '/admin/demo-requests' },
  'support-request': { label: 'Support request', plural: 'Support requests', to: '/admin/wellness' },
  'internship-lead': { label: 'Internship company', plural: 'Internship companies', to: '/admin/internship-partners' },
  'cr-lead': { label: 'Career Readiness lead', plural: 'Career Readiness leads', to: '/admin/cr-leads' },
  'unlinked-mentor': { label: 'Mentor to link', plural: 'Mentors to link', to: '/admin/mentors' },
}

const DAY = 24 * 60 * 60 * 1000

/** Whole days an item has waited (0 = today). */
export function daysWaiting(iso: string): number {
  return Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / DAY))
}

/** "today", "yesterday", "5 days", "3 weeks". */
export function waitedLabel(iso: string): string {
  const d = daysWaiting(iso)
  if (d === 0) return 'today'
  if (d === 1) return 'yesterday'
  if (d < 14) return `${d} days`
  return `${Math.floor(d / 7)} weeks`
}

/**
 * Everything waiting, oldest first. Resolves null (not an error) when the SQL
 * hasn't been run, so the sidebar and the page can say so instead of failing.
 */
export function fetchInbox(): Promise<InboxItem[] | null> {
  return shared('adminInbox', async () => {
    const { data, error } = await supabase.rpc('admin_inbox')
    if (error) {
      if (error.code === 'PGRST202') return null
      throw new Error(error.message?.trim() || 'Something went wrong.')
    }
    return (data ?? []) as InboxItem[]
  })
}

/** How many items are waiting, for the sidebar. Null until known, or if unavailable. */
export function useInboxCount(): number | null {
  const [count, setCount] = useState<number | null>(null)
  useEffect(() => {
    let active = true
    fetchInbox()
      .then((rows) => active && setCount(rows ? rows.length : null))
      .catch(() => {})
    return () => {
      active = false
    }
  }, [])
  return count
}
