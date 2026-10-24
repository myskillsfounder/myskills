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
  | 'institution-lead'
  | 'lead-follow-up'
  | 'support-request'
  | 'internship-lead'
  | 'cr-lead'
  | 'unlinked-mentor'
  | 'portal-request'
  | 'internship-role'
  | 'internship-signoff'
  | 'feedback'

/** Who said "I'm on it" (docs/supabase-inbox-claims.sql). */
export interface InboxClaim {
  by: string
  name: string
  at: string
}

export interface InboxItem {
  kind: InboxKind
  ref: string
  title: string
  detail: string | null
  created_at: string
  /** Null when nobody has it; undefined until the claims SQL is run, so no buttons show. */
  claim?: InboxClaim | null
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
  'institution-lead': { label: 'Institution lead', plural: 'New institution leads', to: '/admin/institution-leads' },
  'lead-follow-up': { label: 'Lead follow-up', plural: 'Lead follow-ups due', to: '/admin/institution-leads' },
  'support-request': { label: 'Support request', plural: 'Support requests', to: '/admin/wellness' },
  'internship-lead': { label: 'Internship company', plural: 'Internship companies to contact', to: '/admin/internship-partners' },
  'cr-lead': { label: 'Programme lead', plural: 'Programme leads', to: '/admin/cr-leads' },
  'unlinked-mentor': { label: 'Mentor to link', plural: 'Mentors to link', to: '/admin/mentors' },
  'portal-request': { label: 'Portal sign-up', plural: 'Portal sign-ups to verify', to: '/admin/partner-verification' },
  'internship-role': { label: 'Internship role to approve', plural: 'Internship roles to approve', to: '/admin/internships' },
  'internship-signoff': { label: 'Internship to confirm', plural: 'Internships to confirm', to: '/admin/internships' },
  feedback: { label: 'New feedback', plural: 'New feedback', to: '/admin/feedback' },
}

/** Where an item is dealt with; a lead opens on its own row. */
export function inboxLink(i: Pick<InboxItem, 'kind' | 'ref'>): { to: string; search?: { lead: string } } {
  const to = INBOX_KINDS[i.kind].to
  return i.kind === 'institution-lead' || i.kind === 'lead-follow-up' ? { to, search: { lead: i.ref } } : { to }
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
    const [main, feedback, leads, claims] = await Promise.all([
      supabase.rpc('admin_inbox'),
      // Unread feedback (docs/supabase-activity-log.sql); nothing until that is run.
      supabase.rpc('admin_inbox_feedback'),
      // New institution leads and follow-ups due (docs/supabase-institution-leads.sql).
      supabase.rpc('admin_inbox_institution_leads'),
      // Who is on what (docs/supabase-inbox-claims.sql).
      supabase.rpc('admin_inbox_claims'),
    ])
    const { data, error } = main
    if (error) {
      if (error.code === 'PGRST202') return null
      throw new Error(error.message?.trim() || 'Something went wrong.')
    }
    const rows = [
      ...((data ?? []) as InboxItem[]),
      ...((feedback.error ? [] : feedback.data ?? []) as InboxItem[]),
      ...((leads.error ? [] : leads.data ?? []) as InboxItem[]),
    ]
    const held = claims.error
      ? null
      : new Map(
          ((claims.data ?? []) as { kind: string; ref: string; claimed_by: string; name: string; claimed_at: string }[]).map(
            (c) => [`${c.kind}:${c.ref}`, { by: c.claimed_by, name: c.name, at: c.claimed_at }] as const,
          ),
        )
    // A kind this page doesn't know yet (the SQL can run ahead of a deploy) is
    // left out rather than breaking the Inbox and the Dashboard. Oldest first.
    return rows
      .filter((i) => i.kind in INBOX_KINDS)
      .map((i) => (held ? { ...i, claim: held.get(`${i.kind}:${i.ref}`) ?? null } : i))
      .sort((a, b) => a.created_at.localeCompare(b.created_at))
  })
}

/** Say "I'm on it" (claim true), or let go of it. Claiming someone else's takes it over. */
export async function claimInboxItem(i: Pick<InboxItem, 'kind' | 'ref'>, claim: boolean): Promise<void> {
  const { error } = await supabase.rpc('admin_claim_inbox_item', { p_kind: i.kind, p_ref: i.ref, p_claim: claim })
  if (error) throw new Error(error.message?.trim() || 'Something went wrong.')
}

/** Everything waiting for this person, once, for the menu: null until known, or without the SQL. */
export function useInboxItems(): InboxItem[] | null {
  const [items, setItems] = useState<InboxItem[] | null>(null)
  useEffect(() => {
    let active = true
    fetchInbox()
      .then((rows) => active && setItems(rows ?? null))
      .catch(() => {})
    return () => {
      active = false
    }
  }, [])
  return items
}
