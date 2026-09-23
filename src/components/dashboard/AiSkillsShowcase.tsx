import type { ComponentType } from 'react'
import { Link } from '@tanstack/react-router'
import {
  ArrowRight,
  BarChart3,
  Bot,
  Briefcase,
  Compass,
  Users,
  FileText,
  GraduationCap,
  HeartHandshake,
  Lock,
  Megaphone,
  Search,
  Sparkles,
  Telescope,
  Workflow,
} from 'lucide-react'
import { skillTracks } from '@/lib/skillTracks'
import { CAREER_READINESS, DIGITAL_MARKETING, PERSONAL_DEVELOPMENT_MODULES } from '@/lib/programmes'

type IconType = ComponentType<{ size?: number; className?: string }>

const TRACK_ICON: Record<string, IconType> = {
  'marketing-fundamentals': Compass,
  'market-research': Telescope,
  'meta-ads': Users,
  'google-ads': Megaphone,
  'seo-aeo': Search,
  analytics: BarChart3,
  'content-marketing': FileText,
  'marketing-automation-ai': Workflow,
}

function SkillRow({ icon: Icon, title, body, muted }: { icon: IconType; title: string; body: string; muted?: boolean }) {
  return (
    <li className="flex items-start gap-3">
      <span
        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${
          muted ? 'bg-ink-100 text-ink-500' : 'bg-brand-50 text-brand-700'
        }`}
      >
        <Icon size={16} />
      </span>
      <div className="min-w-0">
        <p className="text-sm font-semibold text-ink-900">{title}</p>
        <p className="text-xs leading-relaxed text-ink-600">{body}</p>
      </div>
    </li>
  )
}

/** One of the two skill pillars. Same shape for both so they read as a pair. */
function SkillPillar({
  eyebrow,
  title,
  intro,
  aiNote,
  status,
  live,
  rows,
  to,
  cta,
  muted,
}: {
  eyebrow: string
  title: string
  intro: string
  aiNote: string
  status: string
  live: boolean
  rows: { icon: IconType; title: string; body: string }[]
  to: string
  cta: string
  muted?: boolean
}) {
  return (
    <section className="card flex flex-col overflow-hidden">
      <div className="relative border-b border-ink-100 bg-gradient-to-br from-brand-50 via-white to-white p-5 sm:p-6">
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-brand-700">{eyebrow}</p>
          <span
            className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-semibold ${
              live ? 'bg-emerald-50 text-emerald-700' : 'bg-ink-100 text-ink-600'
            }`}
          >
            {live ? <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> : <Lock size={10} />}
            {status}
          </span>
        </div>
        <h3 className="mt-1.5 font-display text-xl font-semibold tracking-tight text-ink-900">{title}</h3>
        <p className="mt-1.5 text-sm leading-relaxed text-ink-600">{intro}</p>
        <p className="mt-3 flex items-start gap-2 rounded-xl bg-white/80 p-3 text-xs leading-relaxed text-ink-700 ring-1 ring-ink-900/[0.06]">
          <Bot size={14} className="mt-0.5 shrink-0 text-brand-600" />
          {aiNote}
        </p>
      </div>

      <ul className="flex-1 space-y-4 p-5 sm:p-6">
        {rows.map((r) => (
          <SkillRow key={r.title} {...r} muted={muted} />
        ))}
      </ul>

      <div className="border-t border-ink-100 px-5 py-4 sm:px-6">
        <Link
          to={to}
          className="group inline-flex items-center gap-1.5 text-sm font-semibold text-brand-700 hover:text-brand-800"
        >
          {cta}
          <ArrowRight size={15} className="transition-transform group-hover:translate-x-0.5" />
        </Link>
      </div>
    </section>
  )
}

const SUPPORT: { icon: IconType; title: string; body: string; to: string; tag: string }[] = [
  {
    icon: GraduationCap,
    title: 'Mentors',
    body: 'Real marketers who answer questions and review your work in live chat.',
    to: '/community/mentors',
    tag: 'Live',
  },
  {
    icon: HeartHandshake,
    title: 'Wellness support',
    body: 'Private conversations with counsellors, whenever the pressure builds up.',
    to: '/wellness',
    tag: 'Live',
  },
  {
    icon: Compass,
    title: 'Career guidance',
    body: 'Talk through which track to focus on and what to do next.',
    to: '/wellness',
    tag: 'Live',
  },
  {
    icon: Briefcase,
    title: 'Internships',
    body: 'Real briefs with partner companies — the last step to completing a programme.',
    to: '/community',
    tag: 'Opening soon',
  },
]

/**
 * The two kinds of skill MySkills builds — professional (Digital Marketing,
 * live) and personal (Career Readiness, opening soon) — followed by the
 * people and support around them. Copy stays honest about what runs today:
 * Digital Marketing practice is live, the AI practice partner belongs to the
 * personal-development programme that hasn't opened yet.
 */
export function AiSkillsShowcase() {
  const professional = skillTracks.map((t) => ({
    icon: TRACK_ICON[t.slug] ?? Sparkles,
    title: t.name,
    body: t.description,
  }))
  const personal = PERSONAL_DEVELOPMENT_MODULES.map((m) => ({ icon: m.icon, title: m.title, body: m.ai }))

  return (
    <section className="space-y-5">
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-brand-700">Skills in the age of AI</p>
        <h2 className="mt-1 font-display text-2xl font-semibold tracking-tight text-ink-900">
          Everything you need to get hired
        </h2>
        <p className="mt-1 max-w-2xl text-sm leading-relaxed text-ink-600">
          Employers look for two things: what you can do, and how you work. MySkills builds both — with AI
          alongside you, and people to check your work.
        </p>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <SkillPillar
          eyebrow="Professional skills"
          title={DIGITAL_MARKETING.name}
          intro="The eight skills digital marketing employers hire for — practised on real business scenarios, not multiple-choice trivia."
          aiNote="Includes Marketing Automation & AI and answer-engine SEO, so you learn the tools marketers use now."
          status="Live"
          live
          rows={professional}
          to={DIGITAL_MARKETING.path}
          cta="Practise a skill"
        />
        <SkillPillar
          eyebrow="Personal skills"
          title={CAREER_READINESS.name}
          intro="The skills that decide whether you get the job and grow in it — goals, communication, leadership, agile working and a growth mindset."
          aiNote="AI is your practice partner: rehearse, get instant feedback, then a mentor reviews your growth."
          status="Opens soon"
          live={false}
          rows={personal}
          to={CAREER_READINESS.path}
          cta="See the programme"
          muted
        />
      </div>

      <div>
        <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-500">
          And people around you
        </p>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {SUPPORT.map((s) => (
            <Link key={s.title} to={s.to} className="card lift group flex flex-col p-5">
              <div className="flex items-start justify-between gap-2">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-brand-700">
                  <s.icon size={18} />
                </span>
                <span className="rounded-full bg-ink-100 px-2 py-0.5 text-[11px] font-medium text-ink-600">{s.tag}</span>
              </div>
              <p className="mt-3 font-display text-base font-semibold text-ink-900">{s.title}</p>
              <p className="mt-1 flex-1 text-xs leading-relaxed text-ink-600">{s.body}</p>
              <span className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-brand-700">
                Open
                <ArrowRight size={13} className="transition-transform group-hover:translate-x-0.5" />
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}
