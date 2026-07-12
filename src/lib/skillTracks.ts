/**
 * Canonical list of MySkills assessment tracks.
 * Mirrors the 8 skill tracks defined in the content bank (Decision Labs
 * scenario files). Question counts reflect the current practice bank size.
 *
 * NOTE: keep this in sync with the backend `skill_tracks` table/seed data
 * once the API is wired up (see docs/BACKEND.md).
 */
export interface SkillTrack {
  slug: string
  name: string
  description: string
  questionCount: number
}

export const skillTracks: SkillTrack[] = [
  {
    slug: 'marketing-fundamentals',
    name: 'Marketing Fundamentals',
    description: 'Core concepts: STP, funnels, personas, and customer value.',
    questionCount: 10,
  },
  {
    slug: 'market-research',
    name: 'Market Research',
    description: 'Keyword research, primary research, and competitor analysis.',
    questionCount: 10,
  },
  {
    slug: 'meta-ads',
    name: 'Meta Ads',
    description: 'Campaign objectives, lookalike audiences, and retargeting.',
    questionCount: 15,
  },
  {
    slug: 'google-ads',
    name: 'Google Ads',
    description: 'Campaign types, Quality Score, match types, and bidding.',
    questionCount: 15,
  },
  {
    slug: 'seo-aeo',
    name: 'SEO & AEO',
    description: 'On-page SEO, backlinks, local SEO, and answer engines.',
    questionCount: 15,
  },
  {
    slug: 'analytics',
    name: 'Analytics',
    description: 'GA4, attribution, conversions, and acquisition efficiency.',
    questionCount: 10,
  },
  {
    slug: 'content-marketing',
    name: 'Content Marketing',
    description: 'Content strategy, formats, and distribution decisions.',
    questionCount: 10,
  },
  {
    slug: 'marketing-automation-ai',
    name: 'Marketing Automation & AI',
    description: 'Workflows, lead scoring, and AI-assisted marketing tools.',
    questionCount: 15,
  },
]
