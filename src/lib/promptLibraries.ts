/**
 * Prompt libraries — GENERATED from the source spreadsheets:
 *   'Module Topics for Case Study # prompt.xlsx'  -> Case Studies
 *   'Vocabulary for Modules.xlsx'                 -> Vocabulary
 *   'Mini Lessons for Prompt Library.xlsx'        -> Mini Lessons
 *
 * Regenerate rather than hand-editing, so the two can't drift apart.
 *
 * TWO SHAPES. Libraries come in one of two kinds:
 *
 *   'templated'  a few master-prompt STYLES plus ITEMS grouped by track.
 *                Opening an item fills the chosen style's placeholders
 *                from that item. (Case Studies, Vocabulary)
 *
 *   'standalone' each item IS a complete prompt, carried in `item.body`.
 *                No styles, no placeholders — the prompt generates fresh
 *                content every run. (Mini Lessons)
 *
 * Adding a library means appending to `promptLibraries` — the index page
 * and the browser route both read from it, so no UI changes are needed.
 *
 * ACCESS. Open to everyone. There is deliberately no tier gate here.
 */

/** Where a placeholder's replacement text comes from. */
export type TokenSource = 'itemTitle' | 'itemSubtitle' | 'trackName'

export interface PromptStyle {
  id: string
  name: string
  blurb: string
  /** Raw master prompt, placeholders unfilled. */
  template: string
}

export interface LibraryItem {
  id: string
  title: string
  /** Case studies carry a learning objective here; vocabulary leaves it ''. */
  subtitle: string
  /** Standalone libraries put the whole prompt here. Templated ones omit it. */
  body?: string
}

export interface LibraryTrack {
  /** Usually matches a slug in src/lib/skillTracks.ts; standalone libraries
   *  may use their own grouping (e.g. 'marketing-psychology'). */
  slug: string
  name: string
  items: LibraryItem[]
}

export interface PromptLibrary {
  id: string
  kind: 'templated' | 'standalone'
  name: string
  tagline: string
  description: string
  /** singular noun for counts + empty states, e.g. 'topic' */
  itemNoun: string
  /** lucide icon name, resolved by the UI */
  icon: string
  accent: 'brand' | 'emerald' | 'amber'
  /** placeholder -> where its value comes from (empty for standalone) */
  tokens: Record<string, TokenSource>
  styles: PromptStyle[]
  tracks: LibraryTrack[]
}

export const promptLibraries: PromptLibrary[] = [
  {
    id: 'case-studies',
    kind: 'templated',
    name: "Case Studies",
    tagline: "Learn from real companies",
    description: "Pick a topic and an AI assistant walks you through a real business case \u2014 the challenge first, your decision, then what the company actually did.",
    itemNoun: 'topic',
    icon: 'BookOpen',
    accent: 'brand',
    tokens: {"{{Topic}}": "itemTitle", "{{Why It Works}}": "itemSubtitle"},
    styles: [
      {
        id: 'consultant',
        name: "Consultant case",
        blurb: "A real company, a real challenge \u2014 you decide before the reveal.",
        template: `You are a senior marketing consultant from McKinsey, BCG, and Harvard Business School.

Today's learning topic is:

Topic:
{{Topic}}

Learning Objective:
{{Why It Works}}

Your goal is to teach this topic through ONE real business case study.

Requirements

• Select a real company. Never invent companies.
• Never repeat companies or case studies.
• Choose companies from different industries and countries whenever possible.
• The case study must naturally demonstrate the learning objective.
• Begin with company background.
• Present the business challenge without revealing the solution.
• Explain the market conditions and constraints.
• Ask the learner:

"What would you do if you were the marketing manager?"

Wait for the learner's answer.

After the learner responds:

• Evaluate their thinking.
• Reveal what the company actually did.
• Explain why it succeeded or failed.
• Connect every decision back to {{Topic}}.
• End with:
    - 3 key takeaways
    - 2 reflection questions
    - 1 practical exercise

Do not turn this into a lecture.
Keep it interactive.`,
      },
      {
        id: 'socratic',
        name: "Socratic method",
        blurb: "Taught only through questions until you solve it yourself.",
        template: `You are an MBA professor teaching through the Case Method.

Today's Topic

{{Topic}}

Learning Objective

{{Why It Works}}

Teach ONLY through questions.

Do not explain the concept immediately.

Instead,

1. Introduce a real company.
2. Present the situation.
3. Reveal the challenge gradually.
4. Ask one question.
5. Wait.
6. Reveal more information.
7. Ask another question.
8. Continue until the learner has solved the problem.

Only then

Explain

• The marketing concept
• Why it matters
• What the company actually did
• Alternative solutions
• Lessons learned

The learner should discover the concept instead of being told.`,
      },
      {
        id: 'cmo-sim',
        name: "CMO simulation",
        blurb: "You're the CMO. Every decision reshapes the scenario.",
        template: `You are the Chief Marketing Officer of a company.

Today's Topic

{{Topic}}

Learning Objective

{{Why It Works}}

Put me inside a real business situation.

Give me:

• Company
• Industry
• Budget
• Team
• Competitors
• Customer profile
• Current challenge

Then ask me to make decisions.

Every decision should change the scenario.

Challenge my assumptions.

Act like a real executive.

At the end compare my decisions with what the real company actually did.

Explain

• Why they succeeded
• Why they failed
• Better alternatives

Increase complexity every session.`,
      },
    ],
    tracks: [
      {
        slug: 'marketing-fundamentals',
        name: "Marketing Fundamentals",
        items: [
          { id: 'case-studies--marketing-fundamentals--customer-needs-wants-demand', title: "Customer Needs, Wants & Demand", subtitle: "Understanding why products succeed or fail" },
          { id: 'case-studies--marketing-fundamentals--customer-value-proposition', title: "Customer Value Proposition", subtitle: "Why customers choose one brand over another" },
          { id: 'case-studies--marketing-fundamentals--product-market-fit', title: "Product-Market Fit", subtitle: "Finding the right market for a product" },
          { id: 'case-studies--marketing-fundamentals--market-segmentation', title: "Market Segmentation", subtitle: "Identifying the right customer groups" },
          { id: 'case-studies--marketing-fundamentals--targeting-strategy', title: "Targeting Strategy", subtitle: "Choosing which audience to serve" },
          { id: 'case-studies--marketing-fundamentals--brand-positioning', title: "Brand Positioning", subtitle: "Owning a unique place in the customer's mind" },
          { id: 'case-studies--marketing-fundamentals--unique-selling-proposition-usp', title: "Unique Selling Proposition (USP)", subtitle: "Differentiating from competitors" },
          { id: 'case-studies--marketing-fundamentals--branding', title: "Branding", subtitle: "Building recognition, trust, and loyalty" },
          { id: 'case-studies--marketing-fundamentals--brand-equity', title: "Brand Equity", subtitle: "Creating long-term brand value" },
          { id: 'case-studies--marketing-fundamentals--customer-journey', title: "Customer Journey", subtitle: "Improving the buying experience" },
          { id: 'case-studies--marketing-fundamentals--buyer-decision-process', title: "Buyer Decision Process", subtitle: "Understanding how customers make decisions" },
          { id: 'case-studies--marketing-fundamentals--consumer-behavior', title: "Consumer Behavior", subtitle: "Explaining purchasing decisions" },
          { id: 'case-studies--marketing-fundamentals--marketing-mix-4ps', title: "Marketing Mix (4Ps)", subtitle: "Product, Price, Place, and Promotion decisions" },
          { id: 'case-studies--marketing-fundamentals--pricing-strategy', title: "Pricing Strategy", subtitle: "Premium, penetration, skimming, value-based pricing" },
          { id: 'case-studies--marketing-fundamentals--product-strategy', title: "Product Strategy", subtitle: "Product design, features, and lifecycle decisions" },
          { id: 'case-studies--marketing-fundamentals--distribution-place-strategy', title: "Distribution (Place) Strategy", subtitle: "Getting products to customers effectively" },
          { id: 'case-studies--marketing-fundamentals--promotion-strategy', title: "Promotion Strategy", subtitle: "Choosing the right communication approach" },
          { id: 'case-studies--marketing-fundamentals--competitive-advantage', title: "Competitive Advantage", subtitle: "Winning against competitors" },
          { id: 'case-studies--marketing-fundamentals--differentiation-strategy', title: "Differentiation Strategy", subtitle: "Standing out in crowded markets" },
          { id: 'case-studies--marketing-fundamentals--blue-ocean-strategy', title: "Blue Ocean Strategy", subtitle: "Creating uncontested market space" },
          { id: 'case-studies--marketing-fundamentals--market-entry-strategy', title: "Market Entry Strategy", subtitle: "Launching into new markets or countries" },
          { id: 'case-studies--marketing-fundamentals--repositioning-strategy', title: "Repositioning Strategy", subtitle: "Changing customer perception" },
          { id: 'case-studies--marketing-fundamentals--customer-retention', title: "Customer Retention", subtitle: "Keeping existing customers" },
          { id: 'case-studies--marketing-fundamentals--customer-experience-cx', title: "Customer Experience (CX)", subtitle: "Designing memorable customer interactions" },
          { id: 'case-studies--marketing-fundamentals--innovation-in-marketing', title: "Innovation in Marketing", subtitle: "Using innovation to drive growth" },
          { id: 'case-studies--marketing-fundamentals--growth-strategy', title: "Growth Strategy", subtitle: "Scaling a business sustainably" },
          { id: 'case-studies--marketing-fundamentals--marketing-ethics', title: "Marketing Ethics", subtitle: "Ethical dilemmas in branding and advertising" },
          { id: 'case-studies--marketing-fundamentals--crisis-reputation-management', title: "Crisis & Reputation Management", subtitle: "Responding to PR and brand crises" },
        ],
      },
      {
        slug: 'market-research',
        name: "Market Research",
        items: [
          { id: 'case-studies--market-research--identifying-the-research-problem', title: "Identifying the Research Problem", subtitle: "Defining the right business problem before investing" },
          { id: 'case-studies--market-research--business-objectives-vs-research-objectives', title: "Business Objectives vs Research Objectives", subtitle: "Aligning research with business goals" },
          { id: 'case-studies--market-research--market-opportunity-analysis', title: "Market Opportunity Analysis", subtitle: "Finding new markets and growth opportunities" },
          { id: 'case-studies--market-research--customer-research', title: "Customer Research", subtitle: "Understanding customer needs, behaviors, and pain points" },
          { id: 'case-studies--market-research--target-audience-research', title: "Target Audience Research", subtitle: "Identifying the ideal customer profile" },
          { id: 'case-studies--market-research--market-segmentation-research', title: "Market Segmentation Research", subtitle: "Discovering meaningful customer segments" },
          { id: 'case-studies--market-research--competitor-research', title: "Competitor Research", subtitle: "Understanding competitors' strengths and weaknesses" },
          { id: 'case-studies--market-research--industry-analysis', title: "Industry Analysis", subtitle: "Evaluating market size, trends, and dynamics" },
          { id: 'case-studies--market-research--consumer-behavior-research', title: "Consumer Behavior Research", subtitle: "Explaining why customers buy or don't buy" },
          { id: 'case-studies--market-research--qualitative-research', title: "Qualitative Research", subtitle: "Using interviews and focus groups for insights" },
          { id: 'case-studies--market-research--quantitative-research', title: "Quantitative Research", subtitle: "Making decisions with surveys and numerical data" },
          { id: 'case-studies--market-research--primary-research', title: "Primary Research", subtitle: "Collecting original customer data" },
          { id: 'case-studies--market-research--secondary-research', title: "Secondary Research", subtitle: "Leveraging existing reports and public information" },
          { id: 'case-studies--market-research--survey-design', title: "Survey Design", subtitle: "Asking the right questions to get reliable insights" },
          { id: 'case-studies--market-research--customer-persona-development', title: "Customer Persona Development", subtitle: "Building evidence-based customer personas" },
          { id: 'case-studies--market-research--customer-journey-research', title: "Customer Journey Research", subtitle: "Identifying friction points in the buying process" },
          { id: 'case-studies--market-research--market-sizing-tam-sam-som', title: "Market Sizing (TAM, SAM, SOM)", subtitle: "Estimating business potential" },
          { id: 'case-studies--market-research--demand-forecasting', title: "Demand Forecasting", subtitle: "Predicting future customer demand" },
          { id: 'case-studies--market-research--trend-analysis', title: "Trend Analysis", subtitle: "Spotting emerging market opportunities" },
          { id: 'case-studies--market-research--swot-analysis', title: "SWOT Analysis", subtitle: "Assessing internal and external factors" },
          { id: 'case-studies--market-research--pestle-analysis', title: "PESTLE Analysis", subtitle: "Understanding macro-environment influences" },
          { id: 'case-studies--market-research--porter-s-five-forces', title: "Porter's Five Forces", subtitle: "Evaluating industry competitiveness" },
          { id: 'case-studies--market-research--benchmarking', title: "Benchmarking", subtitle: "Comparing performance against competitors" },
          { id: 'case-studies--market-research--product-validation-research', title: "Product Validation Research", subtitle: "Testing ideas before launch" },
          { id: 'case-studies--market-research--concept-testing', title: "Concept Testing", subtitle: "Evaluating product or campaign concepts" },
          { id: 'case-studies--market-research--pricing-research', title: "Pricing Research", subtitle: "Finding what customers are willing to pay" },
          { id: 'case-studies--market-research--brand-perception-research', title: "Brand Perception Research", subtitle: "Measuring how customers view a brand" },
          { id: 'case-studies--market-research--customer-satisfaction-research', title: "Customer Satisfaction Research", subtitle: "Understanding satisfaction and loyalty" },
          { id: 'case-studies--market-research--voice-of-customer-voc', title: "Voice of Customer (VoC)", subtitle: "Collecting customer feedback for improvement" },
          { id: 'case-studies--market-research--research-driven-decision-making', title: "Research-Driven Decision Making", subtitle: "Turning insights into business actions" },
        ],
      },
      {
        slug: 'meta-ads',
        name: "Meta Ads",
        items: [
          { id: 'case-studies--meta-ads--choosing-the-right-campaign-objective', title: "Choosing the Right Campaign Objective", subtitle: "Selecting objectives based on business goals" },
          { id: 'case-studies--meta-ads--understanding-the-meta-auction', title: "Understanding the Meta Auction", subtitle: "Explaining why one advertiser wins over another" },
          { id: 'case-studies--meta-ads--campaign-structure-campaign-ad-set-ad', title: "Campaign Structure (Campaign, Ad Set, Ad)", subtitle: "Designing scalable campaign architecture" },
          { id: 'case-studies--meta-ads--audience-research-before-advertising', title: "Audience Research Before Advertising", subtitle: "Building campaigns on customer insights" },
          { id: 'case-studies--meta-ads--interest-targeting', title: "Interest Targeting", subtitle: "Reaching relevant audiences through interests" },
          { id: 'case-studies--meta-ads--custom-audiences', title: "Custom Audiences", subtitle: "Re-engaging existing customers effectively" },
          { id: 'case-studies--meta-ads--lookalike-audiences', title: "Lookalike Audiences", subtitle: "Scaling from high-quality customer data" },
          { id: 'case-studies--meta-ads--broad-targeting', title: "Broad Targeting", subtitle: "Letting Meta's algorithm optimize delivery" },
          { id: 'case-studies--meta-ads--creative-strategy', title: "Creative Strategy", subtitle: "Developing ad creatives that capture attention" },
          { id: 'case-studies--meta-ads--ad-copy-messaging', title: "Ad Copy & Messaging", subtitle: "Writing copy that converts different audiences" },
          { id: 'case-studies--meta-ads--creative-testing-framework', title: "Creative Testing Framework", subtitle: "Systematically identifying winning creatives" },
          { id: 'case-studies--meta-ads--a-b-testing', title: "A/B Testing", subtitle: "Testing variables without introducing bias" },
          { id: 'case-studies--meta-ads--landing-page-experience', title: "Landing Page Experience", subtitle: "Improving post-click conversion rates" },
          { id: 'case-studies--meta-ads--pixel-conversion-tracking', title: "Pixel & Conversion Tracking", subtitle: "Ensuring accurate measurement and optimization" },
          { id: 'case-studies--meta-ads--conversion-api-capi', title: "Conversion API (CAPI)", subtitle: "Recovering signal loss and improving attribution" },
          { id: 'case-studies--meta-ads--optimization-events', title: "Optimization Events", subtitle: "Choosing the right event for campaign goals" },
          { id: 'case-studies--meta-ads--learning-phase', title: "Learning Phase", subtitle: "Helping campaigns stabilize and exit learning" },
          { id: 'case-studies--meta-ads--budget-allocation-abo-vs-cbo', title: "Budget Allocation (ABO vs CBO)", subtitle: "Deciding where budgets should be controlled" },
          { id: 'case-studies--meta-ads--bid-strategy', title: "Bid Strategy", subtitle: "Selecting the right bidding approach" },
          { id: 'case-studies--meta-ads--scaling-campaigns', title: "Scaling Campaigns", subtitle: "Growing spend without destroying efficiency" },
          { id: 'case-studies--meta-ads--creative-fatigue', title: "Creative Fatigue", subtitle: "Identifying and fixing declining performance" },
          { id: 'case-studies--meta-ads--audience-fatigue', title: "Audience Fatigue", subtitle: "Recognizing market saturation" },
          { id: 'case-studies--meta-ads--frequency-management', title: "Frequency Management", subtitle: "Balancing exposure without oversaturation" },
          { id: 'case-studies--meta-ads--retargeting-strategy', title: "Retargeting Strategy", subtitle: "Recovering lost visitors and abandoned leads" },
          { id: 'case-studies--meta-ads--full-funnel-advertising', title: "Full-Funnel Advertising", subtitle: "Building awareness, consideration, and conversion campaigns" },
          { id: 'case-studies--meta-ads--attribution-challenges', title: "Attribution Challenges", subtitle: "Interpreting performance across touchpoints" },
          { id: 'case-studies--meta-ads--diagnosing-high-cpm', title: "Diagnosing High CPM", subtitle: "Understanding rising advertising costs" },
          { id: 'case-studies--meta-ads--diagnosing-low-ctr', title: "Diagnosing Low CTR", subtitle: "Improving click-through rates through creative and messaging" },
          { id: 'case-studies--meta-ads--diagnosing-high-cpa', title: "Diagnosing High CPA", subtitle: "Finding the root causes of expensive conversions" },
          { id: 'case-studies--meta-ads--improving-roas', title: "Improving ROAS", subtitle: "Optimizing campaigns for profitability" },
          { id: 'case-studies--meta-ads--seasonal-advertising', title: "Seasonal Advertising", subtitle: "Adjusting campaigns for changing demand" },
          { id: 'case-studies--meta-ads--launching-a-new-product', title: "Launching a New Product", subtitle: "Planning Meta campaigns for product introductions" },
          { id: 'case-studies--meta-ads--local-business-advertising', title: "Local Business Advertising", subtitle: "Driving footfall and local leads" },
          { id: 'case-studies--meta-ads--e-commerce-scaling', title: "E-commerce Scaling", subtitle: "Scaling online stores efficiently" },
          { id: 'case-studies--meta-ads--lead-generation-campaigns', title: "Lead Generation Campaigns", subtitle: "Generating high-quality leads at scale" },
          { id: 'case-studies--meta-ads--b2b-advertising-on-meta', title: "B2B Advertising on Meta", subtitle: "Reaching professional audiences effectively" },
          { id: 'case-studies--meta-ads--international-campaign-expansion', title: "International Campaign Expansion", subtitle: "Scaling campaigns across countries" },
          { id: 'case-studies--meta-ads--budget-constraints', title: "Budget Constraints", subtitle: "Maximizing results with limited spend" },
          { id: 'case-studies--meta-ads--competitor-advertising-strategy', title: "Competitor Advertising Strategy", subtitle: "Responding to aggressive competitors" },
          { id: 'case-studies--meta-ads--campaign-recovery', title: "Campaign Recovery", subtitle: "Turning around underperforming campaigns" },
        ],
      },
      {
        slug: 'google-ads',
        name: "Google Ads",
        items: [
          { id: 'case-studies--google-ads--choosing-the-right-google-ads-campaign-type', title: "Choosing the Right Google Ads Campaign Type", subtitle: "Selecting Search, Performance Max, Shopping, Display, or Video based on business goals" },
          { id: 'case-studies--google-ads--search-intent-analysis', title: "Search Intent Analysis", subtitle: "Understanding what customers are actually searching for" },
          { id: 'case-studies--google-ads--keyword-research', title: "Keyword Research", subtitle: "Finding keywords that drive qualified traffic" },
          { id: 'case-studies--google-ads--keyword-match-types', title: "Keyword Match Types", subtitle: "Balancing reach and relevance with Broad, Phrase, and Exact Match" },
          { id: 'case-studies--google-ads--search-term-analysis', title: "Search Term Analysis", subtitle: "Discovering what users actually searched before clicking" },
          { id: 'case-studies--google-ads--negative-keywords', title: "Negative Keywords", subtitle: "Eliminating wasted spend from irrelevant traffic" },
          { id: 'case-studies--google-ads--ad-copy-strategy', title: "Ad Copy Strategy", subtitle: "Writing compelling search ads that improve CTR" },
          { id: 'case-studies--google-ads--responsive-search-ads-rsa', title: "Responsive Search Ads (RSA)", subtitle: "Optimizing multiple headlines and descriptions using AI" },
          { id: 'case-studies--google-ads--quality-score-optimization', title: "Quality Score Optimization", subtitle: "Improving Ad Rank while lowering CPC" },
          { id: 'case-studies--google-ads--ad-rank-auction', title: "Ad Rank & Auction", subtitle: "Understanding how Google determines winners" },
          { id: 'case-studies--google-ads--landing-page-optimization', title: "Landing Page Optimization", subtitle: "Increasing conversions after the click" },
          { id: 'case-studies--google-ads--conversion-tracking', title: "Conversion Tracking", subtitle: "Measuring valuable actions accurately" },
          { id: 'case-studies--google-ads--smart-bidding-strategies', title: "Smart Bidding Strategies", subtitle: "Choosing the right automated bidding approach" },
          { id: 'case-studies--google-ads--budget-allocation', title: "Budget Allocation", subtitle: "Distributing spend across campaigns effectively" },
          { id: 'case-studies--google-ads--campaign-structure', title: "Campaign Structure", subtitle: "Organizing campaigns and ad groups for scalability" },
          { id: 'case-studies--google-ads--performance-max-strategy', title: "Performance Max Strategy", subtitle: "Leveraging AI-driven campaigns across Google's inventory" },
          { id: 'case-studies--google-ads--shopping-ads-strategy', title: "Shopping Ads Strategy", subtitle: "Optimizing product feeds and retail campaigns" },
          { id: 'case-studies--google-ads--display-advertising', title: "Display Advertising", subtitle: "Building awareness and remarketing audiences" },
          { id: 'case-studies--google-ads--youtube-advertising', title: "YouTube Advertising", subtitle: "Driving awareness and action through video" },
          { id: 'case-studies--google-ads--remarketing-strategy', title: "Remarketing Strategy", subtitle: "Re-engaging visitors across Google properties" },
          { id: 'case-studies--google-ads--local-search-advertising', title: "Local Search Advertising", subtitle: "Driving calls, visits, and local business growth" },
          { id: 'case-studies--google-ads--lead-generation-campaigns', title: "Lead Generation Campaigns", subtitle: "Optimizing for high-quality leads" },
          { id: 'case-studies--google-ads--e-commerce-scaling', title: "E-commerce Scaling", subtitle: "Growing online sales efficiently" },
          { id: 'case-studies--google-ads--diagnosing-high-cpc', title: "Diagnosing High CPC", subtitle: "Understanding why clicks have become expensive" },
          { id: 'case-studies--google-ads--diagnosing-low-ctr', title: "Diagnosing Low CTR", subtitle: "Improving relevance and click-through rate" },
          { id: 'case-studies--google-ads--diagnosing-low-conversion-rate', title: "Diagnosing Low Conversion Rate", subtitle: "Identifying friction after the click" },
          { id: 'case-studies--google-ads--improving-roas', title: "Improving ROAS", subtitle: "Increasing profitability through optimization" },
          { id: 'case-studies--google-ads--attribution-conversion-paths', title: "Attribution & Conversion Paths", subtitle: "Understanding how multiple touchpoints contribute to conversions" },
          { id: 'case-studies--google-ads--competitor-strategy', title: "Competitor Strategy", subtitle: "Responding to aggressive competitors in search results" },
          { id: 'case-studies--google-ads--seasonal-search-demand', title: "Seasonal Search Demand", subtitle: "Planning campaigns around changing search behavior" },
          { id: 'case-studies--google-ads--brand-vs-non-brand-campaigns', title: "Brand vs Non-Brand Campaigns", subtitle: "Balancing defensive and acquisition strategies" },
          { id: 'case-studies--google-ads--search-vs-performance-max', title: "Search vs Performance Max", subtitle: "Choosing the right campaign type for business goals" },
          { id: 'case-studies--google-ads--ai-automation-in-google-ads', title: "AI & Automation in Google Ads", subtitle: "Using Google's automation effectively without losing control" },
          { id: 'case-studies--google-ads--campaign-recovery', title: "Campaign Recovery", subtitle: "Fixing underperforming campaigns through systematic analysis" },
        ],
      },
      {
        slug: 'seo-aeo',
        name: "SEO & AEO",
        items: [
          { id: 'case-studies--seo-aeo--understanding-search-intent', title: "Understanding Search Intent", subtitle: "Matching content to what users actually want" },
          { id: 'case-studies--seo-aeo--keyword-research', title: "Keyword Research", subtitle: "Finding high-value search opportunities" },
          { id: 'case-studies--seo-aeo--topic-clusters-content-strategy', title: "Topic Clusters & Content Strategy", subtitle: "Building authority around a subject" },
          { id: 'case-studies--seo-aeo--on-page-seo', title: "On-Page SEO", subtitle: "Optimizing content for search engines and users" },
          { id: 'case-studies--seo-aeo--technical-seo', title: "Technical SEO", subtitle: "Improving crawlability, indexing, and site health" },
          { id: 'case-studies--seo-aeo--website-architecture', title: "Website Architecture", subtitle: "Organizing content for better discoverability" },
          { id: 'case-studies--seo-aeo--internal-linking-strategy', title: "Internal Linking Strategy", subtitle: "Distributing authority across pages" },
          { id: 'case-studies--seo-aeo--content-quality-eeat', title: "Content Quality & EEAT", subtitle: "Building trust and expertise" },
          { id: 'case-studies--seo-aeo--featured-snippets', title: "Featured Snippets", subtitle: "Winning Google's answer box" },
          { id: 'case-studies--seo-aeo--aeo-answer-engine-optimization', title: "AEO (Answer Engine Optimization)", subtitle: "Optimizing content for AI-powered search experiences" },
          { id: 'case-studies--seo-aeo--ai-search-optimization', title: "AI Search Optimization", subtitle: "Increasing visibility in ChatGPT, Gemini, and AI Overviews" },
          { id: 'case-studies--seo-aeo--local-seo', title: "Local SEO", subtitle: "Driving traffic from location-based searches" },
          { id: 'case-studies--seo-aeo--google-business-profile-optimization', title: "Google Business Profile Optimization", subtitle: "Improving local visibility" },
          { id: 'case-studies--seo-aeo--link-building-strategy', title: "Link Building Strategy", subtitle: "Earning high-quality backlinks" },
          { id: 'case-studies--seo-aeo--digital-pr', title: "Digital PR", subtitle: "Gaining authority through media coverage" },
          { id: 'case-studies--seo-aeo--content-refresh-strategy', title: "Content Refresh Strategy", subtitle: "Updating existing content to regain rankings" },
          { id: 'case-studies--seo-aeo--competitor-seo-analysis', title: "Competitor SEO Analysis", subtitle: "Understanding why competitors rank higher" },
          { id: 'case-studies--seo-aeo--seo-for-e-commerce', title: "SEO for E-commerce", subtitle: "Growing product visibility organically" },
          { id: 'case-studies--seo-aeo--seo-for-saas', title: "SEO for SaaS", subtitle: "Scaling organic acquisition for software businesses" },
          { id: 'case-studies--seo-aeo--seo-for-blogs', title: "SEO for Blogs", subtitle: "Building consistent organic traffic" },
          { id: 'case-studies--seo-aeo--mobile-seo', title: "Mobile SEO", subtitle: "Optimizing for mobile-first indexing" },
          { id: 'case-studies--seo-aeo--core-web-vitals', title: "Core Web Vitals", subtitle: "Improving user experience and rankings" },
          { id: 'case-studies--seo-aeo--crawl-budget-optimization', title: "Crawl Budget Optimization", subtitle: "Ensuring important pages are indexed" },
          { id: 'case-studies--seo-aeo--schema-markup', title: "Schema Markup", subtitle: "Helping search engines understand content" },
          { id: 'case-studies--seo-aeo--voice-search-optimization', title: "Voice Search Optimization", subtitle: "Preparing content for conversational queries" },
          { id: 'case-studies--seo-aeo--zero-click-searches', title: "Zero-Click Searches", subtitle: "Winning visibility without clicks" },
          { id: 'case-studies--seo-aeo--measuring-seo-success', title: "Measuring SEO Success", subtitle: "Tracking rankings, traffic, and conversions" },
          { id: 'case-studies--seo-aeo--recovering-from-an-algorithm-update', title: "Recovering from an Algorithm Update", subtitle: "Responding to search ranking changes" },
          { id: 'case-studies--seo-aeo--international-seo', title: "International SEO", subtitle: "Optimizing multilingual and multi-country websites" },
          { id: 'case-studies--seo-aeo--seo-content-strategy', title: "SEO Content Strategy", subtitle: "Planning content for long-term growth" },
          { id: 'case-studies--seo-aeo--topical-authority', title: "Topical Authority", subtitle: "Becoming the trusted source in a niche" },
          { id: 'case-studies--seo-aeo--programmatic-seo', title: "Programmatic SEO", subtitle: "Scaling content using structured templates" },
          { id: 'case-studies--seo-aeo--ai-generated-content-strategy', title: "AI-Generated Content Strategy", subtitle: "Using AI responsibly while maintaining quality" },
          { id: 'case-studies--seo-aeo--seo-migration', title: "SEO Migration", subtitle: "Preserving rankings during website redesigns" },
          { id: 'case-studies--seo-aeo--seo-cro-integration', title: "SEO & CRO Integration", subtitle: "Converting organic visitors into customers" },
        ],
      },
      {
        slug: 'analytics',
        name: "Analytics",
        items: [
          { id: 'case-studies--analytics--choosing-the-right-kpis', title: "Choosing the Right KPIs", subtitle: "Measuring what actually matters for business success" },
          { id: 'case-studies--analytics--marketing-funnel-analysis', title: "Marketing Funnel Analysis", subtitle: "Identifying where customers are dropping off" },
          { id: 'case-studies--analytics--customer-journey-analytics', title: "Customer Journey Analytics", subtitle: "Understanding the complete conversion path" },
          { id: 'case-studies--analytics--website-traffic-analysis', title: "Website Traffic Analysis", subtitle: "Interpreting traffic sources and behavior" },
          { id: 'case-studies--analytics--acquisition-channel-analysis', title: "Acquisition Channel Analysis", subtitle: "Comparing the effectiveness of different marketing channels" },
          { id: 'case-studies--analytics--campaign-performance-analysis', title: "Campaign Performance Analysis", subtitle: "Evaluating advertising campaign success" },
          { id: 'case-studies--analytics--conversion-rate-optimization-cro', title: "Conversion Rate Optimization (CRO)", subtitle: "Improving conversions through data-driven decisions" },
          { id: 'case-studies--analytics--attribution-models', title: "Attribution Models", subtitle: "Understanding which channels deserve credit" },
          { id: 'case-studies--analytics--customer-lifetime-value-clv-analysis', title: "Customer Lifetime Value (CLV) Analysis", subtitle: "Measuring long-term customer profitability" },
          { id: 'case-studies--analytics--cohort-analysis', title: "Cohort Analysis", subtitle: "Tracking user behavior over time" },
          { id: 'case-studies--analytics--retention-analysis', title: "Retention Analysis", subtitle: "Understanding why customers stay or leave" },
          { id: 'case-studies--analytics--churn-analysis', title: "Churn Analysis", subtitle: "Identifying the reasons behind customer loss" },
          { id: 'case-studies--analytics--segmentation-analysis', title: "Segmentation Analysis", subtitle: "Comparing different customer groups" },
          { id: 'case-studies--analytics--a-b-test-analysis', title: "A/B Test Analysis", subtitle: "Interpreting experiment results correctly" },
          { id: 'case-studies--analytics--roas-analysis', title: "ROAS Analysis", subtitle: "Measuring advertising profitability" },
          { id: 'case-studies--analytics--cac-analysis', title: "CAC Analysis", subtitle: "Understanding customer acquisition costs" },
          { id: 'case-studies--analytics--revenue-analysis', title: "Revenue Analysis", subtitle: "Connecting marketing performance to business growth" },
          { id: 'case-studies--analytics--dashboard-design', title: "Dashboard Design", subtitle: "Building actionable executive dashboards" },
          { id: 'case-studies--analytics--data-visualization', title: "Data Visualization", subtitle: "Presenting insights clearly and effectively" },
          { id: 'case-studies--analytics--google-analytics-4-ga4-analysis', title: "Google Analytics 4 (GA4) Analysis", subtitle: "Using GA4 reports to answer business questions" },
          { id: 'case-studies--analytics--event-tracking-analysis', title: "Event Tracking Analysis", subtitle: "Understanding user interactions" },
          { id: 'case-studies--analytics--utm-tracking-strategy', title: "UTM Tracking Strategy", subtitle: "Measuring campaign performance accurately" },
          { id: 'case-studies--analytics--multi-channel-attribution', title: "Multi-Channel Attribution", subtitle: "Evaluating cross-channel performance" },
          { id: 'case-studies--analytics--e-commerce-analytics', title: "E-commerce Analytics", subtitle: "Understanding online shopping behavior" },
          { id: 'case-studies--analytics--lead-funnel-analytics', title: "Lead Funnel Analytics", subtitle: "Measuring lead generation efficiency" },
          { id: 'case-studies--analytics--predictive-analytics', title: "Predictive Analytics", subtitle: "Forecasting future performance" },
          { id: 'case-studies--analytics--marketing-mix-analysis', title: "Marketing Mix Analysis", subtitle: "Understanding channel contribution" },
          { id: 'case-studies--analytics--executive-reporting', title: "Executive Reporting", subtitle: "Communicating insights to stakeholders" },
          { id: 'case-studies--analytics--data-quality-tracking-audits', title: "Data Quality & Tracking Audits", subtitle: "Ensuring reliable data collection" },
          { id: 'case-studies--analytics--decision-making-with-data', title: "Decision-Making with Data", subtitle: "Turning analysis into business actions" },
        ],
      },
      {
        slug: 'content-marketing',
        name: "Content Marketing",
        items: [
          { id: 'case-studies--content-marketing--building-a-content-strategy', title: "Building a Content Strategy", subtitle: "Aligning content with business goals" },
          { id: 'case-studies--content-marketing--understanding-the-target-audience', title: "Understanding the Target Audience", subtitle: "Creating content people actually care about" },
          { id: 'case-studies--content-marketing--content-planning-editorial-calendar', title: "Content Planning & Editorial Calendar", subtitle: "Publishing consistently with purpose" },
          { id: 'case-studies--content-marketing--content-pillars-topic-clusters', title: "Content Pillars & Topic Clusters", subtitle: "Building authority around core topics" },
          { id: 'case-studies--content-marketing--storytelling-in-marketing', title: "Storytelling in Marketing", subtitle: "Using stories to build emotional connections" },
          { id: 'case-studies--content-marketing--educational-content-marketing', title: "Educational Content Marketing", subtitle: "Teaching to earn trust and authority" },
          { id: 'case-studies--content-marketing--brand-storytelling', title: "Brand Storytelling", subtitle: "Communicating brand purpose effectively" },
          { id: 'case-studies--content-marketing--copywriting-fundamentals', title: "Copywriting Fundamentals", subtitle: "Writing content that captures attention and drives action" },
          { id: 'case-studies--content-marketing--blog-content-strategy', title: "Blog Content Strategy", subtitle: "Growing organic traffic through blogging" },
          { id: 'case-studies--content-marketing--video-content-strategy', title: "Video Content Strategy", subtitle: "Using video to educate, engage, and convert" },
          { id: 'case-studies--content-marketing--social-media-content-strategy', title: "Social Media Content Strategy", subtitle: "Creating platform-specific content" },
          { id: 'case-studies--content-marketing--email-content-marketing', title: "Email Content Marketing", subtitle: "Nurturing leads with valuable communication" },
          { id: 'case-studies--content-marketing--user-generated-content-ugc', title: "User-Generated Content (UGC)", subtitle: "Leveraging customers to create authentic content" },
          { id: 'case-studies--content-marketing--influencer-content-strategy', title: "Influencer Content Strategy", subtitle: "Partnering with creators for greater reach" },
          { id: 'case-studies--content-marketing--content-distribution-strategy', title: "Content Distribution Strategy", subtitle: "Ensuring great content reaches the right audience" },
          { id: 'case-studies--content-marketing--repurposing-content', title: "Repurposing Content", subtitle: "Turning one idea into multiple formats" },
          { id: 'case-studies--content-marketing--seo-content-strategy', title: "SEO Content Strategy", subtitle: "Writing content that ranks and converts" },
          { id: 'case-studies--content-marketing--aeo-content-strategy', title: "AEO Content Strategy", subtitle: "Optimizing content for AI-powered answer engines" },
          { id: 'case-studies--content-marketing--content-personalization', title: "Content Personalization", subtitle: "Delivering relevant content to different audiences" },
          { id: 'case-studies--content-marketing--content-for-lead-generation', title: "Content for Lead Generation", subtitle: "Using content to attract qualified prospects" },
          { id: 'case-studies--content-marketing--content-funnel-strategy', title: "Content Funnel Strategy", subtitle: "Mapping content to awareness, consideration, and decision stages" },
          { id: 'case-studies--content-marketing--thought-leadership', title: "Thought Leadership", subtitle: "Becoming an authority in your industry" },
          { id: 'case-studies--content-marketing--community-driven-content', title: "Community-Driven Content", subtitle: "Building loyal audiences through participation" },
          { id: 'case-studies--content-marketing--content-performance-analysis', title: "Content Performance Analysis", subtitle: "Measuring engagement and business impact" },
          { id: 'case-studies--content-marketing--content-refresh-strategy', title: "Content Refresh Strategy", subtitle: "Updating existing content to maintain performance" },
          { id: 'case-studies--content-marketing--ai-assisted-content-creation', title: "AI-Assisted Content Creation", subtitle: "Using AI without sacrificing quality or authenticity" },
          { id: 'case-studies--content-marketing--crisis-content-strategy', title: "Crisis Content Strategy", subtitle: "Managing brand communication during crises" },
          { id: 'case-studies--content-marketing--content-monetization', title: "Content Monetization", subtitle: "Turning content into a revenue-generating asset" },
          { id: 'case-studies--content-marketing--content-scaling', title: "Content Scaling", subtitle: "Growing output without compromising quality" },
          { id: 'case-studies--content-marketing--content-governance', title: "Content Governance", subtitle: "Maintaining quality, consistency, and brand voice" },
        ],
      },
      {
        slug: 'marketing-automation-ai',
        name: "Marketing Automation & AI",
        items: [
          { id: 'case-studies--marketing-automation-ai--marketing-automation-strategy', title: "Marketing Automation Strategy", subtitle: "Building automated customer journeys aligned with business goals" },
          { id: 'case-studies--marketing-automation-ai--customer-journey-automation', title: "Customer Journey Automation", subtitle: "Delivering the right message at the right time" },
          { id: 'case-studies--marketing-automation-ai--lead-nurturing-automation', title: "Lead Nurturing Automation", subtitle: "Converting prospects through automated communication" },
          { id: 'case-studies--marketing-automation-ai--email-automation', title: "Email Automation", subtitle: "Increasing engagement with triggered email sequences" },
          { id: 'case-studies--marketing-automation-ai--whatsapp-automation', title: "WhatsApp Automation", subtitle: "Using conversational messaging to improve conversions and support" },
          { id: 'case-studies--marketing-automation-ai--crm-automation', title: "CRM Automation", subtitle: "Managing leads and customer relationships efficiently" },
          { id: 'case-studies--marketing-automation-ai--ai-powered-personalization', title: "AI-Powered Personalization", subtitle: "Delivering personalized experiences at scale" },
          { id: 'case-studies--marketing-automation-ai--ai-in-customer-segmentation', title: "AI in Customer Segmentation", subtitle: "Creating dynamic customer segments using AI" },
          { id: 'case-studies--marketing-automation-ai--ai-content-generation', title: "AI Content Generation", subtitle: "Producing marketing content faster while maintaining quality" },
          { id: 'case-studies--marketing-automation-ai--ai-copywriting', title: "AI Copywriting", subtitle: "Improving advertising and marketing copy with AI" },
          { id: 'case-studies--marketing-automation-ai--ai-creative-generation', title: "AI Creative Generation", subtitle: "Using AI to produce images, videos, and creatives" },
          { id: 'case-studies--marketing-automation-ai--ai-chatbots-virtual-assistants', title: "AI Chatbots & Virtual Assistants", subtitle: "Automating customer support and lead qualification" },
          { id: 'case-studies--marketing-automation-ai--predictive-marketing', title: "Predictive Marketing", subtitle: "Forecasting customer behavior and future outcomes" },
          { id: 'case-studies--marketing-automation-ai--predictive-lead-scoring', title: "Predictive Lead Scoring", subtitle: "Prioritizing high-value prospects using AI" },
          { id: 'case-studies--marketing-automation-ai--behavioral-automation', title: "Behavioral Automation", subtitle: "Triggering campaigns based on customer actions" },
          { id: 'case-studies--marketing-automation-ai--omnichannel-automation', title: "Omnichannel Automation", subtitle: "Coordinating marketing across multiple channels" },
          { id: 'case-studies--marketing-automation-ai--workflow-automation', title: "Workflow Automation", subtitle: "Eliminating repetitive marketing tasks" },
          { id: 'case-studies--marketing-automation-ai--ai-for-campaign-optimization', title: "AI for Campaign Optimization", subtitle: "Improving campaign performance through machine learning" },
          { id: 'case-studies--marketing-automation-ai--ai-for-customer-insights', title: "AI for Customer Insights", subtitle: "Discovering patterns and opportunities from customer data" },
          { id: 'case-studies--marketing-automation-ai--ai-for-market-research', title: "AI for Market Research", subtitle: "Using AI to accelerate research and competitive analysis" },
          { id: 'case-studies--marketing-automation-ai--recommendation-engines', title: "Recommendation Engines", subtitle: "Suggesting products and content intelligently" },
          { id: 'case-studies--marketing-automation-ai--ai-in-sales-enablement', title: "AI in Sales Enablement", subtitle: "Supporting sales teams with automated insights" },
          { id: 'case-studies--marketing-automation-ai--marketing-operations-automation', title: "Marketing Operations Automation", subtitle: "Streamlining internal marketing processes" },
          { id: 'case-studies--marketing-automation-ai--responsible-ai-in-marketing', title: "Responsible AI in Marketing", subtitle: "Applying AI ethically and transparently" },
          { id: 'case-studies--marketing-automation-ai--human-ai-collaboration', title: "Human + AI Collaboration", subtitle: "Combining creativity with AI efficiency" },
          { id: 'case-studies--marketing-automation-ai--ai-prompt-engineering-for-marketing', title: "AI Prompt Engineering for Marketing", subtitle: "Designing prompts for better marketing outcomes" },
          { id: 'case-studies--marketing-automation-ai--ai-workflow-design', title: "AI Workflow Design", subtitle: "Connecting multiple AI tools into automated systems" },
          { id: 'case-studies--marketing-automation-ai--automation-performance-measurement', title: "Automation Performance Measurement", subtitle: "Measuring ROI and business impact of automation" },
          { id: 'case-studies--marketing-automation-ai--scaling-marketing-with-ai', title: "Scaling Marketing with AI", subtitle: "Growing marketing operations without proportional headcount" },
          { id: 'case-studies--marketing-automation-ai--future-of-ai-marketing', title: "Future of AI Marketing", subtitle: "Preparing for the next generation of AI-driven marketing" },
        ],
      },
    ],
  },
  {
    id: 'vocabulary',
    kind: 'templated',
    name: "Vocabulary",
    tagline: "Master the terminology",
    description: "Every term a marketer is expected to know, each with a ready-made prompt that explains it in plain English with real examples.",
    itemNoun: 'term',
    icon: 'Type',
    accent: 'emerald',
    tokens: {"[KEYWORD]": "itemTitle", "{{Vocabulary}}": "itemTitle", "{{Topic}}": "trackName"},
    styles: [
      {
        id: 'quick',
        name: "Quick explainer",
        blurb: "Definition, why it matters and one example, under 300 words.",
        template: `Act as an expert marketing instructor with years of industry experience.

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

Avoid unnecessary theory and focus on helping me understand the concept quickly.`,
      },
      {
        id: 'deep',
        name: "Full breakdown",
        blurb: "12-part walkthrough with analogies, misconceptions and a quiz.",
        template: `You are an award-winning marketing professor teaching future CMOs.

Today's Topic

{{Topic}}

Today's Vocabulary

{{Vocabulary}}

Teach this vocabulary as if I have never encountered it before.

Structure your explanation as follows:

1. Simple Definition
2. Professional Definition
3. Why It Matters
4. Real Business Example
5. Everyday Analogy
6. Common Misconceptions
7. Related Marketing Terms
8. Opposite or Contrasting Terms
9. When Professionals Use This Term
10. Interview Question
11. Quick Quiz (3 questions)
12. One Practical Exercise

Keep the explanation concise, practical, and easy to remember.

Never repeat examples from previous sessions.`,
      },
      {
        id: 'dictionary',
        name: "Dictionary entry",
        blurb: "Complete reference: origins, examples, confusions, memory trick.",
        template: `You are creating the world's best marketing dictionary.

Today's Topic

{{Topic}}

Today's Vocabulary

{{Vocabulary}}

Create a complete vocabulary profile.

Include:

• Definition
• Category
• Difficulty Level
• Marketing Discipline
• Origin of the Term
• Why it became important
• Business Example
• Industry Example
• AI Example
• Related Frameworks
• Similar Terms
• Frequently Confused Terms
• Interview Question
• Memory Trick
• Key Takeaway

Explain everything in clear language.

Do not exceed 5 minutes of reading.`,
      },
    ],
    tracks: [
      {
        slug: 'marketing-fundamentals',
        name: "Marketing Fundamentals",
        items: [
          { id: 'vocabulary--marketing-fundamentals--marketing', title: "Marketing", subtitle: "" },
          { id: 'vocabulary--marketing-fundamentals--market', title: "Market", subtitle: "" },
          { id: 'vocabulary--marketing-fundamentals--customer', title: "Customer", subtitle: "" },
          { id: 'vocabulary--marketing-fundamentals--customer-need', title: "Customer Need", subtitle: "" },
          { id: 'vocabulary--marketing-fundamentals--customer-want', title: "Customer Want", subtitle: "" },
          { id: 'vocabulary--marketing-fundamentals--customer-demand', title: "Customer Demand", subtitle: "" },
          { id: 'vocabulary--marketing-fundamentals--value-proposition', title: "Value Proposition", subtitle: "" },
          { id: 'vocabulary--marketing-fundamentals--usp', title: "USP", subtitle: "" },
          { id: 'vocabulary--marketing-fundamentals--brand', title: "Brand", subtitle: "" },
          { id: 'vocabulary--marketing-fundamentals--branding', title: "Branding", subtitle: "" },
          { id: 'vocabulary--marketing-fundamentals--brand-identity', title: "Brand Identity", subtitle: "" },
          { id: 'vocabulary--marketing-fundamentals--brand-positioning', title: "Brand Positioning", subtitle: "" },
          { id: 'vocabulary--marketing-fundamentals--market-segmentation', title: "Market Segmentation", subtitle: "" },
          { id: 'vocabulary--marketing-fundamentals--target-audience', title: "Target Audience", subtitle: "" },
          { id: 'vocabulary--marketing-fundamentals--buyer-persona', title: "Buyer Persona", subtitle: "" },
          { id: 'vocabulary--marketing-fundamentals--marketing-mix-4ps', title: "Marketing Mix (4Ps)", subtitle: "" },
          { id: 'vocabulary--marketing-fundamentals--product', title: "Product", subtitle: "" },
          { id: 'vocabulary--marketing-fundamentals--price', title: "Price", subtitle: "" },
          { id: 'vocabulary--marketing-fundamentals--place', title: "Place", subtitle: "" },
          { id: 'vocabulary--marketing-fundamentals--promotion', title: "Promotion", subtitle: "" },
          { id: 'vocabulary--marketing-fundamentals--customer-journey', title: "Customer Journey", subtitle: "" },
          { id: 'vocabulary--marketing-fundamentals--marketing-funnel', title: "Marketing Funnel", subtitle: "" },
          { id: 'vocabulary--marketing-fundamentals--b2b', title: "B2B", subtitle: "" },
          { id: 'vocabulary--marketing-fundamentals--b2c', title: "B2C", subtitle: "" },
          { id: 'vocabulary--marketing-fundamentals--c2c', title: "C2C", subtitle: "" },
          { id: 'vocabulary--marketing-fundamentals--value', title: "Value", subtitle: "" },
          { id: 'vocabulary--marketing-fundamentals--competition', title: "Competition", subtitle: "" },
          { id: 'vocabulary--marketing-fundamentals--competitive-advantage', title: "Competitive Advantage", subtitle: "" },
          { id: 'vocabulary--marketing-fundamentals--market-share', title: "Market Share", subtitle: "" },
          { id: 'vocabulary--marketing-fundamentals--customer-lifetime-value', title: "Customer Lifetime Value", subtitle: "" },
          { id: 'vocabulary--marketing-fundamentals--customer-retention', title: "Customer Retention", subtitle: "" },
          { id: 'vocabulary--marketing-fundamentals--customer-acquisition', title: "Customer Acquisition", subtitle: "" },
          { id: 'vocabulary--marketing-fundamentals--brand-equity', title: "Brand Equity", subtitle: "" },
          { id: 'vocabulary--marketing-fundamentals--aida', title: "AIDA", subtitle: "" },
          { id: 'vocabulary--marketing-fundamentals--marketing-strategy', title: "Marketing Strategy", subtitle: "" },
          { id: 'vocabulary--marketing-fundamentals--marketing-tactics', title: "Marketing Tactics", subtitle: "" },
        ],
      },
      {
        slug: 'market-research',
        name: "Market Research",
        items: [
          { id: 'vocabulary--market-research--market-research', title: "Market Research", subtitle: "" },
          { id: 'vocabulary--market-research--primary-research', title: "Primary Research", subtitle: "" },
          { id: 'vocabulary--market-research--secondary-research', title: "Secondary Research", subtitle: "" },
          { id: 'vocabulary--market-research--quantitative-research', title: "Quantitative Research", subtitle: "" },
          { id: 'vocabulary--market-research--qualitative-research', title: "Qualitative Research", subtitle: "" },
          { id: 'vocabulary--market-research--surveys', title: "Surveys", subtitle: "" },
          { id: 'vocabulary--market-research--focus-groups', title: "Focus Groups", subtitle: "" },
          { id: 'vocabulary--market-research--interviews', title: "Interviews", subtitle: "" },
          { id: 'vocabulary--market-research--observation', title: "Observation", subtitle: "" },
          { id: 'vocabulary--market-research--competitor-analysis', title: "Competitor Analysis", subtitle: "" },
          { id: 'vocabulary--market-research--swot', title: "SWOT", subtitle: "" },
          { id: 'vocabulary--market-research--pestle', title: "PESTLE", subtitle: "" },
          { id: 'vocabulary--market-research--tam', title: "TAM", subtitle: "" },
          { id: 'vocabulary--market-research--sam', title: "SAM", subtitle: "" },
          { id: 'vocabulary--market-research--som', title: "SOM", subtitle: "" },
          { id: 'vocabulary--market-research--keyword-research', title: "Keyword Research", subtitle: "" },
          { id: 'vocabulary--market-research--search-intent', title: "Search Intent", subtitle: "" },
          { id: 'vocabulary--market-research--customer-pain-points', title: "Customer Pain Points", subtitle: "" },
          { id: 'vocabulary--market-research--consumer-behaviour', title: "Consumer Behaviour", subtitle: "" },
          { id: 'vocabulary--market-research--market-trends', title: "Market Trends", subtitle: "" },
          { id: 'vocabulary--market-research--demand-analysis', title: "Demand Analysis", subtitle: "" },
        ],
      },
      {
        slug: 'meta-ads',
        name: "Meta Ads",
        items: [
          { id: 'vocabulary--meta-ads--campaign', title: "Campaign", subtitle: "" },
          { id: 'vocabulary--meta-ads--ad-set', title: "Ad Set", subtitle: "" },
          { id: 'vocabulary--meta-ads--ad', title: "Ad", subtitle: "" },
          { id: 'vocabulary--meta-ads--meta-pixel', title: "Meta Pixel", subtitle: "" },
          { id: 'vocabulary--meta-ads--conversions-api', title: "Conversions API", subtitle: "" },
          { id: 'vocabulary--meta-ads--campaign-objective', title: "Campaign Objective", subtitle: "" },
          { id: 'vocabulary--meta-ads--advantage', title: "Advantage+", subtitle: "" },
          { id: 'vocabulary--meta-ads--audience', title: "Audience", subtitle: "" },
          { id: 'vocabulary--meta-ads--custom-audience', title: "Custom Audience", subtitle: "" },
          { id: 'vocabulary--meta-ads--lookalike-audience', title: "Lookalike Audience", subtitle: "" },
          { id: 'vocabulary--meta-ads--retargeting', title: "Retargeting", subtitle: "" },
          { id: 'vocabulary--meta-ads--ctr', title: "CTR", subtitle: "" },
          { id: 'vocabulary--meta-ads--cpc', title: "CPC", subtitle: "" },
          { id: 'vocabulary--meta-ads--cpm', title: "CPM", subtitle: "" },
          { id: 'vocabulary--meta-ads--cpa', title: "CPA", subtitle: "" },
          { id: 'vocabulary--meta-ads--roas', title: "ROAS", subtitle: "" },
          { id: 'vocabulary--meta-ads--frequency', title: "Frequency", subtitle: "" },
          { id: 'vocabulary--meta-ads--reach', title: "Reach", subtitle: "" },
          { id: 'vocabulary--meta-ads--impressions', title: "Impressions", subtitle: "" },
          { id: 'vocabulary--meta-ads--learning-phase', title: "Learning Phase", subtitle: "" },
          { id: 'vocabulary--meta-ads--attribution', title: "Attribution", subtitle: "" },
          { id: 'vocabulary--meta-ads--bid-strategy', title: "Bid Strategy", subtitle: "" },
          { id: 'vocabulary--meta-ads--creative', title: "Creative", subtitle: "" },
          { id: 'vocabulary--meta-ads--placement', title: "Placement", subtitle: "" },
          { id: 'vocabulary--meta-ads--carousel-ads', title: "Carousel Ads", subtitle: "" },
          { id: 'vocabulary--meta-ads--lead-ads', title: "Lead Ads", subtitle: "" },
          { id: 'vocabulary--meta-ads--instant-forms', title: "Instant Forms", subtitle: "" },
        ],
      },
      {
        slug: 'google-ads',
        name: "Google Ads",
        items: [
          { id: 'vocabulary--google-ads--search-campaign', title: "Search Campaign", subtitle: "" },
          { id: 'vocabulary--google-ads--display-campaign', title: "Display Campaign", subtitle: "" },
          { id: 'vocabulary--google-ads--performance-max', title: "Performance Max", subtitle: "" },
          { id: 'vocabulary--google-ads--shopping-ads', title: "Shopping Ads", subtitle: "" },
          { id: 'vocabulary--google-ads--quality-score', title: "Quality Score", subtitle: "" },
          { id: 'vocabulary--google-ads--ad-rank', title: "Ad Rank", subtitle: "" },
          { id: 'vocabulary--google-ads--keywords', title: "Keywords", subtitle: "" },
          { id: 'vocabulary--google-ads--broad-match', title: "Broad Match", subtitle: "" },
          { id: 'vocabulary--google-ads--phrase-match', title: "Phrase Match", subtitle: "" },
          { id: 'vocabulary--google-ads--exact-match', title: "Exact Match", subtitle: "" },
          { id: 'vocabulary--google-ads--negative-keywords', title: "Negative Keywords", subtitle: "" },
          { id: 'vocabulary--google-ads--cpc', title: "CPC", subtitle: "" },
          { id: 'vocabulary--google-ads--maximize-conversions', title: "Maximize Conversions", subtitle: "" },
          { id: 'vocabulary--google-ads--target-cpa', title: "Target CPA", subtitle: "" },
          { id: 'vocabulary--google-ads--target-roas', title: "Target ROAS", subtitle: "" },
          { id: 'vocabulary--google-ads--search-impression-share', title: "Search Impression Share", subtitle: "" },
          { id: 'vocabulary--google-ads--ad-extensions', title: "Ad Extensions", subtitle: "" },
          { id: 'vocabulary--google-ads--landing-page', title: "Landing Page", subtitle: "" },
        ],
      },
      {
        slug: 'seo-aeo',
        name: "SEO & AEO",
        items: [
          { id: 'vocabulary--seo-aeo--seo', title: "SEO", subtitle: "" },
          { id: 'vocabulary--seo-aeo--aeo', title: "AEO", subtitle: "" },
          { id: 'vocabulary--seo-aeo--serp', title: "SERP", subtitle: "" },
          { id: 'vocabulary--seo-aeo--organic-traffic', title: "Organic Traffic", subtitle: "" },
          { id: 'vocabulary--seo-aeo--backlinks', title: "Backlinks", subtitle: "" },
          { id: 'vocabulary--seo-aeo--keywords', title: "Keywords", subtitle: "" },
          { id: 'vocabulary--seo-aeo--meta-title', title: "Meta Title", subtitle: "" },
          { id: 'vocabulary--seo-aeo--meta-description', title: "Meta Description", subtitle: "" },
          { id: 'vocabulary--seo-aeo--heading-tags', title: "Heading Tags", subtitle: "" },
          { id: 'vocabulary--seo-aeo--technical-seo', title: "Technical SEO", subtitle: "" },
          { id: 'vocabulary--seo-aeo--crawl', title: "Crawl", subtitle: "" },
          { id: 'vocabulary--seo-aeo--indexing', title: "Indexing", subtitle: "" },
          { id: 'vocabulary--seo-aeo--canonical-tag', title: "Canonical Tag", subtitle: "" },
          { id: 'vocabulary--seo-aeo--schema-markup', title: "Schema Markup", subtitle: "" },
          { id: 'vocabulary--seo-aeo--core-web-vitals', title: "Core Web Vitals", subtitle: "" },
          { id: 'vocabulary--seo-aeo--featured-snippet', title: "Featured Snippet", subtitle: "" },
          { id: 'vocabulary--seo-aeo--internal-linking', title: "Internal Linking", subtitle: "" },
          { id: 'vocabulary--seo-aeo--external-linking', title: "External Linking", subtitle: "" },
          { id: 'vocabulary--seo-aeo--domain-authority', title: "Domain Authority", subtitle: "" },
          { id: 'vocabulary--seo-aeo--page-authority', title: "Page Authority", subtitle: "" },
        ],
      },
      {
        slug: 'analytics',
        name: "Analytics",
        items: [
          { id: 'vocabulary--analytics--google-analytics', title: "Google Analytics", subtitle: "" },
          { id: 'vocabulary--analytics--ga4', title: "GA4", subtitle: "" },
          { id: 'vocabulary--analytics--event', title: "Event", subtitle: "" },
          { id: 'vocabulary--analytics--conversion', title: "Conversion", subtitle: "" },
          { id: 'vocabulary--analytics--session', title: "Session", subtitle: "" },
          { id: 'vocabulary--analytics--user', title: "User", subtitle: "" },
          { id: 'vocabulary--analytics--engagement-rate', title: "Engagement Rate", subtitle: "" },
          { id: 'vocabulary--analytics--bounce-rate', title: "Bounce Rate", subtitle: "" },
          { id: 'vocabulary--analytics--attribution', title: "Attribution", subtitle: "" },
          { id: 'vocabulary--analytics--utm', title: "UTM", subtitle: "" },
          { id: 'vocabulary--analytics--source', title: "Source", subtitle: "" },
          { id: 'vocabulary--analytics--medium', title: "Medium", subtitle: "" },
          { id: 'vocabulary--analytics--campaign', title: "Campaign", subtitle: "" },
          { id: 'vocabulary--analytics--dimensions', title: "Dimensions", subtitle: "" },
          { id: 'vocabulary--analytics--metrics', title: "Metrics", subtitle: "" },
          { id: 'vocabulary--analytics--funnel-analysis', title: "Funnel Analysis", subtitle: "" },
          { id: 'vocabulary--analytics--cohort-analysis', title: "Cohort Analysis", subtitle: "" },
          { id: 'vocabulary--analytics--dashboard', title: "Dashboard", subtitle: "" },
          { id: 'vocabulary--analytics--looker-studio', title: "Looker Studio", subtitle: "" },
          { id: 'vocabulary--analytics--bigquery', title: "BigQuery", subtitle: "" },
        ],
      },
      {
        slug: 'content-marketing',
        name: "Content Marketing",
        items: [
          { id: 'vocabulary--content-marketing--content-marketing', title: "Content Marketing", subtitle: "" },
          { id: 'vocabulary--content-marketing--content-strategy', title: "Content Strategy", subtitle: "" },
          { id: 'vocabulary--content-marketing--content-calendar', title: "Content Calendar", subtitle: "" },
          { id: 'vocabulary--content-marketing--blog', title: "Blog", subtitle: "" },
          { id: 'vocabulary--content-marketing--landing-page', title: "Landing Page", subtitle: "" },
          { id: 'vocabulary--content-marketing--copywriting', title: "Copywriting", subtitle: "" },
          { id: 'vocabulary--content-marketing--cta', title: "CTA", subtitle: "" },
          { id: 'vocabulary--content-marketing--hook', title: "Hook", subtitle: "" },
          { id: 'vocabulary--content-marketing--storytelling', title: "Storytelling", subtitle: "" },
          { id: 'vocabulary--content-marketing--evergreen-content', title: "Evergreen Content", subtitle: "" },
          { id: 'vocabulary--content-marketing--ugc', title: "UGC", subtitle: "" },
          { id: 'vocabulary--content-marketing--email-marketing', title: "Email Marketing", subtitle: "" },
          { id: 'vocabulary--content-marketing--lead-magnet', title: "Lead Magnet", subtitle: "" },
          { id: 'vocabulary--content-marketing--newsletter', title: "Newsletter", subtitle: "" },
          { id: 'vocabulary--content-marketing--engagement', title: "Engagement", subtitle: "" },
          { id: 'vocabulary--content-marketing--content-funnel', title: "Content Funnel", subtitle: "" },
          { id: 'vocabulary--content-marketing--repurposing', title: "Repurposing", subtitle: "" },
          { id: 'vocabulary--content-marketing--topic-cluster', title: "Topic Cluster", subtitle: "" },
        ],
      },
      {
        slug: 'marketing-automation-ai',
        name: "Marketing Automation & AI",
        items: [
          { id: 'vocabulary--marketing-automation-ai--marketing-automation', title: "Marketing Automation", subtitle: "" },
          { id: 'vocabulary--marketing-automation-ai--crm', title: "CRM", subtitle: "" },
          { id: 'vocabulary--marketing-automation-ai--workflow', title: "Workflow", subtitle: "" },
          { id: 'vocabulary--marketing-automation-ai--trigger', title: "Trigger", subtitle: "" },
          { id: 'vocabulary--marketing-automation-ai--lead-scoring', title: "Lead Scoring", subtitle: "" },
          { id: 'vocabulary--marketing-automation-ai--chatbot', title: "Chatbot", subtitle: "" },
          { id: 'vocabulary--marketing-automation-ai--email-sequence', title: "Email Sequence", subtitle: "" },
          { id: 'vocabulary--marketing-automation-ai--zapier', title: "Zapier", subtitle: "" },
          { id: 'vocabulary--marketing-automation-ai--make', title: "Make", subtitle: "" },
          { id: 'vocabulary--marketing-automation-ai--ai-prompt', title: "AI Prompt", subtitle: "" },
          { id: 'vocabulary--marketing-automation-ai--prompt-engineering', title: "Prompt Engineering", subtitle: "" },
          { id: 'vocabulary--marketing-automation-ai--llm', title: "LLM", subtitle: "" },
          { id: 'vocabulary--marketing-automation-ai--ai-agent', title: "AI Agent", subtitle: "" },
          { id: 'vocabulary--marketing-automation-ai--personalization', title: "Personalization", subtitle: "" },
          { id: 'vocabulary--marketing-automation-ai--predictive-analytics', title: "Predictive Analytics", subtitle: "" },
          { id: 'vocabulary--marketing-automation-ai--segmentation', title: "Segmentation", subtitle: "" },
          { id: 'vocabulary--marketing-automation-ai--a-b-testing-automation', title: "A/B Testing Automation", subtitle: "" },
          { id: 'vocabulary--marketing-automation-ai--whatsapp-automation', title: "WhatsApp Automation", subtitle: "" },
          { id: 'vocabulary--marketing-automation-ai--api', title: "API", subtitle: "" },
          { id: 'vocabulary--marketing-automation-ai--webhook', title: "Webhook", subtitle: "" },
        ],
      },
    ],
  },
  {
    id: 'mini-lessons',
    kind: 'standalone',
    name: "Mini Lessons",
    tagline: "Marketing psychology, five minutes at a time",
    description: "Self-running lessons on consumer psychology and behavioural economics. Each prompt generates a completely different lesson every time you run it \u2014 nothing to pick, just paste and go.",
    itemNoun: 'lesson',
    icon: 'Brain',
    accent: 'amber',
    tokens: {},
    styles: [],
    tracks: [
      {
        slug: 'marketing-psychology',
        name: "Marketing Psychology",
        items: [
          {
            id: 'mini-lessons--marketing-psychology--principle-of-the-day',
            title: "Principle of the day",
            subtitle: "A structured lesson on one psychological principle \u2014 a different one every run.",
            body: `You are a professor of Marketing Psychology, Consumer Behavior, and Behavioral Economics.

Generate ONE completely different marketing psychology lesson every time this prompt is used.

Never repeat a psychological principle that has already been taught.

Select from areas such as:

• Cognitive Biases
• Behavioral Economics
• Consumer Psychology
• Neuroscience
• Persuasion
• Decision Making
• Pricing Psychology
• Brand Psychology
• Social Psychology
• Habit Formation
• UX Psychology
• Advertising Psychology

Structure every lesson as follows:

1. Lesson Title
2. Psychological Principle
3. Definition (2-3 sentences)
4. Why Humans Think This Way
5. Real Business Example
6. Everyday Example
7. How Marketers Use It
8. Ethical Considerations
9. One Reflection Question
10. One Practical Observation Task

Keep the lesson under 5 minutes.

Increase complexity over time.`,
          },
          {
            id: 'mini-lessons--marketing-psychology--brand-psychology',
            title: "Brand psychology",
            subtitle: "One global brand per lesson, and the principle behind why it works.",
            body: `You are a marketing psychologist.

Every time this prompt runs, choose ONE different global brand.

Never repeat brands.

Explain ONE psychological principle that made the brand successful.

Examples include:

Apple

Nike

Amazon

IKEA

Netflix

Starbucks

Spotify

Disney

Tesla

Coca-Cola

Explain:

• The psychology
• Why it works
• Consumer reaction
• Business impact
• How another company could use the same principle

Finish with one challenge:

"Can you identify another brand using this psychology?"`,
          },
          {
            id: 'mini-lessons--marketing-psychology--the-buying-brain',
            title: "The buying brain",
            subtitle: "One cognitive effect at a time: what happens in the brain, and why.",
            body: `You are teaching how the human brain makes buying decisions.

Every lesson should introduce ONE different psychological effect.

Never repeat.

Possible topics include:

Anchoring

Loss Aversion

Scarcity

Social Proof

Decoy Effect

Framing

Choice Overload

Peak-End Rule

Commitment Bias

Halo Effect

Default Effect

Mere Exposure Effect

Explain:

• What happens in the brain
• Why evolution created this behavior
• Marketing applications
• Ethical risks
• Business example

End with a real-world experiment the learner can observe today.`,
          },
          {
            id: 'mini-lessons--marketing-psychology--everyday-situations',
            title: "Everyday situations",
            subtitle: "Starts somewhere familiar, then reveals the hidden psychology behind it.",
            body: `Teach marketing psychology using situations everyone experiences.

Every lesson should begin with an everyday situation such as:

Shopping

Restaurants

Supermarkets

Amazon

Netflix

Instagram

YouTube

Coffee shops

Airports

Hotels

Explain the hidden psychological principle behind that experience.

Only after explaining the situation reveal the psychology.

Connect it back to marketing.

End with:

"Where else have you seen this happen?"`,
          },
        ],
      },
    ],
  },
]

export function libraryById(id: string): PromptLibrary | undefined {
  return promptLibraries.find((l) => l.id === id)
}

export function libraryCount(lib: PromptLibrary): number {
  return lib.tracks.reduce((n, t) => n + t.items.length, 0)
}

/** Total items across every library. */
export const totalPromptItems = promptLibraries.reduce((n, l) => n + libraryCount(l), 0)

/**
 * The prompt for one item.
 *
 * Standalone items carry their own text. Templated ones fill the chosen
 * style's placeholders — via split/join rather than String.replaceAll, since
 * '[KEYWORD]' is a valid regex character class and would be mangled.
 */
export function fillPrompt(
  lib: PromptLibrary,
  style: PromptStyle | undefined,
  item: LibraryItem,
  trackName: string,
): string {
  if (item.body) return item.body
  if (!style) return ''
  let out = style.template
  for (const [token, source] of Object.entries(lib.tokens)) {
    const value =
      source === 'itemTitle' ? item.title : source === 'itemSubtitle' ? item.subtitle : trackName
    out = out.split(token).join(value)
  }
  return out
}
