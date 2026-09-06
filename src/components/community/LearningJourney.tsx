import type { ComponentType } from 'react'
import { Link } from '@tanstack/react-router'
import {
  ArrowRight,
  BookOpen,
  Briefcase,
  Building2,
  GraduationCap,
  Sparkles,
  Users,
} from 'lucide-react'

type IconType = ComponentType<{ size?: number; className?: string }>

interface Stage {
  n: number
  icon: IconType
  title: string
  description: string
  status: 'always' | 'live' | 'soon'
  to?: string
  ctaLabel?: string
}

/**
 * The MySkills learning model: self-learning first, with AI, mentors, peers,
 * and institutions layered in as a learner's goals grow — not a ladder
 * everyone has to climb from a classroom.
 *
 * Stages 3 (Mentorship) and 5 (Offline learning) are today's live product;
 * 1 and 2 point at features that already exist elsewhere in the app
 * (practice, prompt library); 4 and 6 are named honestly as not built yet.
 */
const STAGES: Stage[] = [
  {
    n: 1,
    icon: BookOpen,
    title: 'Self-learning',
    description: 'Explore on your own — videos, articles, and hands-on practice at your pace.',
    status: 'always',
    to: '/practice',
    ctaLabel: 'Go practice',
  },
  {
    n: 2,
    icon: Sparkles,
    title: 'AI-powered guidance',
    description: 'Use AI and MySkills tools to understand concepts and find what to learn next.',
    status: 'always',
    to: '/prompt-library',
    ctaLabel: 'Prompt library',
  },
  {
    n: 3,
    icon: GraduationCap,
    title: 'Mentorship',
    description: 'Connect with mentors who give direction, feedback, and accountability.',
    status: 'live',
    to: '/community/mentors',
    ctaLabel: 'Meet the mentors',
  },
  {
    n: 4,
    icon: Users,
    title: 'Peer learning',
    description: 'Learn alongside people chasing the same goals — share ideas, compare notes.',
    status: 'soon',
  },
  {
    n: 5,
    icon: Building2,
    title: 'Offline learning',
    description: 'When digital isn’t enough, offline sessions turn knowledge into real practice.',
    status: 'live',
    to: '/community/institutions',
    ctaLabel: 'Book a demo',
  },
  {
    n: 6,
    icon: Briefcase,
    title: 'Real-world application',
    description: 'Build projects, solve real briefs, and show what you can actually do.',
    status: 'soon',
  },
]

function StageCard({ stage }: { stage: Stage }) {
  const Icon = stage.icon
  const live = stage.status !== 'soon'

  const body = (
    <>
      <div className="flex items-start justify-between gap-3">
        <span
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl text-white shadow-e1 ${
            live
              ? 'bg-gradient-to-br from-brand-500 to-brand-700'
              : 'bg-gradient-to-br from-ink-400 to-ink-600 opacity-70 grayscale'
          }`}
        >
          <Icon size={20} />
        </span>
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-ink-100 text-xs font-semibold text-ink-500">
          {stage.n}
        </span>
      </div>

      <h3 className="mt-3.5 font-display text-base font-semibold text-ink-900">{stage.title}</h3>
      <p className="mt-1 flex-1 text-[13px] leading-relaxed text-ink-600">{stage.description}</p>

      {stage.status === 'live' && stage.to && (
        <span className="mt-3 inline-flex items-center gap-1.5 text-[13px] font-semibold text-brand-700">
          {stage.ctaLabel}
          <ArrowRight size={13} className="transition-transform duration-300 group-hover:translate-x-0.5" />
        </span>
      )}
      {stage.status === 'always' && stage.to && (
        <span className="mt-3 inline-flex items-center gap-1.5 text-[13px] font-medium text-ink-500">
          {stage.ctaLabel}
          <ArrowRight size={13} className="transition-transform duration-300 group-hover:translate-x-0.5" />
        </span>
      )}
      {stage.status === 'soon' && (
        <p className="mt-3 text-[13px] font-medium text-ink-400">Coming soon</p>
      )}
    </>
  )

  const className =
    'group relative flex h-full flex-col rounded-2xl border border-ink-900/[0.08] bg-white p-4 shadow-e1 transition-all duration-300'

  if (stage.to) {
    return (
      <Link to={stage.to} className={`${className} hover:-translate-y-0.5 hover:shadow-e2`}>
        {body}
      </Link>
    )
  }
  return <div className={className}>{body}</div>
}

export function LearningJourney() {
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {STAGES.map((stage) => (
        <StageCard key={stage.n} stage={stage} />
      ))}
    </div>
  )
}
