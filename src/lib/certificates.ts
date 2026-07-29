/**
 * Certificates — one per user, awarded on completing the initial assessment.
 *
 * Performance bands (single source of truth for the whole app — the SVG
 * certificate, the profile card and the practice page all read from TIERS):
 *
 *   Gold    score >= 90
 *   Silver  score >= 75  and < 90
 *   Bronze  everything below 75 (every completed assessment earns a
 *           certificate; bronze is the floor, not a 50% cut-off)
 *
 * Keep TIER_THRESHOLDS in sync with the backfill CASE in
 * docs/supabase-migration-2026-07-30-certificate-bands.sql and the check
 * constraint in docs/supabase-schema.sql (section 5).
 */
import { supabase } from './supabase'

export type CertificateKind = 'gold' | 'silver' | 'bronze'

/** Inclusive lower bound of each band, highest first. Order matters. */
export const TIER_THRESHOLDS: ReadonlyArray<{ kind: CertificateKind; min: number }> = [
  { kind: 'gold', min: 90 },
  { kind: 'silver', min: 75 },
  { kind: 'bronze', min: 0 },
]

export interface Certificate {
  id: string
  code: string
  recipient_name: string
  kind: CertificateKind
  percent: number
  title: string
  issued_at: string
}

/** Everything that varies per band, in one place. */
export interface TierMeta {
  kind: CertificateKind
  /** "Gold" */
  label: string
  /** "Gold Certificate" — card headings */
  certLabel: string
  /** Certificate headline, e.g. "FOUNDATIONAL EXCELLENCE" */
  headline: string
  /** Short badge under the medallion, e.g. "90%+" */
  bandMin: string
  /** Inline band phrase used in the certificate body copy */
  bandWord: string
  /** Adjective phrase in the body copy, e.g. "an exceptional understanding" */
  understanding: string
  /** Tailwind classes for cards/badges outside the SVG */
  ui: {
    border: string
    bg: string
    text: string
    textSoft: string
    textStrong: string
    icon: string
    button: string
  }
}

export const TIERS: Record<CertificateKind, TierMeta> = {
  gold: {
    kind: 'gold',
    label: 'Gold',
    certLabel: 'Gold Certificate',
    headline: 'FOUNDATIONAL EXCELLENCE',
    bandMin: '90%+',
    bandWord: 'Gold Performance Band (90% and above)',
    understanding: 'an exceptional understanding',
    ui: {
      border: 'border-amber-200',
      bg: 'bg-amber-50',
      text: 'text-amber-800',
      textSoft: 'text-amber-700',
      textStrong: 'text-amber-900',
      icon: 'text-amber-600',
      button: 'bg-amber-600 hover:bg-amber-700',
    },
  },
  silver: {
    kind: 'silver',
    label: 'Silver',
    certLabel: 'Silver Certificate',
    headline: 'FOUNDATIONAL ACHIEVEMENT',
    bandMin: '75%+',
    bandWord: 'Silver Performance Band (75% to 89%)',
    understanding: 'a strong understanding',
    ui: {
      border: 'border-slate-200',
      bg: 'bg-slate-50',
      text: 'text-slate-700',
      textSoft: 'text-slate-600',
      textStrong: 'text-slate-900',
      icon: 'text-slate-500',
      button: 'bg-slate-600 hover:bg-slate-700',
    },
  },
  bronze: {
    kind: 'bronze',
    label: 'Bronze',
    certLabel: 'Bronze Certificate',
    headline: 'FOUNDATIONAL COMPETENCE',
    bandMin: 'COMPLETED',
    bandWord: 'Bronze Performance Band',
    understanding: 'a working understanding',
    ui: {
      border: 'border-orange-200',
      bg: 'bg-orange-50',
      text: 'text-orange-800',
      textSoft: 'text-orange-700',
      textStrong: 'text-orange-900',
      icon: 'text-orange-600',
      button: 'bg-orange-600 hover:bg-orange-700',
    },
  },
}

export function kindForPercent(percent: number): CertificateKind {
  return TIER_THRESHOLDS.find((t) => percent >= t.min)?.kind ?? 'bronze'
}

/** Tier metadata for a score or an issued certificate. */
export function tierForPercent(percent: number): TierMeta {
  return TIERS[kindForPercent(percent)]
}

/**
 * Tier metadata for an issued certificate. Falls back to the score if the
 * stored `kind` is missing or is a legacy value ('standard' pre-2026-07-29).
 */
export function tierForCertificate(cert: Pick<Certificate, 'kind' | 'percent'>): TierMeta {
  return TIERS[cert.kind] ?? tierForPercent(cert.percent)
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
