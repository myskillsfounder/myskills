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

/* Tier-based entitlements were removed 2026-08-02 — the prompt libraries are
 * open to everyone now. Certificates still carry a band (gold/silver/bronze);
 * it's purely a label, nothing gates on it. If perks return, add a ranked
 * `hasTierAccess(cert, required)` helper here rather than comparing `kind`
 * inline at each call site. */

/**
 * Certificates are issued server-side now, inside grade_initial_assessment()
 * (see docs/supabase-server-side-grading.sql) — the percent that decides the
 * band has to come from the same trusted grading, not a client-supplied
 * argument. There is no client-callable issueCertificate() anymore; the
 * certificates table has no client-facing INSERT policy at all.
 */
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
