/**
 * Learning tracks — the guided modules unlocked after the initial assessment.
 * Aligned with the initial-assessment categories (core marketing skill areas).
 */
export interface LearningTrack {
  slug: string
  name: string
  description: string
  lessons: number
  level: 'Beginner' | 'Intermediate' | 'Advanced'
}

export const learningTracks: LearningTrack[] = [
  {
    slug: 'marketing-fundamentals',
    name: 'Marketing Fundamentals',
    description: 'STP, funnels, personas, and how to create real customer value.',
    lessons: 8,
    level: 'Beginner',
  },
  {
    slug: 'market-research',
    name: 'Market Research',
    description: 'Keyword research, surveys, and competitor analysis that inform strategy.',
    lessons: 6,
    level: 'Beginner',
  },
  {
    slug: 'meta-ads',
    name: 'Meta Ads',
    description: 'Objectives, audiences, creatives, and retargeting on Meta.',
    lessons: 9,
    level: 'Intermediate',
  },
  {
    slug: 'google-ads',
    name: 'Google Ads',
    description: 'Search vs. display, Quality Score, match types, and bidding.',
    lessons: 9,
    level: 'Intermediate',
  },
  {
    slug: 'seo',
    name: 'SEO',
    description: 'On-page SEO, backlinks, technical basics, and answer engines.',
    lessons: 7,
    level: 'Intermediate',
  },
  {
    slug: 'analytics',
    name: 'Analytics',
    description: 'GA4, conversions, attribution, and reading the numbers that matter.',
    lessons: 6,
    level: 'Advanced',
  },
]
