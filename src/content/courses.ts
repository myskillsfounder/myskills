import { BarChart3, Globe2, Megaphone, Rocket, type LucideIcon } from 'lucide-react'

/**
 * The courses on the standard website (routes/courses.tsx), in one place.
 * Digital Marketing and Global Leadership are built into the app; the others
 * run on the course engine, and their words here are taken from their
 * programme files in docs/programmes/ (keep them in step when those change).
 */
export interface Course {
  id: 'digital-marketing' | 'global-leadership' | 'entrepreneurship' | 'data-analytics'
  title: string
  tagline: string
  /** Which half of the Global Readiness Score it builds. */
  kind: 'personal' | 'professional'
  /** Open now, or taking names until it opens. */
  status: 'open' | 'soon'
  /** Its own page on the website. */
  page?: '/digital-marketing' | '/career-readiness' | '/entrepreneurship' | '/data-analytics'
  /** The aptitude test that starts it (open to visitors). */
  test?: string
  facts: string[]
  skills: string[]
  earn: string[]
  icon: LucideIcon
  tile: string
}

export const COURSES: Course[] = [
  {
    id: 'digital-marketing',
    title: 'Digital Marketing',
    tagline: 'SEO, Google and Meta ads, content and analytics, practised on real business scenarios with an AI coach.',
    kind: 'professional',
    status: 'open',
    page: '/digital-marketing',
    test: '/aptitude-assessment',
    facts: ['8 skill tracks', 'Beginner to advanced', 'Free to start'],
    skills: ['SEO', 'Google Ads', 'Meta Ads', 'Analytics'],
    earn: ['Foundation certificate', 'Mentor-graded project', 'Professional points'],
    icon: Megaphone,
    tile: 'from-brand-400 to-brand-700',
  },
  {
    id: 'global-leadership',
    title: 'Global Leadership',
    tagline: 'Self-awareness, communication, decisions and leading people: the 14 skills employers hire for.',
    kind: 'personal',
    status: 'open',
    page: '/career-readiness',
    test: '/career-readiness-assessment',
    facts: ['14 modules', 'Every student', 'Free to start'],
    skills: ['Communication', 'Decision-making', 'Leadership', 'Coping with stress'],
    earn: ['Mentor-graded project', 'Personal points'],
    icon: Globe2,
    tile: 'from-amber-400 to-orange-500',
  },
  {
    id: 'entrepreneurship',
    title: 'AI-Powered Entrepreneurship',
    tagline: 'Take your own idea from a guess to its first paying customers, with AI at every step and Indian examples.',
    kind: 'professional',
    status: 'open',
    page: '/entrepreneurship',
    test: '/programmes/ai-powered-entrepreneurship/aptitude',
    facts: ['7 modules', 'About 16 hours', 'Beginner'],
    skills: ['Idea validation', 'Selling', 'Low-budget marketing', 'Startup money'],
    earn: ['Foundation certificate', 'Mentor-graded project', 'Professional points'],
    icon: Rocket,
    tile: 'from-rose-400 to-pink-600',
  },
  {
    id: 'data-analytics',
    title: 'AI-Powered Data Analytics',
    tagline: 'Turn raw business data into decisions with spreadsheets, SQL, Python, dashboards and AI assistants, on free tools and real practice data.',
    kind: 'professional',
    status: 'open',
    page: '/data-analytics',
    test: '/programmes/data-analytics/aptitude',
    facts: ['10 modules', 'About 34 hours', 'Beginner'],
    skills: ['Spreadsheets', 'SQL', 'Python', 'Dashboards'],
    earn: ['Foundation certificate', 'Portfolio project', 'Professional points'],
    icon: BarChart3,
    tile: 'from-emerald-400 to-teal-600',
  },
]

/** What a course-engine programme's own page shows (components/landing/
 *  EngineCoursePage.tsx), taken from its programme file. */
export interface EngineCourseContent {
  summary: string
  audience: string
  outcomes: string[]
  modules: { title: string; minutes: number }[]
  project: string
  /** How long the project takes, for the facts box. */
  projectTime: string
}

/** AI-Powered Entrepreneurship's own page (routes/entrepreneurship.tsx),
 *  from docs/programmes/Entrepreneurship/ai-powered-entrepreneurship.json. */
export const ENTREPRENEURSHIP: EngineCourseContent = {
  projectTime: 'About 2 weeks',
  summary:
    'Take your own business idea from a guess to its first paying customers, with free AI tools at every step and Indian examples from campus ventures to D2C (direct-to-consumer) brands.',
  audience: 'Students and recent graduates in India starting their first venture. No business experience needed.',
  outcomes: [
    'Test a business idea through real customer conversations and judge how strong the evidence is',
    'Build a no-code first version of a product and test it with five users against a goal set in advance',
    'Win first customers by selling in messages, collecting payment by UPI, and growing through marketing, your network and referrals',
    'Price an offer and plan unit economics, cash flow and first funding in rupees',
    'Plan a founding team: one owner for each area and, if you have co-founders, a written equity split with vesting',
    'Use free AI tools to research, draft and practise, and check everything they produce',
  ],
  modules: [
    { title: 'Evaluate an idea with evidence', minutes: 60 },
    { title: 'Build and test a scrappy MVP', minutes: 60 },
    { title: 'Sell to your first customers', minutes: 60 },
    { title: 'Market on a tiny budget', minutes: 60 },
    { title: 'Network and grow through people', minutes: 60 },
    { title: 'Price and manage money', minutes: 70 },
    { title: 'Build your team', minutes: 60 },
  ],
  project:
    'Over about two weeks, with your mentor’s guidance, take one real idea from a guess to evidence: talk to at least 5 real people in your customer group, win at least one commitment, and write a one-page plan your mentor grades.',
}

/** AI-Powered Data Analytics' own page (routes/data-analytics.tsx), from
 *  docs/programmes/Data analytics/ai-powered-data-analytics.json (published
 *  27 Oct 2026). Keep the two in step when the programme changes. */
export const DATA_ANALYTICS: EngineCourseContent = {
  summary:
    'Turn raw business data into decisions with spreadsheets, SQL, Python, dashboards and AI assistants, and learn to check what the AI produces. Every module uses free tools and one practice dataset from Masala Mart, a fictional Indian spice brand.',
  audience: 'Students and graduates in India who want an entry-level data analyst role, or to use data well in any job. No coding experience needed.',
  outcomes: [
    'Turn a vague business question into an analysis plan with a clear decision',
    'Clean, combine and summarise data in spreadsheets, SQL and Python (pandas)',
    'Tell a real change from noise using spread, samples and simple A/B tests',
    'Build a dashboard that tracks what matters and flags problems early',
    'Use AI assistants to work faster, and check everything they produce',
    'Present a recommendation a manager can act on, backed by a portfolio project',
  ],
  modules: [
    { title: 'Thinking like an analyst', minutes: 60 },
    { title: 'Spreadsheets that answer questions', minutes: 90 },
    { title: 'Cleaning messy data', minutes: 90 },
    { title: 'SQL foundations: asking a database questions', minutes: 90 },
    { title: 'SQL for real questions: joins and windows', minutes: 90 },
    { title: 'Statistics that change decisions', minutes: 75 },
    { title: 'Python and pandas for analysis', minutes: 90 },
    { title: 'Dashboards people use', minutes: 90 },
    { title: 'AI as your analysis partner', minutes: 75 },
    { title: 'From numbers to decisions', minutes: 60 },
  ],
  project:
    'Over 3 to 4 weeks, with your mentor, analyse 12 months of data for a real or realistic Indian business and recommend one change that would grow revenue or cut costs: a cleaned dataset, the analysis, a dashboard, an AI log and a one-page memo your mentor grades.',
  projectTime: 'About 3–4 weeks',
}
