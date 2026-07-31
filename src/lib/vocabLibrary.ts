/**
 * Silver Vocabulary Library — 180 marketing terms, each explained on demand
 * by filling one reusable teaching prompt with the chosen term.
 *
 * Source: 'Silver Category - Prompt Library.xlsx'. Column A of each sheet is
 * the term list; the master prompt lives in C3 of the first sheet. This file
 * is GENERATED — regenerate rather than hand-editing if the source changes.
 *
 * `slug` values match src/lib/skillTracks.ts exactly.
 *
 * Same caveat as the Gold library: this ships in the client bundle, so the
 * tier gate is a UX affordance, not a security boundary.
 */
import type { CertificateKind } from './certificates'

/** The band that unlocks the vocabulary library (Gold inherits it). */
export const VOCAB_LIBRARY_TIER: CertificateKind = 'silver'

/**
 * The teaching prompt every term reuses. `[KEYWORD]` is replaced with the
 * selected term by `promptForTerm()`.
 */
export const VOCAB_PROMPT_TEMPLATE = `Act as an expert marketing instructor with years of industry experience.

Teach me the marketing concept: [KEYWORD].

Keep the explanation simple, practical, and beginner-friendly.

Structure your response exactly like this:

1. Definition
Explain the concept in 2–3 simple sentences without using technical jargon.

2. Why It Matters
Explain why this concept is important in marketing and business in one short paragraph.

3. Real-World Example
Give one simple example from a well-known company or a local business.

4. Key Takeaway
Summarize the concept in one memorable sentence.

5. Related Concepts
List 5 closely related marketing concepts I should learn next.

Keep the entire explanation under 300 words.

Avoid unnecessary theory and focus on helping me understand the concept quickly.`

export interface VocabTerm {
  id: string
  /** The term itself, e.g. 'Quality Score'. */
  term: string
}

export interface VocabTrack {
  /** matches a slug in src/lib/skillTracks.ts */
  slug: string
  name: string
  terms: VocabTerm[]
}

export const vocabTracks: VocabTrack[] = [
  {
    slug: 'marketing-fundamentals',
    name: "Marketing Fundamentals",
    terms: [
      { id: 'marketing-fundamentals--marketing', term: "Marketing" },
      { id: 'marketing-fundamentals--market', term: "Market" },
      { id: 'marketing-fundamentals--customer', term: "Customer" },
      { id: 'marketing-fundamentals--customer-need', term: "Customer Need" },
      { id: 'marketing-fundamentals--customer-want', term: "Customer Want" },
      { id: 'marketing-fundamentals--customer-demand', term: "Customer Demand" },
      { id: 'marketing-fundamentals--value-proposition', term: "Value Proposition" },
      { id: 'marketing-fundamentals--usp', term: "USP" },
      { id: 'marketing-fundamentals--brand', term: "Brand" },
      { id: 'marketing-fundamentals--branding', term: "Branding" },
      { id: 'marketing-fundamentals--brand-identity', term: "Brand Identity" },
      { id: 'marketing-fundamentals--brand-positioning', term: "Brand Positioning" },
      { id: 'marketing-fundamentals--market-segmentation', term: "Market Segmentation" },
      { id: 'marketing-fundamentals--target-audience', term: "Target Audience" },
      { id: 'marketing-fundamentals--buyer-persona', term: "Buyer Persona" },
      { id: 'marketing-fundamentals--marketing-mix-4ps', term: "Marketing Mix (4Ps)" },
      { id: 'marketing-fundamentals--product', term: "Product" },
      { id: 'marketing-fundamentals--price', term: "Price" },
      { id: 'marketing-fundamentals--place', term: "Place" },
      { id: 'marketing-fundamentals--promotion', term: "Promotion" },
      { id: 'marketing-fundamentals--customer-journey', term: "Customer Journey" },
      { id: 'marketing-fundamentals--marketing-funnel', term: "Marketing Funnel" },
      { id: 'marketing-fundamentals--b2b', term: "B2B" },
      { id: 'marketing-fundamentals--b2c', term: "B2C" },
      { id: 'marketing-fundamentals--c2c', term: "C2C" },
      { id: 'marketing-fundamentals--value', term: "Value" },
      { id: 'marketing-fundamentals--competition', term: "Competition" },
      { id: 'marketing-fundamentals--competitive-advantage', term: "Competitive Advantage" },
      { id: 'marketing-fundamentals--market-share', term: "Market Share" },
      { id: 'marketing-fundamentals--customer-lifetime-value', term: "Customer Lifetime Value" },
      { id: 'marketing-fundamentals--customer-retention', term: "Customer Retention" },
      { id: 'marketing-fundamentals--customer-acquisition', term: "Customer Acquisition" },
      { id: 'marketing-fundamentals--brand-equity', term: "Brand Equity" },
      { id: 'marketing-fundamentals--aida', term: "AIDA" },
      { id: 'marketing-fundamentals--marketing-strategy', term: "Marketing Strategy" },
      { id: 'marketing-fundamentals--marketing-tactics', term: "Marketing Tactics" },
    ],
  },
  {
    slug: 'market-research',
    name: "Market Research",
    terms: [
      { id: 'market-research--market-research', term: "Market Research" },
      { id: 'market-research--primary-research', term: "Primary Research" },
      { id: 'market-research--secondary-research', term: "Secondary Research" },
      { id: 'market-research--quantitative-research', term: "Quantitative Research" },
      { id: 'market-research--qualitative-research', term: "Qualitative Research" },
      { id: 'market-research--surveys', term: "Surveys" },
      { id: 'market-research--focus-groups', term: "Focus Groups" },
      { id: 'market-research--interviews', term: "Interviews" },
      { id: 'market-research--observation', term: "Observation" },
      { id: 'market-research--competitor-analysis', term: "Competitor Analysis" },
      { id: 'market-research--swot', term: "SWOT" },
      { id: 'market-research--pestle', term: "PESTLE" },
      { id: 'market-research--tam', term: "TAM" },
      { id: 'market-research--sam', term: "SAM" },
      { id: 'market-research--som', term: "SOM" },
      { id: 'market-research--keyword-research', term: "Keyword Research" },
      { id: 'market-research--search-intent', term: "Search Intent" },
      { id: 'market-research--customer-pain-points', term: "Customer Pain Points" },
      { id: 'market-research--consumer-behaviour', term: "Consumer Behaviour" },
      { id: 'market-research--market-trends', term: "Market Trends" },
      { id: 'market-research--demand-analysis', term: "Demand Analysis" },
    ],
  },
  {
    slug: 'meta-ads',
    name: "Meta Ads",
    terms: [
      { id: 'meta-ads--campaign', term: "Campaign" },
      { id: 'meta-ads--ad-set', term: "Ad Set" },
      { id: 'meta-ads--ad', term: "Ad" },
      { id: 'meta-ads--meta-pixel', term: "Meta Pixel" },
      { id: 'meta-ads--conversions-api', term: "Conversions API" },
      { id: 'meta-ads--campaign-objective', term: "Campaign Objective" },
      { id: 'meta-ads--advantage', term: "Advantage+" },
      { id: 'meta-ads--audience', term: "Audience" },
      { id: 'meta-ads--custom-audience', term: "Custom Audience" },
      { id: 'meta-ads--lookalike-audience', term: "Lookalike Audience" },
      { id: 'meta-ads--retargeting', term: "Retargeting" },
      { id: 'meta-ads--ctr', term: "CTR" },
      { id: 'meta-ads--cpc', term: "CPC" },
      { id: 'meta-ads--cpm', term: "CPM" },
      { id: 'meta-ads--cpa', term: "CPA" },
      { id: 'meta-ads--roas', term: "ROAS" },
      { id: 'meta-ads--frequency', term: "Frequency" },
      { id: 'meta-ads--reach', term: "Reach" },
      { id: 'meta-ads--impressions', term: "Impressions" },
      { id: 'meta-ads--learning-phase', term: "Learning Phase" },
      { id: 'meta-ads--attribution', term: "Attribution" },
      { id: 'meta-ads--bid-strategy', term: "Bid Strategy" },
      { id: 'meta-ads--creative', term: "Creative" },
      { id: 'meta-ads--placement', term: "Placement" },
      { id: 'meta-ads--carousel-ads', term: "Carousel Ads" },
      { id: 'meta-ads--lead-ads', term: "Lead Ads" },
      { id: 'meta-ads--instant-forms', term: "Instant Forms" },
    ],
  },
  {
    slug: 'google-ads',
    name: "Google Ads",
    terms: [
      { id: 'google-ads--search-campaign', term: "Search Campaign" },
      { id: 'google-ads--display-campaign', term: "Display Campaign" },
      { id: 'google-ads--performance-max', term: "Performance Max" },
      { id: 'google-ads--shopping-ads', term: "Shopping Ads" },
      { id: 'google-ads--quality-score', term: "Quality Score" },
      { id: 'google-ads--ad-rank', term: "Ad Rank" },
      { id: 'google-ads--keywords', term: "Keywords" },
      { id: 'google-ads--broad-match', term: "Broad Match" },
      { id: 'google-ads--phrase-match', term: "Phrase Match" },
      { id: 'google-ads--exact-match', term: "Exact Match" },
      { id: 'google-ads--negative-keywords', term: "Negative Keywords" },
      { id: 'google-ads--cpc', term: "CPC" },
      { id: 'google-ads--maximize-conversions', term: "Maximize Conversions" },
      { id: 'google-ads--target-cpa', term: "Target CPA" },
      { id: 'google-ads--target-roas', term: "Target ROAS" },
      { id: 'google-ads--search-impression-share', term: "Search Impression Share" },
      { id: 'google-ads--ad-extensions', term: "Ad Extensions" },
      { id: 'google-ads--landing-page', term: "Landing Page" },
    ],
  },
  {
    slug: 'seo-aeo',
    name: "SEO & AEO",
    terms: [
      { id: 'seo-aeo--seo', term: "SEO" },
      { id: 'seo-aeo--aeo', term: "AEO" },
      { id: 'seo-aeo--serp', term: "SERP" },
      { id: 'seo-aeo--organic-traffic', term: "Organic Traffic" },
      { id: 'seo-aeo--backlinks', term: "Backlinks" },
      { id: 'seo-aeo--keywords', term: "Keywords" },
      { id: 'seo-aeo--meta-title', term: "Meta Title" },
      { id: 'seo-aeo--meta-description', term: "Meta Description" },
      { id: 'seo-aeo--heading-tags', term: "Heading Tags" },
      { id: 'seo-aeo--technical-seo', term: "Technical SEO" },
      { id: 'seo-aeo--crawl', term: "Crawl" },
      { id: 'seo-aeo--indexing', term: "Indexing" },
      { id: 'seo-aeo--canonical-tag', term: "Canonical Tag" },
      { id: 'seo-aeo--schema-markup', term: "Schema Markup" },
      { id: 'seo-aeo--core-web-vitals', term: "Core Web Vitals" },
      { id: 'seo-aeo--featured-snippet', term: "Featured Snippet" },
      { id: 'seo-aeo--internal-linking', term: "Internal Linking" },
      { id: 'seo-aeo--external-linking', term: "External Linking" },
      { id: 'seo-aeo--domain-authority', term: "Domain Authority" },
      { id: 'seo-aeo--page-authority', term: "Page Authority" },
    ],
  },
  {
    slug: 'analytics',
    name: "Analytics",
    terms: [
      { id: 'analytics--google-analytics', term: "Google Analytics" },
      { id: 'analytics--ga4', term: "GA4" },
      { id: 'analytics--event', term: "Event" },
      { id: 'analytics--conversion', term: "Conversion" },
      { id: 'analytics--session', term: "Session" },
      { id: 'analytics--user', term: "User" },
      { id: 'analytics--engagement-rate', term: "Engagement Rate" },
      { id: 'analytics--bounce-rate', term: "Bounce Rate" },
      { id: 'analytics--attribution', term: "Attribution" },
      { id: 'analytics--utm', term: "UTM" },
      { id: 'analytics--source', term: "Source" },
      { id: 'analytics--medium', term: "Medium" },
      { id: 'analytics--campaign', term: "Campaign" },
      { id: 'analytics--dimensions', term: "Dimensions" },
      { id: 'analytics--metrics', term: "Metrics" },
      { id: 'analytics--funnel-analysis', term: "Funnel Analysis" },
      { id: 'analytics--cohort-analysis', term: "Cohort Analysis" },
      { id: 'analytics--dashboard', term: "Dashboard" },
      { id: 'analytics--looker-studio', term: "Looker Studio" },
      { id: 'analytics--bigquery', term: "BigQuery" },
    ],
  },
  {
    slug: 'content-marketing',
    name: "Content Marketing",
    terms: [
      { id: 'content-marketing--content-marketing', term: "Content Marketing" },
      { id: 'content-marketing--content-strategy', term: "Content Strategy" },
      { id: 'content-marketing--content-calendar', term: "Content Calendar" },
      { id: 'content-marketing--blog', term: "Blog" },
      { id: 'content-marketing--landing-page', term: "Landing Page" },
      { id: 'content-marketing--copywriting', term: "Copywriting" },
      { id: 'content-marketing--cta', term: "CTA" },
      { id: 'content-marketing--hook', term: "Hook" },
      { id: 'content-marketing--storytelling', term: "Storytelling" },
      { id: 'content-marketing--evergreen-content', term: "Evergreen Content" },
      { id: 'content-marketing--ugc', term: "UGC" },
      { id: 'content-marketing--email-marketing', term: "Email Marketing" },
      { id: 'content-marketing--lead-magnet', term: "Lead Magnet" },
      { id: 'content-marketing--newsletter', term: "Newsletter" },
      { id: 'content-marketing--engagement', term: "Engagement" },
      { id: 'content-marketing--content-funnel', term: "Content Funnel" },
      { id: 'content-marketing--repurposing', term: "Repurposing" },
      { id: 'content-marketing--topic-cluster', term: "Topic Cluster" },
    ],
  },
  {
    slug: 'marketing-automation-ai',
    name: "Marketing Automation & AI",
    terms: [
      { id: 'marketing-automation-ai--marketing-automation', term: "Marketing Automation" },
      { id: 'marketing-automation-ai--crm', term: "CRM" },
      { id: 'marketing-automation-ai--workflow', term: "Workflow" },
      { id: 'marketing-automation-ai--trigger', term: "Trigger" },
      { id: 'marketing-automation-ai--lead-scoring', term: "Lead Scoring" },
      { id: 'marketing-automation-ai--chatbot', term: "Chatbot" },
      { id: 'marketing-automation-ai--email-sequence', term: "Email Sequence" },
      { id: 'marketing-automation-ai--zapier', term: "Zapier" },
      { id: 'marketing-automation-ai--make', term: "Make" },
      { id: 'marketing-automation-ai--ai-prompt', term: "AI Prompt" },
      { id: 'marketing-automation-ai--prompt-engineering', term: "Prompt Engineering" },
      { id: 'marketing-automation-ai--llm', term: "LLM" },
      { id: 'marketing-automation-ai--ai-agent', term: "AI Agent" },
      { id: 'marketing-automation-ai--personalization', term: "Personalization" },
      { id: 'marketing-automation-ai--predictive-analytics', term: "Predictive Analytics" },
      { id: 'marketing-automation-ai--segmentation', term: "Segmentation" },
      { id: 'marketing-automation-ai--a-b-testing-automation', term: "A/B Testing Automation" },
      { id: 'marketing-automation-ai--whatsapp-automation', term: "WhatsApp Automation" },
      { id: 'marketing-automation-ai--api', term: "API" },
      { id: 'marketing-automation-ai--webhook', term: "Webhook" },
    ],
  },
]

/** Total terms across every track. */
export const vocabCount = vocabTracks.reduce((n, t) => n + t.terms.length, 0)

/** The ready-to-paste prompt for a single term. */
export function promptForTerm(term: string): string {
  return VOCAB_PROMPT_TEMPLATE.replace('[KEYWORD]', term)
}
