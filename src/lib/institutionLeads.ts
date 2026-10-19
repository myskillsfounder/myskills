/**
 * Institution leads (docs/supabase-institution-leads.sql): a student's interest
 * in an institution, worked by the MySkills team from first call to enrolment.
 * The student sees a simple status; the team sees everything, with notes.
 */
import { useEffect, useState } from 'react'
import { supabase } from './supabase'

function fail(error: { message?: string }): never {
  throw new Error(error.message?.trim() || 'Something went wrong.')
}

export type LeadStage = 'new' | 'contacted' | 'visit' | 'enrolled' | 'lost'

/** The pipeline, in order, as the team works it. */
export const LEAD_STAGES: { key: LeadStage; label: string; tone: 'brand' | 'warning' | 'success' | 'neutral' }[] = [
  { key: 'new', label: 'New', tone: 'brand' },
  { key: 'contacted', label: 'Contacted', tone: 'warning' },
  { key: 'visit', label: 'Visit scheduled', tone: 'warning' },
  { key: 'enrolled', label: 'Enrolled', tone: 'success' },
  { key: 'lost', label: 'Not interested', tone: 'neutral' },
]
export const stageInfo = (s: LeadStage) => LEAD_STAGES.find((x) => x.key === s)!

/** How a stage reads to the student: plain, and never the team's reasons. */
export const STUDENT_STAGE: Record<LeadStage, { label: string; note: string }> = {
  new: { label: 'Enquiry sent', note: 'The MySkills team will call you within two working days.' },
  contacted: { label: 'We’ve contacted you', note: 'We’re helping you choose and set up a visit.' },
  visit: { label: 'Visit scheduled', note: 'Your visit or counselling session is booked.' },
  enrolled: { label: 'Enrolled', note: 'You joined. Well done.' },
  lost: { label: 'Closed', note: 'This enquiry is closed. You can enquire again any time.' },
}

/* -- the student ---------------------------------------------------------- */

export interface MyEnquiry {
  id: string
  created_at: string
  institution_id: string | null
  institution_name: string
  course: string | null
  stage: LeadStage
  stage_changed_at: string
}

/** Empty, not an error, before the SQL is in. */
export async function fetchMyEnquiries(): Promise<MyEnquiry[]> {
  const { data, error } = await supabase.rpc('my_institution_enquiries')
  if (error) return []
  return (data ?? []) as MyEnquiry[]
}

export interface EnquiryInput {
  course: string
  phone: string
  city: string
  preferred: string
  message: string
}

export async function enquireInstitution(institutionId: string, input: EnquiryInput): Promise<void> {
  const { error } = await supabase.rpc('enquire_institution', {
    p_institution: institutionId,
    p_course: input.course,
    p_phone: input.phone,
    p_city: input.city,
    p_preferred: input.preferred,
    p_message: input.message,
  })
  if (error) fail(error)
}

/* -- the team -------------------------------------------------------------- */

export interface InstitutionLead {
  id: string
  created_at: string
  updated_at: string
  student_id: string | null
  institution_id: string | null
  institution_name: string
  course: string | null
  full_name: string
  email: string
  phone: string | null
  city: string | null
  preferred_time: string | null
  message: string | null
  stage: LeadStage
  stage_changed_at: string
  lost_reason: string | null
  owner_id: string | null
  owner_name: string | null
  follow_up_on: string | null
  source: string
  notes: number
  last_note_at: string | null
}

/** Null before the SQL is in: the page then says so. */
export async function fetchInstitutionLeads(): Promise<InstitutionLead[] | null> {
  const { data, error } = await supabase.rpc('admin_institution_leads')
  if (error) {
    if (error.code === 'PGRST202') return null
    fail(error)
  }
  return (data ?? []) as InstitutionLead[]
}

export async function updateInstitutionLead(
  id: string,
  next: { stage: LeadStage; owner: string | null; followUp: string | null; lostReason: string | null },
): Promise<void> {
  const { error } = await supabase.rpc('admin_update_institution_lead', {
    p_id: id,
    p_stage: next.stage,
    p_owner: next.owner,
    p_follow_up: next.followUp,
    p_lost_reason: next.lostReason,
  })
  if (error) fail(error)
}

export interface LeadNote {
  id: string
  created_at: string
  author_name: string
  body: string
}

export async function fetchLeadNotes(id: string): Promise<LeadNote[]> {
  const { data, error } = await supabase.rpc('admin_institution_lead_notes', { p_id: id })
  if (error) fail(error)
  return (data ?? []) as LeadNote[]
}

export async function addLeadNote(id: string, body: string): Promise<void> {
  const { error } = await supabase.rpc('admin_add_institution_lead_note', { p_id: id, p_body: body })
  if (error) fail(error)
}

export async function fetchLeadOwners(): Promise<{ user_id: string; name: string }[]> {
  const { data, error } = await supabase.rpc('admin_institution_lead_owners')
  if (error) return []
  return (data ?? []) as { user_id: string; name: string }[]
}

/**
 * The open leads this person owns, follow-ups first (soonest first), then
 * those without a date. Null when they can't see leads or the SQL isn't run.
 */
export function useMyOpenLeads(enabled: boolean, userId: string | undefined): InstitutionLead[] | null {
  const [leads, setLeads] = useState<InstitutionLead[] | null>(null)
  useEffect(() => {
    if (!enabled || !userId) return
    let active = true
    fetchInstitutionLeads()
      .then((all) => {
        if (!active || !all) return
        const open = all.filter((l) => l.owner_id === userId && (l.stage === 'new' || l.stage === 'contacted' || l.stage === 'visit'))
        open.sort((a, b) => (a.follow_up_on ?? '9999').localeCompare(b.follow_up_on ?? '9999'))
        setLeads(open)
      })
      .catch(() => {})
    return () => {
      active = false
    }
  }, [enabled, userId])
  return leads
}
