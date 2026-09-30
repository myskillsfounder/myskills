import { Link } from '@tanstack/react-router'
import { ArrowRight, CheckCircle2, Clock, Compass, Megaphone } from 'lucide-react'

type Option = {
  key: 'marketing' | 'personal'
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
 * The two starting points, one per programme: what a student with no aptitude
 * assessment sees on Practice, and the last step of onboarding. Either
 * assessment opens Practice; the other stays available any time.
 *
 * Practice uses it as-is (each card is a link to its assessment). Onboarding
 * passes `onChoose` — so picking a card can finish onboarding first — plus a
 * `recommended` card suggested from the student's goals, and hides the big
 * heading because the onboarding step already has one.
 */
export function StartChoice({
  onChoose,
  recommended = null,
  showHeading = true,
  disabled = false,
  tone = 'light',
}: {
  onChoose?: (option: 'marketing' | 'personal', to: Option['to']) => void
  recommended?: 'marketing' | 'personal' | null
  showHeading?: boolean
  disabled?: boolean
  /** 'dark' for the dark onboarding surface: glass cards, light text. */
  tone?: 'light' | 'dark'
}) {
  const dark = tone === 'dark'
  return (
    <section aria-labelledby={showHeading ? 'start-choice' : undefined}>
      {showHeading && (
        <>
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-ink-500">Step 1 · Start here</p>
          <h2 id="start-choice" className="mt-1.5 font-display text-3xl font-semibold leading-tight tracking-tight text-ink-900 sm:text-4xl">
            Where would you like to start?
          </h2>
          <p className="mt-2 max-w-2xl text-[15px] leading-relaxed text-ink-600">
            Pick an aptitude assessment. Each one has 20 statements, takes about five minutes and has no right answers —
            it just shows you where to begin. You can take the other one any time.
          </p>
        </>
      )}

      <div className={`${showHeading ? 'mt-6' : ''} grid gap-4 md:grid-cols-2`}>
        {OPTIONS.map((o) => (
          <article
            key={o.key}
            className={`flex flex-col p-5 transition-colors sm:p-6 ${
              dark
                ? `card-glass-dark hover:border-white/25 ${recommended === o.key ? 'glow-edge' : ''}`
                : `card ${o.hover}`
            }`}
          >
            {recommended === o.key && (
              <span
                className={`mb-3 inline-flex self-start rounded-full px-2.5 py-1 text-[11px] font-semibold ring-1 ${
                  dark
                    ? 'bg-emerald-400/15 text-emerald-300 ring-emerald-300/30'
                    : 'bg-emerald-50 text-emerald-700 ring-emerald-200'
                }`}
              >
                Suggested for you
              </span>
            )}
            <div className="flex items-center gap-3.5">
              <span
                className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br text-white ring-1 ring-white/40 ${o.tile}`}
              >
                <o.icon size={22} />
              </span>
              <div className="min-w-0">
                <p className={`text-xs font-semibold uppercase tracking-wide ${dark ? 'text-white/55' : 'text-ink-500'}`}>{o.programme}</p>
                <h3 className={`font-display text-xl font-semibold leading-tight ${dark ? 'text-white' : 'text-ink-900'}`}>{o.title}</h3>
              </div>
            </div>

            <p className={`mt-4 text-sm leading-relaxed ${dark ? 'text-white/70' : 'text-ink-600'}`}>{o.blurb}</p>

            <p className={`mt-5 text-[11px] font-semibold uppercase tracking-wide ${dark ? 'text-white/50' : 'text-ink-500'}`}>Opens</p>
            <ul className="mt-2 space-y-2">
              {o.unlocks.map((u) => (
                <li key={u} className={`flex items-start gap-2.5 text-sm ${dark ? 'text-white/80' : 'text-ink-700'}`}>
                  <CheckCircle2 size={16} className={`mt-0.5 shrink-0 ${dark ? 'text-brand-200' : 'text-ink-400'}`} />
                  {u}
                </li>
              ))}
            </ul>

            <div className="mt-6 flex flex-1 flex-col justify-end gap-3">
              <p className={`inline-flex items-center gap-1.5 text-xs font-medium ${dark ? 'text-white/55' : 'text-ink-500'}`}>
                <Clock size={13} /> 20 statements · about 5 minutes
              </p>
              {onChoose ? (
                <button
                  type="button"
                  disabled={disabled}
                  onClick={() => onChoose(o.key, o.to)}
                  className={`press inline-flex min-h-12 items-center justify-center gap-2 rounded-full px-5 py-2 text-center text-[15px] leading-tight font-semibold text-white shadow-e1 transition-colors disabled:cursor-not-allowed disabled:opacity-70 ${o.button}`}
                >
                  Take the {o.title.toLowerCase()}
                  <ArrowRight size={17} />
                </button>
              ) : (
                <Link
                  to={o.to}
                  className={`press inline-flex min-h-12 items-center justify-center gap-2 rounded-full px-5 py-2 text-center text-[15px] leading-tight font-semibold text-white shadow-e1 transition-colors ${o.button}`}
                >
                  Take the {o.title.toLowerCase()}
                  <ArrowRight size={17} />
                </Link>
              )}
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}
