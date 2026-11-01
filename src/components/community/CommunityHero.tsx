import { Link } from '@tanstack/react-router'
import { ArrowLeft, type LucideIcon } from 'lucide-react'

/*
 * The top of each Community page (Paul, 27 Oct 2026: "each individual page
 * keeps its own vibe"): Mentors for one-to-one sessions and expert guidance,
 * Internships for a first hands-on corporate experience, Institutions for
 * offline and peer learning, Wellness for the student's wellbeing first,
 * Focus Rooms for studying alongside others online (1 Nov 2026).
 * One layout, five looks.
 */

export type HeroTone = 'mentors' | 'internships' | 'institutions' | 'wellness' | 'focus'

const TONE: Record<
  HeroTone,
  { box: string; eyebrow: string; title: string; accent: string; body: string; chip: string; chipIcon: string; glow: string; art: string }
> = {
  // Deep violet: focused, personal, expert.
  mentors: {
    box: 'theme-light bg-gradient-to-br from-[#2a1d6e] via-[#3b2a9a] to-[#5b3fd6] text-white',
    eyebrow: 'text-violet-200',
    title: 'text-white',
    accent: 'bg-gradient-to-r from-violet-200 to-fuchsia-200 bg-clip-text text-transparent',
    body: 'text-white/80',
    chip: 'border-white/20 bg-white/10 text-white backdrop-blur',
    chipIcon: 'bg-white/15 text-violet-100',
    glow: 'bg-fuchsia-400/30',
    art: 'text-white/10',
  },
  // Emerald and slate: professional, corporate, the first real job-like step.
  internships: {
    box: 'theme-light bg-gradient-to-br from-[#0b2a2a] via-[#0f3d3a] to-[#0f766e] text-white',
    eyebrow: 'text-emerald-200',
    title: 'text-white',
    accent: 'bg-gradient-to-r from-emerald-200 to-teal-100 bg-clip-text text-transparent',
    body: 'text-white/80',
    chip: 'border-white/15 bg-white/10 text-white backdrop-blur',
    chipIcon: 'bg-emerald-400/20 text-emerald-100',
    glow: 'bg-emerald-400/25',
    art: 'text-white/[0.08]',
  },
  // Bright sky: daylight, classrooms, people learning together.
  institutions: {
    box: 'theme-light bg-gradient-to-br from-sky-500 via-sky-600 to-blue-700 text-white',
    eyebrow: 'text-sky-100',
    title: 'text-white',
    accent: 'text-amber-200',
    body: 'text-white/85',
    chip: 'border-white/25 bg-white/15 text-white backdrop-blur',
    chipIcon: 'bg-white/20 text-white',
    glow: 'bg-amber-200/30',
    art: 'text-white/15',
  },
  // Soft and light: calm, warm, unhurried. No dark drama on a wellbeing page.
  wellness: {
    box: 'bg-gradient-to-br from-rose-50 via-pink-50 to-amber-50 text-ink-900 ring-1 ring-rose-100',
    eyebrow: 'text-rose-500',
    title: 'text-ink-900',
    accent: 'text-rose-500',
    body: 'text-ink-600',
    chip: 'border-rose-100 bg-white/80 text-ink-700',
    chipIcon: 'bg-rose-100 text-rose-500',
    glow: 'bg-rose-200/50',
    art: 'text-rose-200/60',
  },
  // Midnight with a desk lamp's amber: late-evening study, side by side.
  focus: {
    box: 'theme-light bg-gradient-to-br from-[#0f172a] via-[#1e1b4b] to-[#92400e] text-white',
    eyebrow: 'text-amber-200',
    title: 'text-white',
    accent: 'bg-gradient-to-r from-amber-200 to-orange-200 bg-clip-text text-transparent',
    body: 'text-white/80',
    chip: 'border-white/15 bg-white/10 text-white backdrop-blur',
    chipIcon: 'bg-amber-400/20 text-amber-100',
    glow: 'bg-amber-400/25',
    art: 'text-white/[0.08]',
  },
}

export function CommunityHero({
  tone,
  icon: Icon,
  eyebrow,
  title,
  accent,
  body,
  points,
  back = { to: '/community', label: 'Community' },
}: {
  tone: HeroTone
  icon: LucideIcon
  eyebrow: string
  title: string
  accent: string
  body: string
  points: { icon: LucideIcon; label: string }[]
  back?: { to: '/community' | '/dashboard'; label: string }
}) {
  const t = TONE[tone]
  return (
    <div>
      <Link to={back.to} className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-ink-600 hover:text-ink-900">
        <ArrowLeft size={16} /> {back.label}
      </Link>
      <section className={`relative overflow-hidden rounded-3xl p-6 shadow-e2 sm:p-9 ${t.box}`}>
        <span aria-hidden className={`absolute -right-16 -top-20 h-72 w-72 rounded-full blur-3xl ${t.glow}`} />
        <Icon aria-hidden size={220} strokeWidth={1} className={`absolute -bottom-10 right-4 hidden sm:block ${t.art}`} />
        <div className="relative max-w-2xl">
          <p className={`text-[11px] font-semibold uppercase tracking-[0.22em] ${t.eyebrow}`}>{eyebrow}</p>
          <h1 className={`mt-3 font-display text-3xl font-bold leading-[1.1] tracking-tight sm:text-4xl ${t.title}`}>
            {title} <span className={`block ${t.accent}`}>{accent}</span>
          </h1>
          <p className={`mt-4 text-[15px] leading-relaxed sm:text-base ${t.body}`}>{body}</p>
          <ul className="mt-6 flex flex-wrap gap-2">
            {points.map((p) => (
              <li key={p.label} className={`inline-flex items-center gap-2 rounded-full border py-1.5 pl-1.5 pr-3.5 text-[13px] font-medium ${t.chip}`}>
                <span className={`flex h-6 w-6 items-center justify-center rounded-full ${t.chipIcon}`}>
                  <p.icon size={13} />
                </span>
                {p.label}
              </li>
            ))}
          </ul>
        </div>
      </section>
    </div>
  )
}

/** "How it works" in each page's colour. */
export function HowItWorks({ tone, steps }: { tone: HeroTone; steps: { title: string; body: string }[] }) {
  const dot = {
    mentors: 'bg-violet-600 text-white',
    internships: 'bg-teal-700 text-white',
    institutions: 'bg-sky-600 text-white',
    wellness: 'bg-rose-100 text-rose-600',
    focus: 'bg-amber-600 text-white',
  }[tone]
  return (
    <section className="card p-5 sm:p-6">
      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-500">How it works</p>
      <ol className={`mt-4 grid gap-4 ${steps.length >= 4 ? 'sm:grid-cols-2 lg:grid-cols-4' : 'sm:grid-cols-3'}`}>
        {steps.map((s, i) => (
          <li key={s.title} className="flex gap-3">
            <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full font-display text-sm font-semibold ${dot}`}>{i + 1}</span>
            <span>
              <span className="block font-semibold text-ink-900">{s.title}</span>
              <span className="mt-0.5 block text-sm leading-relaxed text-ink-600">{s.body}</span>
            </span>
          </li>
        ))}
      </ol>
    </section>
  )
}
