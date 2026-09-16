/**
 * Marketing vocabulary bank shared by the dashboard's Vocabulary Coach
 * widget and the full Vocabulary Builder practice mode. One flat list so
 * both surfaces stay in sync — add terms here, they show up in both places.
 */

export type VocabLevel = 'beginner' | 'advanced'

export interface VocabTerm {
  id: string
  term: string
  definition: string
  category: string
  level: VocabLevel
}

export const vocabularyTerms: VocabTerm[] = [
  {
    id: 'cac',
    term: 'CAC (Customer Acquisition Cost)',
    definition: 'The total sales and marketing cost required to acquire one new customer.',
    category: 'Analytics',
    level: 'beginner',
  },
  {
    id: 'ltv',
    term: 'LTV (Customer Lifetime Value)',
    definition: 'The total revenue a business can expect from a single customer over the life of the relationship.',
    category: 'Analytics',
    level: 'advanced',
  },
  {
    id: 'ctr',
    term: 'CTR (Click-Through Rate)',
    definition: 'The percentage of people who click a link or ad after seeing it.',
    category: 'Analytics',
    level: 'beginner',
  },
  {
    id: 'cpc',
    term: 'CPC (Cost Per Click)',
    definition: 'The amount an advertiser pays each time someone clicks their ad.',
    category: 'Paid Media',
    level: 'beginner',
  },
  {
    id: 'cpm',
    term: 'CPM (Cost Per Mille)',
    definition: 'The cost of one thousand ad impressions, used to compare ad pricing across platforms.',
    category: 'Paid Media',
    level: 'advanced',
  },
  {
    id: 'roas',
    term: 'ROAS (Return on Ad Spend)',
    definition: 'The revenue generated for every unit of currency spent on advertising.',
    category: 'Analytics',
    level: 'advanced',
  },
  {
    id: 'attribution-window',
    term: 'Attribution Window',
    definition: 'The time period after someone interacts with an ad during which a resulting conversion is credited to it.',
    category: 'Analytics',
    level: 'advanced',
  },
  {
    id: 'bounce-rate',
    term: 'Bounce Rate',
    definition: 'The percentage of visitors who leave a site after viewing only one page.',
    category: 'Analytics',
    level: 'beginner',
  },
  {
    id: 'serp',
    term: 'SERP (Search Engine Results Page)',
    definition: 'The page a search engine displays in response to a user’s query.',
    category: 'SEO',
    level: 'advanced',
  },
  {
    id: 'backlink',
    term: 'Backlink',
    definition: 'A link from one website to a page on another site, used as a signal of authority and trust.',
    category: 'SEO',
    level: 'beginner',
  },
  {
    id: 'domain-authority',
    term: 'Domain Authority',
    definition: 'A score that predicts how well a website is likely to rank on search engine results pages.',
    category: 'SEO',
    level: 'advanced',
  },
  {
    id: 'organic-traffic',
    term: 'Organic Traffic',
    definition: 'Visitors who arrive at a website through unpaid search engine results.',
    category: 'SEO',
    level: 'advanced',
  },
  {
    id: 'long-tail-keyword',
    term: 'Long-Tail Keyword',
    definition: 'A longer, more specific search phrase that has lower search volume but often higher purchase intent.',
    category: 'SEO',
    level: 'advanced',
  },
  {
    id: 'ab-testing',
    term: 'A/B Testing',
    definition: 'Comparing two versions of a page, email, or ad to see which one performs better.',
    category: 'Optimization',
    level: 'beginner',
  },
  {
    id: 'conversion-funnel',
    term: 'Conversion Funnel',
    definition: 'The stages a prospect moves through on the way from first awareness to completing a purchase.',
    category: 'Strategy',
    level: 'beginner',
  },
  {
    id: 'retargeting',
    term: 'Retargeting',
    definition: 'Showing ads specifically to people who have already visited your site or app.',
    category: 'Paid Media',
    level: 'advanced',
  },
  {
    id: 'ugc',
    term: 'UGC (User-Generated Content)',
    definition: 'Content such as photos, reviews, or videos created by customers rather than the brand itself.',
    category: 'Content & Social',
    level: 'beginner',
  },
  {
    id: 'impressions',
    term: 'Impressions',
    definition: 'The number of times an ad or post is displayed, regardless of whether it was clicked.',
    category: 'Content & Social',
    level: 'beginner',
  },
  {
    id: 'reach',
    term: 'Reach',
    definition: 'The number of unique people who saw a piece of content.',
    category: 'Content & Social',
    level: 'beginner',
  },
  {
    id: 'engagement-rate',
    term: 'Engagement Rate',
    definition: 'Likes, comments, and shares divided by reach or followers, showing how actively an audience responds.',
    category: 'Content & Social',
    level: 'beginner',
  },
  {
    id: 'seo',
    term: 'SEO (Search Engine Optimization)',
    definition: 'The practice of improving a website so it ranks higher in unpaid search results.',
    category: 'SEO',
    level: 'beginner',
  },
  {
    id: 'sem',
    term: 'SEM (Search Engine Marketing)',
    definition: 'Paid tactics, such as search ads, used to increase a brand’s visibility in search results.',
    category: 'Paid Media',
    level: 'beginner',
  },
  {
    id: 'ppc',
    term: 'PPC (Pay-Per-Click)',
    definition: 'An advertising model where the advertiser pays a fee only when their ad is actually clicked.',
    category: 'Paid Media',
    level: 'beginner',
  },
  {
    id: 'kpi',
    term: 'KPI (Key Performance Indicator)',
    definition: 'A measurable value that shows how effectively a team is achieving a specific goal.',
    category: 'Strategy',
    level: 'beginner',
  },
  {
    id: 'conversion-rate',
    term: 'Conversion Rate',
    definition: 'The percentage of visitors who complete a desired action, such as a purchase or sign-up.',
    category: 'Analytics',
    level: 'beginner',
  },
  {
    id: 'lead-magnet',
    term: 'Lead Magnet',
    definition: 'A free resource, such as a guide or template, offered in exchange for a visitor’s contact details.',
    category: 'Strategy',
    level: 'advanced',
  },
  {
    id: 'drip-campaign',
    term: 'Drip Campaign',
    definition: 'A series of automated marketing emails sent on a set schedule or triggered by user behavior.',
    category: 'Email & CRM',
    level: 'advanced',
  },
  {
    id: 'segmentation',
    term: 'Segmentation',
    definition: 'Dividing an audience into smaller groups based on shared traits, such as behavior or demographics.',
    category: 'Strategy',
    level: 'advanced',
  },
  {
    id: 'churn-rate',
    term: 'Churn Rate',
    definition: 'The percentage of customers who stop using a product or service over a given period.',
    category: 'Analytics',
    level: 'advanced',
  },
  {
    id: 'brand-equity',
    term: 'Brand Equity',
    definition: 'The added value a brand name gives a product beyond its basic functional benefits.',
    category: 'Strategy',
    level: 'advanced',
  },
  {
    id: 'value-proposition',
    term: 'Value Proposition',
    definition: 'The clear reason a customer should choose your product over the available alternatives.',
    category: 'Strategy',
    level: 'advanced',
  },
  {
    id: 'impression-share',
    term: 'Impression Share',
    definition: 'The percentage of possible ad impressions an advertiser actually received out of the total available.',
    category: 'Paid Media',
    level: 'advanced',
  },
]
