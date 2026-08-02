import { useEffect, useMemo, useRef, useState } from 'react'
import { createFileRoute, Link, notFound } from '@tanstack/react-router'
import { ArrowLeft, Bookmark, Search, SlidersHorizontal, X } from 'lucide-react'
import { requireOnboarded } from '@/lib/guards'
import { useAuthUser } from '@/lib/useAuth'
import { libraryById, libraryCount, type LibraryItem, type PromptLibrary } from '@/lib/promptLibraries'
import { AppShell } from '@/components/app/AppShell'
import { BOTTOM_NAV_CLEARANCE } from '@/components/app/MobileBottomNav'
import { ItemList, type ItemHit } from '@/components/prompts/ItemList'
import { LibraryIntro } from '@/components/prompts/LibraryIntro'
import { ItemSheet } from '@/components/prompts/ItemSheet'
import { ALL, FilterSheet, type FilterTrack } from '@/components/prompts/FilterSheet'

export const Route = createFileRoute('/prompt-library/$libraryId')({
  /** `?item=<id>` deep-links straight to one prompt (dashboard suggestions). */
  validateSearch: (search: Record<string, unknown>): { item?: string } => ({
    item: typeof search.item === 'string' ? search.item : undefined,
  }),
  beforeLoad: async ({ params }) => {
    await requireOnboarded()
    if (!libraryById(params.libraryId)) throw notFound()
  },
  component: LibraryBrowser,
  notFoundComponent: () => (
    <AppShell wide>
      <div className="mx-auto max-w-sm py-12 text-center">
        <p className="text-sm font-medium text-ink-700">Library not found</p>
        <Link to="/prompt-library" className="mt-3 inline-flex text-sm font-semibold text-brand-600">
          Back to Prompt Library
        </Link>
      </div>
    </AppShell>
  ),
})

const SAVED_KEY = (uid: string, libId: string) => `myskills.promptlib.${libId}.saved.${uid}`

function useSavedItems(userId: string, libId: string) {
  const [saved, setSaved] = useState<string[]>([])

  useEffect(() => {
    try {
      setSaved(JSON.parse(localStorage.getItem(SAVED_KEY(userId, libId)) || '[]'))
    } catch {
      setSaved([])
    }
  }, [userId, libId])

  function toggle(id: string) {
    setSaved((prev) => {
      const next = prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
      try {
        localStorage.setItem(SAVED_KEY(userId, libId), JSON.stringify(next))
      } catch {
        /* storage unavailable — keep it in memory for this session */
      }
      return next
    })
  }

  return { saved, toggle }
}

function flatten(lib: PromptLibrary): ItemHit[] {
  return lib.tracks.flatMap((t) =>
    t.items.map((item) => ({ item, trackSlug: t.slug, trackName: t.name })),
  )
}

function LibraryBrowser() {
  const { libraryId } = Route.useParams()
  const { item: deepLinkId } = Route.useSearch()
  const library = libraryById(libraryId)!
  const { user } = useAuthUser()

  const [query, setQuery] = useState('')
  const [track, setTrack] = useState<string>(ALL)
  const [savedOnly, setSavedOnly] = useState(false)
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [active, setActive] = useState<{ item: LibraryItem; trackName: string } | null>(null)
  const searchRef = useRef<HTMLInputElement>(null)

  const { saved, toggle } = useSavedItems(user?.id ?? 'guest', library.id)

  const all = useMemo(() => flatten(library), [library])
  const total = libraryCount(library)
  // Vocabulary terms have no subtitle -> render them as a dense chip grid.
  const dense = useMemo(() => !all.some((h) => h.item.subtitle), [all])

  // Reset filters when switching library.
  useEffect(() => {
    setQuery('')
    setTrack(ALL)
    setSavedOnly(false)
    setActive(null)
  }, [libraryId])

  // Open the deep-linked item once the library is resolved.
  useEffect(() => {
    if (!deepLinkId) return
    const hit = all.find((h) => h.item.id === deepLinkId)
    if (hit) setActive({ item: hit.item, trackName: hit.trackName })
  }, [deepLinkId, all])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = document.activeElement
      const typing = el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement
      if (e.key === '/' && !typing) {
        e.preventDefault()
        searchRef.current?.focus()
      }
      if (e.key === 'Escape' && typing) searchRef.current?.blur()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [])

  const results = useMemo(() => {
    const q = query.trim().toLowerCase()
    return all.filter(({ item, trackSlug }) => {
      if (track !== ALL && trackSlug !== track) return false
      if (savedOnly && !saved.includes(item.id)) return false
      if (!q) return true
      return item.title.toLowerCase().includes(q) || item.subtitle.toLowerCase().includes(q)
    })
  }, [all, query, track, savedOnly, saved])

  const filterTracks: FilterTrack[] = useMemo(
    () =>
      library.tracks.map((t) => ({
        slug: t.slug,
        name: t.name,
        count: all.filter(
          (h) => h.trackSlug === t.slug && (!savedOnly || saved.includes(h.item.id)),
        ).length,
      })),
    [library, all, savedOnly, saved],
  )

  const trackName = (slug: string) => library.tracks.find((t) => t.slug === slug)?.name ?? ''
  const activeFilterCount = (track !== ALL ? 1 : 0) + (savedOnly ? 1 : 0)
  const filtering = Boolean(query.trim()) || activeFilterCount > 0
  const noun = library.itemNoun

  function clearAll() {
    setQuery('')
    setTrack(ALL)
    setSavedOnly(false)
  }

  /** Opens a random item — an entry point for "I don't know where to start". */
  function surpriseMe() {
    const pool = results.length ? results : all
    const hit = pool[Math.floor(Math.random() * pool.length)]
    if (hit) setActive({ item: hit.item, trackName: hit.trackName })
  }

  return (
    <AppShell wide>
      <div className="space-y-4 pb-14 lg:pb-0">
        <Link
          to="/prompt-library"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-ink-500 transition-colors hover:text-ink-900"
        >
          <ArrowLeft size={16} /> Prompt Library
        </Link>

        <LibraryIntro library={library} total={total} onSurprise={surpriseMe} />

        {/* Search — sticky so it survives a long scroll. Pointless on a
            handful of items, so it only appears once a library is big. */}
        {total > 12 && (
        <div className="sticky top-14 z-20 -mx-4 bg-[#f7f6fc]/95 px-4 py-2 backdrop-blur sm:-mx-6 sm:px-6 lg:static lg:mx-0 lg:bg-transparent lg:px-0 lg:py-0 lg:backdrop-blur-none">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-400" />
              <input
                ref={searchRef}
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={`Search ${noun}s…`}
                aria-label={`Search ${noun}s`}
                className="h-11 w-full rounded-full border border-ink-200 bg-white pl-10 pr-10 text-[15px] text-ink-900 outline-none transition-colors placeholder:text-ink-400 focus:border-brand-400 sm:text-sm"
              />
              {query ? (
                <button
                  type="button"
                  onClick={() => setQuery('')}
                  aria-label="Clear search"
                  className="absolute right-1 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full text-ink-400 hover:text-ink-700"
                >
                  <X size={16} />
                </button>
              ) : (
                <kbd className="absolute right-3.5 top-1/2 hidden -translate-y-1/2 rounded border border-ink-200 px-1.5 py-0.5 text-[10px] text-ink-400 lg:block">
                  /
                </kbd>
              )}
            </div>

            <button
              type="button"
              onClick={() => setSavedOnly((v) => !v)}
              aria-pressed={savedOnly}
              className={`hidden h-11 shrink-0 items-center gap-1.5 rounded-full border px-4 text-sm font-medium transition-colors lg:inline-flex ${
                savedOnly
                  ? 'border-amber-300 bg-amber-50 text-amber-800'
                  : 'border-ink-200 bg-white text-ink-600 hover:bg-ink-50'
              }`}
            >
              <Bookmark size={15} fill={savedOnly ? 'currentColor' : 'none'} />
              Saved{saved.length ? ` (${saved.length})` : ''}
            </button>
          </div>
        </div>
        )}

        {activeFilterCount > 0 && (
          <div className="flex flex-wrap items-center gap-2 lg:hidden">
            {track !== ALL && (
              <button
                type="button"
                onClick={() => setTrack(ALL)}
                className="inline-flex items-center gap-1.5 rounded-full bg-brand-600 px-3 py-1.5 text-xs font-medium text-white"
              >
                {trackName(track)} <X size={13} />
              </button>
            )}
            {savedOnly && (
              <button
                type="button"
                onClick={() => setSavedOnly(false)}
                className="inline-flex items-center gap-1.5 rounded-full bg-amber-500 px-3 py-1.5 text-xs font-medium text-white"
              >
                Saved <X size={13} />
              </button>
            )}
          </div>
        )}

        <div className="grid gap-5 lg:grid-cols-4 lg:items-start">
          {library.tracks.length > 1 && (
          <nav aria-label="Filter by track" className="hidden lg:sticky lg:top-6 lg:block">
            <div className="flex flex-col gap-0.5">
              <button
                type="button"
                onClick={() => setTrack(ALL)}
                className={`flex items-center justify-between gap-3 rounded-lg px-3.5 py-2.5 text-sm transition-colors ${
                  track === ALL ? 'bg-brand-50 font-medium text-brand-700' : 'text-ink-600 hover:bg-ink-50'
                }`}
              >
                All tracks
                <span className="text-xs text-ink-400">{savedOnly ? saved.length : total}</span>
              </button>
              {filterTracks.map((t) => (
                <button
                  key={t.slug}
                  type="button"
                  onClick={() => setTrack(t.slug)}
                  className={`flex items-center justify-between gap-3 rounded-lg px-3.5 py-2.5 text-left text-sm transition-colors ${
                    track === t.slug
                      ? 'bg-brand-50 font-medium text-brand-700'
                      : 'text-ink-600 hover:bg-ink-50'
                  }`}
                >
                  <span>{t.name}</span>
                  <span className="text-xs text-ink-400">{t.count}</span>
                </button>
              ))}
            </div>
          </nav>
          )}

          <div className={library.tracks.length > 1 ? 'space-y-3 lg:col-span-3' : 'space-y-3 lg:col-span-4'}>
            <div className="hidden items-baseline justify-between gap-3 lg:flex">
              <h2 className="text-sm font-semibold text-ink-900">
                {filtering ? 'Results' : `All ${noun}s`}
              </h2>
              <p className="text-xs text-ink-400">
                {results.length} {results.length === 1 ? noun : `${noun}s`}
                {filtering ? ' shown' : ''}
              </p>
            </div>

            {results.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-ink-200 bg-white p-8 text-center sm:p-10">
                <p className="text-sm font-medium text-ink-700">
                  {savedOnly && !query ? 'Nothing saved yet' : `No ${noun}s match`}
                </p>
                <p className="mt-1 text-sm text-ink-500">
                  {savedOnly && !query
                    ? 'Tap the bookmark on anything you want to keep here.'
                    : 'Try a different search term or track.'}
                </p>
                <button
                  type="button"
                  onClick={clearAll}
                  className="mt-4 inline-flex h-10 items-center rounded-full border border-ink-200 px-4 text-xs font-semibold text-ink-700 hover:bg-ink-50"
                >
                  Clear filters
                </button>
              </div>
            ) : (
              <ItemList
                hits={results}
                grouped={track === ALL}
                dense={dense}
                savedIds={saved}
                onOpen={(h) => setActive({ item: h.item, trackName: h.trackName })}
              />
            )}
          </div>
        </div>
      </div>

      {/* Floating filter button — thumb zone, above the app's bottom nav */}
      {library.tracks.length > 1 && (
      <div
        className="pointer-events-none fixed inset-x-0 z-30 flex justify-center px-4 lg:hidden"
        style={{ bottom: BOTTOM_NAV_CLEARANCE }}
      >
        <button
          type="button"
          onClick={() => setFiltersOpen(true)}
          className="pointer-events-auto inline-flex h-11 items-center gap-2 rounded-full bg-ink-900 px-5 text-sm font-semibold text-white shadow-lg shadow-ink-900/25 active:bg-ink-800"
        >
          <SlidersHorizontal size={16} />
          Filter
          {activeFilterCount > 0 && (
            <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-white px-1.5 text-[11px] font-bold text-ink-900">
              {activeFilterCount}
            </span>
          )}
          <span className="ml-1 border-l border-white/25 pl-3 text-xs font-normal text-white/80">
            {results.length}
          </span>
        </button>
      </div>
      )}

      <FilterSheet
        open={filtersOpen}
        onClose={() => setFiltersOpen(false)}
        tracks={filterTracks}
        track={track}
        setTrack={setTrack}
        savedOnly={savedOnly}
        setSavedOnly={setSavedOnly}
        totalCount={total}
        savedCount={saved.length}
        resultCount={results.length}
        itemNoun={noun}
      />

      <ItemSheet
        library={library}
        item={active?.item ?? null}
        trackName={active?.trackName ?? ''}
        saved={active ? saved.includes(active.item.id) : false}
        onToggleSave={() => active && toggle(active.item.id)}
        onClose={() => setActive(null)}
      />
    </AppShell>
  )
}
