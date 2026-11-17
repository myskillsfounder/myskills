import { ArrowRight } from 'lucide-react'
import { TOPIC_CHAPTERS } from '@/content/dmTopics'
import { skillTracks } from '@/lib/skillTracks'
import { topicSteps, type TopicLocal, type TopicStep } from '@/lib/topicProgress'
import type { PracticeSummary } from '@/lib/practiceResults'
import { NextUpCard } from './NextUpCard'

/**
 * What's next, on the Digital Marketing home (Paul, 17 Nov 2026: two cards, the
 * score and what's next). It points at the next step of the next topic: the
 * first topic, in the order the aptitude result suggests, that still has a step
 * to do. When every step of every topic is done it falls back to the Decision
 * Lab suggestion (NextUpCard), so there is always one clear thing to do.
 */

const DO: Record<TopicStep['key'], string> = {
  read: 'Read the big idea',
  check: 'Take the check-in',
  terms: 'Learn the key terms',
  task: 'Do the small task',
  practise: 'Practise the Decision Lab',
}

export function WhatsNextCard({
  practice,
  learnedIds,
  getLocal,
  suggested = [],
  suitedTo,
  onOpenTopic,
  onSelectTrack,
}: {
  practice: PracticeSummary
  learnedIds: Set<string>
  getLocal: (slug: string) => TopicLocal
  /** Track slugs in the order the aptitude result suggests (lib/dmAptitude.ts). */
  suggested?: string[]
  /** The strongest aptitude's name, to say why a topic is first. */
  suitedTo?: string
  onOpenTopic: (slug: string) => void
  onSelectTrack: (slug: string) => void
}) {
  const order = [...suggested, ...TOPIC_CHAPTERS.map((c) => c.slug)].filter(
    (s, i, all) => all.indexOf(s) === i && TOPIC_CHAPTERS.some((c) => c.slug === s),
  )
  const rows = order.map((slug) => ({ slug, steps: topicSteps(slug, getLocal(slug), learnedIds, practice) }))
  // A topic already under way comes first, so a learner finishes what they started.
  const target =
    rows.find((r) => r.steps.some((s) => s.done) && r.steps.some((s) => !s.done)) ?? rows.find((r) => r.steps.some((s) => !s.done))

  // Every topic finished: the Decision Lab suggestion takes over.
  if (!target) return <NextUpCard practice={practice} onSelect={onSelectTrack} suggested={suggested} suitedTo={suitedTo} />

  const chapter = TOPIC_CHAPTERS.find((c) => c.slug === target.slug)!
  const name = skillTracks.find((t) => t.slug === target.slug)?.name ?? target.slug
  const step = target.steps.find((s) => !s.done)!
  const done = target.steps.filter((s) => s.done).length
  const anyStarted = rows.some((r) => r.steps.some((s) => s.done))
  const suited = !anyStarted && suggested[0] === target.slug
  const label = suited ? 'Suits you · start here' : done > 0 ? 'Continue where you left off' : anyStarted ? 'Up next' : 'Start here'

  return (
    <button
      type="button"
      onClick={() => onOpenTopic(target.slug)}
      className="surface-wood-dark lift rise-in group relative flex h-full w-full flex-col justify-between overflow-hidden rounded-2xl p-5 text-left shadow-md sm:p-6"
    >
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
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/60">{label}</p>
        <p className="mt-1.5 font-display text-2xl font-semibold leading-tight text-white">{name}</p>
        <p className="mt-1.5 text-sm font-medium text-white/90">{DO[step.key]}</p>
        <p className="mt-1 text-xs text-white/70">
          {done} of {target.steps.length} steps done · about {chapter.minutes} min
        </p>
        {suited && suitedTo && <p className="mt-1 text-xs text-white/70">It leans on your strongest aptitude: {suitedTo}.</p>}
      </div>

      <span className="relative mt-6 flex h-11 w-11 items-center justify-center self-end rounded-full bg-white text-ink-800 shadow-lg transition-transform duration-300 group-hover:translate-x-1 group-hover:scale-110">
        <ArrowRight size={20} />
      </span>
    </button>
  )
}
