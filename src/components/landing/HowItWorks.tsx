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
 * steps, rebuilt as a card grid to match Pillars/SkillTracks above it rather
 * than the dashboard's connected-list style, which reads more like an
 * in-app checklist than a first-time explainer. Badges are static (no
 * per-user progress pre-signup); every CTA goes to /signup rather than
 * deep-linking into practice/mentors — those routes require an account, and
 * requireOnboarded has no return-to path, so a deep link would strand a
 * signed-out visitor on a bare login screen instead of taking them anywhere
 * useful.
 */
const steps: StepDef[] = [
  {
    icon: ClipboardCheck,
    title: 'Take your initial assessment',
    description:
      'A one-time, 8-track benchmark. It tells you — and the app — exactly where you’re strong and where to focus first.',
    cta: 'Start assessment',
    badge: { label: 'Start here', tone: 'brand' },
  },
  {
    icon: Dumbbell,
    title: 'Practice with real scenarios',
    description:
      'Work through Decision Labs for each track, scored like the real job. Your dashboard shows exactly how you’re improving.',
    cta: 'Practice a track',
    badge: { label: '8 tracks', tone: 'neutral' },
  },
  {
    icon: GraduationCap,
    title: 'Get 1:1 mentor feedback',
    description:
      'Stuck on something? Ask a real, working marketer in live chat — free, one-on-one, no scheduling needed.',
    cta: 'Meet the mentors',
    badge: { label: 'Mentors live', tone: 'success' },
  },
  {
    icon: Briefcase,
    title: 'Land a real internship',
    description:
      'Once your skills are proven, apply for an internship with a partner company and work real briefs — experience for your resume, not just a certificate.',
    cta: 'See what’s coming',
    badge: { label: 'Coming soon', tone: 'neutral', icon: Lock },
  },
]

export function HowItWorks() {
  return (
    <section id="how-it-works" className="border-t border-ink-100 pt-6 pb-16 sm:pt-8 sm:pb-20">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl">
          <h2 className="font-display text-2xl font-semibold tracking-tight text-ink-900 sm:text-3xl">
            Your path to mastery
          </h2>
          <p className="mt-3 text-base text-ink-500">
            Four steps from &ldquo;I think I know this&rdquo; to &ldquo;I can prove it.&rdquo;
          </p>
        </div>

        <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map((step, i) => (
            <div
              key={step.title}
              className="flex flex-col rounded-xl border border-ink-100 bg-white p-5 transition-colors hover:border-brand-200"
            >
              <div className="flex items-start justify-between gap-3">
                <span
                  className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${ICON_TONE[step.badge.tone]}`}
                >
                  <step.icon size={19} />
                </span>
                <Badge tone={step.badge.tone} icon={step.badge.icon}>
                  {step.badge.label}
                </Badge>
              </div>

              <p className="mt-3.5 text-xs font-semibold uppercase tracking-wide text-brand-600">
                Step {i + 1}
              </p>
              <h3 className="mt-1 text-base font-semibold text-ink-900">{step.title}</h3>
              <p className="mt-1.5 flex-1 text-sm leading-relaxed text-ink-500">
                {step.description}
              </p>

              <Link
                to="/signup"
                className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-brand-700 hover:text-brand-800"
              >
                {step.cta}
                <ArrowRight size={14} />
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
