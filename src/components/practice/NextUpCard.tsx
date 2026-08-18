import { ArrowRight } from 'lucide-react'
import { skillTracks } from '@/lib/skillTracks'
import { questionsForTrack } from '@/lib/decisionLabs'
import type { PracticeSummary } from '@/lib/practiceResults'

/**
 * Picks the single track the user should do next and puts it above the list.
 *
 * The old page opened with a wall of eight equal-weight cards and left the
 * "what now?" decision entirely to the user. Rule: an untouched track first
 * (in track order), otherwise the weakest score.
 */
export function pickNextTrack(practice: PracticeSummary) {
  const unstarted = skillTracks.find((t) => !practice[t.slug])
  if (unstarted) return { track: unstarted, percent: null as number | null }

  const weakest = [...skillTracks].sort(
    (a, b) => (practice[a.slug]?.percent ?? 0) - (practice[b.slug]?.percent ?? 0),
  )[0]
  return weakest ? { track: weakest, percent: practice[weakest.slug]?.percent ?? 0 } : null
}

export function NextUpCard({
  practice,
  onSelect,
}: {
  practice: PracticeSummary
  onSelect: (slug: string) => void
}) {
  const next = pickNextTrack(practice)
  if (!next) return null

  const { track, percent } = next
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
          {fresh ? 'Start here' : 'Recommended next'}
        </p>
        <p className="mt-1.5 font-display text-2xl font-semibold leading-tight text-white">
          {track.name}
        </p>
        <p className="mt-1.5 text-xs text-white/70">
          {count} scenarios · {fresh ? 'not attempted yet' : `best ${percent}%`}
        </p>
      </div>

      <span className="relative mt-6 flex h-11 w-11 items-center justify-center self-end rounded-full bg-white text-ink-800 shadow-lg transition-transform duration-300 group-hover:translate-x-1 group-hover:scale-110">
        <ArrowRight size={20} />
      </span>
    </button>
  )
}
