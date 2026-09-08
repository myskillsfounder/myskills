import type { ComponentType } from 'react'
import { Briefcase, Building2, ClipboardCheck, GraduationCap, Layers } from 'lucide-react'
import { Badge } from '@/components/ui'

type IconType = ComponentType<{ size?: number; className?: string }>

interface Pillar {
  icon: IconType
  title: string
  description: string
  live: boolean
}

const pillars: Pillar[] = [
  {
    icon: ClipboardCheck,
    title: 'Practice Assessments',
    description:
      'Scenario-based Decision Labs across 8 skill tracks — SEO, Google Ads, Meta Ads, Analytics and more — scored against real industry difficulty, not textbook trivia.',
    live: true,
  },
  {
    icon: Layers,
    title: 'Skill Development',
    description:
      'A dedicated Vocabulary Builder and 441 AI-ready prompts for real marketing work, alongside every practice track — the repetition that actually makes it stick.',
    live: true,
  },
  {
    icon: GraduationCap,
    title: 'Expert Mentor Support',
    description:
      '1:1 chat sessions with real, working marketers — ask questions, get feedback on your work, and unblock your next step, free.',
    live: true,
  },
  {
    icon: Building2,
    title: 'Institutional Support',
    description:
      "INTERVAL, our exclusive offline partner, runs in-person cohorts for colleges and training institutes, built on the same MySkills tracks.",
    live: true,
  },
  {
    icon: Briefcase,
    title: 'Internships for Freshers',
    description:
      'Real internship briefs from partner companies, so your practice turns into work experience you can actually show.',
    live: false,
  },
]

/**
 * "Why MySkills" pillars, surfaced on the homepage — Mentor Support and
 * Institutional Support previously only existed on /community, and Skill
 * Development's actual tools (Vocabulary Builder, prompt library) weren't
 * shown anywhere pre-signup. Internships mirrors the exact "Coming soon"
 * treatment already used on /community — it's real in the roadmap, not
 * built yet, and saying otherwise here would contradict what a visitor
 * sees the moment they click through.
 */
export function Pillars() {
  return (
    <section className="border-t border-ink-100 pt-6 pb-16 sm:pt-8 sm:pb-20">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl">
          <h2 className="font-display text-2xl font-semibold tracking-tight text-ink-900 sm:text-3xl">
            Everything you need to actually get good
          </h2>
          <p className="mt-3 text-base text-ink-500">
            Practice, mentorship and offline training, all built around the
            same skill tracks — so progress in one shows up in the others.
          </p>
        </div>

        <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {pillars.map((pillar) => (
            <div
              key={pillar.title}
              className="rounded-xl border border-ink-100 bg-white p-5 transition-colors hover:border-brand-200"
            >
              <div className="flex items-start justify-between gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
                  <pillar.icon size={19} />
                </span>
                {!pillar.live && <Badge tone="neutral">Coming soon</Badge>}
              </div>
              <h3 className="mt-3.5 text-base font-semibold text-ink-900">
                {pillar.title}
              </h3>
              <p className="mt-1.5 text-sm leading-relaxed text-ink-500">
                {pillar.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
