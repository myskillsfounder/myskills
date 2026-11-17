import { ArrowRight, Check, Clock } from 'lucide-react'
import { TOPIC_CHAPTERS } from '@/content/dmTopics'
import { skillTracks } from '@/lib/skillTracks'
import { topicSteps, type TopicLocal } from '@/lib/topicProgress'
import type { PracticeSummary } from '@/lib/practiceResults'
import { SectionHeader } from '@/components/app/SectionHeader'

/**
 * The Digital Marketing topics as chapter cards: one card per skill track, with
 * its steps (Read, Check-in where there is one, Terms, Task, Practise). Opening a card opens that
 * topic's page (TopicPage.tsx).
 */
export function TopicChapters({
  practice,
  learnedIds,
  getLocal,
  onOpen,
}: {
  practice: PracticeSummary
  learnedIds: Set<string>
  getLocal: (slug: string) => TopicLocal
  onOpen: (slug: string) => void
}) {
  return (
    <section aria-labelledby="dm-topics">
      <SectionHeader
        eyebrow="Digital Marketing"
        title={<span id="dm-topics">Modules</span>}
        description="Each module is a short chapter. Read the big idea, learn the key terms, do the small task, then practise."
      />
      <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {TOPIC_CHAPTERS.map((c, i) => {
          const track = skillTracks.find((t) => t.slug === c.slug)
          const steps = topicSteps(c.slug, getLocal(c.slug), learnedIds, practice)
          const done = steps.filter((s) => s.done).length
          return (
            <li key={c.slug}>
              <button
                type="button"
                onClick={() => onOpen(c.slug)}
                className="group flex h-full w-full flex-col rounded-2xl border border-ink-200 bg-white p-4 text-left shadow-e1 transition-all duration-300 hover:-translate-y-0.5 hover:border-brand-300 hover:shadow-e2"
              >
                <span className="flex items-center justify-between gap-2">
                  <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-ink-500">Module {i + 1}</span>
                  <span className="inline-flex items-center gap-1 text-[11px] text-ink-500">
                    <Clock size={11} /> {c.minutes} min
                  </span>
                </span>
                <h3 className="mt-1.5 font-display text-lg font-semibold leading-snug text-ink-900">{track?.name ?? c.slug}</h3>
                <p className="mt-1 line-clamp-2 text-sm leading-relaxed text-ink-600">{c.hook}</p>

                <span className="mt-auto flex items-center justify-between gap-3 pt-4">
                  <span className="flex items-center gap-1.5" role="img" aria-label={`${done} of ${steps.length} steps done`}>
                    {steps.map((s) => (
                      <span
                        key={s.key}
                        title={s.label}
                        className={`flex h-5 w-5 items-center justify-center rounded-full text-white ${s.done ? 'bg-emerald-600' : 'bg-ink-200'}`}
                      >
                        {s.done && <Check size={12} strokeWidth={3} />}
                      </span>
                    ))}
                    <span className="ml-1 text-xs text-ink-500">{done}/{steps.length}</span>
                  </span>
                  <span className="inline-flex items-center gap-1 text-sm font-semibold text-brand-700">
                    {done === 0 ? 'Start' : done === steps.length ? 'Review' : 'Continue'}
                    <ArrowRight size={15} className="transition-transform group-hover:translate-x-0.5" />
                  </span>
                </span>
              </button>
            </li>
          )
        })}
      </ul>
    </section>
  )
}
