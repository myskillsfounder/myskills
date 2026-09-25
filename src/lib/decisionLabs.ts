/**
 * Practice-track scenario question bank ("Decision Labs") — the QUESTIONS only.
 * Auto-generated from content/source-assessment-bank/MySkills_*_Scenario.xlsx
 * (8 files, one per skill track). Regenerate from the xlsx if the source
 * content changes — do not hand-edit the data array below.
 *
 * The correct answers and the explanations are NOT in this file, on purpose:
 * this file ships to every visitor's browser, and an answer key in the
 * bundle is an answer key for anyone who opens devtools. They live in
 * public.decision_lab_answer_key (docs/supabase-practice-server-grading.sql),
 * are graded by submit_practice_attempt(), and come back with the result —
 * after the attempt is recorded, never before.
 *
 * This is DIFFERENT from the Foundation assessment (the one-time, plain-MCQ
 * test graded by grade_initial_assessment). These are richer business
 * scenarios used for retakeable practice, one track at a time.
 */

export type Difficulty = 'Beginner' | 'Intermediate' | 'Advanced' | 'Expert'

export interface ScenarioQuestion {
  id: string
  /** matches a slug in src/lib/skillTracks.ts */
  track: string
  trackName: string
  title: string
  difficulty: Difficulty
  competency: string
  industry: string
  company: string
  role: string
  background: string
  objective: string
  information: string
  constraints: string
  question: string
  options: string[]
}

/** What the server returns for one question after grading an attempt. */
export interface ScenarioReview {
  /** index (0-3) of the correct option */
  correctIndex: number
  whyCorrect: string
  whyOthersWrong: string
  learningOutcome: string
}

/**
 * Points awarded per question, by difficulty — harder scenarios are worth
 * more (product decision: weighted scoring, not flat). Display only: the
 * server holds the real weight for each question in the answer key.
 */
export const DIFFICULTY_WEIGHT: Record<Difficulty, number> = {
  Beginner: 5,
  Intermediate: 10,
  Advanced: 15,
  Expert: 20,
}

export const decisionLabQuestions: ScenarioQuestion[] = [
  {
    "id": "MF-S001",
    "track": "marketing-fundamentals",
    "trackName": "Marketing Fundamentals",
    "title": "Launching an EdTech Startup",
    "difficulty": "Beginner",
    "competency": "Marketing Objectives",
    "industry": "EdTech",
    "company": "SkillSprint",
    "role": "You are the first Marketing Manager.",
    "background": "SkillSprint has launched AI, Data Science and Digital Marketing courses. The platform is new, has no previous customers, no CRM, no SEO rankings and very limited brand awareness. The founders have allocated ₹15 lakh for the first three months and expect measurable growth before seeking investors.",
    "objective": "Generate 1,500 qualified leads while maintaining a CPA below ₹900.",
    "information": "Budget ₹15L; New website; No customer database; High search demand for courses.",
    "constraints": "Limited team; Three-month deadline.",
    "question": "Which marketing channel should receive the highest initial investment?",
    "options": [
      "SEO",
      "Meta Lead Campaign",
      "Google Search Campaign",
      "Influencer Marketing"
    ]
  },
  {
    "id": "MF-S002",
    "track": "marketing-fundamentals",
    "trackName": "Marketing Fundamentals",
    "title": "Finding the Right Target Audience",
    "difficulty": "Beginner",
    "competency": "Segmentation",
    "industry": "Beauty",
    "company": "GlowSkin",
    "role": "You are the Brand Manager.",
    "background": "GlowSkin is introducing a premium anti-ageing serum priced well above mass-market alternatives. Research shows interest from multiple demographics, but the launch budget is limited.",
    "objective": "Achieve profitable online sales within 60 days.",
    "information": "Premium pricing; ₹8L budget; Audience research completed.",
    "constraints": "Cannot target everyone initially.",
    "question": "Which audience should be targeted first?",
    "options": [
      "Everyone aged 18+",
      "Women 35–50 interested in premium skincare",
      "Teenagers",
      "Broad audience with no interests"
    ]
  },
  {
    "id": "MF-S003",
    "track": "marketing-fundamentals",
    "trackName": "Marketing Fundamentals",
    "title": "Traffic Without Sales",
    "difficulty": "Intermediate",
    "competency": "Customer Journey",
    "industry": "E-commerce",
    "company": "UrbanKart",
    "role": "You are the Growth Manager.",
    "background": "UrbanKart's website traffic increased by 80% after a successful advertising campaign, but sales remained almost unchanged.",
    "objective": "Increase online purchases by 20%.",
    "information": "CTR 4.8%; Bounce Rate 28%; Checkout completion 18%.",
    "constraints": "No additional media budget this month.",
    "question": "Which stage of the customer journey requires immediate attention?",
    "options": [
      "Awareness",
      "Consideration",
      "Conversion",
      "Retention"
    ]
  },
  {
    "id": "MF-S004",
    "track": "marketing-fundamentals",
    "trackName": "Marketing Fundamentals",
    "title": "Building a Value Proposition",
    "difficulty": "Intermediate",
    "competency": "Value Proposition",
    "industry": "Nutrition",
    "company": "FitFuel",
    "role": "You are the Product Marketing Manager.",
    "background": "FitFuel is entering a crowded protein supplement market where competitors offer similar prices and ingredients.",
    "objective": "Increase first-time purchases.",
    "information": "Strong product quality; Limited brand awareness.",
    "constraints": "Cannot compete on price alone.",
    "question": "Which value proposition is strongest?",
    "options": [
      "Cheapest protein",
      "Scientifically formulated for busy professionals",
      "Largest warehouse",
      "Fastest delivery"
    ]
  },
  {
    "id": "MF-S005",
    "track": "marketing-fundamentals",
    "trackName": "Marketing Fundamentals",
    "title": "Choosing a Target Segment",
    "difficulty": "Intermediate",
    "competency": "STP",
    "industry": "FinTech",
    "company": "FinNest",
    "role": "You are responsible for launching a budgeting app.",
    "background": "The app serves students, freelancers and families, but the launch budget is insufficient to market to everyone.",
    "objective": "Acquire the first 10,000 users efficiently.",
    "information": "Three researched personas available.",
    "constraints": "Limited budget.",
    "question": "What is the best launch strategy?",
    "options": [
      "Target everyone",
      "Choose one priority segment",
      "Ignore segmentation",
      "Launch internationally"
    ]
  },
  {
    "id": "MF-S006",
    "track": "marketing-fundamentals",
    "trackName": "Marketing Fundamentals",
    "title": "Improving the Funnel",
    "difficulty": "Intermediate",
    "competency": "Marketing Funnel",
    "industry": "Travel",
    "company": "TravelGo",
    "role": "You oversee digital acquisition.",
    "background": "Thousands of visitors browse holiday packages every week, yet very few submit enquiry forms.",
    "objective": "Increase enquiries by 25%.",
    "information": "High traffic; Low enquiry rate.",
    "constraints": "No increase in advertising spend.",
    "question": "What should be optimised first?",
    "options": [
      "Company logo",
      "Landing page CTA and enquiry form",
      "Office location",
      "Facebook followers"
    ]
  },
  {
    "id": "MF-S007",
    "track": "marketing-fundamentals",
    "trackName": "Marketing Fundamentals",
    "title": "Responding to a Price War",
    "difficulty": "Advanced",
    "competency": "Competitive Positioning",
    "industry": "Healthcare",
    "company": "MedEase",
    "role": "You are the Marketing Director.",
    "background": "A competitor has reduced prices by 30%, but your customer satisfaction scores remain high.",
    "objective": "Protect market share without damaging profitability.",
    "information": "Strong reviews; Loyal customer base.",
    "constraints": "Price cuts reduce margins.",
    "question": "What is the best strategic response?",
    "options": [
      "Immediately reduce prices",
      "Strengthen differentiation and service quality",
      "Stop advertising",
      "Exit the market"
    ]
  },
  {
    "id": "MF-S008",
    "track": "marketing-fundamentals",
    "trackName": "Marketing Fundamentals",
    "title": "Allocating a Launch Budget",
    "difficulty": "Advanced",
    "competency": "Budget Allocation",
    "industry": "Real Estate",
    "company": "HomeSpace",
    "role": "You are planning a premium apartment launch.",
    "background": "The developer has ₹50 lakh for marketing and wants qualified enquiries over the next six months.",
    "objective": "Generate high-quality property enquiries.",
    "information": "Long sales cycle; High-value purchases.",
    "constraints": "Budget must cover multiple channels.",
    "question": "Which allocation strategy is most appropriate?",
    "options": [
      "Spend everything on Meta",
      "Use a balanced mix of Search, Social and Remarketing",
      "Only newspapers",
      "Only television"
    ]
  },
  {
    "id": "MF-S009",
    "track": "marketing-fundamentals",
    "trackName": "Marketing Fundamentals",
    "title": "Improving Customer Retention",
    "difficulty": "Advanced",
    "competency": "Retention",
    "industry": "Food Delivery",
    "company": "QuickServe",
    "role": "You lead lifecycle marketing.",
    "background": "Customer acquisition is strong, but repeat orders have declined steadily over three months.",
    "objective": "Increase repeat purchases.",
    "information": "Large customer database available.",
    "constraints": "Acquisition costs are increasing.",
    "question": "What should be prioritised?",
    "options": [
      "Acquire more customers",
      "Launch retention campaigns and loyalty programme",
      "Increase prices",
      "Pause marketing"
    ]
  },
  {
    "id": "MF-S010",
    "track": "marketing-fundamentals",
    "trackName": "Marketing Fundamentals",
    "title": "Creating an Integrated Strategy",
    "difficulty": "Advanced",
    "competency": "Marketing Strategy",
    "industry": "Legal Services",
    "company": "LegalPro",
    "role": "You are building the firm's first digital marketing plan.",
    "background": "LegalPro wants sustainable growth rather than short-term spikes in enquiries.",
    "objective": "Generate qualified consultations over the next year.",
    "information": "Annual budget ₹20L; Small marketing team.",
    "constraints": "Must balance short-term and long-term growth.",
    "question": "Which strategy is most sustainable?",
    "options": [
      "Paid ads only",
      "SEO + Content + Search Ads + Email Nurturing",
      "Social media only",
      "Referral marketing only"
    ]
  },
  {
    "id": "MR-S001",
    "track": "market-research",
    "trackName": "Market Research",
    "title": "Finding the Best Market Opportunity",
    "difficulty": "Beginner",
    "competency": "Competitor Analysis",
    "industry": "EdTech",
    "company": "SkillSprint",
    "role": "Market Research Analyst",
    "background": "AI course launch with crowded competitors but emerging niche demand.",
    "objective": "Identify best opportunity.",
    "information": "Trends show AI Product Management growing.",
    "constraints": "Small budget.",
    "question": "Recommendation?",
    "options": [
      "Generic AI",
      "AI Product Management",
      "Delay",
      "Copy competitors"
    ]
  },
  {
    "id": "MR-S002",
    "track": "market-research",
    "trackName": "Market Research",
    "title": "Understanding Search Demand",
    "difficulty": "Beginner",
    "competency": "Keyword Research",
    "industry": "SaaS",
    "company": "TaskFlow",
    "role": "SEO Research Specialist",
    "background": "New SaaS wants SEO strategy.",
    "objective": "Choose keyword.",
    "information": "50k vol KD92 vs 8k vol KD28.",
    "constraints": "New domain.",
    "question": "Priority?",
    "options": [
      "KD92",
      "KD28",
      "Both",
      "Neither"
    ]
  },
  {
    "id": "MR-S003",
    "track": "market-research",
    "trackName": "Market Research",
    "title": "Choosing the Right Segment",
    "difficulty": "Intermediate",
    "competency": "Audience Segmentation",
    "industry": "FinTech",
    "company": "FinNest",
    "role": "Research Consultant",
    "background": "Three audience segments identified.",
    "objective": "Recommend first target.",
    "information": "Students, freelancers, families.",
    "constraints": "Limited budget.",
    "question": "Choose?",
    "options": [
      "Students",
      "Freelancers",
      "Families",
      "Everyone"
    ]
  },
  {
    "id": "MR-S004",
    "track": "market-research",
    "trackName": "Market Research",
    "title": "Survey vs Analytics",
    "difficulty": "Intermediate",
    "competency": "Consumer Research",
    "industry": "E-commerce",
    "company": "UrbanKart",
    "role": "Insights Analyst",
    "background": "Survey says checkout easy but GA4 shows abandonment.",
    "objective": "Find truth.",
    "information": "Conflicting data.",
    "constraints": "No usability tests.",
    "question": "Next step?",
    "options": [
      "Ignore analytics",
      "Run usability testing",
      "Trust surveys",
      "Redesign homepage"
    ]
  },
  {
    "id": "MR-S005",
    "track": "market-research",
    "trackName": "Market Research",
    "title": "Using Google Trends",
    "difficulty": "Intermediate",
    "competency": "Trend Analysis",
    "industry": "Healthcare",
    "company": "MedEase",
    "role": "Market Analyst",
    "background": "Search behaviour changing.",
    "objective": "Recommend content.",
    "information": "Trend data available.",
    "constraints": "Fixed budget.",
    "question": "Priority?",
    "options": [
      "Old keyword",
      "New trend keyword",
      "Ignore trends",
      "Pause SEO"
    ]
  },
  {
    "id": "MR-S006",
    "track": "market-research",
    "trackName": "Market Research",
    "title": "Evaluating Competitors",
    "difficulty": "Intermediate",
    "competency": "Competitor Benchmarking",
    "industry": "Beauty",
    "company": "GlowSkin",
    "role": "Research Lead",
    "background": "Competitor ranks #1 organically.",
    "objective": "Find advantage.",
    "information": "Weekly content.",
    "constraints": "Limited backlinks.",
    "question": "Analyse?",
    "options": [
      "Office",
      "SEO content",
      "Logo",
      "Employees"
    ]
  },
  {
    "id": "MR-S007",
    "track": "market-research",
    "trackName": "Market Research",
    "title": "Market Sizing",
    "difficulty": "Advanced",
    "competency": "Market Sizing",
    "industry": "Travel",
    "company": "TravelGo",
    "role": "Business Analyst",
    "background": "Luxury niche market.",
    "objective": "Launch decision.",
    "information": "High margin niche.",
    "constraints": "₹20L budget.",
    "question": "Recommendation?",
    "options": [
      "Reject",
      "Launch niche",
      "Everyone",
      "Reduce price"
    ]
  },
  {
    "id": "MR-S008",
    "track": "market-research",
    "trackName": "Market Research",
    "title": "Validating Personas",
    "difficulty": "Advanced",
    "competency": "Persona Development",
    "industry": "Real Estate",
    "company": "HomeSpace",
    "role": "Research Manager",
    "background": "Sales and interviews disagree.",
    "objective": "Recommend action.",
    "information": "CRM + interviews.",
    "constraints": "Team disagreement.",
    "question": "Next?",
    "options": [
      "Ignore interviews",
      "Validate quantitatively",
      "Follow sales",
      "Target all"
    ]
  },
  {
    "id": "MR-S009",
    "track": "market-research",
    "trackName": "Market Research",
    "title": "Research Budget",
    "difficulty": "Advanced",
    "competency": "Research Planning",
    "industry": "Food Delivery",
    "company": "QuickServe",
    "role": "Research Consultant",
    "background": "₹10L research budget.",
    "objective": "Allocate budget.",
    "information": "Need customer and competitor insights.",
    "constraints": "Short timeline.",
    "question": "Allocate?",
    "options": [
      "Surveys only",
      "Balanced research",
      "Brand redesign",
      "Social contests"
    ]
  },
  {
    "id": "MR-S010",
    "track": "market-research",
    "trackName": "Market Research",
    "title": "Final Recommendation",
    "difficulty": "Advanced",
    "competency": "Strategic Research",
    "industry": "Legal",
    "company": "LegalPro",
    "role": "Head of Insights",
    "background": "Research supports SME market.",
    "objective": "Board decision.",
    "information": "Growing demand.",
    "constraints": "Evidence required.",
    "question": "Recommend?",
    "options": [
      "Reject",
      "Phased launch",
      "Wait",
      "Acquire competitor"
    ]
  },
  {
    "id": "META-S001",
    "track": "meta-ads",
    "trackName": "Meta Ads",
    "title": "Selecting the Right Campaign Objective",
    "difficulty": "Beginner",
    "competency": "Campaign Objective",
    "industry": "EdTech",
    "company": "SkillSprint",
    "role": "Performance Marketer",
    "background": "A new AI course is launching with no previous campaign history.",
    "objective": "Generate qualified leads.",
    "information": "Budget ₹10L; New landing page; No pixel history.",
    "constraints": "Limited time.",
    "question": "Which objective should be used first?",
    "options": [
      "Awareness",
      "Traffic",
      "Leads",
      "Engagement"
    ]
  },
  {
    "id": "META-S002",
    "track": "meta-ads",
    "trackName": "Meta Ads",
    "title": "Campaign Structure for Multiple Courses",
    "difficulty": "Beginner",
    "competency": "Campaign Structure",
    "industry": "Education",
    "company": "FutureLearn",
    "role": "Media Buyer",
    "background": "Three courses target different audiences.",
    "objective": "Generate leads efficiently.",
    "information": "MBA, AI and Data Science audiences differ.",
    "constraints": "Budget ₹12L.",
    "question": "Best campaign structure?",
    "options": [
      "One campaign",
      "Separate campaigns by audience",
      "One ad set only",
      "One ad per course"
    ]
  },
  {
    "id": "META-S003",
    "track": "meta-ads",
    "trackName": "Meta Ads",
    "title": "Choosing the Best Audience",
    "difficulty": "Beginner",
    "competency": "Audience Targeting",
    "industry": "Healthcare",
    "company": "MedEase",
    "role": "Campaign Manager",
    "background": "Launching online consultation services.",
    "objective": "Acquire patients.",
    "information": "Pixel has 5,000 purchasers.",
    "constraints": "Limited budget.",
    "question": "Which audience should be tested first?",
    "options": [
      "Broad 18-65",
      "Lookalike of existing patients",
      "Random interests",
      "Worldwide"
    ]
  },
  {
    "id": "META-S004",
    "track": "meta-ads",
    "trackName": "Meta Ads",
    "title": "Budget Allocation",
    "difficulty": "Beginner",
    "competency": "Budgeting",
    "industry": "E-commerce",
    "company": "UrbanKart",
    "role": "Performance Specialist",
    "background": "Four product categories require promotion.",
    "objective": "Maximize ROAS.",
    "information": "Historical sales available.",
    "constraints": "₹5L monthly budget.",
    "question": "How should budget be allocated?",
    "options": [
      "Equal split",
      "Prioritize best-selling categories",
      "Spend on weakest products",
      "Random split"
    ]
  },
  {
    "id": "META-S005",
    "track": "meta-ads",
    "trackName": "Meta Ads",
    "title": "Placement Strategy",
    "difficulty": "Beginner",
    "competency": "Placements",
    "industry": "Fashion",
    "company": "StyleHub",
    "role": "Media Buyer",
    "background": "Campaign targets online purchases.",
    "objective": "Increase sales.",
    "information": "Meta recommends Advantage+ placements.",
    "constraints": "No creative limitations.",
    "question": "Which placement strategy?",
    "options": [
      "Manual Feed only",
      "Advantage+ Placements",
      "Stories only",
      "Reels only"
    ]
  },
  {
    "id": "META-S006",
    "track": "meta-ads",
    "trackName": "Meta Ads",
    "title": "CTR vs CPC",
    "difficulty": "Intermediate",
    "competency": "Performance Analysis",
    "industry": "SaaS",
    "company": "TaskFlow",
    "role": "Optimization Specialist",
    "background": "CTR is 0.7%, CPC ₹85.",
    "objective": "Improve efficiency.",
    "information": "Low engagement.",
    "constraints": "Budget unchanged.",
    "question": "What should be optimized first?",
    "options": [
      "Creative",
      "Increase budget",
      "Pause account",
      "Change logo"
    ]
  },
  {
    "id": "META-S007",
    "track": "meta-ads",
    "trackName": "Meta Ads",
    "title": "Low Conversion Rate",
    "difficulty": "Intermediate",
    "competency": "Landing Page Analysis",
    "industry": "Real Estate",
    "company": "HomeSpace",
    "role": "Growth Marketer",
    "background": "CTR is 4.8% but conversion rate is 0.4%.",
    "objective": "Increase enquiries.",
    "information": "Landing page loads in 7 seconds.",
    "constraints": "No new creatives.",
    "question": "What's the bottleneck?",
    "options": [
      "Audience",
      "Landing page",
      "Budget",
      "Placements"
    ]
  },
  {
    "id": "META-S008",
    "track": "meta-ads",
    "trackName": "Meta Ads",
    "title": "High CPA",
    "difficulty": "Intermediate",
    "competency": "Optimization",
    "industry": "FinTech",
    "company": "FinNest",
    "role": "Performance Lead",
    "background": "CPA increased from ₹600 to ₹1,350.",
    "objective": "Reduce CPA.",
    "information": "Frequency 2.1; CTR stable.",
    "constraints": "Budget unchanged.",
    "question": "First optimization?",
    "options": [
      "Analyze audience and conversion funnel",
      "Double budget",
      "Duplicate campaign",
      "Pause all ads"
    ]
  },
  {
    "id": "META-S009",
    "track": "meta-ads",
    "trackName": "Meta Ads",
    "title": "Creative Fatigue",
    "difficulty": "Intermediate",
    "competency": "Creative Optimization",
    "industry": "Food Delivery",
    "company": "QuickServe",
    "role": "Creative Strategist",
    "background": "Frequency reached 8.5 and CTR is falling.",
    "objective": "Recover performance.",
    "information": "Same creatives running 6 weeks.",
    "constraints": "Strong audience.",
    "question": "Best action?",
    "options": [
      "Increase budget",
      "Launch new creatives",
      "Reduce bids",
      "Delete pixel"
    ]
  },
  {
    "id": "META-S010",
    "track": "meta-ads",
    "trackName": "Meta Ads",
    "title": "Lookalike vs Interests",
    "difficulty": "Intermediate",
    "competency": "Audience Testing",
    "industry": "Beauty",
    "company": "GlowSkin",
    "role": "Ads Specialist",
    "background": "Interest audience CPA ₹950; Lookalike CPA ₹620.",
    "objective": "Scale profitably.",
    "information": "Stable conversion volume.",
    "constraints": "Budget available.",
    "question": "What should you do?",
    "options": [
      "Shift entire budget instantly",
      "Gradually increase Lookalike budget",
      "Pause Lookalike",
      "Use interests only"
    ]
  },
  {
    "id": "META-S011",
    "track": "meta-ads",
    "trackName": "Meta Ads",
    "title": "Scaling a Winner",
    "difficulty": "Advanced",
    "competency": "Scaling",
    "industry": "Travel",
    "company": "TravelGo",
    "role": "Senior Media Buyer",
    "background": "Campaign delivers ROAS 6.2 consistently.",
    "objective": "Increase volume.",
    "information": "Daily budget ₹20k.",
    "constraints": "Need stable performance.",
    "question": "Best scaling approach?",
    "options": [
      "Increase 20% every few days",
      "Increase 300% overnight",
      "Duplicate 10 campaigns",
      "Restart learning"
    ]
  },
  {
    "id": "META-S012",
    "track": "meta-ads",
    "trackName": "Meta Ads",
    "title": "Pixel Attribution Issue",
    "difficulty": "Advanced",
    "competency": "Tracking",
    "industry": "Retail",
    "company": "UrbanKart",
    "role": "Tracking Specialist",
    "background": "CRM reports 180 purchases but Pixel reports 120.",
    "objective": "Restore measurement.",
    "information": "Recent website update.",
    "constraints": "Limited developer time.",
    "question": "Likely first investigation?",
    "options": [
      "Pixel implementation",
      "Logo update",
      "Audience size",
      "Campaign name"
    ]
  },
  {
    "id": "META-S013",
    "track": "meta-ads",
    "trackName": "Meta Ads",
    "title": "Conversion API",
    "difficulty": "Advanced",
    "competency": "CAPI",
    "industry": "Insurance",
    "company": "SecureLife",
    "role": "Marketing Technologist",
    "background": "Browser tracking has declined after privacy updates.",
    "objective": "Improve measurement.",
    "information": "Pixel already installed.",
    "constraints": "Developer support available.",
    "question": "Best recommendation?",
    "options": [
      "Remove Pixel",
      "Implement Conversion API",
      "Stop tracking",
      "Use manual reporting"
    ]
  },
  {
    "id": "META-S014",
    "track": "meta-ads",
    "trackName": "Meta Ads",
    "title": "Campaign Rescue",
    "difficulty": "Advanced",
    "competency": "Troubleshooting",
    "industry": "Hospitality",
    "company": "StayEasy",
    "role": "Performance Manager",
    "background": "₹2 lakh spent, only 18 bookings.",
    "objective": "Recover campaign.",
    "information": "CTR 1.9%, CVR 0.6%, CPA very high.",
    "constraints": "One week remaining.",
    "question": "First action?",
    "options": [
      "Audit funnel before making changes",
      "Increase budget",
      "Launch new page only",
      "Pause account"
    ]
  },
  {
    "id": "META-S015",
    "track": "meta-ads",
    "trackName": "Meta Ads",
    "title": "Performance Review",
    "difficulty": "Expert",
    "competency": "Strategic Optimization",
    "industry": "Automotive",
    "company": "DriveNow",
    "role": "Digital Marketing Manager",
    "background": "Quarterly performance review shows mixed results across campaigns.",
    "objective": "Recommend next-quarter strategy.",
    "information": "ROAS varies from 1.8 to 5.9.",
    "constraints": "Board presentation due.",
    "question": "Best recommendation?",
    "options": [
      "Increase spend everywhere",
      "Reallocate budget to high-ROAS campaigns while testing new opportunities",
      "Stop low performers immediately",
      "Only refresh creatives"
    ]
  },
  {
    "id": "GA-S001",
    "track": "google-ads",
    "trackName": "Google Ads",
    "title": "Selecting the Right Campaign Type",
    "difficulty": "Beginner",
    "competency": "Campaign Selection",
    "industry": "EdTech",
    "company": "SkillSprint",
    "role": "Google Ads Specialist",
    "background": "A new AI certification program is launching.",
    "objective": "Generate qualified leads.",
    "information": "Budget ₹8L; strong search demand.",
    "constraints": "Limited launch time.",
    "question": "Which campaign type should you launch first?",
    "options": [
      "Display",
      "Search",
      "Video",
      "Demand Gen"
    ]
  },
  {
    "id": "GA-S002",
    "track": "google-ads",
    "trackName": "Google Ads",
    "title": "Choosing Match Types",
    "difficulty": "Beginner",
    "competency": "Keywords",
    "industry": "Healthcare",
    "company": "MedEase",
    "role": "PPC Executive",
    "background": "Online doctor consultation campaign is launching.",
    "objective": "Maximize qualified traffic.",
    "information": "Limited budget.",
    "constraints": "Need high relevance.",
    "question": "Which match type is best initially?",
    "options": [
      "Broad",
      "Broad Match with no negatives",
      "Exact + Phrase",
      "Display keywords"
    ]
  },
  {
    "id": "GA-S003",
    "track": "google-ads",
    "trackName": "Google Ads",
    "title": "Negative Keywords",
    "difficulty": "Beginner",
    "competency": "Optimization",
    "industry": "E-commerce",
    "company": "UrbanKart",
    "role": "Campaign Manager",
    "background": "Ads appear for irrelevant searches.",
    "objective": "Reduce wasted spend.",
    "information": "Search terms include 'free' and 'jobs'.",
    "constraints": "CPA increasing.",
    "question": "What should you do first?",
    "options": [
      "Increase bids",
      "Add negative keywords",
      "Pause campaign",
      "Raise budget"
    ]
  },
  {
    "id": "GA-S004",
    "track": "google-ads",
    "trackName": "Google Ads",
    "title": "Quality Score Drop",
    "difficulty": "Intermediate",
    "competency": "Quality Score",
    "industry": "SaaS",
    "company": "TaskFlow",
    "role": "Performance Marketer",
    "background": "Quality Score dropped from 8 to 4.",
    "objective": "Improve ad performance.",
    "information": "CTR declined; landing page unchanged.",
    "constraints": "Budget fixed.",
    "question": "What should you review first?",
    "options": [
      "Ad relevance",
      "Office location",
      "Campaign name",
      "Account currency"
    ]
  },
  {
    "id": "GA-S005",
    "track": "google-ads",
    "trackName": "Google Ads",
    "title": "Low CTR",
    "difficulty": "Intermediate",
    "competency": "Ad Copy",
    "industry": "Travel",
    "company": "TravelGo",
    "role": "SEM Specialist",
    "background": "Search ads have 0.9% CTR.",
    "objective": "Increase clicks.",
    "information": "Impressions are high.",
    "constraints": "Competitors have stronger offers.",
    "question": "Best first action?",
    "options": [
      "Increase bids",
      "Rewrite ad copy and headlines",
      "Pause keywords",
      "Change logo"
    ]
  },
  {
    "id": "GA-S006",
    "track": "google-ads",
    "trackName": "Google Ads",
    "title": "High CPC",
    "difficulty": "Intermediate",
    "competency": "Bidding",
    "industry": "Legal",
    "company": "LegalPro",
    "role": "Google Ads Manager",
    "background": "Average CPC increased 40%.",
    "objective": "Maintain profitability.",
    "information": "Competitive auction.",
    "constraints": "Conversion rate stable.",
    "question": "What should you analyze first?",
    "options": [
      "Auction Insights",
      "Website colors",
      "Office address",
      "Email signatures"
    ]
  },
  {
    "id": "GA-S007",
    "track": "google-ads",
    "trackName": "Google Ads",
    "title": "Landing Page Experience",
    "difficulty": "Intermediate",
    "competency": "Landing Pages",
    "industry": "Real Estate",
    "company": "HomeSpace",
    "role": "Growth Manager",
    "background": "CTR is 6% but conversions remain low.",
    "objective": "Increase enquiries.",
    "information": "Landing page loads in 8 seconds.",
    "constraints": "Mobile bounce rate 72%.",
    "question": "Main optimization?",
    "options": [
      "Add keywords",
      "Improve landing page speed and UX",
      "Increase budget",
      "Pause ads"
    ]
  },
  {
    "id": "GA-S008",
    "track": "google-ads",
    "trackName": "Google Ads",
    "title": "Performance Max Evaluation",
    "difficulty": "Intermediate",
    "competency": "Performance Max",
    "industry": "Retail",
    "company": "StyleHub",
    "role": "Digital Marketing Executive",
    "background": "Performance Max delivers conversions but limited visibility.",
    "objective": "Decide next action.",
    "information": "ROAS 4.5.",
    "constraints": "Limited search term insights.",
    "question": "Recommendation?",
    "options": [
      "Pause campaign",
      "Continue while measuring business KPIs",
      "Move all budget to Display",
      "Disable tracking"
    ]
  },
  {
    "id": "GA-S009",
    "track": "google-ads",
    "trackName": "Google Ads",
    "title": "Search Terms Analysis",
    "difficulty": "Intermediate",
    "competency": "Search Queries",
    "industry": "Education",
    "company": "FutureLearn",
    "role": "PPC Analyst",
    "background": "Search report contains many irrelevant queries.",
    "objective": "Improve efficiency.",
    "information": "CPA rising.",
    "constraints": "Negative keywords missing.",
    "question": "First action?",
    "options": [
      "Increase bids",
      "Review search terms and add negatives",
      "Duplicate campaign",
      "Pause account"
    ]
  },
  {
    "id": "GA-S010",
    "track": "google-ads",
    "trackName": "Google Ads",
    "title": "Remarketing Strategy",
    "difficulty": "Intermediate",
    "competency": "Remarketing",
    "industry": "Beauty",
    "company": "GlowSkin",
    "role": "SEM Manager",
    "background": "Thousands abandon carts monthly.",
    "objective": "Recover lost sales.",
    "information": "GA4 audiences available.",
    "constraints": "Budget ₹3L.",
    "question": "Best campaign?",
    "options": [
      "Search only",
      "Remarketing campaign",
      "Display without audiences",
      "Video awareness"
    ]
  },
  {
    "id": "GA-S011",
    "track": "google-ads",
    "trackName": "Google Ads",
    "title": "Scaling Search Campaigns",
    "difficulty": "Advanced",
    "competency": "Scaling",
    "industry": "Insurance",
    "company": "SecureLife",
    "role": "Senior PPC Manager",
    "background": "Campaign consistently achieves CPA below target.",
    "objective": "Increase lead volume.",
    "information": "Budget available.",
    "constraints": "Stable Quality Score.",
    "question": "Best approach?",
    "options": [
      "Double budget overnight",
      "Gradually increase budget while monitoring CPA",
      "Restart campaign",
      "Pause keywords"
    ]
  },
  {
    "id": "GA-S012",
    "track": "google-ads",
    "trackName": "Google Ads",
    "title": "Conversion Tracking Failure",
    "difficulty": "Advanced",
    "competency": "Tracking",
    "industry": "Finance",
    "company": "FinNest",
    "role": "Tracking Specialist",
    "background": "Conversions suddenly dropped to zero.",
    "objective": "Restore measurement.",
    "information": "Website updated yesterday.",
    "constraints": "Traffic unchanged.",
    "question": "First investigation?",
    "options": [
      "Conversion tag implementation",
      "Ad copy",
      "Keyword bids",
      "Extensions"
    ]
  },
  {
    "id": "GA-S013",
    "track": "google-ads",
    "trackName": "Google Ads",
    "title": "Budget Allocation",
    "difficulty": "Advanced",
    "competency": "Budget Strategy",
    "industry": "Hospitality",
    "company": "StayEasy",
    "role": "SEM Lead",
    "background": "Five campaigns compete for the same budget.",
    "objective": "Maximize bookings.",
    "information": "ROAS ranges from 2.0 to 7.1.",
    "constraints": "Budget limited.",
    "question": "What should you do?",
    "options": [
      "Equal budget",
      "Shift budget toward higher ROAS campaigns",
      "Pause all",
      "Increase all budgets"
    ]
  },
  {
    "id": "GA-S014",
    "track": "google-ads",
    "trackName": "Google Ads",
    "title": "Campaign Rescue",
    "difficulty": "Advanced",
    "competency": "Troubleshooting",
    "industry": "Automotive",
    "company": "DriveNow",
    "role": "Performance Lead",
    "background": "₹5 lakh spent with poor lead quality.",
    "objective": "Improve results quickly.",
    "information": "CTR 5%, Conversion Rate 0.5%.",
    "constraints": "One week remains.",
    "question": "First action?",
    "options": [
      "Audit keywords, search terms and landing pages",
      "Increase budget",
      "Launch Display",
      "Pause account"
    ]
  },
  {
    "id": "GA-S015",
    "track": "google-ads",
    "trackName": "Google Ads",
    "title": "Quarterly Account Review",
    "difficulty": "Expert",
    "competency": "Strategic Optimization",
    "industry": "Manufacturing",
    "company": "BuildPro",
    "role": "Head of Digital",
    "background": "Executive team requests next-quarter growth strategy.",
    "objective": "Increase qualified leads while improving ROAS.",
    "information": "Mixed campaign performance.",
    "constraints": "Board presentation tomorrow.",
    "question": "Best recommendation?",
    "options": [
      "Increase spend everywhere",
      "Invest more in top-performing campaigns while testing new opportunities",
      "Pause low performers immediately",
      "Replace all keywords"
    ]
  },
  {
    "id": "SEO-S001",
    "track": "seo-aeo",
    "trackName": "SEO & AEO",
    "title": "Organic Traffic Decline",
    "difficulty": "Beginner",
    "competency": "Technical SEO",
    "industry": "EdTech",
    "company": "SkillSprint",
    "role": "SEO Specialist",
    "background": "Organic traffic has dropped 35% after a website redesign.",
    "objective": "Recover lost traffic.",
    "information": "URLs changed, redirects may be missing, rankings declining.",
    "constraints": "Limited developer time.",
    "question": "Where should you investigate first?",
    "options": [
      "Run influencer campaign",
      "Audit redirects and technical SEO",
      "Increase Meta Ads budget",
      "Publish more social posts"
    ]
  },
  {
    "id": "SEO-S002",
    "track": "seo-aeo",
    "trackName": "SEO & AEO",
    "title": "Keyword Prioritization",
    "difficulty": "Beginner",
    "competency": "Keyword Research",
    "industry": "Healthcare",
    "company": "MedEase",
    "role": "SEO Executive",
    "background": "A new healthcare blog is choosing target keywords.",
    "objective": "Rank within 6 months.",
    "information": "Keyword A: 60k volume/KD90. Keyword B: 7k volume/KD25.",
    "constraints": "New domain authority.",
    "question": "Which keyword should be targeted first?",
    "options": [
      "Keyword A",
      "Keyword B",
      "Both equally",
      "Neither"
    ]
  },
  {
    "id": "SEO-S003",
    "track": "seo-aeo",
    "trackName": "SEO & AEO",
    "title": "Content Gap Analysis",
    "difficulty": "Beginner",
    "competency": "Content Strategy",
    "industry": "Finance",
    "company": "FinNest",
    "role": "Content Strategist",
    "background": "Competitors rank for topics your website does not cover.",
    "objective": "Increase organic visibility.",
    "information": "Competitors publish guides, calculators and FAQs.",
    "constraints": "Small content team.",
    "question": "What should you do first?",
    "options": [
      "Copy competitor articles",
      "Perform a content gap analysis and build a content plan",
      "Buy backlinks only",
      "Ignore competitors"
    ]
  },
  {
    "id": "SEO-S004",
    "track": "seo-aeo",
    "trackName": "SEO & AEO",
    "title": "Local SEO Challenge",
    "difficulty": "Intermediate",
    "competency": "Local SEO",
    "industry": "Restaurant",
    "company": "SpiceHouse",
    "role": "Local SEO Manager",
    "background": "The restaurant ranks nationally for recipes but not for local searches.",
    "objective": "Increase local reservations.",
    "information": "Google Business Profile exists but has few reviews.",
    "constraints": "Budget limited.",
    "question": "What is the highest priority?",
    "options": [
      "Buy display ads",
      "Optimize Google Business Profile and local citations",
      "Change logo",
      "Rewrite homepage only"
    ]
  },
  {
    "id": "SEO-S005",
    "track": "seo-aeo",
    "trackName": "SEO & AEO",
    "title": "Core Web Vitals",
    "difficulty": "Intermediate",
    "competency": "Technical SEO",
    "industry": "E-commerce",
    "company": "UrbanKart",
    "role": "Technical SEO Analyst",
    "background": "Mobile pages load slowly and Core Web Vitals are failing.",
    "objective": "Improve rankings and UX.",
    "information": "LCP 5.8s, CLS 0.32, INP poor.",
    "constraints": "Development sprint available.",
    "question": "What should be prioritized?",
    "options": [
      "Add more keywords",
      "Improve page speed and Core Web Vitals",
      "Increase backlinks",
      "Run paid ads"
    ]
  },
  {
    "id": "SEO-S006",
    "track": "seo-aeo",
    "trackName": "SEO & AEO",
    "title": "Backlink Strategy",
    "difficulty": "Intermediate",
    "competency": "Link Building",
    "industry": "Travel",
    "company": "TravelGo",
    "role": "SEO Consultant",
    "background": "A competitor has twice as many high-quality backlinks.",
    "objective": "Increase domain authority.",
    "information": "Content quality is strong.",
    "constraints": "Limited outreach budget.",
    "question": "Best long-term strategy?",
    "options": [
      "Buy hundreds of low-quality links",
      "Earn authoritative backlinks through partnerships and content",
      "Ignore backlinks",
      "Stuff keywords"
    ]
  },
  {
    "id": "SEO-S007",
    "track": "seo-aeo",
    "trackName": "SEO & AEO",
    "title": "Schema Markup",
    "difficulty": "Intermediate",
    "competency": "Structured Data",
    "industry": "Retail",
    "company": "StyleHub",
    "role": "SEO Manager",
    "background": "Product pages rarely appear with rich results.",
    "objective": "Improve SERP visibility.",
    "information": "No structured data implemented.",
    "constraints": "Developers available.",
    "question": "What should you implement?",
    "options": [
      "More banner ads",
      "Product schema markup",
      "More pop-ups",
      "More images only"
    ]
  },
  {
    "id": "SEO-S008",
    "track": "seo-aeo",
    "trackName": "SEO & AEO",
    "title": "Featured Snippet Opportunity",
    "difficulty": "Advanced",
    "competency": "Content Optimization",
    "industry": "Legal",
    "company": "LegalPro",
    "role": "Organic Growth Manager",
    "background": "Competitor owns the featured snippet for an important keyword.",
    "objective": "Win the snippet.",
    "information": "Your article ranks #3.",
    "constraints": "Content can be updated.",
    "question": "What should you do?",
    "options": [
      "Increase PPC bids",
      "Restructure content with concise answers, headings and FAQs",
      "Delete the page",
      "Reduce content length drastically"
    ]
  },
  {
    "id": "SEO-S009",
    "track": "seo-aeo",
    "trackName": "SEO & AEO",
    "title": "AI Search & AEO",
    "difficulty": "Advanced",
    "competency": "Answer Engine Optimization",
    "industry": "SaaS",
    "company": "TaskFlow",
    "role": "AEO Specialist",
    "background": "AI-powered search engines summarize competitor content instead of yours.",
    "objective": "Increase AI visibility.",
    "information": "Content lacks direct answers and structured FAQs.",
    "constraints": "Need future-ready SEO.",
    "question": "Which improvement is most valuable?",
    "options": [
      "Publish shorter ads",
      "Create expert, structured content with FAQs and schema",
      "Pause SEO",
      "Focus only on backlinks"
    ]
  },
  {
    "id": "SEO-S010",
    "track": "seo-aeo",
    "trackName": "SEO & AEO",
    "title": "Site Migration",
    "difficulty": "Advanced",
    "competency": "Technical SEO",
    "industry": "Manufacturing",
    "company": "BuildPro",
    "role": "SEO Lead",
    "background": "The company is moving to a new CMS.",
    "objective": "Protect organic traffic.",
    "information": "20,000 indexed URLs.",
    "constraints": "Migration in 30 days.",
    "question": "What is the most critical preparation?",
    "options": [
      "Delete old URLs",
      "Create redirect mapping and test indexing",
      "Launch without testing",
      "Pause Search Console"
    ]
  },
  {
    "id": "SEO-S011",
    "track": "seo-aeo",
    "trackName": "SEO & AEO",
    "title": "Internal Linking",
    "difficulty": "Advanced",
    "competency": "Site Architecture",
    "industry": "Education",
    "company": "FutureLearn",
    "role": "SEO Strategist",
    "background": "Important course pages receive little internal authority.",
    "objective": "Improve rankings.",
    "information": "Many orphan pages found.",
    "constraints": "Content hub exists.",
    "question": "What should you do?",
    "options": [
      "Remove links",
      "Build a strategic internal linking structure",
      "Reduce navigation",
      "Duplicate pages"
    ]
  },
  {
    "id": "SEO-S012",
    "track": "seo-aeo",
    "trackName": "SEO & AEO",
    "title": "Recovering from a Google Update",
    "difficulty": "Advanced",
    "competency": "Algorithm Recovery",
    "industry": "Beauty",
    "company": "GlowSkin",
    "role": "SEO Consultant",
    "background": "Traffic dropped after a major Google core update.",
    "objective": "Recover rankings.",
    "information": "No manual actions reported.",
    "constraints": "Content quality inconsistent.",
    "question": "Best first action?",
    "options": [
      "Buy backlinks",
      "Audit content quality against search intent and E-E-A-T",
      "Change domain",
      "Pause publishing"
    ]
  },
  {
    "id": "SEO-S013",
    "track": "seo-aeo",
    "trackName": "SEO & AEO",
    "title": "Content Refresh Strategy",
    "difficulty": "Advanced",
    "competency": "Content Optimization",
    "industry": "Food",
    "company": "QuickServe",
    "role": "Content Manager",
    "background": "Blogs ranking on page two haven't been updated for two years.",
    "objective": "Increase organic traffic.",
    "information": "Competitors publish fresher information.",
    "constraints": "Limited writers.",
    "question": "Best action?",
    "options": [
      "Delete blogs",
      "Refresh and expand existing content",
      "Ignore them",
      "Only change titles"
    ]
  },
  {
    "id": "SEO-S014",
    "track": "seo-aeo",
    "trackName": "SEO & AEO",
    "title": "SEO Reporting",
    "difficulty": "Advanced",
    "competency": "Measurement",
    "industry": "Insurance",
    "company": "SecureLife",
    "role": "SEO Analyst",
    "background": "The CEO wants proof that SEO is driving business value.",
    "objective": "Build executive reporting.",
    "information": "GA4 and Search Console connected.",
    "constraints": "Monthly reporting required.",
    "question": "Which KPI set is most useful?",
    "options": [
      "Followers and likes",
      "Organic conversions, rankings, CTR and revenue",
      "Page colors",
      "Bounce rate only"
    ]
  },
  {
    "id": "SEO-S015",
    "track": "seo-aeo",
    "trackName": "SEO & AEO",
    "title": "Building a Long-Term SEO Roadmap",
    "difficulty": "Expert",
    "competency": "SEO Strategy",
    "industry": "Real Estate",
    "company": "HomeSpace",
    "role": "Head of Organic Growth",
    "background": "The company wants to dominate organic search over the next three years.",
    "objective": "Create a sustainable SEO strategy.",
    "information": "Large content budget, development support and leadership buy-in.",
    "constraints": "Highly competitive market.",
    "question": "Which roadmap is strongest?",
    "options": [
      "Focus only on backlinks",
      "Combine technical SEO, content, authority building, local SEO and AEO",
      "Publish blogs only",
      "Depend entirely on paid ads"
    ]
  },
  {
    "id": "ANA-S001",
    "track": "analytics",
    "trackName": "Analytics",
    "title": "GA4 Setup Validation",
    "difficulty": "Beginner",
    "competency": "GA4 Configuration",
    "industry": "EdTech",
    "company": "SkillSprint",
    "role": "Marketing Analyst",
    "background": "A new website has launched and management wants reliable analytics before campaigns begin.",
    "objective": "Ensure accurate tracking.",
    "information": "GA4 installed; no conversions configured.",
    "constraints": "Launch in one week.",
    "question": "What should be done first?",
    "options": [
      "Launch ads immediately",
      "Configure key events and conversions",
      "Change website colors",
      "Increase budget"
    ]
  },
  {
    "id": "ANA-S002",
    "track": "analytics",
    "trackName": "Analytics",
    "title": "Traffic Increased but Leads Didn't",
    "difficulty": "Beginner",
    "competency": "Traffic Analysis",
    "industry": "Healthcare",
    "company": "MedEase",
    "role": "Digital Analyst",
    "background": "Organic traffic has grown by 45% over two months, but lead volume has remained flat.",
    "objective": "Identify the reason.",
    "information": "Sessions ↑45%; Leads unchanged; Bounce rate 70%.",
    "constraints": "Limited development resources.",
    "question": "What should you investigate first?",
    "options": [
      "Increase ad spend",
      "Landing page engagement and conversion funnel",
      "Logo redesign",
      "Social media followers"
    ]
  },
  {
    "id": "ANA-S003",
    "track": "analytics",
    "trackName": "Analytics",
    "title": "Attribution Conflict",
    "difficulty": "Intermediate",
    "competency": "Attribution",
    "industry": "E-commerce",
    "company": "UrbanKart",
    "role": "Performance Analyst",
    "background": "Meta Ads reports 320 purchases while GA4 attributes only 210 purchases to Meta.",
    "objective": "Explain reporting differences.",
    "information": "Different attribution models are being used.",
    "constraints": "Executive meeting tomorrow.",
    "question": "What is the best explanation?",
    "options": [
      "One platform is broken",
      "Different attribution windows and models produce different numbers",
      "GA4 lost all data",
      "Meta inflates every conversion"
    ]
  },
  {
    "id": "ANA-S004",
    "track": "analytics",
    "trackName": "Analytics",
    "title": "Funnel Drop-off",
    "difficulty": "Intermediate",
    "competency": "Funnel Analysis",
    "industry": "Travel",
    "company": "TravelGo",
    "role": "Growth Analyst",
    "background": "A booking funnel shows 10,000 users visiting package pages, 3,200 reaching checkout and only 180 completing payment.",
    "objective": "Increase completed bookings.",
    "information": "Checkout abandonment is very high.",
    "constraints": "No increase in media budget.",
    "question": "Where should optimization efforts begin?",
    "options": [
      "Homepage redesign",
      "Checkout process and payment experience",
      "Increase impressions",
      "Pause campaigns"
    ]
  },
  {
    "id": "ANA-S005",
    "track": "analytics",
    "trackName": "Analytics",
    "title": "Campaign ROI Comparison",
    "difficulty": "Intermediate",
    "competency": "ROI Analysis",
    "industry": "SaaS",
    "company": "TaskFlow",
    "role": "Marketing Analyst",
    "background": "Google Ads generated ₹12 lakh revenue from ₹3 lakh spend. Meta generated ₹9 lakh revenue from ₹2 lakh spend.",
    "objective": "Recommend budget allocation.",
    "information": "Need profitable growth.",
    "constraints": "Budget fixed at ₹6 lakh.",
    "question": "Which recommendation is best?",
    "options": [
      "Split budget equally",
      "Allocate more budget to the higher ROAS channel while continuing controlled tests",
      "Pause Meta",
      "Spend only on Google"
    ]
  },
  {
    "id": "ANA-S006",
    "track": "analytics",
    "trackName": "Analytics",
    "title": "Conversion Tracking Failure",
    "difficulty": "Intermediate",
    "competency": "Measurement",
    "industry": "Real Estate",
    "company": "HomeSpace",
    "role": "Analytics Specialist",
    "background": "Lead conversions suddenly dropped to zero in GA4 after a website update.",
    "objective": "Restore reporting.",
    "information": "Traffic unchanged; Forms still working.",
    "constraints": "Developer available today.",
    "question": "What should be checked first?",
    "options": [
      "Campaign names",
      "Conversion event implementation",
      "Ad headlines",
      "Audience settings"
    ]
  },
  {
    "id": "ANA-S007",
    "track": "analytics",
    "trackName": "Analytics",
    "title": "Dashboard for Executives",
    "difficulty": "Advanced",
    "competency": "Reporting",
    "industry": "Finance",
    "company": "FinNest",
    "role": "BI Analyst",
    "background": "The CEO wants a monthly dashboard focused on business outcomes instead of marketing metrics.",
    "objective": "Build an executive dashboard.",
    "information": "GA4, CRM and ad data available.",
    "constraints": "Monthly review meetings.",
    "question": "Which KPI set should be prioritized?",
    "options": [
      "Likes and followers",
      "Revenue, Leads, CPA, ROAS and Conversion Rate",
      "Impressions only",
      "CTR only"
    ]
  },
  {
    "id": "ANA-S008",
    "track": "analytics",
    "trackName": "Analytics",
    "title": "Audience Behaviour Analysis",
    "difficulty": "Advanced",
    "competency": "Audience Insights",
    "industry": "Retail",
    "company": "StyleHub",
    "role": "Customer Insights Analyst",
    "background": "New visitors bounce at 72%, while returning visitors bounce at 28% and convert 5x more often.",
    "objective": "Improve acquisition quality.",
    "information": "Traffic sources available.",
    "constraints": "Budget unchanged.",
    "question": "What is the best recommendation?",
    "options": [
      "Ignore bounce rate",
      "Improve landing pages and targeting for new visitors",
      "Pause remarketing",
      "Increase prices"
    ]
  },
  {
    "id": "ANA-S009",
    "track": "analytics",
    "trackName": "Analytics",
    "title": "Marketing Mix Evaluation",
    "difficulty": "Advanced",
    "competency": "Channel Performance",
    "industry": "Food Delivery",
    "company": "QuickServe",
    "role": "Growth Analyst",
    "background": "The company invests in SEO, Google Ads, Meta Ads and Email Marketing.",
    "objective": "Recommend next-quarter investment.",
    "information": "Email has highest ROI but smallest volume; Google delivers largest revenue; SEO is growing steadily.",
    "constraints": "Budget increase limited.",
    "question": "What strategy is most appropriate?",
    "options": [
      "Invest equally everywhere",
      "Increase investment in top-performing channels while maintaining diversification",
      "Pause SEO",
      "Remove email"
    ]
  },
  {
    "id": "ANA-S010",
    "track": "analytics",
    "trackName": "Analytics",
    "title": "Executive Performance Review",
    "difficulty": "Expert",
    "competency": "Strategic Analytics",
    "industry": "Manufacturing",
    "company": "BuildPro",
    "role": "Head of Analytics",
    "background": "The board requests a data-driven recommendation for next year's digital marketing strategy.",
    "objective": "Present strategic insights.",
    "information": "12 months of channel, revenue and customer data available.",
    "constraints": "Need actionable recommendations.",
    "question": "What is the strongest approach?",
    "options": [
      "Show only traffic charts",
      "Present business insights, trends, attribution, ROI analysis and strategic recommendations",
      "Export raw GA4 reports",
      "Focus only on conversion rate"
    ]
  },
  {
    "id": "CM-S001",
    "track": "content-marketing",
    "trackName": "Content Marketing",
    "title": "Building a Content Strategy",
    "difficulty": "Beginner",
    "competency": "Content Strategy",
    "industry": "EdTech",
    "company": "SkillSprint",
    "role": "Content Marketing Manager",
    "background": "SkillSprint is launching new AI and Data Science programs. The website has very little content and almost no organic visibility.",
    "objective": "Build awareness and generate qualified leads.",
    "information": "Budget ₹5 lakh; Blog section empty; Social channels active.",
    "constraints": "Small content team.",
    "question": "Which content strategy should be prioritized first?",
    "options": [
      "Only promotional posts",
      "Educational content answering student questions",
      "Memes only",
      "Daily discount posts"
    ]
  },
  {
    "id": "CM-S002",
    "track": "content-marketing",
    "trackName": "Content Marketing",
    "title": "Choosing the Right Content Format",
    "difficulty": "Beginner",
    "competency": "Content Planning",
    "industry": "Healthcare",
    "company": "MedEase",
    "role": "Content Strategist",
    "background": "A hospital wants to educate patients about diabetes prevention.",
    "objective": "Increase awareness and consultations.",
    "information": "Audience prefers mobile content.",
    "constraints": "Limited production budget.",
    "question": "Which format should be created first?",
    "options": [
      "Long PDF only",
      "Short educational videos with supporting articles",
      "Radio ads",
      "Banner ads only"
    ]
  },
  {
    "id": "CM-S003",
    "track": "content-marketing",
    "trackName": "Content Marketing",
    "title": "Editorial Calendar Planning",
    "difficulty": "Beginner",
    "competency": "Content Calendar",
    "industry": "Retail",
    "company": "StyleHub",
    "role": "Content Executive",
    "background": "The marketing team publishes content randomly without a schedule.",
    "objective": "Improve consistency.",
    "information": "Multiple product launches planned.",
    "constraints": "Two writers available.",
    "question": "What should you implement first?",
    "options": [
      "Daily random posts",
      "Monthly editorial calendar aligned with campaigns",
      "Post only when sales drop",
      "Stop publishing"
    ]
  },
  {
    "id": "CM-S004",
    "track": "content-marketing",
    "trackName": "Content Marketing",
    "title": "Low Blog Engagement",
    "difficulty": "Intermediate",
    "competency": "Content Optimization",
    "industry": "Travel",
    "company": "TravelGo",
    "role": "SEO Content Specialist",
    "background": "Blog traffic is increasing but average time on page is only 28 seconds.",
    "objective": "Increase engagement.",
    "information": "Bounce rate 82%; Articles exceed 2,500 words.",
    "constraints": "No redesign budget.",
    "question": "What should you improve first?",
    "options": [
      "Publish fewer blogs",
      "Improve readability, structure and user experience",
      "Increase ad spend",
      "Delete all articles"
    ]
  },
  {
    "id": "CM-S005",
    "track": "content-marketing",
    "trackName": "Content Marketing",
    "title": "Content for Different Funnel Stages",
    "difficulty": "Intermediate",
    "competency": "Marketing Funnel",
    "industry": "Finance",
    "company": "FinNest",
    "role": "Content Manager",
    "background": "The company creates only promotional content and struggles to generate trust.",
    "objective": "Improve conversions.",
    "information": "Awareness traffic is growing.",
    "constraints": "Limited creative resources.",
    "question": "What is the best approach?",
    "options": [
      "Only sales content",
      "Create TOFU, MOFU and BOFU content",
      "Stop blogging",
      "Use only testimonials"
    ]
  },
  {
    "id": "CM-S006",
    "track": "content-marketing",
    "trackName": "Content Marketing",
    "title": "Repurposing High-Performing Content",
    "difficulty": "Intermediate",
    "competency": "Content Repurposing",
    "industry": "SaaS",
    "company": "TaskFlow",
    "role": "Growth Content Lead",
    "background": "One blog generated 50,000 visits organically.",
    "objective": "Maximize its value.",
    "information": "Strong engagement metrics.",
    "constraints": "Small design team.",
    "question": "What should be done next?",
    "options": [
      "Leave it unchanged",
      "Repurpose into videos, infographics, email and social content",
      "Delete after campaign",
      "Rewrite from scratch"
    ]
  },
  {
    "id": "CM-S007",
    "track": "content-marketing",
    "trackName": "Content Marketing",
    "title": "Thought Leadership Strategy",
    "difficulty": "Advanced",
    "competency": "Brand Authority",
    "industry": "Legal",
    "company": "LegalPro",
    "role": "Head of Content",
    "background": "The firm wants to become the most trusted legal resource for SMEs.",
    "objective": "Build authority.",
    "information": "Experienced lawyers available.",
    "constraints": "Competitive market.",
    "question": "Which strategy is strongest?",
    "options": [
      "Publish only company news",
      "Publish expert insights, case studies and educational guides",
      "Focus only on paid ads",
      "Use stock content"
    ]
  },
  {
    "id": "CM-S008",
    "track": "content-marketing",
    "trackName": "Content Marketing",
    "title": "Social Content Performance",
    "difficulty": "Advanced",
    "competency": "Social Media Content",
    "industry": "Food Delivery",
    "company": "QuickServe",
    "role": "Social Content Manager",
    "background": "Short-form videos outperform image posts by 4x in engagement.",
    "objective": "Increase orders.",
    "information": "Video production is affordable.",
    "constraints": "Budget fixed.",
    "question": "What should you recommend?",
    "options": [
      "Continue equal posting",
      "Shift more resources toward high-performing video content while testing new ideas",
      "Stop image posts forever",
      "Ignore analytics"
    ]
  },
  {
    "id": "CM-S009",
    "track": "content-marketing",
    "trackName": "Content Marketing",
    "title": "Measuring Content Success",
    "difficulty": "Advanced",
    "competency": "Content Analytics",
    "industry": "Beauty",
    "company": "GlowSkin",
    "role": "Content Analyst",
    "background": "The CEO measures success only by page views.",
    "objective": "Create meaningful reporting.",
    "information": "GA4 and CRM connected.",
    "constraints": "Monthly executive review.",
    "question": "Which KPI set is most valuable?",
    "options": [
      "Page views only",
      "Leads, engagement, assisted conversions and revenue impact",
      "Followers only",
      "Likes only"
    ]
  },
  {
    "id": "CM-S010",
    "track": "content-marketing",
    "trackName": "Content Marketing",
    "title": "Integrated Content Campaign",
    "difficulty": "Expert",
    "competency": "Campaign Planning",
    "industry": "Real Estate",
    "company": "HomeSpace",
    "role": "Content Marketing Lead",
    "background": "A premium apartment launch requires a three-month content campaign.",
    "objective": "Generate qualified enquiries and build brand trust.",
    "information": "Blog, email, YouTube and social channels available.",
    "constraints": "Highly competitive market.",
    "question": "Which campaign approach is strongest?",
    "options": [
      "Only paid social posts",
      "Coordinate blogs, videos, email, SEO and social content around one campaign theme",
      "Only YouTube videos",
      "Only email newsletters"
    ]
  },
  {
    "id": "MAI-S001",
    "track": "marketing-automation-ai",
    "trackName": "Marketing Automation & AI",
    "title": "Welcome Email Automation",
    "difficulty": "Beginner",
    "competency": "Email Automation",
    "industry": "EdTech",
    "company": "SkillSprint",
    "role": "Marketing Automation Specialist",
    "background": "Every new lead receives the same generic email, resulting in low engagement.",
    "objective": "Increase email open and click rates.",
    "information": "CRM and email platform are connected.",
    "constraints": "Limited content resources.",
    "question": "What should be automated first?",
    "options": [
      "Weekly newsletter only",
      "Welcome email sequence",
      "Monthly sales email",
      "No automation"
    ]
  },
  {
    "id": "MAI-S002",
    "track": "marketing-automation-ai",
    "trackName": "Marketing Automation & AI",
    "title": "Lead Nurturing Workflow",
    "difficulty": "Beginner",
    "competency": "Lead Nurturing",
    "industry": "SaaS",
    "company": "TaskFlow",
    "role": "CRM Executive",
    "background": "Thousands of trial users never become paying customers.",
    "objective": "Increase trial-to-paid conversions.",
    "information": "User behavior data is available.",
    "constraints": "Small sales team.",
    "question": "What is the best solution?",
    "options": [
      "Call every lead",
      "Automated nurturing workflow based on user actions",
      "Send one reminder email",
      "Pause free trials"
    ]
  },
  {
    "id": "MAI-S003",
    "track": "marketing-automation-ai",
    "trackName": "Marketing Automation & AI",
    "title": "WhatsApp Automation",
    "difficulty": "Beginner",
    "competency": "WhatsApp Marketing",
    "industry": "Healthcare",
    "company": "MedEase",
    "role": "Automation Manager",
    "background": "Patients frequently miss appointment reminders.",
    "objective": "Reduce no-show rate.",
    "information": "WhatsApp Business API is available.",
    "constraints": "Must comply with consent requirements.",
    "question": "What should be implemented?",
    "options": [
      "Manual reminders",
      "Automated appointment reminders",
      "Daily promotional messages",
      "SMS only"
    ]
  },
  {
    "id": "MAI-S004",
    "track": "marketing-automation-ai",
    "trackName": "Marketing Automation & AI",
    "title": "Lead Scoring",
    "difficulty": "Intermediate",
    "competency": "Lead Scoring",
    "industry": "Real Estate",
    "company": "HomeSpace",
    "role": "CRM Manager",
    "background": "Sales teams spend time calling low-quality leads.",
    "objective": "Prioritize high-intent prospects.",
    "information": "CRM captures website visits, downloads and enquiries.",
    "constraints": "Sales capacity is limited.",
    "question": "What should be introduced?",
    "options": [
      "Random lead assignment",
      "Lead scoring model",
      "More cold calls",
      "Ignore website activity"
    ]
  },
  {
    "id": "MAI-S005",
    "track": "marketing-automation-ai",
    "trackName": "Marketing Automation & AI",
    "title": "Cart Abandonment Automation",
    "difficulty": "Intermediate",
    "competency": "E-commerce Automation",
    "industry": "Retail",
    "company": "StyleHub",
    "role": "Lifecycle Marketer",
    "background": "Many shoppers abandon carts before checkout.",
    "objective": "Recover lost sales.",
    "information": "Email and SMS integrations available.",
    "constraints": "Limited discount budget.",
    "question": "Best first workflow?",
    "options": [
      "Weekly newsletter",
      "Automated cart abandonment reminders",
      "Mass promotional email",
      "Delete inactive carts"
    ]
  },
  {
    "id": "MAI-S006",
    "track": "marketing-automation-ai",
    "trackName": "Marketing Automation & AI",
    "title": "AI Copy Generation",
    "difficulty": "Intermediate",
    "competency": "AI Content",
    "industry": "Beauty",
    "company": "GlowSkin",
    "role": "Content Manager",
    "background": "The marketing team spends hours writing ad copy for every campaign.",
    "objective": "Increase productivity.",
    "information": "AI writing tools are available.",
    "constraints": "Human review is required.",
    "question": "How should AI be used?",
    "options": [
      "Publish AI output without review",
      "Generate first drafts and review before publishing",
      "Avoid AI completely",
      "Replace the content team"
    ]
  },
  {
    "id": "MAI-S007",
    "track": "marketing-automation-ai",
    "trackName": "Marketing Automation & AI",
    "title": "AI Audience Insights",
    "difficulty": "Intermediate",
    "competency": "AI Analytics",
    "industry": "Finance",
    "company": "FinNest",
    "role": "Growth Analyst",
    "background": "Customer data is growing too quickly for manual analysis.",
    "objective": "Identify high-value segments.",
    "information": "Historical CRM data available.",
    "constraints": "Need weekly insights.",
    "question": "Best approach?",
    "options": [
      "Manual spreadsheets",
      "Use AI to identify audience patterns and validate findings",
      "Ignore older data",
      "Random segmentation"
    ]
  },
  {
    "id": "MAI-S008",
    "track": "marketing-automation-ai",
    "trackName": "Marketing Automation & AI",
    "title": "Marketing Workflow Automation",
    "difficulty": "Advanced",
    "competency": "Workflow Design",
    "industry": "Travel",
    "company": "TravelGo",
    "role": "Marketing Operations Manager",
    "background": "The team manually transfers leads between multiple tools.",
    "objective": "Reduce manual work.",
    "information": "CRM, email and forms support integrations.",
    "constraints": "Need reliable processes.",
    "question": "What should be implemented?",
    "options": [
      "Continue manual exports",
      "Automated workflow integrations",
      "Hire more administrators",
      "Print spreadsheets"
    ]
  },
  {
    "id": "MAI-S009",
    "track": "marketing-automation-ai",
    "trackName": "Marketing Automation & AI",
    "title": "AI Chatbot Strategy",
    "difficulty": "Advanced",
    "competency": "Conversational AI",
    "industry": "Education",
    "company": "FutureLearn",
    "role": "Digital Experience Manager",
    "background": "Support teams receive hundreds of repetitive course enquiries every day.",
    "objective": "Reduce response time.",
    "information": "FAQ database exists.",
    "constraints": "Complex issues still require humans.",
    "question": "Best solution?",
    "options": [
      "Remove support",
      "Deploy an AI chatbot with human escalation",
      "Use only email",
      "Disable live chat"
    ]
  },
  {
    "id": "MAI-S010",
    "track": "marketing-automation-ai",
    "trackName": "Marketing Automation & AI",
    "title": "Re-engagement Campaign",
    "difficulty": "Advanced",
    "competency": "Lifecycle Marketing",
    "industry": "Food Delivery",
    "company": "QuickServe",
    "role": "Retention Specialist",
    "background": "20,000 customers haven't ordered in six months.",
    "objective": "Win back inactive users.",
    "information": "Purchase history available.",
    "constraints": "Budget limited.",
    "question": "Best campaign?",
    "options": [
      "Ignore inactive users",
      "Automated personalized re-engagement sequence",
      "Only social media ads",
      "Acquire new users only"
    ]
  },
  {
    "id": "MAI-S011",
    "track": "marketing-automation-ai",
    "trackName": "Marketing Automation & AI",
    "title": "Prompt Engineering for Marketing",
    "difficulty": "Advanced",
    "competency": "Prompt Engineering",
    "industry": "Agency",
    "company": "CreativeSpark",
    "role": "AI Marketing Consultant",
    "background": "The team gets inconsistent AI-generated campaign ideas.",
    "objective": "Improve AI output quality.",
    "information": "Uses multiple AI tools.",
    "constraints": "Need repeatable process.",
    "question": "Best improvement?",
    "options": [
      "Write shorter prompts only",
      "Create structured prompts with context, goals and constraints",
      "Stop using AI",
      "Generate random prompts"
    ]
  },
  {
    "id": "MAI-S012",
    "track": "marketing-automation-ai",
    "trackName": "Marketing Automation & AI",
    "title": "Automation Performance Audit",
    "difficulty": "Advanced",
    "competency": "Automation Optimization",
    "industry": "Insurance",
    "company": "SecureLife",
    "role": "Marketing Operations Lead",
    "background": "Several automations exist but performance has declined.",
    "objective": "Improve efficiency.",
    "information": "Email opens falling; workflows outdated.",
    "constraints": "No additional budget.",
    "question": "First step?",
    "options": [
      "Create more workflows",
      "Audit existing automations and optimize weak points",
      "Delete all workflows",
      "Increase ad spend"
    ]
  },
  {
    "id": "MAI-S013",
    "track": "marketing-automation-ai",
    "trackName": "Marketing Automation & AI",
    "title": "AI Ethics in Marketing",
    "difficulty": "Advanced",
    "competency": "Responsible AI",
    "industry": "Healthcare",
    "company": "MedEase",
    "role": "Digital Strategy Manager",
    "background": "The team plans to use AI-generated patient content.",
    "objective": "Maintain trust and compliance.",
    "information": "Healthcare regulations apply.",
    "constraints": "Brand reputation is critical.",
    "question": "Best policy?",
    "options": [
      "Publish everything AI creates",
      "Require human review, transparency and compliance checks",
      "Avoid AI forever",
      "Hide AI usage"
    ]
  },
  {
    "id": "MAI-S014",
    "track": "marketing-automation-ai",
    "trackName": "Marketing Automation & AI",
    "title": "Cross-Channel Automation",
    "difficulty": "Expert",
    "competency": "Omnichannel Automation",
    "industry": "Automotive",
    "company": "DriveNow",
    "role": "Marketing Automation Architect",
    "background": "Customers interact through website, email, WhatsApp and paid ads.",
    "objective": "Deliver consistent experiences.",
    "information": "Integrated customer data platform available.",
    "constraints": "Need personalization at scale.",
    "question": "Best strategy?",
    "options": [
      "Separate campaigns by channel only",
      "Create unified cross-channel automation journeys",
      "Email only",
      "Meta Ads only"
    ]
  },
  {
    "id": "MAI-S015",
    "track": "marketing-automation-ai",
    "trackName": "Marketing Automation & AI",
    "title": "Building an AI Marketing Roadmap",
    "difficulty": "Expert",
    "competency": "AI Strategy",
    "industry": "Manufacturing",
    "company": "BuildPro",
    "role": "Head of Marketing Innovation",
    "background": "Leadership wants to integrate AI into marketing over the next three years.",
    "objective": "Create a practical roadmap.",
    "information": "Budget approved; Teams need training.",
    "constraints": "Must balance innovation with governance.",
    "question": "Which roadmap is strongest?",
    "options": [
      "Replace all marketers immediately",
      "Implement AI in phases with training, governance, automation and continuous measurement",
      "Buy every AI tool available",
      "Delay AI adoption indefinitely"
    ]
  }
]


/** All scenario questions belonging to one track, in source order. */
export function questionsForTrack(track: string): ScenarioQuestion[] {
  return decisionLabQuestions.filter((q) => q.track === track)
}

/** The server's grade for one attempt. */
export interface ScenarioGrade {
  correct: number
  total: number
  earnedWeight: number
  maxWeight: number
  /** weighted percent — NOT correct/total, reflects difficulty weighting */
  percent: number
}
