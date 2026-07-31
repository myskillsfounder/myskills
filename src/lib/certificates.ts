/**
 * Certificates — one per user, awarded on completing the initial assessment.
 *
 * Performance bands (single source of truth for the whole app — the SVG
 * certificate, the profile card, the practice page and the prompt library all
 * read from TIERS):
 *
 *   Gold     80 - 100   Excellent
 *   Silver   60 -  79   Good
 *   Bronze    0 -  59   Developing / basic
 *
 * Bronze is the floor — every completed assessment earns a certificate.
 *
 * ONLY `TIER_THRESHOLDS` below carries the numbers. Every user-facing string
 * ("80% and above", "60% to 79%") is derived from it, so changing a cut-off is
 * a one-line edit. The one place that can still drift is SQL — keep it in sync
 * with the CASE in docs/supabase-migration-2026-07-30-certificate-bands.sql.
 */
import { supabase } from './supabase'

export type CertificateKind = 'gold' | 'silver' | 'bronze'

/** Inclusive lower bound of each band, highest first. Order matters. */
export const TIER_THRESHOLDS: ReadonlyArray<{ kind: CertificateKind; min: number }> = [
  { kind: 'gold', min: 80 },
  { kind: 'silver', min: 60 },
  { kind: 'bronze', min: 0 },
]

/** Inclusive score range for a band, derived from the thresholds above. */
export function tierRange(kind: CertificateKind): { min: number; max: number } {
  const i = TIER_THRESHOLDS.findIndex((t) => t.kind === kind)
  const min = TIER_THRESHOLDS[i].min
  const max = i === 0 ? 100 : TIER_THRESHOLDS[i - 1].min - 1
  return { min, max }
}

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
  /** Plain-English quality label, e.g. "Excellent" */
  meaning: string
  /** Inclusive score range for this band */
  min: number
  max: number
  /** Short badge under the medallion, e.g. "80%+" (derived) */
  bandMin: string
  /** Inline band phrase used in the certificate body copy (derived) */
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

/** Everything that does NOT depend on the numeric cut-offs. */
const TIER_BASE: Record<
  CertificateKind,
  Omit<TierMeta, 'min' | 'max' | 'bandMin' | 'bandWord'>
> = {
  gold: {
    kind: 'gold',
    label: 'Gold',
    certLabel: 'Gold Certificate',
    headline: 'FOUNDATIONAL EXCELLENCE',
    meaning: 'Excellent',
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
    meaning: 'Good',
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
    meaning: 'Developing',
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

function buildTier(kind: CertificateKind): TierMeta {
  const base = TIER_BASE[kind]
  const { min, max } = tierRange(kind)
  // Bronze starts at 0, so a numeric floor would read as meaningless ("0%+").
  const isFloor = min === 0
  return {
    ...base,
    min,
    max,
    bandMin: isFloor ? 'COMPLETED' : `${min}%+`,
    bandWord: isFloor
      ? `${base.label} Performance Band`
      : max === 100
        ? `${base.label} Performance Band (${min}% and above)`
        : `${base.label} Performance Band (${min}% to ${max}%)`,
  }
}

export const TIERS: Record<CertificateKind, TierMeta> = {
  gold: buildTier('gold'),
  silver: buildTier('silver'),
  bronze: buildTier('bronze'),
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

/* -- entitlements ---------------------------------------------------------- *
 * Bands are ranked and INHERIT downward: Gold gets everything Silver gets.
 * Use `hasTierAccess` rather than comparing `kind` directly, so adding a perk
 * to a lower band automatically grants it to the higher ones.
 * -------------------------------------------------------------------------- */

const TIER_RANK: Record<CertificateKind, number> = { bronze: 0, silver: 1, gold: 2 }

/** Does this certificate meet or exceed `required`? */
export function hasTierAccess(
  cert: Pick<Certificate, 'kind'> | null | undefined,
  required: CertificateKind,
): boolean {
  if (!cert) return false
  const held = TIER_RANK[cert.kind]
  if (held === undefined) return false // legacy/unknown value
  return held >= TIER_RANK[required]
}

/** Does this certificate unlock Gold-tier perks (e.g. the deep-dive prompts)? */
export function isGoldCertificate(cert: Pick<Certificate, 'kind'> | null | undefined): boolean {
  return hasTierAccess(cert, 'gold')
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
