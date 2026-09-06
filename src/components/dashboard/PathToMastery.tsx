import type { ComponentType } from 'react'
import { Link } from '@tanstack/react-router'
import { ArrowRight, Briefcase, ClipboardCheck, Dumbbell, GraduationCap, Lock } from 'lucide-react'
import { Badge } from '@/components/ui'

type IconType = ComponentType<{ size?: number; className?: string }>
type Tone = 'success' | 'brand' | 'neutral'

const ICON_TONE: Record<Tone, string> = {
  success: 'bg-emerald-100 text-emerald-700',
  brand: 'bg-brand-50 text-brand-700',
  neutral: 'bg-ink-100 text-ink-400',
}

interface StepDef {
  icon: IconType
  title: string
  description: string
  to: string
  cta: string
  badge: { label: string; tone: Tone; icon?: IconType }
}

/**
 * A short, sequential guide to how the app is meant to be used, shown above
 * Recommended prompts. Without this, a new user has to discover the
 * assessment -> practice -> mentors -> internships path themselves by
 * clicking around. Steps 3 and 4 lean on features that aren't fully live yet
 * (institutions, internships), so they're labelled honestly rather than
 * promising something the app can't deliver today.
 */
export function PathToMastery({
  assessmentDone,
  practicedCount,
  totalTracks,
}: {
  assessmentDone: boolean
  practicedCount: number
  totalTracks: number
}) {
  const steps: StepDef[] = [
    {
      icon: ClipboardCheck,
      title: 'Complete your initial assessment',
      description:
        'A one-time benchmark across all 8 skill tracks, so you know exactly where to start and what to work on first.',
      to: '/practice',
      cta: assessmentDone ? 'Review your results' : 'Start assessment',
      badge: assessmentDone ? { label: 'Done', tone: 'success' } : { label: 'Start here', tone: 'brand' },
    },
    {
      icon: Dumbbell,
      title: 'Practice to track your progress',
      description:
        'Scenario-based Decision Labs, scored like the real thing — come back often and watch your scores climb.',
      to: '/practice',
      cta: 'Practice a track',
      badge: {
        label: `${practicedCount}/${totalTracks} tracks`,
        tone: practicedCount > 0 ? 'success' : 'neutral',
      },
    },
    {
      icon: GraduationCap,
      title: 'Get feedback from mentors',
      description:
        'Real marketers review your work and answer questions in live chat. Institutions and cohort learning are coming soon.',
      to: '/community/mentors',
      cta: 'Meet the mentors',
      badge: { label: 'Mentors live', tone: 'success' },
    },
    {
      icon: Briefcase,
      title: 'Find an internship',
      description:
        'Real briefs from partner companies, so what you practice here becomes real work experience on your resume.',
      to: '/community',
      cta: 'See what’s coming',
      badge: { label: 'Coming soon', tone: 'neutral', icon: Lock },
    },
  ]

  return (
    <section className="card overflow-hidden p-0">
      <div className="border-b border-ink-100 px-5 py-4 sm:px-6">
        <h2 className="font-display text-lg font-semibold text-ink-900">Your path to mastery</h2>
        <p className="mt-0.5 text-sm text-ink-600">
          Four steps from &ldquo;I think I know this&rdquo; to &ldquo;I can prove it.&rdquo;
        </p>
      </div>

      <ol className="divide-y divide-ink-100">
        {steps.map((step, i) => (
          <li key={step.title} className="flex gap-4 px-5 py-4 sm:px-6">
            <div className="flex flex-col items-center">
              <span
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl ${ICON_TONE[step.badge.tone]}`}
              >
                <step.icon size={18} />
              </span>
              {i < steps.length - 1 && <span className="mt-1 w-px flex-1 bg-ink-100" />}
            </div>

            <div className="min-w-0 flex-1 pb-1">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-sm font-semibold text-ink-900">{step.title}</h3>
                <Badge tone={step.badge.tone} icon={step.badge.icon}>
                  {step.badge.label}
                </Badge>
              </div>
              <p className="mt-1 text-sm leading-relaxed text-ink-600">{step.description}</p>
              <Link
                to={step.to}
                className="mt-2 inline-flex items-center gap-1 text-sm font-semibold text-brand-700 hover:text-brand-800"
              >
                {step.cta}
                <ArrowRight size={14} />
              </Link>
            </div>
          </li>
        ))}
      </ol>
    </section>
  )
}
