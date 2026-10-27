import { Bot, Crown, Rocket, TrendingUp, Award, BookOpen, Building2, CalendarCheck, Compass, FileText, Globe2, GraduationCap, MessageSquare, Plane, Trophy, Users, Briefcase, Target } from 'lucide-react'
import type { GlimpseProps } from '@/components/landing/Glimpse'

/*
 * The words for the three glimpse pages (components/landing/Glimpse.tsx).
 * Only true claims: what each part does today. The look inside shows
 * examples, blurred, and says so; the one card shown clearly is real (Paul,
 * a mentor). MySkills offers internships, never jobs.
 */

export const MENTORS_GLIMPSE: GlimpseProps = {
  id: 'mentors',
  icon: Users,
  // Top industry leaders, by industry (Paul, 27 Oct 2026).
  kicker: 'Mentors · top industry leaders',
  title: 'Learn from top',
  accent: 'industry leaders.',
  body: 'AI can explain almost anything. A leader who has done it knows what matters: live sessions with people at the top of their field, answers when you are stuck, and a real project they grade.',
  // The industries as cards where the photo was (Paul, 27 Oct 2026).
  heroCards: [
    // Each card shows the published mentors whose expertise or headline fits it.
    { icon: Rocket, title: 'Entrepreneurship', body: 'From an idea to first paying customers.', tone: 'pink', match: /entrepreneur|start-?up|founder|business/i },
    { icon: Bot, title: 'AI product development', body: 'Build products with AI at the core.', tone: 'violet', match: /\bai\b|artificial intelligence|machine learning|\bml\b|product/i },
    { icon: TrendingUp, title: 'Growth hacking', body: 'Grow fast on a startup budget.', tone: 'blue', match: /growth|marketing|seo|\bads\b/i },
    { icon: Crown, title: 'Leadership', body: 'Lead people, teams and decisions.', tone: 'amber', match: /leader|management|manager|coach|communicat|behaviou?r|\bhr\b/i },
  ],
  photo: 'paul-mentorship',
  photoAlt: 'Paul Thomas, a MySkills mentor, at his desk',
  features: [
    { icon: MessageSquare, title: '1:1 sessions', body: 'Book time with an industry leader when you are stuck or want feedback on your work.' },
    { icon: Users, title: 'Live sessions', body: 'Group sessions with leaders in entrepreneurship, AI product development, growth hacking and leadership.' },
    { icon: Award, title: 'Your project, graded', body: 'Every course ends with a real project a mentor grades, not a multiple-choice quiz.' },
    { icon: Compass, title: 'Guidance beyond the course', body: 'Advice on what to learn next, your portfolio and your first internship.' },
  ],
  steps: [
    { title: 'Start a course', body: 'Take the free aptitude test and begin the course that fits you.' },
    { title: 'Meet your mentors', body: 'Join live sessions and book 1:1 time when you need it.' },
    { title: 'Get your project graded', body: 'Your mentor grades your project, and it counts towards your Global Readiness Score.' },
  ],
  peek: {
    title: 'The industry leaders',
    note: 'Examples. Sign in to see every mentor.',
    items: [
      { title: 'Paul Thomas', sub: 'Founder, MySkills · Mentor', photo: 'paul-mentor', open: true },
      { title: 'Entrepreneurship', sub: 'Founders who built and scaled', photo: 'face-2' },
      { title: 'AI product development', sub: 'Building products with AI', photo: 'face-3' },
      { title: 'Growth hacking', sub: 'Growth on a startup budget', photo: 'face-1' },
      { title: 'Leadership', sub: 'Leading people and teams', photo: 'face-4' },
      { title: 'Digital marketing', sub: 'Ads, content and analytics' },
    ],
  },
  next: '/community?category=mentors',
}

export const STUDY_ABROAD_GLIMPSE: GlimpseProps = {
  id: 'study-abroad',
  icon: Plane,
  kicker: 'Study abroad · with a guide at every step',
  title: 'Study abroad,',
  accent: 'without the guesswork.',
  body: 'Partner universities abroad, help with your applications and the tests you need to get in, all in the same place you learn, so you can prepare for a world being reshaped by AI.',
  photo: 'card-study-abroad',
  photoAlt: 'A university building abroad, with a plane overhead',
  features: [
    { icon: GraduationCap, title: 'Partner universities', body: 'Programmes our team has opened, with the details you need to compare them.' },
    { icon: FileText, title: 'Application help', body: 'Apply from the platform and follow every step until you have an answer.' },
    { icon: BookOpen, title: 'Test prep', body: 'Get ready for the tests your university asks for.' },
    { icon: Globe2, title: 'Counselling', body: 'Talk your options through with someone who knows the process.' },
  ],
  steps: [
    { title: 'Explore programmes', body: 'Browse by country and see what each programme offers.' },
    { title: 'Apply in the platform', body: 'Send your application and track it from your account.' },
    { title: 'Our team guides you', body: 'We follow up with you and the university until you have an answer.' },
  ],
  peek: {
    title: 'Programmes',
    note: 'Examples. Sign in to see what is open now.',
    items: [
      { title: "Master's programme", sub: 'Business and management', photo: 'card-study-abroad' },
      { title: "Bachelor's programme", sub: 'Computer science' },
      { title: 'Foundation year', sub: 'A route into your degree' },
      { title: "Master's programme", sub: 'Data and analytics' },
      { title: 'Short course', sub: 'Summer school' },
      { title: 'Test prep', sub: 'Before you apply' },
    ],
  },
  // Trending now (Paul, 27 Oct 2026): nursing in Albania, where MySkills is a
  // top partner of the university. Facts from docs/supabase-study-abroad-v2.sql;
  // fees, dates and entry rules stay on the programme's own page.
  trending: {
    title: 'Study Nursing in Albania',
    where: 'Our Lady of Good Counsel University (UNIZKM), Tirana',
    partner: 'MySkills · Top partner',
    body: 'A Bachelor’s in Nursing with clinical training in hospitals, taught in Italian, and a joint degree from the University of Rome Tor Vergata: a way to work as a nurse in Italy and the EU after the usual registration steps. MySkills guides you from application to arrival.',
    points: ['Taught in Italian', 'Joint degree with Tor Vergata (Rome)', 'Recognised in Albania and Italy', 'Clinical training in hospitals'],
    country: 'al',
    art: 'nurse',
    next: '/study-abroad/nursing-albania',
  },
  // The page opens on what's trending, with no hero (Paul, 27 Oct 2026).
  trendingFirst: true,
  next: '/study-abroad',
}

export const INTERNSHIPS_GLIMPSE: GlimpseProps = {
  id: 'internships',
  icon: Briefcase,
  kicker: 'Internships · real work experience',
  title: 'Your first internship,',
  accent: 'hands-on and real.',
  body: 'In the AI era, employers look for what you have actually done. Partner companies post internships our team reviews, you apply with your Global Readiness Score, and the company signs off the work you do.',
  photo: 'card-career',
  photoAlt: 'A student meeting a company for an internship',
  features: [
    { icon: Building2, title: 'Partner companies', body: 'Internships from companies our team has reviewed and approved.' },
    { icon: Target, title: 'Apply with your score', body: 'Companies see your Global Readiness Score, not just your marks.' },
    { icon: CalendarCheck, title: 'Real work', body: 'Hands-on projects with a real team, not a simulation.' },
    { icon: Trophy, title: 'It counts', body: 'Your first signed-off internship adds 20 points to your Global Readiness Score.' },
  ],
  steps: [
    { title: 'Build your score', body: 'Take a course, finish your project and grow your Global Readiness Score.' },
    { title: 'Apply', body: 'Apply to the internships that fit you; the company sees your score.' },
    { title: 'Do the work', body: 'Accept an offer, do the internship, and the company signs it off.' },
  ],
  peek: {
    title: 'Open internships',
    note: 'Examples. Sign in to see what is open now.',
    items: [
      { title: 'Marketing intern', sub: 'Remote · 8 weeks', photo: 'card-career' },
      { title: 'Content intern', sub: 'Hybrid · 6 weeks' },
      { title: 'Social media intern', sub: 'Remote · 8 weeks' },
      { title: 'Business development intern', sub: 'On site · 12 weeks' },
      { title: 'Data intern', sub: 'Remote · 8 weeks' },
      { title: 'Operations intern', sub: 'Hybrid · 10 weeks' },
    ],
  },
  next: '/community?category=internships',
}
