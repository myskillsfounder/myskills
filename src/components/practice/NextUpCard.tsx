import { ArrowRight, Sparkles } from 'lucide-react'
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
      className="flex w-full items-center gap-3.5 rounded-2xl bg-ink-900 p-4 text-left transition-colors active:bg-ink-800 sm:gap-4 sm:p-5 sm:hover:bg-ink-800"
    >
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/10 text-white sm:h-12 sm:w-12">
        <Sparkles size={20} />
      </span>

      <div className="min-w-0 flex-1">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-white/50">
          {fresh ? 'Start here' : 'Recommended next'}
        </p>
        <p className="mt-0.5 truncate text-[15px] font-semibold text-white">{track.name}</p>
        <p className="mt-0.5 truncate text-xs text-white/60">
          {fresh ? `${count} scenarios · not attempted yet` : `${count} scenarios · best ${percent}%`}
        </p>
      </div>

      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white text-ink-900">
        <ArrowRight size={17} />
      </span>
    </button>
  )
}
