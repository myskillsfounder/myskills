/**
 * Gold Prompt Library — AI study prompts unlocked by a Gold certificate.
 *
 * Source: 'Gold Category - Prompt Library.xlsx' (one sheet per skill track).
 * This file is GENERATED from that spreadsheet — if the source changes,
 * regenerate rather than hand-editing, so the two can't drift apart.
 *
 * `trackSlug` values match src/lib/skillTracks.ts exactly.
 *
 * NOTE: this ships in the client bundle, so the gold gate here is a UX
 * affordance, not a security boundary. Move the prompts into a Supabase
 * table with an RLS policy if they ever need to be genuinely restricted.
 */
import type { CertificateKind } from './certificates'

export interface Prompt {
  id: string
  /** Short label shown on the card — the prompt's opening line. */
  title: string
  /** The full prompt text, verbatim from the library. */
  body: string
}

export interface PromptTrack {
  /** matches a slug in src/lib/skillTracks.ts */
  slug: string
  name: string
  prompts: Prompt[]
}

/** The certificate band that unlocks the library. */
export const PROMPT_LIBRARY_TIER: CertificateKind = 'gold'

export const promptTracks: PromptTrack[] = [
  {
    slug: 'marketing-fundamentals',
    name: 'Marketing Fundamentals',
    prompts: [
      {
        id: 'marketing-fundamentals-1',
        title: "I don't want a textbook explanation of marketing",
        body: `I don't want a textbook explanation of marketing.

Instead, tell me the story of marketing as if you are a historian.

Start from ancient civilizations where merchants first competed for customers, move through the Industrial Revolution, explain the rise of mass advertising, branding, digital marketing, social media, AI, and today's attention economy.

At every stage explain:

• What changed in society
• What businesses struggled with
• Why marketing evolved
• What new ideas emerged
• Which ideas still matter today

Use famous companies, products and historical events to make the story engaging.

I want to understand how marketing evolved—not memorize definitions.`,
      },
      {
        id: 'marketing-fundamentals-2',
        title: "Choose ten companies that became category leaders because of\u2026",
        body: `Choose ten companies that became category leaders because of outstanding marketing.

Examples could include Apple, Nike, Coca-Cola, IKEA, Airbnb, Tesla, Netflix, Amazon, Patagonia and Lego.

For each company explain:

• What problem existed before they entered
• What customers believed at the time
• What competitors were doing
• The unique marketing insight they discovered
• Why customers chose them
• What business lesson marketers should learn

Don't summarize.

Treat each company like a mini business case study.`,
      },
      {
        id: 'marketing-fundamentals-3',
        title: "Teach me marketing by explaining why humans buy",
        body: `Teach me marketing by explaining why humans buy.

Don't begin with marketing concepts.

Begin with psychology.

Explain:

• Attention
• Curiosity
• Emotion
• Trust
• Social proof
• Scarcity
• Identity
• Status
• Habit
• Cognitive biases

After explaining each psychological principle, show how marketers use it ethically in branding, advertising, pricing, product design and customer experience.

Use real companies and campaigns as examples.`,
      },
      {
        id: 'marketing-fundamentals-4',
        title: "Teach me marketing by analysing famous business failures",
        body: `Teach me marketing by analysing famous business failures.

Choose at least fifteen marketing failures.

Examples may include:

• New Coke
• Nokia
• Kodak
• Yahoo
• Blackberry
• Quibi
• Google Glass
• Blockbuster

For every case explain:

• What the company believed
• Why they made those decisions
• Which marketing principle they ignored
• What customers actually wanted
• What competitors understood better
• What marketers should learn

Don't just explain the failure.

Explain the thinking behind it.`,
      },
      {
        id: 'marketing-fundamentals-5',
        title: "Introduce me to the people who shaped modern marketing",
        body: `Introduce me to the people who shaped modern marketing.

Include marketers and thinkers like:

Philip Kotler
David Ogilvy
Seth Godin
Al Ries
Jack Trout
Claude Hopkins
Rory Sutherland
Byron Sharp
Simon Sinek
Steve Jobs (from a marketing perspective)

For each person explain:

• Their core philosophy
• Their biggest contribution
• Their most famous work
• Why their ideas changed marketing
• Which ideas are still relevant today
• Which ideas are debated

At the end compare their philosophies and explain when each approach works best.`,
      },
    ],
  },
  {
    slug: 'market-research',
    name: 'Market Research',
    prompts: [
      {
        id: 'market-research-1',
        title: "Teach me Market Research by turning me into a Marketing Detective",
        body: `Teach me Market Research by turning me into a Marketing Detective.

Instead of explaining theories, give me a real business mystery to solve.

Choose a well-known company such as Airbnb, Netflix, Amazon, Apple, Tesla, Swiggy, Nike, Spotify, or another relevant business.

Start with a business problem they faced.

Examples:
• Declining sales
• Low customer retention
• Failed product launch
• Entering a new market
• New competitors
• Falling brand loyalty

Reveal information slowly.

Don't tell me what actually happened.

Instead, give me pieces of evidence one by one:

• Customer interviews
• Sales trends
• Competitor actions
• Market changes
• Consumer behavior
• Industry reports
• Search trends
• Online reviews
• Social media discussions

After each clue, ask me:

"What does this evidence tell you?"

Challenge my assumptions before revealing the next clue.

Only after I've built my own hypothesis should you explain what the company actually discovered and compare my reasoning with theirs.

I want to experience how professional market researchers think—not just learn research methods.`,
      },
      {
        id: 'market-research-2',
        title: "Teach me Market Research through the stories behind famous\u2026",
        body: `Teach me Market Research through the stories behind famous business decisions.

Choose fifteen well-known companies.

For each company explain:

• The business decision they had to make
• What they didn't know
• What questions they needed answered
• How they gathered information
• What research methods they used
• What surprising insights they discovered
• How those insights changed their strategy
• The business results

Examples may include:

Netflix
Amazon
Apple
Nike
Airbnb
Tesla
LEGO
Starbucks
McDonald's
Zara
Spotify
HubSpot

Don't focus on marketing campaigns.

Focus on the research process that led to those decisions.

I want to understand how businesses reduce uncertainty before investing millions of dollars.`,
      },
      {
        id: 'market-research-3',
        title: "Most people think Market Research is about surveys",
        body: `Most people think Market Research is about surveys.

Teach me why that is only a small part of understanding customers.

Explain how researchers uncover:

• Hidden needs
• Buying motivations
• Emotional triggers
• Frustrations
• Habits
• Decision-making processes
• Identity
• Social influence
• Cognitive biases
• Customer expectations

For every concept explain:

• The psychology behind it
• How researchers discover it
• Real companies that used these insights successfully
• Companies that misunderstood customers and failed

Treat this like a masterclass in understanding human behavior rather than collecting data.`,
      },
      {
        id: 'market-research-4',
        title: "Pretend I have joined the Insights and Market Research team of a\u2026",
        body: `Pretend I have joined the Insights and Market Research team of a global company.

Create a realistic business project.

For example:

Launching a new smartphone
Expanding into a new country
Creating a new subscription service
Entering a competitive market
Rebranding an existing company

Give me:

• Company background
• Business objectives
• Available budget
• Timeline
• Existing data
• Unknowns
• Stakeholders

Ask me to design the research strategy.

Do not help immediately.

Challenge every decision I make.

Ask why I selected certain research methods.

Explain what experienced researchers would do differently.

Guide me until I have designed a complete research plan that could realistically be presented to executives.`,
      },
      {
        id: 'market-research-5',
        title: "Teach me Market Research through history's most famous business\u2026",
        body: `Teach me Market Research through history's most famous business successes and failures.

Choose at least twenty companies.

Examples:

Kodak
Blockbuster
Nokia
LEGO
Netflix
Airbnb
Apple
Google Glass
Quibi
Yahoo
BlackBerry
Coca-Cola (New Coke)
Amazon
Tesla
Disney

For every company explain:

• The business problem
• What customers actually wanted
• What the company believed
• Whether research was done well or poorly
• Warning signs they ignored
• Signals they recognized
• The final outcome
• The biggest lesson marketers should learn

At the end compare all the case studies.

Identify recurring patterns that separate companies that deeply understand customers from companies that make decisions based on assumptions.`,
      },
    ],
  },
  {
    slug: 'meta-ads',
    name: 'Meta Ads',
    prompts: [
      {
        id: 'meta-ads-1',
        title: "I don't want to learn how to use Meta Ads Manager",
        body: `I don't want to learn how to use Meta Ads Manager.

I want to understand how Meta's advertising algorithm thinks.

Teach me as if I have joined Meta's Ads Engineering team.

Explain:

• How the auction actually works
• How Meta predicts conversions
• How machine learning decides who sees an ad
• What happens between a user opening Instagram and seeing an advertisement
• How relevance, engagement and predicted action influence delivery
• Why two advertisers targeting the same audience get different results
• Why campaigns suddenly stop performing
• Why CPM changes
• Why audiences fatigue
• Why creative matters more than targeting today

Use diagrams, analogies and simplified explanations without losing technical depth.

Throughout the conversation, challenge me with "What do you think happens next?" before revealing each stage of the system.

I want to understand Meta's decision-making process rather than memorize campaign settings.`,
      },
      {
        id: 'meta-ads-2',
        title: "Teach me Meta Ads by breaking down famous advertising campaigns\u2026",
        body: `Teach me Meta Ads by breaking down famous advertising campaigns from companies such as Nike, Airbnb, Spotify, Netflix, Coca-Cola, Apple, Gymshark, Duolingo, and other brands known for strong Meta advertising.

For each company explain:

• The business objective
• Why Meta Ads was chosen
• Campaign structure
• Target audience strategy
• Creative strategy
• Messaging
• Offer
• Funnel design
• Budget allocation
• Optimization decisions
• KPIs measured
• What they likely tested
• Mistakes they intentionally avoided

Whenever information isn't public, explain what experienced media buyers would most likely have done and clearly distinguish inference from documented facts.

After each case study, ask me how I would improve the campaign before sharing your analysis.

I want to think like the strategist responsible for scaling the campaign.`,
      },
      {
        id: 'meta-ads-3',
        title: "Pretend I have just joined a high-performance digital marketing\u2026",
        body: `Pretend I have just joined a high-performance digital marketing agency as a Meta Ads Specialist.

Over the course of this conversation, give me realistic client projects one at a time.

Examples include:

• An e-commerce brand with declining ROAS
• A startup launching a new app
• A university generating admissions
• A SaaS company generating demos
• A restaurant opening a new location
• A D2C skincare brand

For every project provide:

• Business goals
• Historical campaign data
• Audience information
• Budget
• Creative assets
• Performance metrics
• Competitor landscape
• Business constraints

Ask me to:

• Build campaign strategy
• Choose objectives
• Allocate budget
• Suggest creatives
• Recommend audiences
• Explain optimization decisions

Challenge every recommendation I make before revealing how an experienced Meta Ads strategist would approach the same project.

Make this feel like my first six months working inside a leading performance marketing agency.`,
      },
      {
        id: 'meta-ads-4',
        title: "Teach me Meta Ads by performing detailed post-mortems of real\u2026",
        body: `Teach me Meta Ads by performing detailed post-mortems of real and realistic advertising campaigns.

Present campaigns that either scaled successfully or failed.

Without telling me the outcome first, provide:

• Campaign objective
• Audience
• Budget
• Creative
• Funnel
• KPIs
• Timeline
• Performance trends

Ask me to investigate:

• Why results changed
• What signals indicate the problem
• What I would test next
• Which metrics matter most
• Whether the issue is creative, audience, offer, landing page or measurement

After I complete my diagnosis, explain what actually happened and compare my reasoning with how senior performance marketers would investigate the campaign.

Repeat with increasingly complex cases involving attribution, creative fatigue, scaling, seasonality, and algorithm learning.`,
      },
      {
        id: 'meta-ads-5',
        title: "Act as the Head of Growth for Meta",
        body: `Act as the Head of Growth for Meta.

Teach me how Meta advertising is evolving because of:

• Artificial Intelligence
• Advantage+ campaigns
• Privacy regulations
• First-party data
• Creative automation
• Attribution challenges
• Short-form video
• Generative AI
• Consumer behavior
• Future ad products

For each trend explain:

• Why Meta is changing
• What advertisers misunderstand
• Which old practices are becoming obsolete
• Which new skills media buyers must develop
• How agencies should adapt
• How brands should prepare over the next five years

Throughout the discussion ask me strategic questions before giving your perspective.

Finish by creating a roadmap showing what separates an average Meta Ads specialist from a world-class performance marketer.`,
      },
    ],
  },
  {
    slug: 'google-ads',
    name: 'Google Ads',
    prompts: [
      {
        id: 'google-ads-1',
        title: "I don't want to learn Google Ads by clicking buttons",
        body: `I don't want to learn Google Ads by clicking buttons.

I want to understand how Google's Search ecosystem actually works.

Teach me as if I have joined Google's Search & Ads Engineering team.

Start from the moment a user types a search query.

Explain everything that happens until an advertisement appears.

Cover:

• How Google interprets search intent
• How keywords are matched
• How the Ad Rank system works
• Why Quality Score exists
• How Google predicts CTR
• How bidding actually works
• Why two advertisers bidding the same amount receive different positions
• Why Google sometimes refuses to show an ad
• How machine learning influences ad delivery
• How Performance Max fits into Google's ecosystem

Use analogies, simplified diagrams and practical examples.

Pause after every major concept and ask me to predict what happens next before revealing the answer.

I want to understand Google's thinking rather than memorize Google Ads features.`,
      },
      {
        id: 'google-ads-2',
        title: "Teach me Google Ads through Search Intent rather than campaign\u2026",
        body: `Teach me Google Ads through Search Intent rather than campaign settings.

Choose fifteen completely different search queries from different industries.

For every search query explain:

• What the user is actually trying to accomplish
• The emotional state of the user
• Where they are in the buying journey
• What information they still need
• What kind of landing page would satisfy them
• Which Google Ads campaign would work best
• Which keywords should be targeted
• Which keywords should be avoided
• How bidding strategy changes based on intent
• What businesses usually misunderstand about this search

Progressively increase the complexity of the search queries.

Challenge me to classify each search before explaining your reasoning.

I want to learn how experienced search marketers think when interpreting intent.`,
      },
      {
        id: 'google-ads-3',
        title: "Teach me Google Ads by analysing how successful companies likely\u2026",
        body: `Teach me Google Ads by analysing how successful companies likely use Google's advertising ecosystem.

Choose companies such as:

Amazon
Booking.com
HubSpot
Canva
Salesforce
Nike
Apple
Airbnb
Spotify
Zomato
Swiggy

For every company explain:

• Their business objective
• Their customer acquisition strategy
• Which Google campaign types they likely use
• Their keyword strategy
• Their bidding approach
• Their landing page strategy
• Their conversion optimization strategy
• Their measurement framework
• Their budget allocation philosophy
• How they probably scale campaigns

Clearly distinguish between publicly known information and professional inference.

After every case study ask me how I would improve the strategy before explaining your recommendations.`,
      },
      {
        id: 'google-ads-4',
        title: "Pretend I have joined a leading performance marketing agency as\u2026",
        body: `Pretend I have joined a leading performance marketing agency as a Google Ads Strategist.

Give me realistic client accounts one at a time.

Examples:

• SaaS company
• Study abroad consultancy
• E-commerce brand
• Hospital
• Real estate developer
• Law firm
• Online course platform
• Travel company

For every project provide:

• Business objectives
• Budget
• Competitors
• Existing campaign performance
• Conversion data
• Search term reports
• Landing pages
• Business constraints

Ask me to build:

• Account structure
• Campaign structure
• Keyword strategy
• Match type strategy
• Negative keywords
• Ad copy
• Extensions
• Landing page recommendations
• Bidding strategy
• Measurement plan

Challenge every recommendation I make before revealing how a senior Google Ads strategist would approach the same project.

Make this feel like managing real client accounts.`,
      },
      {
        id: 'google-ads-5',
        title: "Act as Google's Vice President responsible for Search Advertising",
        body: `Act as Google's Vice President responsible for Search Advertising.

Explain how search advertising is evolving because of:

• Artificial Intelligence
• AI Overviews
• Search Generative Experience
• Voice Search
• Multimodal Search
• Privacy regulations
• Automation
• Smart Bidding
• Performance Max
• Agentic AI

For every trend explain:

• Why Google is changing
• How user behaviour is changing
• What advertisers misunderstand
• Which traditional Google Ads skills are becoming less important
• Which new skills will become essential
• How agencies should prepare
• How businesses should adapt over the next decade

Ask me strategic questions throughout the discussion.

Finish by creating a roadmap explaining what separates an average Google Ads specialist from an elite search strategist.`,
      },
    ],
  },
  {
    slug: 'seo-aeo',
    name: 'SEO & AEO',
    prompts: [
      {
        id: 'seo-aeo-1',
        title: "Teach me SEO as if I have joined Google's Search Quality team",
        body: `Teach me SEO as if I have joined Google's Search Quality team.

Don't begin with keywords.

Instead explain how Google tries to understand information.

Cover:

• Crawling
• Indexing
• Knowledge Graph
• Entities
• Search Intent
• Semantic Search
• E-E-A-T
• Topical Authority
• User Satisfaction
• Helpful Content
• Link Signals
• Behaviour Signals

For every concept explain:

• Why Google built it
• Which problem it solves
• How AI helps Google understand content
• How websites succeed or fail because of it

Throughout the lesson ask me to predict how Google might evaluate different websites before explaining the answer.

I want to think like Google's ranking systems rather than an SEO checklist.`,
      },
      {
        id: 'seo-aeo-2',
        title: "Choose ten companies with exceptional organic search performance",
        body: `Choose ten companies with exceptional organic search performance.

Examples may include:

HubSpot
Wikipedia
Healthline
NerdWallet
Investopedia
Zapier
Canva
Ahrefs
Backlinko
Airbnb
Amazon

For each company explain:

• Why people search for them
• Their content strategy
• Their topical authority
• Their internal linking philosophy
• Their information architecture
• Their user experience
• Their trust signals
• Their business model
• Why Google rewards them

Also explain:

• What competitors fail to understand
• Which SEO myths these companies ignore
• Which principles remain timeless

Treat every company as a complete business case study rather than an SEO audit.`,
      },
      {
        id: 'seo-aeo-3',
        title: "Pretend I have joined Google's Search Quality team",
        body: `Pretend I have joined Google's Search Quality team.

Give me realistic websites, articles or landing pages to evaluate.

For every example ask me to assess:

• Search Intent Match
• Content Quality
• User Experience
• Information Architecture
• Trustworthiness
• Expertise
• Authority
• Helpful Content
• Entity Coverage
• Overall Search Satisfaction

Do not tell me Google's likely opinion first.

Instead ask me to justify every judgement.

Challenge my reasoning.

After I complete my evaluation explain how Google's Search Quality systems would likely assess the page and compare my reasoning with theirs.

Gradually increase the complexity of the examples.`,
      },
      {
        id: 'seo-aeo-4',
        title: "Act as a researcher studying the future of information retrieval",
        body: `Act as a researcher studying the future of information retrieval.

Explain how search is evolving from:

Search Engine Optimization

to

Answer Engine Optimization.

Discuss platforms including:

Google AI Overviews
ChatGPT
Perplexity
Gemini
Claude
Microsoft Copilot
Voice Assistants
AI Agents

For every platform explain:

• How users search differently
• How AI retrieves information
• How answers are generated
• What role websites play
• How content creators should adapt
• Why traditional SEO alone is no longer enough

Compare:

SEO
Semantic SEO
Entity SEO
Topical Authority
Retrieval-Augmented Generation (RAG)
Knowledge Graphs
Structured Data
LLMs
Answer Engine Optimization

Finish by creating a roadmap explaining how an SEO professional today can become an expert in AI Search and Answer Engine Optimization over the next five years.

I want to understand where search is heading rather than only how it worked yesterday.`,
      },
    ],
  },
  {
    slug: 'analytics',
    name: 'Analytics',
    prompts: [
      {
        id: 'analytics-1',
        title: "Teach me Marketing Analytics by turning me into a Data Detective",
        body: `Teach me Marketing Analytics by turning me into a Data Detective.

Instead of teaching metrics, give me a real business mystery to solve.

Choose a realistic company experiencing a business problem.

Examples include:

• Website traffic suddenly drops
• Revenue declines
• Conversion rate falls
• ROAS decreases
• Customer retention drops
• CAC increases
• Organic traffic disappears
• Mobile conversions collapse
• Leads increase but sales decline

Reveal evidence slowly.

Give me pieces of information one at a time such as:

• Google Analytics reports
• GA4 events
• Dashboard screenshots (describe them)
• Heatmap findings
• CRM reports
• Advertising metrics
• Funnel reports
• User recordings
• Search Console data
• Customer feedback

After every clue ask:

"What does this tell you?"

"What would you investigate next?"

Challenge my assumptions.

Only after I build my own hypothesis should you explain what actually happened and compare my reasoning with that of an experienced Growth Analyst.

I want to learn investigation—not dashboards.`,
      },
      {
        id: 'analytics-2',
        title: "Teach me Marketing Analytics through real business stories",
        body: `Teach me Marketing Analytics through real business stories.

Choose fifteen famous companies.

Examples:

Netflix
Spotify
Amazon
Uber
Airbnb
Booking.com
HubSpot
Canva
Duolingo
Meta
Google
Zomato

For every company explain:

• Which business metric mattered most
• Why leadership cared about that metric
• Which decisions were influenced by it
• What data they collected
• What patterns they discovered
• Which actions they took
• What happened afterwards

Don't focus on dashboards.

Focus on how data changed business decisions.

I want to understand why analytics exists rather than which reports to build.`,
      },
      {
        id: 'analytics-3',
        title: "Pretend I have joined the Growth Analytics team of a\u2026",
        body: `Pretend I have joined the Growth Analytics team of a fast-growing company.

Every day give me one business problem.

Examples:

Customer acquisition slows

Bounce rate increases

Organic traffic grows but revenue drops

Email open rate declines

Paid campaigns become expensive

Returning users disappear

Revenue grows but profit falls

Give me:

• Company background
• Business objectives
• Available datasets
• KPIs
• Historical trends
• Constraints

Ask me to investigate.

Do not tell me where the problem is.

Instead ask:

Which reports would you open first?

What hypothesis would you test?

Which metrics actually matter?

What data is missing?

Challenge my reasoning before revealing how experienced analysts approach the investigation.

Make every scenario feel like a real day working inside a Growth team.`,
      },
      {
        id: 'analytics-4',
        title: "Choose twenty famous business decisions from well-known companies",
        body: `Choose twenty famous business decisions from well-known companies.

Examples:

Netflix investing in original content

Amazon Prime

Spotify Discover Weekly

Airbnb Experiences

Google AI products

Tesla direct-to-consumer

HubSpot freemium

For every decision explain:

• What business question existed
• Which data leadership likely analysed
• Which KPIs mattered
• Which customer behaviour was observed
• Which assumptions were tested
• What risks existed
• Why executives made the final decision

Then ask:

"If you were analysing this company, what additional data would you want before making the same decision?"

Teach me how leaders think with data instead of teaching reports.`,
      },
    ],
  },
  {
    slug: 'content-marketing',
    name: 'Content Marketing',
    prompts: [
      {
        id: 'content-marketing-1',
        title: "I don't want to learn Content Marketing by studying blog writing",
        body: `I don't want to learn Content Marketing by studying blog writing.

Teach me Content Marketing through the greatest storytellers in history.

Start with ancient storytelling traditions, myths, religions, literature and great speeches before moving into modern brands.

Then explain how storytelling evolved through:

• Newspapers
• Radio
• Television
• Cinema
• Books
• YouTube
• Podcasts
• Social Media
• AI-generated content

Throughout the journey, explain how stories have always influenced beliefs, cultures and buying decisions.

Then analyse companies like:

Apple
Nike
Red Bull
Airbnb
LEGO
Patagonia
Duolingo
HubSpot
Notion

For each company explain:

• The stories they tell
• Why those stories resonate
• How they build trust
• How they educate rather than simply sell
• What marketers should learn from them

I want to understand why storytelling is the foundation of Content Marketing rather than simply learning how to write content.`,
      },
      {
        id: 'content-marketing-2',
        title: "Teach me Content Marketing through psychology instead of content\u2026",
        body: `Teach me Content Marketing through psychology instead of content formats.

Explain why people choose to:

• Read
• Watch
• Share
• Save
• Comment
• Subscribe
• Recommend

Explore concepts such as:

• Curiosity
• Identity
• Emotion
• Social Currency
• Authority
• Trust
• Belonging
• Novelty
• Surprise
• Practical Value

For every psychological principle:

• Explain the science behind it
• Show real examples from successful brands
• Analyse viral campaigns
• Explain why some content disappears while other content lives for years

At the end compare timeless content with trend-driven content and explain when each strategy works best.

I want to understand why people consume and share content—not just how to create it.`,
      },
      {
        id: 'content-marketing-3',
        title: "Pretend I have joined the Content Strategy team of a global company",
        body: `Pretend I have joined the Content Strategy team of a global company.

Choose a company such as:

HubSpot
Canva
Notion
Ahrefs
Adobe
Shopify
Duolingo
Airbnb
Red Bull
Netflix

Give me a real business objective.

Examples:

Increase brand awareness

Build category leadership

Educate customers

Generate qualified leads

Launch a new product

Improve customer retention

Build community

Ask me to design a complete content strategy.

Challenge my decisions.

Ask why I selected each content format, channel and message.

Explain how experienced Content Strategists would think differently.

Continue until we have built a complete strategy suitable for presentation to senior leadership.

I want to think like a Content Strategist rather than a Content Creator.`,
      },
      {
        id: 'content-marketing-4',
        title: "Choose twenty legendary examples of Content Marketing",
        body: `Choose twenty legendary examples of Content Marketing.

Examples may include:

Red Bull Stratos

Spotify Wrapped

HubSpot Academy

Google Year in Search

Airbnb's community stories

Patagonia documentaries

Nike's Dream Crazy campaign

Dove Real Beauty

Notion's education strategy

Canva Design School

For every example explain:

• The business objective
• The target audience
• Why this content was created
• The emotional triggers used
• The distribution strategy
• Why people engaged with it
• The long-term business impact
• What marketers can learn from it today

After every case study ask me:

"If you were responsible for this campaign, what would you have done differently?"

I want to develop strategic judgement by analysing great work rather than simply admiring it.`,
      },
      {
        id: 'content-marketing-5',
        title: "Act as a Chief Content Officer responsible for preparing a\u2026",
        body: `Act as a Chief Content Officer responsible for preparing a global marketing team for the future.

Explain how Content Marketing is evolving because of:

• Artificial Intelligence

• Large Language Models

• AI Search

• Answer Engine Optimization

• Personalisation

• Community-led growth

• Creator Economy

• Interactive content

• Short-form video

• Synthetic media

For every trend explain:

• What is changing

• What timeless principles remain unchanged

• Which content strategies are becoming obsolete

• Which new opportunities are emerging

• Which skills future Content Marketers must develop

Use examples from companies successfully adapting to these changes.

Challenge me throughout the discussion by asking how I would evolve a content strategy for the next five years.

Finish by creating a roadmap explaining how a Content Creator can become a world-class Content Strategist in the AI era.`,
      },
    ],
  },
  {
    slug: 'marketing-automation-ai',
    name: 'Marketing Automation & AI',
    prompts: [],
  },
]

/** Total prompts across every track. */
export const promptCount = promptTracks.reduce((n, t) => n + t.prompts.length, 0)

/** Tracks that actually have prompts, in library order. */
export const availablePromptTracks = promptTracks.filter((t) => t.prompts.length > 0)

/** Gold certificate holders get the library. */
export function isPromptLibraryUnlocked(kind: CertificateKind | undefined | null): boolean {
  return kind === PROMPT_LIBRARY_TIER
}
