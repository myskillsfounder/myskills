/**
 * Picks one prompt per library to surface on the dashboard.
 *
 * Rule: aim at the user's weakest initial-assessment category. If they scored
 * 100% everywhere (or the library has nothing for that area) fall back to a
 * random pick, so the block is never empty and never repeats the same thing
 * forever.
 *
 * Suggestions are seeded by user + day, so they're stable while you're using
 * the app and refresh once a day rather than reshuffling on every render.
 */
import type { AssessmentResult } from './assessmentResults'
import { promptLibraries, type LibraryItem, type PromptLibrary } from './promptLibraries'

/**
 * Assessment categories -> prompt-library track slugs.
 *
 * 'Scenario Based' is deliberately absent: it's a cross-cutting section of the
 * assessment, not a skill track, so it can't point at a set of prompts.
 */
const CATEGORY_TO_TRACK: Record<string, string> = {
  'Marketing Fundamentals': 'marketing-fundamentals',
  'Market Research': 'market-research',
  'Meta Ads': 'meta-ads',
  'Google Ads': 'google-ads',
  SEO: 'seo-aeo',
  Analytics: 'analytics',
  'Content Marketing': 'content-marketing',
  'Marketing Automation & AI': 'marketing-automation-ai',
}

export interface WeakArea {
  /** track slug the prompts are grouped by */
  slug: string
  /** the assessment category name, as the user saw it */
  category: string
  percent: number
}

/** The lowest-scoring assessment category that maps to a prompt track. */
export function weakestArea(assessment: AssessmentResult | null | undefined): WeakArea | null {
  if (!assessment?.categories?.length) return null

  const mapped = assessment.categories
    .map((c) => ({ slug: CATEGORY_TO_TRACK[c.category], category: c.category, percent: c.percent }))
    .filter((c): c is WeakArea => Boolean(c.slug))

  if (!mapped.length) return null

  const weakest = mapped.reduce((lo, c) => (c.percent < lo.percent ? c : lo))
  // A perfect score everywhere means there's no weak area to aim at.
  return weakest.percent >= 100 ? null : weakest
}

/** Stable 32-bit hash — same seed always yields the same pick. */
function hash(seed: string): number {
  let h = 2166136261
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

export interface Suggestion {
  library: PromptLibrary
  item: LibraryItem
  trackName: string
  /** 'weak' when aimed at the weakest area, 'random' when it's a free pick. */
  reason: 'weak' | 'random'
}

/** Today, as a stable per-day seed component. */
function dayKey(d = new Date()): string {
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`
}

/** One suggestion per library. */
export function suggestPrompts(
  assessment: AssessmentResult | null | undefined,
  userKey: string,
): Suggestion[] {
  const weak = weakestArea(assessment)

  return promptLibraries.flatMap<Suggestion>((library) => {
    const weakTrack = weak ? library.tracks.find((t) => t.slug === weak.slug) : undefined
    // Mini Lessons has no skill tracks, so it always falls through to random.
    const track = weakTrack ?? library.tracks[hash(`${userKey}|${dayKey()}|${library.id}|t`) % library.tracks.length]
    if (!track?.items.length) return []

    const item = track.items[hash(`${userKey}|${dayKey()}|${library.id}`) % track.items.length]
    return [{ library, item, trackName: track.name, reason: weakTrack ? 'weak' : 'random' }]
  })
}
