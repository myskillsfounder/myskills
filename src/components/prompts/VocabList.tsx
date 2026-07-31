/**
 * Vocabulary terms render as a dense chip grid, not cards. They're 1-3 words
 * each — a card per term would mean 180 mostly-empty boxes and endless
 * scrolling. Grouped under track headings when no single track is selected.
 */
import { Bookmark } from 'lucide-react'
import type { VocabTerm } from '@/lib/vocabLibrary'

export interface VocabHit {
  term: VocabTerm
  trackSlug: string
  trackName: string
}

function TermChip({
  hit,
  saved,
  onOpen,
}: {
  hit: VocabHit
  saved: boolean
  onOpen: () => void
}) {
  return (
    <button
      type="button"
      onClick={onOpen}
      className="flex min-h-[52px] items-center justify-between gap-2 rounded-xl border border-ink-100 bg-white px-3.5 py-2.5 text-left transition-colors active:bg-ink-50 sm:hover:border-brand-200"
    >
      <span className="min-w-0 flex-1 text-sm font-medium leading-snug text-ink-800">
        {hit.term.term}
      </span>
      {saved && <Bookmark size={13} className="shrink-0 text-amber-500" fill="currentColor" />}
    </button>
  )
}

export function VocabList({
  hits,
  grouped,
  savedIds,
  onOpen,
}: {
  hits: VocabHit[]
  /** group under track headings (true when no single track is selected) */
  grouped: boolean
  savedIds: string[]
  onOpen: (hit: VocabHit) => void
}) {
  if (!grouped) {
    return (
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {hits.map((h) => (
          <TermChip key={h.term.id} hit={h} saved={savedIds.includes(h.term.id)} onOpen={() => onOpen(h)} />
        ))}
      </div>
    )
  }

  // preserve track order as it appears in `hits`
  const groups: { slug: string; name: string; items: VocabHit[] }[] = []
  for (const h of hits) {
    const last = groups[groups.length - 1]
    if (last && last.slug === h.trackSlug) last.items.push(h)
    else groups.push({ slug: h.trackSlug, name: h.trackName, items: [h] })
  }

  return (
    <div className="space-y-5">
      {groups.map((g) => (
        <section key={g.slug}>
          <div className="mb-2 flex items-baseline gap-2">
            <h2 className="text-sm font-semibold text-ink-900">{g.name}</h2>
            <span className="text-xs text-ink-400">{g.items.length}</span>
          </div>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {g.items.map((h) => (
              <TermChip
                key={h.term.id}
                hit={h}
                saved={savedIds.includes(h.term.id)}
                onOpen={() => onOpen(h)}
              />
            ))}
          </div>
        </section>
      ))}
    </div>
  )
}
