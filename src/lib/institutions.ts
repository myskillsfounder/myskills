/**
 * Institutions pillar — a single exclusive offline partner for now (INTERVAL).
 * "Book a demo" writes a lead into institution_demo_requests
 * (docs/supabase-institution-demo-requests.sql); follow-up happens by email
 * or phone, there's no automated scheduling here.
 */
import { supabase } from './supabase'

function raise(error: { message?: string } | null): never {
  throw new Error(error?.message?.trim() || 'Something went wrong.')
}

export interface Partner {
  name: string
  tagline: string
  description: string
  highlights: string[]
}

export const institutionPartner: Partner = {
  name: 'INTERVAL',
  tagline: 'Personalised Learning Platform',
  description:
    "MySkills' exclusive offline partner for classroom-based digital marketing training — the same skill tracks and assessments you practice here, taught in person by INTERVAL's trainers.",
  highlights: [
    'Instructor-led offline sessions, run for your cohort',
    'Personalised pace, built around what you’ve already practiced on MySkills',
    'A guided path from practice scores to real classroom coaching',
  ],
}

export interface DemoRequestInput {
  full_name: string
  role: string
  institution: string
  city: string
  student_count: string
  email: string
  phone: string
  message: string
}

export async function submitDemoRequest(userId: string, input: DemoRequestInput): Promise<void> {
  const { error } = await supabase.from('institution_demo_requests').insert({
    requested_by: userId,
    partner: institutionPartner.name,
    full_name: input.full_name.trim(),
    role: input.role.trim() || null,
    institution: input.institution.trim() || null,
    city: input.city.trim() || null,
    student_count: input.student_count.trim() ? Number(input.student_count) : null,
    email: input.email.trim(),
    phone: input.phone.trim() || null,
    message: input.message.trim() || null,
  })
  if (error) raise(error)
}
