import { Link } from '@tanstack/react-router'
import { ArrowRight, CheckCircle2, Clock, Compass, Megaphone } from 'lucide-react'

type Option = {
  key: string
  to: '/aptitude-assessment' | '/career-readiness-assessment'
  programme: string
  title: string
  blurb: string
  unlocks: string[]
  icon: typeof Megaphone
  /** Gradient of the icon tile, matching the course tiles on the LaunchPad. */
  tile: string
  button: string
  hover: string
}

const OPTIONS: Option[] = [
  {
    key: 'marketing',
    to: '/aptitude-assessment',
    programme: 'Digital Marketing Programme',
    title: 'Marketing aptitude',
    blurb: 'How marketing already shows up in your life — the ads you notice, the offers you act on, the trends you spot.',
    unlocks: [
      'Eight skill tracks with real-scenario practice',
      'Vocabulary Builder and a free certificate',
      'Live sessions with a mentor',
    ],
    icon: Megaphone,
    tile: 'from-brand-400 to-brand-700 shadow-[0_8px_18px_-8px_rgba(111,99,226,0.75)]',
    button: 'bg-brand-600 hover:bg-brand-700',
    hover: 'hover:border-brand-300',
  },
  {
    key: 'personal',
    to: '/career-readiness-assessment',
    programme: 'Career Readiness Programme',
    title: 'Personal aptitude',
    blurb: 'Your starting point in goal setting, communication, leadership, agile ways of working and growth mindset.',
    unlocks: [
      'Five modules practised with an AI coach',
      'Mentor feedback on your written work',
      'Live sessions with a mentor',
    ],
    icon: Compass,
    tile: 'from-emerald-400 to-teal-600 shadow-[0_8px_18px_-8px_rgba(16,185,129,0.75)]',
    button: 'bg-emerald-600 hover:bg-emerald-700',
    hover: 'hover:border-emerald-300',
  },
]

/**
 * What a student with no aptitude assessment sees on Practice: two equal
 * starting points, one per programme, instead of a single marketing card.
 * Either assessment opens Practice; the other stays available any time.
 */
export function StartChoice() {
  return (
    <section aria-labelledby="start-choice">
      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-ink-500">Step 1 · Start here</p>
      <h2 id="start-choice" className="mt-1.5 font-display text-3xl font-semibold leading-tight tracking-tight text-ink-900 sm:text-4xl">
        Where would you like to start?
      </h2>
      <p className="mt-2 max-w-2xl text-[15px] leading-relaxed text-ink-600">
        Pick an aptitude assessment. Each one has 20 statements, takes about five minutes and has no right answers —
        it just shows you where to begin. You can take the other one any time.
      </p>

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        {OPTIONS.map((o) => (
          <article
            key={o.key}
            className={`card flex flex-col p-5 transition-colors sm:p-6 ${o.hover}`}
          >
            <div className="flex items-center gap-3.5">
              <span
                className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br text-white ring-1 ring-white/40 ${o.tile}`}
              >
                <o.icon size={22} />
              </span>
              <div className="min-w-0">
                <p className="text-xs font-semibold uppercase tracking-wide text-ink-500">{o.programme}</p>
                <h3 className="font-display text-xl font-semibold leading-tight text-ink-900">{o.title}</h3>
              </div>
            </div>

            <p className="mt-4 text-sm leading-relaxed text-ink-600">{o.blurb}</p>

            <p className="mt-5 text-[11px] font-semibold uppercase tracking-wide text-ink-500">Opens</p>
            <ul className="mt-2 space-y-2">
              {o.unlocks.map((u) => (
                <li key={u} className="flex items-start gap-2.5 text-sm text-ink-700">
                  <CheckCircle2 size={16} className="mt-0.5 shrink-0 text-ink-400" />
                  {u}
                </li>
              ))}
            </ul>

            <div className="mt-6 flex flex-1 flex-col justify-end gap-3">
              <p className="inline-flex items-center gap-1.5 text-xs font-medium text-ink-500">
                <Clock size={13} /> 20 statements · about 5 minutes
              </p>
              <Link
                to={o.to}
                className={`press inline-flex h-12 items-center justify-center gap-2 rounded-full px-6 text-[15px] font-semibold text-white shadow-e1 transition-colors ${o.button}`}
              >
                Take the {o.title.toLowerCase()}
                <ArrowRight size={17} />
              </Link>
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}
