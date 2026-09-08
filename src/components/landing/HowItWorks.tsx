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
  cta: string
  badge: { label: string; tone: Tone; icon?: IconType }
}

/**
 * Public counterpart to components/dashboard/PathToMastery.tsx — same four
 * steps and visual language, so the story a signed-out visitor reads here
 * matches what they'll actually see once they're in. Badges are static
 * (no per-user progress to show pre-signup) and every CTA goes to /signup:
 * every one of these pages (practice, mentors) requires an account, and
 * requireOnboarded has no return-to path, so a deep link would just strand
 * a signed-out visitor on a bare login screen instead of taking them
 * anywhere useful.
 */
const steps: StepDef[] = [
  {
    icon: ClipboardCheck,
    title: 'Complete your initial assessment',
    description:
      'A one-time benchmark across all 8 skill tracks, so you know exactly where to start and what to work on first.',
    cta: 'Start assessment',
    badge: { label: 'Start here', tone: 'brand' },
  },
  {
    icon: Dumbbell,
    title: 'Practice to track your progress',
    description:
      'Scenario-based Decision Labs, scored like the real thing — come back often and watch your scores climb.',
    cta: 'Practice a track',
    badge: { label: '8 tracks', tone: 'neutral' },
  },
  {
    icon: GraduationCap,
    title: 'Get feedback from mentors',
    description:
      'Real marketers review your work and answer questions in live chat, 1:1 — free.',
    cta: 'Meet the mentors',
    badge: { label: 'Mentors live', tone: 'success' },
  },
  {
    icon: Briefcase,
    title: 'Find an internship',
    description:
      'Real briefs from partner companies, so what you practice here becomes real work experience on your resume.',
    cta: 'See what’s coming',
    badge: { label: 'Coming soon', tone: 'neutral', icon: Lock },
  },
]

export function HowItWorks() {
  return (
    <section id="how-it-works" className="py-16 sm:py-20">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl">
          <h2 className="font-display text-2xl font-semibold tracking-tight text-ink-900 sm:text-3xl">
            Your path to mastery
          </h2>
          <p className="mt-3 text-base text-ink-500">
            Four steps from &ldquo;I think I know this&rdquo; to &ldquo;I can prove it.&rdquo;
          </p>
        </div>

        <div className="card mt-10 overflow-hidden p-0">
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
                    to="/signup"
                    className="mt-2 inline-flex items-center gap-1 text-sm font-semibold text-brand-700 hover:text-brand-800"
                  >
                    {step.cta}
                    <ArrowRight size={14} />
                  </Link>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  )
}
