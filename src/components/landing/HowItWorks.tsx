import type { ComponentType } from 'react'
import { Link } from '@tanstack/react-router'
import { ArrowRight, Briefcase, ClipboardCheck, Dumbbell, GraduationCap, Lock } from 'lucide-react'
import { Eyebrow } from './Eyebrow'
import { GridBackdrop } from './GridBackdrop'

type IconType = ComponentType<{ size?: number; className?: string }>
type Tone = 'success' | 'brand' | 'neutral'

const TAG_TONE: Record<Tone, string> = {
  success: 'bg-emerald-400/15 text-emerald-300',
  brand: 'bg-brand-400/20 text-brand-100',
  neutral: 'bg-white/10 text-white/60',
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
    title: 'Take the Digital Marketing Initial Assessment',
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
    <section id="how-it-works" className="surface-wood-dark relative overflow-hidden border-t border-white/[0.06]">
      <GridBackdrop mask="ellipse 60% 50% at 90% 100%" />
      <div className="relative mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
        <div className="max-w-2xl">
          <Eyebrow dark>How it works</Eyebrow>
          <h2 className="mt-2 font-display text-2xl font-semibold tracking-tight text-white sm:text-3xl">
            Your path to mastery
          </h2>
          <p className="mt-3 text-base text-white/70">
            Four steps, each one proof — not just practice.
          </p>
        </div>

        <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map((step, i) => (
            <div key={step.title} className="card-glass-dark flex flex-col p-5">
              <div className="flex items-start justify-between gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-brand-500 to-brand-700 text-white shadow-e1">
                  <step.icon size={19} />
                </span>
                <span
                  className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-semibold ${TAG_TONE[step.badge.tone]}`}
                >
                  {step.badge.icon && <step.badge.icon size={10} />}
                  {step.badge.label}
                </span>
              </div>

              <p className="mt-3.5 font-mono text-[11px] font-bold uppercase tracking-wide text-brand-200">
                Step_{String(i + 1).padStart(2, '0')}
              </p>
              <h3 className="mt-1 text-base font-semibold text-white">{step.title}</h3>
              <p className="mt-1.5 flex-1 text-sm leading-relaxed text-white/70">
                {step.description}
              </p>

              <Link
                to="/signup"
                className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-brand-200 hover:text-white"
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
