import { ArrowRight, Clock } from 'lucide-react'
import { skillTracks } from '@/lib/skillTracks'
import { questionsForTrack } from '@/lib/decisionLabs'
import { nextAttemptAt, retakeLabel, type PracticeSummary } from '@/lib/practiceResults'

/**
 * Picks the single track the user should do next and puts it above the list.
 *
 * The old page opened with a wall of eight equal-weight cards and left the
 * "what now?" decision entirely to the user. Rule: an untouched track first,
 * in the order the student's aptitude result suggests (the tracks that lean on
 * their strongest aptitude come first); otherwise the weakest score that can
 * be taken today. A track opens once a day (see lib/practiceResults.ts).
 */
export function pickNextTrack(practice: PracticeSummary, suggested: string[] = []) {
  const order = [...suggested, ...skillTracks.map((t) => t.slug)].filter((s, i, all) => all.indexOf(s) === i)
  const tracks = order.map((slug) => skillTracks.find((t) => t.slug === slug)).filter((t) => t != null)

  const unstarted = tracks.find((t) => !practice[t.slug])
  if (unstarted) return { track: unstarted, percent: null as number | null, suited: suggested.includes(unstarted.slug) }

  const open = tracks.filter((t) => !nextAttemptAt(practice[t.slug]))
  const weakest = [...open].sort((a, b) => (practice[a.slug]?.percent ?? 0) - (practice[b.slug]?.percent ?? 0))[0]
  return weakest ? { track: weakest, percent: practice[weakest.slug]?.percent ?? 0, suited: false } : null
}

export function NextUpCard({
  practice,
  onSelect,
  suggested = [],
  suitedTo,
}: {
  practice: PracticeSummary
  onSelect: (slug: string) => void
  /** Track slugs in the order the aptitude result suggests (lib/dmAptitude.ts). */
  suggested?: string[]
  /** The strongest aptitude's name, to say why a track is first. */
  suitedTo?: string
}) {
  const next = pickNextTrack(practice, suggested)

  // Every track taken, and none can be taken again yet today.
  if (!next) {
    const soonest = skillTracks
      .map((t) => nextAttemptAt(practice[t.slug]))
      .filter((d): d is Date => d != null)
      .sort((a, b) => a.getTime() - b.getTime())[0]
    return (
      <div className="surface-wood-dark relative flex h-full w-full flex-col justify-between overflow-hidden rounded-2xl p-5 text-left shadow-md sm:p-6">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/60">All caught up</p>
          <p className="mt-1.5 font-display text-2xl font-semibold leading-tight text-white">Every track is done for today</p>
          <p className="mt-1.5 text-xs text-white/70">
            A track opens again a day after you take it.{soonest ? ` The next one opens ${retakeLabel(soonest)}.` : ''}
          </p>
        </div>
        <span className="mt-6 inline-flex items-center gap-1.5 self-start text-xs font-medium text-white/70">
          <Clock size={13} /> Meanwhile, the Vocabulary Builder is always open
        </span>
      </div>
    )
  }

  const { track, percent, suited } = next
  const count = questionsForTrack(track.slug).length
  const fresh = percent === null

  return (
    <button
      type="button"
      onClick={() => onSelect(track.slug)}
      className="surface-wood-dark lift rise-in group relative flex h-full w-full flex-col justify-between overflow-hidden rounded-2xl p-5 text-left shadow-md sm:p-6"
    >
      {/* target rings */}
      <span aria-hidden className="pointer-events-none absolute -right-8 -top-6 opacity-[0.18]">
        <svg width="190" height="190" viewBox="0 0 190 190" fill="none" stroke="#f6e3c8" strokeWidth="2">
          <circle cx="120" cy="70" r="72" />
          <circle cx="120" cy="70" r="54" />
          <circle cx="120" cy="70" r="36" />
          <circle cx="120" cy="70" r="18" />
          <path d="M60 140 L150 46" strokeWidth="3" />
          <path d="M150 46 l-14 2 M150 46 l-2 14" strokeWidth="3" />
        </svg>
      </span>

      <div className="relative">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/60">
          {fresh ? (suited ? 'Suits you · start here' : 'Start here') : 'Recommended next'}
        </p>
        <p className="mt-1.5 font-display text-2xl font-semibold leading-tight text-white">
          {track.name}
        </p>
        <p className="mt-1.5 text-xs text-white/70">
          {count} scenarios · {fresh ? 'not attempted yet' : `best ${percent}%`}
        </p>
        {suited && suitedTo && (
          <p className="mt-1 text-xs text-white/70">It leans on your strongest aptitude: {suitedTo}.</p>
        )}
      </div>

      <span className="relative mt-6 flex h-11 w-11 items-center justify-center self-end rounded-full bg-white text-ink-800 shadow-lg transition-transform duration-300 group-hover:translate-x-1 group-hover:scale-110">
        <ArrowRight size={20} />
      </span>
    </button>
  )
}
