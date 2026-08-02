/**
 * Item list, in one of two shapes depending on the library's content:
 *
 *  - items WITH a subtitle (case-study topics) get full rows — the learning
 *    objective is the thing that helps you choose, so it needs the width.
 *  - items WITHOUT one (vocabulary terms) get a dense chip grid; 180 one- or
 *    two-word terms as full rows would be needless scrolling.
 */
import { Bookmark, ChevronRight } from 'lucide-react'
import type { LibraryItem } from '@/lib/promptLibraries'

export interface ItemHit {
  item: LibraryItem
  trackSlug: string
  trackName: string
}

function Group({ name, count, children }: { name: string; count: number; children: React.ReactNode }) {
  return (
    <section>
      <div className="mb-2 flex items-baseline gap-2">
        <h2 className="text-sm font-semibold text-ink-900">{name}</h2>
        <span className="text-xs text-ink-400">{count}</span>
      </div>
      {children}
    </section>
  )
}

function groupHits(hits: ItemHit[]) {
  const groups: { slug: string; name: string; items: ItemHit[] }[] = []
  for (const h of hits) {
    const last = groups[groups.length - 1]
    if (last && last.slug === h.trackSlug) last.items.push(h)
    else groups.push({ slug: h.trackSlug, name: h.trackName, items: [h] })
  }
  return groups
}

function Row({ hit, saved, onOpen }: { hit: ItemHit; saved: boolean; onOpen: () => void }) {
  return (
    <button
      type="button"
      onClick={onOpen}
      className="flex w-full items-center gap-3 rounded-xl border border-ink-100 bg-white p-3.5 text-left transition-colors active:bg-ink-50 sm:hover:border-brand-200"
    >
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium leading-snug text-ink-900">{hit.item.title}</p>
        {hit.item.subtitle && (
          <p className="mt-0.5 line-clamp-2 text-xs leading-relaxed text-ink-500">
            {hit.item.subtitle}
          </p>
        )}
      </div>
      {saved && <Bookmark size={14} className="shrink-0 text-amber-500" fill="currentColor" />}
      <ChevronRight size={17} className="shrink-0 text-ink-300" />
    </button>
  )
}

function Chip({ hit, saved, onOpen }: { hit: ItemHit; saved: boolean; onOpen: () => void }) {
  return (
    <button
      type="button"
      onClick={onOpen}
      className="flex min-h-[52px] items-center justify-between gap-2 rounded-xl border border-ink-100 bg-white px-3.5 py-2.5 text-left transition-colors active:bg-ink-50 sm:hover:border-brand-200"
    >
      <span className="min-w-0 flex-1 text-sm font-medium leading-snug text-ink-800">
        {hit.item.title}
      </span>
      {saved && <Bookmark size={13} className="shrink-0 text-amber-500" fill="currentColor" />}
    </button>
  )
}

export function ItemList({
  hits,
  grouped,
  dense,
  savedIds,
  onOpen,
}: {
  hits: ItemHit[]
  /** group under track headings (true when no single track is selected) */
  grouped: boolean
  /** chip grid instead of rows — set for libraries whose items have no subtitle */
  dense: boolean
  savedIds: string[]
  onOpen: (hit: ItemHit) => void
}) {
  const render = (items: ItemHit[]) =>
    dense ? (
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {items.map((h) => (
          <Chip key={h.item.id} hit={h} saved={savedIds.includes(h.item.id)} onOpen={() => onOpen(h)} />
        ))}
      </div>
    ) : (
      <div className="space-y-2">
        {items.map((h) => (
          <Row key={h.item.id} hit={h} saved={savedIds.includes(h.item.id)} onOpen={() => onOpen(h)} />
        ))}
      </div>
    )

  if (!grouped) return render(hits)

  return (
    <div className="space-y-5">
      {groupHits(hits).map((g) => (
        <Group key={g.slug} name={g.name} count={g.items.length}>
          {render(g.items)}
        </Group>
      ))}
    </div>
  )
}
