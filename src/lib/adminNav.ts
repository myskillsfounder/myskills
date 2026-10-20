/**
 * The admin panel's menu, in one place: the sidebar draws it, and the
 * Dashboard's board of areas is built from the same list, so the two never
 * disagree. Each page names its team section, and the Inbox items it deals
 * with.
 */
import {
  Activity,
  Award,
  BadgeCheck,
  BarChart3,
  Bot,
  BookOpen,
  Briefcase,
  Building2,
  CalendarCheck,
  ClipboardCheck,
  ClipboardList,
  Dumbbell,
  FileCheck,
  FileText,
  History,
  GraduationCap,
  HeartHandshake,
  Inbox,
  KeyRound,
  MessageSquare,
  Megaphone,
  ShieldCheck,
  Sparkles,
  Target,
  UserCheck,
  UserCog,
  Users,
} from 'lucide-react'
import type { ReviewProgramme } from './mentorReview'
import type { StaffSection } from './staffAccess'
import type { InboxKind } from './adminInbox'

export type NavItem = {
  to: string
  /** For a page that serves several items (mentor reviews, one per programme). */
  search?: { programme?: ReviewProgramme }
  label: string
  icon: typeof BarChart3
  exact?: boolean
  /** 'any' = every staff member (the Inbox lists only what their sections allow);
   *  null = full admins only. */
  section: StaffSection | null | 'any'
  /** The Inbox items this page deals with, so the Dashboard can say what waits where. */
  inbox?: InboxKind[]
}

// Grouped the way the work is: running the panel first (the day's work, then
// who can get in), then the students and their programmes, then each kind of
// partner with everything to do with it, then the site. A section is something
// an admin grants one person at a time; `null` means full admins only (see
// src/lib/staffAccess.ts).
export const ADMIN_GROUPS: { label: string; items: NavItem[] }[] = [
  {
    label: 'Home',
    items: [
      // Everyone starts on the Dashboard; its numbers need the 'overview' section.
      { to: '/admin', label: 'Dashboard', icon: BarChart3, exact: true, section: 'any' },
      { to: '/admin/inbox', label: 'Inbox', icon: Inbox, section: 'any' },
      // Beside the Inbox: a partner can do nothing until they are verified.
      { to: '/admin/partner-verification', label: 'Partners to verify', icon: BadgeCheck, section: 'portal-access', inbox: ['portal-request'] },
    ],
  },
  // Who can get in: the internal team, and partners in the Community portal.
  {
    label: 'Team & access',
    items: [
      { to: '/admin/team', label: 'Team & roles', icon: UserCog, section: null },
      { to: '/admin/community-portal', label: 'Portal access & usage', icon: KeyRound, section: 'portal-access' },
      { to: '/admin/activity', label: 'Activity log', icon: History, section: null },
      { to: '/admin/ai-agents', label: 'AI agents', icon: Bot, section: null },
    ],
  },
  // A student and everything they have done: one section ('users') opens the
  // results pages as well, so they sit here rather than under Programmes.
  {
    label: 'Students',
    items: [
      { to: '/admin/users', label: 'All students', icon: Users, section: 'users' },
      { to: '/admin/verification', label: 'Verification', icon: ShieldCheck, section: 'verification', inbox: ['verification'] },
      { to: '/admin/aptitude', label: 'Aptitude results', icon: Sparkles, section: 'users' },
      { to: '/admin/practice', label: 'Practice (Marketing)', icon: Dumbbell, section: 'users' },
      { to: '/admin/foundation', label: 'Foundation results', icon: ClipboardCheck, section: 'users' },
    ],
  },
  // What the team grades and writes for both programmes, and the people
  // asking to join Global Leadership.
  {
    label: 'Programmes',
    items: [
      { to: '/admin/mentor-reviews', label: 'Projects to grade', icon: FileCheck, section: 'mentor-reviews', inbox: ['project'] },
      { to: '/admin/modules', label: 'Modules & answers', icon: BookOpen, section: 'mentor-reviews' },
      { to: '/admin/live-sessions', label: 'Live sessions', icon: CalendarCheck, section: 'mentor-reviews' },
      { to: '/admin/certificates', label: 'Certificates', icon: Award, section: 'certificates' },
      { to: '/admin/assessment-questions', label: 'Foundation questions', icon: ClipboardList, section: 'assessment' },
      { to: '/admin/question-health', label: 'Question health', icon: Activity, section: 'assessment' },
      { to: '/admin/cr-leads', label: 'Global Leadership leads', icon: Users, section: 'leads', inbox: ['cr-lead'] },
    ],
  },
  // Internships end to end, under one section: every company however it came,
  // then their roles, applications and sign-offs.
  {
    label: 'Internships',
    items: [
      { to: '/admin/internship-partners', label: 'Companies', icon: Building2, section: 'partner-leads', inbox: ['internship-lead'] },
      { to: '/admin/internships', label: 'Roles & applications', icon: Briefcase, section: 'partner-leads', inbox: ['internship-role', 'internship-signoff'] },
    ],
  },
  {
    label: 'Mentors',
    items: [
      { to: '/admin/mentors', label: 'Mentors', icon: UserCheck, section: 'mentors', inbox: ['mentor-application', 'unlinked-mentor'] },
    ],
  },
  // The institutions themselves, then the students they have interested.
  {
    label: 'Institutions',
    items: [
      { to: '/admin/institution-partners', label: 'Institutions', icon: GraduationCap, section: 'institution-partners', inbox: ['institution-application'] },
      { to: '/admin/institution-leads', label: 'Institution leads', icon: Target, section: 'demo-requests', inbox: ['institution-lead', 'lead-follow-up'] },
    ],
  },
  {
    label: 'Wellness',
    items: [
      { to: '/admin/wellness', label: 'Wellness & career guidance', icon: HeartHandshake, section: 'wellness', inbox: ['support-request'] },
    ],
  },
  {
    label: 'Site',
    items: [
      { to: '/admin/blog', label: 'Blog', icon: FileText, section: 'blog' },
      { to: '/admin/ads', label: 'Ads', icon: Megaphone, section: 'ads' },
      { to: '/admin/feedback', label: 'Feedback', icon: MessageSquare, section: 'feedback', inbox: ['feedback'] },
    ],
  },
]

export function visibleGroups(isAdmin: boolean, sections: StaffSection[]) {
  return ADMIN_GROUPS.map((g) => ({
    ...g,
    items: g.items.filter((t) =>
      t.section === 'any' ? true : t.section === null ? isAdmin : isAdmin || sections.includes(t.section),
    ),
  })).filter((g) => g.items.length > 0)
}
