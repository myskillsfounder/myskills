/**
 * Certificates — one per user, awarded on completing the initial assessment.
 * Gold when score >= 75%, otherwise standard. See docs/supabase-certificates.sql.
 */
import { supabase } from './supabase'

export type CertificateKind = 'standard' | 'gold'
export const GOLD_THRESHOLD = 75

export interface Certificate {
  id: string
  code: string
  recipient_name: string
  kind: CertificateKind
  percent: number
  title: string
  issued_at: string
}

export function kindForPercent(percent: number): CertificateKind {
  return percent >= GOLD_THRESHOLD ? 'gold' : 'standard'
}

/** Human-readable, unique-enough certificate code, e.g. MSK-8F3K-9Q2A-XZ04. */
function generateCode(): string {
  const raw = (globalThis.crypto?.randomUUID?.() ?? `${Math.random()}${Date.now()}`)
    .replace(/[^a-z0-9]/gi, '')
    .toUpperCase()
  const seg = (i: number) => raw.slice(i, i + 4).padEnd(4, '0')
  return `MSK-${seg(0)}-${seg(4)}-${seg(8)}`
}

/**
 * Issue the certificate for the current user if they don't already have one.
 * Best-effort by the caller: safe to call every time the assessment is saved
 * (the unique profile_id makes re-issuing a no-op).
 */
export async function issueCertificate(percent: number, recipientName: string): Promise<void> {
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return

  const { error } = await supabase.from('certificates').insert({
    profile_id: user.id,
    code: generateCode(),
    recipient_name: recipientName || user.email?.split('@')[0] || 'Member',
    kind: kindForPercent(percent),
    percent,
    title: 'Digital Marketing',
  })
  // Ignore "already issued" (unique violation on profile_id/code).
  if (error && !/duplicate|unique|conflict/i.test(error.message)) throw error
}

export async function fetchMyCertificate(): Promise<Certificate | null> {
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return null
  const { data, error } = await supabase
    .from('certificates')
    .select('*')
    .eq('profile_id', user.id)
    .maybeSingle()
  if (error) throw error
  return (data as Certificate) ?? null
}
