/**
 * Initial assessment question bank (source: content/source-assessment-bank/
 * MySkills_45Plus5_Assessment_Bank.xlsx). 35 MCQs across 7 categories.
 * Regenerate from the xlsx if the source changes.
 */
export interface AssessmentQuestion {
  id: string
  category: string
  question: string
  options: string[]
  /** index (0-3) of the correct option */
  correct: number
  explanation: string
}

export const initialAssessmentQuestions: AssessmentQuestion[] = [
  {
    id: 'MF001',
    category: 'Marketing Fundamentals',
    question: 'What is the primary purpose of marketing?',
    options: ['Selling products', 'Generating profit', 'Creating customer value and demand', 'Advertising products'],
    correct: 2,
    explanation: 'Marketing exists to create and communicate customer value.',
  },
  {
    id: 'MF002',
    category: 'Marketing Fundamentals',
    question: 'Which stage comes first in the marketing funnel?',
    options: ['Consideration', 'Awareness', 'Conversion', 'Retention'],
    correct: 1,
    explanation: 'Awareness is the first stage.',
  },
  {
    id: 'MF003',
    category: 'Marketing Fundamentals',
    question: 'STP stands for?',
    options: ['Sales Targeting Positioning', 'Segmentation Targeting Positioning', 'Segmentation Tracking Promotion', 'Strategy Targeting Pricing'],
    correct: 1,
    explanation: 'Core marketing framework.',
  },
  {
    id: 'MF004',
    category: 'Marketing Fundamentals',
    question: 'A buyer persona is?',
    options: ['Customer database', 'Ideal customer profile', 'Competitor profile', 'Sales report'],
    correct: 1,
    explanation: 'Represents ideal customer.',
  },
  {
    id: 'MF005',
    category: 'Marketing Fundamentals',
    question: 'Which metric measures loyalty?',
    options: ['CTR', 'CPC', 'Retention Rate', 'CPM'],
    correct: 2,
    explanation: 'Retention indicates loyalty.',
  },
  {
    id: 'MR001',
    category: 'Market Research',
    question: 'Keyword research helps identify?',
    options: ['Competitors', 'Search demand', 'Pricing', 'Revenue'],
    correct: 1,
    explanation: 'Identifies search demand.',
  },
  {
    id: 'MR002',
    category: 'Market Research',
    question: 'Primary research includes?',
    options: ['Industry reports', 'Customer surveys', 'Blogs', 'Competitor websites'],
    correct: 1,
    explanation: 'Collected directly from users.',
  },
  {
    id: 'MR003',
    category: 'Market Research',
    question: 'Keyword Planner is used for?',
    options: ['Analytics', 'Keyword Research', 'Design', 'Automation'],
    correct: 1,
    explanation: 'Keyword research tool.',
  },
  {
    id: 'MR004',
    category: 'Market Research',
    question: 'Competitor analysis helps understand?',
    options: ['Market Positioning', 'Weather', 'Taxes', 'Coding'],
    correct: 0,
    explanation: 'Competitive positioning.',
  },
  {
    id: 'MR005',
    category: 'Market Research',
    question: 'Search volume refers to?',
    options: ['Pages', 'Keyword searches', 'Websites', 'Ads'],
    correct: 1,
    explanation: 'Search frequency.',
  },
  {
    id: 'META001',
    category: 'Meta Ads',
    question: 'Best Meta objective for lead generation?',
    options: ['Awareness', 'Traffic', 'Leads', 'Engagement'],
    correct: 2,
    explanation: 'Optimized for lead generation.',
  },
  {
    id: 'META002',
    category: 'Meta Ads',
    question: 'CTR stands for?',
    options: ['Cost to Reach', 'Click Through Rate', 'Campaign Tracking Rate', 'Conversion Tracking Ratio'],
    correct: 1,
    explanation: 'Clicks divided by impressions.',
  },
  {
    id: 'META003',
    category: 'Meta Ads',
    question: 'Lookalike audiences are based on?',
    options: ['Random users', 'Customer data', 'Competitors', 'Employees'],
    correct: 1,
    explanation: 'Built from source audience.',
  },
  {
    id: 'META004',
    category: 'Meta Ads',
    question: 'Retargeting focuses on?',
    options: ['New users', 'Engaged users', 'Competitors', 'Employees'],
    correct: 1,
    explanation: 'Warm audiences.',
  },
  {
    id: 'META005',
    category: 'Meta Ads',
    question: 'What impacts CPM?',
    options: ['Competition', 'Weather', 'Logo', 'Office'],
    correct: 0,
    explanation: 'Auction competition impacts CPM.',
  },
  {
    id: 'GADS001',
    category: 'Google Ads',
    question: 'Which campaign captures active intent?',
    options: ['Display', 'Search', 'Video', 'Discovery'],
    correct: 1,
    explanation: 'Search targets active demand.',
  },
  {
    id: 'GADS002',
    category: 'Google Ads',
    question: 'Quality Score depends on?',
    options: ['CTR', 'Landing Page', 'Ad Relevance', 'All of the above'],
    correct: 3,
    explanation: 'All contribute to QS.',
  },
  {
    id: 'GADS003',
    category: 'Google Ads',
    question: 'Negative keywords help?',
    options: ['Increase spend', 'Prevent irrelevant clicks', 'Increase impressions', 'Reduce conversions'],
    correct: 1,
    explanation: 'Filters bad traffic.',
  },
  {
    id: 'GADS004',
    category: 'Google Ads',
    question: 'CPC stands for?',
    options: ['Cost Per Click', 'Cost Per Campaign', 'Campaign Cost', 'Conversion Per Click'],
    correct: 0,
    explanation: 'Advertising metric.',
  },
  {
    id: 'GADS005',
    category: 'Google Ads',
    question: 'Exact Match means?',
    options: ['Broad relevance', 'Close variations', 'All searches', 'Competitor terms'],
    correct: 1,
    explanation: 'Most targeted match type.',
  },
  {
    id: 'SEO001',
    category: 'SEO',
    question: 'Which tag defines page title?',
    options: ['H1', 'Title Tag', 'Alt Tag', 'Meta Keyword'],
    correct: 1,
    explanation: 'Title tag shown in SERPs.',
  },
  {
    id: 'SEO002',
    category: 'SEO',
    question: 'Backlinks are?',
    options: ['Internal links', 'External links to your site', 'Broken links', 'Ads'],
    correct: 1,
    explanation: 'Important ranking factor.',
  },
  {
    id: 'SEO003',
    category: 'SEO',
    question: 'What affects SEO ranking?',
    options: ['Content Quality', 'Office Location', 'Salary', 'Company Name'],
    correct: 0,
    explanation: 'Content quality is critical.',
  },
  {
    id: 'SEO004',
    category: 'SEO',
    question: 'What is Local SEO?',
    options: ['Local rankings', 'Hosting', 'Server setup', 'App development'],
    correct: 0,
    explanation: 'Optimizes local visibility.',
  },
  {
    id: 'SEO005',
    category: 'SEO',
    question: 'AEO stands for?',
    options: ['Answer Engine Optimization', 'Audience Engagement Optimization', 'Advertising Engine Optimization', 'Automated Experience Optimization'],
    correct: 0,
    explanation: 'Optimizing for answer engines.',
  },
  {
    id: 'ANA001',
    category: 'Analytics',
    question: 'GA4 stands for?',
    options: ['Google Analytics 4', 'Growth Analytics 4', 'Google Ad Framework', 'Global Analytics'],
    correct: 0,
    explanation: 'Google Analytics platform.',
  },
  {
    id: 'ANA002',
    category: 'Analytics',
    question: 'Bounce rate measures?',
    options: ['User exits', 'Leaving without interaction', 'Revenue', 'Impressions'],
    correct: 1,
    explanation: 'Limited engagement.',
  },
  {
    id: 'ANA003',
    category: 'Analytics',
    question: 'A conversion is?',
    options: ['Page view', 'Desired action', 'Impression', 'Click'],
    correct: 1,
    explanation: 'Business goal completion.',
  },
  {
    id: 'ANA004',
    category: 'Analytics',
    question: 'Attribution helps identify?',
    options: ['Design', 'Channel contribution', 'Team performance', 'Customer age'],
    correct: 1,
    explanation: 'Tracks conversion sources.',
  },
  {
    id: 'ANA005',
    category: 'Analytics',
    question: 'Which metric indicates efficiency?',
    options: ['CPA', 'Impressions', 'Reach', 'Followers'],
    correct: 0,
    explanation: 'Measures acquisition cost.',
  },
  {
    id: 'SC001',
    category: 'Scenario Based',
    question: 'Budget ₹50k. Goal: Leads. Best platform?',
    options: ['Meta Lead Campaign', 'Awareness', 'Display', 'Organic Only'],
    correct: 0,
    explanation: 'Lead campaigns optimize for leads.',
  },
  {
    id: 'SC002',
    category: 'Scenario Based',
    question: 'CTR 5%, Conversion Rate 0.2%. Optimize?',
    options: ['Landing Page', 'Audience', 'Budget', 'Frequency'],
    correct: 0,
    explanation: 'Traffic is good; page converts poorly.',
  },
  {
    id: 'SC003',
    category: 'Scenario Based',
    question: 'Keyword difficulty 90 on new site. Action?',
    options: ['Target immediately', 'Ignore SEO', 'Find lower competition keywords', 'Run display ads'],
    correct: 2,
    explanation: 'Target achievable keywords first.',
  },
  {
    id: 'SC004',
    category: 'Scenario Based',
    question: 'High impressions, low clicks. Issue?',
    options: ['Creative', 'Tracking', 'Budget', 'Landing Page'],
    correct: 0,
    explanation: 'Poor ad attractiveness.',
  },
  {
    id: 'SC005',
    category: 'Scenario Based',
    question: 'CPA up 40%. First step?',
    options: ['Pause everything', 'Analyze funnel', 'Increase budget', 'Change logo'],
    correct: 1,
    explanation: 'Diagnose before acting.',
  },
]

export interface CategoryScore {
  category: string
  correct: number
  total: number
}

export interface AssessmentGrade {
  correct: number
  total: number
  percent: number
  byCategory: CategoryScore[]
}

/** Grade an answer sheet (selected option index per question, null if skipped). */
export function gradeAssessment(answers: (number | null)[]): AssessmentGrade {
  const byCat = new Map<string, CategoryScore>()
  let correct = 0
  initialAssessmentQuestions.forEach((q, i) => {
    const cat = byCat.get(q.category) ?? { category: q.category, correct: 0, total: 0 }
    cat.total += 1
    if (answers[i] === q.correct) {
      cat.correct += 1
      correct += 1
    }
    byCat.set(q.category, cat)
  })
  const total = initialAssessmentQuestions.length
  return {
    correct,
    total,
    percent: total ? Math.round((correct / total) * 100) : 0,
    byCategory: [...byCat.values()],
  }
}

/** Ordered list of unique categories in the bank. */
export const assessmentCategories: string[] = initialAssessmentQuestions.reduce<string[]>(
  (acc, q) => (acc.includes(q.category) ? acc : [...acc, q.category]),
  [],
)

/** All questions belonging to one category. */
export function questionsForCategory(category: string): AssessmentQuestion[] {
  return initialAssessmentQuestions.filter((q) => q.category === category)
}

/** Grade an arbitrary subset of questions (used for both the full initial
 * assessment and single-category retakes). */
export function gradeQuestions(
  questions: AssessmentQuestion[],
  answers: (number | null)[],
): AssessmentGrade {
  const byCat = new Map<string, CategoryScore>()
  let correct = 0
  questions.forEach((q, i) => {
    const cat = byCat.get(q.category) ?? { category: q.category, correct: 0, total: 0 }
    cat.total += 1
    if (answers[i] === q.correct) {
      cat.correct += 1
      correct += 1
    }
    byCat.set(q.category, cat)
  })
  const total = questions.length
  return {
    correct,
    total,
    percent: total ? Math.round((correct / total) * 100) : 0,
    byCategory: [...byCat.values()],
  }
}
