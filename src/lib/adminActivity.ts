/**
 * The admin activity log (docs/supabase-activity-log.sql): who on the team did
 * what, and when, written by the database as each change happens. Super admins
 * read it. This file loads it and puts each entry into words.
 */
import { supabase } from './supabase'

export interface ActivityRow {
  id: number
  at: string
  /** Null: made in the Supabase SQL editor. */
  actor_id: string | null
  actor_email: string | null
  actor_name: string | null
  table_name: string
  op: 'INSERT' | 'UPDATE' | 'DELETE'
  record_id: string | null
  label: string | null
  subject_id: string | null
  subject_label: string | null
  detail: {
    changed?: string[]
    status?: { from: unknown; to: unknown } | string
    contacted?: { from: unknown; to: unknown }
    sees_all?: { from: unknown; to: unknown } | boolean
    resource?: string
    programme?: string
    item_type?: string
    role_id?: { from: unknown; to: unknown }
    sections?: { from: unknown; to: unknown } | string[]
    [k: string]: unknown
  }
}

/** The areas the log can be filtered by, as the admin menu groups them. */
export const ACTIVITY_AREAS: { id: string; label: string; tables: string[] }[] = [
  { id: 'internships', label: 'Internships', tables: ['internship_roles', 'internship_applications', 'internship_partner_leads'] },
  { id: 'partners', label: 'Partners', tables: ['portal_requests', 'community_access', 'mentors', 'institution_partners', 'wellness_requests'] },
  { id: 'programmes', label: 'Programmes', tables: ['mentor_reviews', 'live_session_attendance', 'initial_assessment_questions'] },
  { id: 'students', label: 'Students', tables: ['verification_requests', 'verified_items'] },
  { id: 'leads', label: 'Leads', tables: ['career_readiness_leads', 'institution_leads', 'institution_lead_notes'] },
  { id: 'site', label: 'Site', tables: ['blog_posts', 'ads'] },
  { id: 'team', label: 'Team', tables: ['admins', 'staff_members', 'staff_roles'] },
]

export const areaOf = (table: string) => ACTIVITY_AREAS.find((a) => a.tables.includes(table))?.label ?? 'Other'

/** Null (not an error) until the SQL is run; an error otherwise. */
export async function fetchActivity(opts: {
  before?: string
  limit?: number
  actor?: string
  tables?: string[]
}): Promise<ActivityRow[] | null> {
  const { data, error } = await supabase.rpc('admin_activity_log', {
    p_before: opts.before ?? null,
    p_limit: opts.limit ?? 50,
    p_actor: opts.actor ?? null,
    p_tables: opts.tables ?? null,
  })
  if (error) {
    if (error.code === 'PGRST202') return null
    throw new Error(error.message?.trim() || 'Something went wrong.')
  }
  return (data ?? []) as ActivityRow[]
}

const RESOURCE: Record<string, string> = {
  mentors: 'Mentors',
  wellness: 'Wellness',
  guidance: 'Career Guidance',
  internships: 'Internships',
  institutions: 'Institutions',
}
const PROGRAMME: Record<string, string> = { 'digital-marketing': 'Digital Marketing', 'career-readiness': 'Global Leadership' }

const words = (v: unknown) => String(v ?? '—').replace(/_/g, ' ')
const quote = (s: string | null) => (s ? `“${s}”` : '')

/** The new value of a state that changed, or the state an added row was given. */
function statusTo(d: ActivityRow['detail']): string | null {
  const s = d.status
  if (s && typeof s === 'object') return String((s as { to: unknown }).to)
  return typeof s === 'string' ? s : null
}
function statusFrom(d: ActivityRow['detail']): string | null {
  const s = d.status
  return s && typeof s === 'object' ? String((s as { from: unknown }).from) : null
}

/**
 * One entry as a sentence, after the person's name: "approved the role “SEO
 * Intern”". Who it concerns is added by the page from subject_label.
 */
export function describe(r: ActivityRow): string {
  const d = r.detail ?? {}
  const to = statusTo(d)
  const from = statusFrom(d)
  const who = r.subject_label ?? 'a student'
  const changed = (d.changed ?? []).filter((c) => !['updated_at', 'reviewed_at', 'reviewed_by'].includes(c))
  const fields = changed.length ? ` (${changed.map(words).join(', ')})` : ''

  switch (r.table_name) {
    case 'internship_roles':
      if (r.op === 'INSERT') return `posted the role ${quote(r.label)}`
      if (r.op === 'DELETE') return `deleted the role ${quote(r.label)}`
      if (to === 'live') return `approved the role ${quote(r.label)}`
      if (to === 'rejected') return `sent back the role ${quote(r.label)}`
      if (to === 'closed') return `took down the role ${quote(r.label)}`
      return `changed the role ${quote(r.label)}${fields}`
    case 'internship_applications':
      if (from === 'signoff_pending' && to === 'completed') return `confirmed ${who}’s internship`
      if (from === 'signoff_pending' && to === 'accepted') return `sent back the sign-off for ${who}’s internship`
      if (to) return `moved ${who}’s application from ${words(from)} to ${words(to)}`
      return `changed ${who}’s application${fields}`
    case 'internship_partner_leads':
    case 'career_readiness_leads': {
      const c = d.contacted as { to: unknown } | undefined
      const what = r.table_name === 'internship_partner_leads' ? 'company' : 'Global Leadership lead'
      if (c) return c.to ? `marked the ${what} ${quote(r.label)} contacted` : `marked the ${what} ${quote(r.label)} not contacted`
      if (r.op === 'DELETE') return `deleted the ${what} ${quote(r.label)}`
      return `changed the ${what} ${quote(r.label)}${fields}`
    }
    case 'institution_leads': {
      const stage: Record<string, string> = { new: 'new', contacted: 'contacted', visit: 'visit scheduled', enrolled: 'enrolled', lost: 'not interested' }
      if (r.op === 'INSERT') return `took a new lead for ${r.label ?? 'an institution'}`
      if (r.op === 'DELETE') return `deleted a lead for ${r.label ?? 'an institution'}`
      if (to) return `moved ${who}’s lead for ${r.label ?? 'an institution'} to ${stage[to] ?? words(to)}`
      if (changed.includes('owner_id')) return `changed who owns ${who}’s lead for ${r.label ?? 'an institution'}`
      if (changed.includes('follow_up_on')) return `set a follow-up on ${who}’s lead for ${r.label ?? 'an institution'}`
      return `updated ${who}’s lead for ${r.label ?? 'an institution'}${fields}`
    }
    case 'institution_lead_notes':
      return r.op === 'DELETE' ? 'deleted a note on an institution lead' : 'added a note to an institution lead'
    case 'portal_requests':
      if (to === 'approved') return `verified the portal sign-up of ${r.label ?? who}`
      if (to === 'rejected') return `turned down the portal sign-up of ${r.label ?? who}`
      return `changed the portal sign-up of ${r.label ?? who}${fields}`
    case 'community_access': {
      const res = RESOURCE[String(d.resource)] ?? words(d.resource)
      const name = r.label ?? who
      const overview = d.sees_all === true || (typeof d.sees_all === 'object' && (d.sees_all as { to: unknown })?.to === true)
      if (r.op === 'INSERT') return overview ? `gave ${who} the team overview of ${res}` : `gave ${name} access to ${res} in the portal`
      if (r.op === 'DELETE') return `removed ${name}’s access to ${res} in the portal`
      return `changed ${name}’s access to ${res}${fields}`
    }
    case 'admins':
      if (r.op === 'INSERT') return `made ${who} a super admin`
      if (r.op === 'DELETE') return `removed ${who} as a super admin`
      return `changed super admin ${who}`
    case 'staff_members':
      if (r.op === 'INSERT') return `added ${r.label} to the team`
      if (r.op === 'DELETE') return `took ${r.label} off the team`
      return `changed what ${r.label} can open`
    case 'staff_roles':
      if (r.op === 'INSERT') return `created the role ${quote(r.label)}`
      if (r.op === 'DELETE') return `deleted the role ${quote(r.label)}`
      return `changed the role ${quote(r.label)}${fields}`
    case 'mentor_reviews': {
      const prog = PROGRAMME[String(d.programme ?? r.label)] ?? ''
      if (to === 'approved') return `passed ${who}’s ${prog} project`.replace('  ', ' ')
      if (to === 'changes_requested') return `sent ${who}’s ${prog} project back for changes`.replace('  ', ' ')
      if (to) return `moved ${who}’s ${prog} project to ${words(to)}`.replace('  ', ' ')
      return `changed ${who}’s ${prog} project${fields}`.replace('  ', ' ')
    }
    case 'live_session_attendance':
      if (r.op === 'INSERT') return `confirmed a live session for ${who}: ${quote(r.label)}`
      if (r.op === 'DELETE') return `removed a live session from ${who}: ${quote(r.label)}`
      return `changed a live session of ${who}${fields}`
    case 'verification_requests':
      if (to) return `moved ${who}’s verification from ${words(from)} to ${words(to)}`
      return `changed ${who}’s verification${fields}`
    case 'verified_items':
      if (r.op === 'INSERT') return `verified ${who}’s ${words(r.label ?? d.item_type)}`
      if (r.op === 'DELETE') return `removed ${who}’s verified ${words(r.label ?? d.item_type)}`
      return `changed ${who}’s verified ${words(r.label)}`
    case 'mentors':
      if (r.op === 'INSERT') return `added the mentor ${r.label}`
      if (r.op === 'DELETE') return `removed the mentor ${r.label}`
      return `changed the mentor ${r.label}${fields}`
    case 'institution_partners':
      if (to === 'approved') return `approved the institution ${r.label}`
      if (to === 'rejected') return `turned down the institution ${r.label}`
      if (r.op === 'DELETE') return `removed the institution ${r.label}`
      return `changed the institution ${r.label}${fields}`
    case 'wellness_requests':
      // Private: never who, never what was asked; only that it moved.
      if (to) return `moved a wellness request from ${words(from)} to ${words(to)}`
      return `changed a wellness request${fields}`
    case 'blog_posts':
      if (r.op === 'INSERT') return `wrote the post ${quote(r.label)}`
      if (r.op === 'DELETE') return `deleted the post ${quote(r.label)}`
      return `edited the post ${quote(r.label)}${fields}`
    case 'ads':
      if (r.op === 'INSERT') return `added the banner ${quote(r.label)}`
      if (r.op === 'DELETE') return `deleted the banner ${quote(r.label)}`
      return `changed the banner ${quote(r.label)}${fields}`
    case 'initial_assessment_questions':
      if (r.op === 'INSERT') return `added Foundation question ${r.label}`
      if (r.op === 'DELETE') return `deleted Foundation question ${r.label}`
      return `edited Foundation question ${r.label}${fields}`
    default:
      return `${r.op === 'INSERT' ? 'added' : r.op === 'DELETE' ? 'deleted' : 'changed'} ${words(r.table_name)} ${r.label ?? ''}`.trim()
  }
}

/** Whether the person an entry concerns is a student, so the page can link to them. */
export const subjectIsStudent = (table: string) =>
  ['internship_applications', 'mentor_reviews', 'live_session_attendance', 'verification_requests', 'verified_items'].includes(table)
