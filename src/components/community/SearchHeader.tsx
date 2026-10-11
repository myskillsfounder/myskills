import { useEffect, useRef, useState, type ComponentType } from 'react'
import { Clock, Search, TrendingUp, X } from 'lucide-react'

type IconType = ComponentType<{ size?: number; className?: string }>

const RECENT_KEY = 'myskills.communitySearches'
const RECENT_MAX = 5

/** The last few things this person searched for, kept on this device only. */
function readRecent(): string[] {
  try {
    const v = JSON.parse(localStorage.getItem(RECENT_KEY) ?? '[]')
    return Array.isArray(v) ? v.filter((s): s is string => typeof s === 'string').slice(0, RECENT_MAX) : []
  } catch {
    return []
  }
}

function writeRecent(list: string[]) {
  try {
    localStorage.setItem(RECENT_KEY, JSON.stringify(list))
  } catch {
    /* storage blocked: recent searches just don't persist */
  }
}

/**
 * Search is the page's main control: one large box, nothing beside it, that
 * stays at the top as you scroll. Focused and empty it offers recent and
 * popular searches; under it, popular searches are a tap away before anything
 * is typed. There is no row of filters: a group is opened from its tile on the
 * page, and while one is open it shows here as a single tag to clear.
 *
 * Results filter as you type (the page does the filtering); a search is
 * remembered once the person presses Enter or leaves the box with text in it.
 */
export function SearchHeader({
  query,
  onQuery,
  filter,
  popular,
  resultCount,
}: {
  query: string
  onQuery: (q: string) => void
  /** The group being looked at, when there is one: named, and cleared, here. */
  filter?: { label: string; onClear: () => void }
  /** Suggested searches, drawn from what is actually listed. */
  popular: string[]
  /** Matches for the current search and category; null while loading. */
  resultCount: number | null
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [focused, setFocused] = useState(false)
  const [recent, setRecent] = useState<string[]>(readRecent)

  // "/" jumps to search from anywhere on the page, as on most search-led sites.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement | null
      const typing = el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.isContentEditable)
      if (e.key === '/' && !typing) {
        e.preventDefault()
        inputRef.current?.focus()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  function remember(text: string) {
    const t = text.trim()
    if (t.length < 2) return
    const next = [t, ...recent.filter((r) => r.toLowerCase() !== t.toLowerCase())].slice(0, RECENT_MAX)
    setRecent(next)
    writeRecent(next)
  }

  function pick(text: string) {
    onQuery(text)
    remember(text)
    inputRef.current?.blur()
  }

  const q = query.trim()
  const showSuggestions = focused && !q && (recent.length > 0 || popular.length > 0)

  return (
    <>
    {/* Sits under the phone header (56px) and at the very top on desktop. */}
    <div className="surface-paper sticky top-14 z-20 -mx-4 px-4 pb-3 pt-3 backdrop-blur sm:-mx-6 sm:px-6 lg:top-0 lg:-mx-8 lg:px-8">
      <div className="relative">
        <label className="flex items-center gap-3 rounded-2xl bg-white px-4 py-3.5 shadow-e2 ring-1 ring-ink-900/[0.1] transition-shadow focus-within:ring-2 focus-within:ring-brand-500 sm:gap-4 sm:px-5 sm:py-4">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand-600 text-white">
            <Search size={18} />
          </span>
          <span className="sr-only">Search mentors, support, internships and institutions</span>
          <input
            ref={inputRef}
            type="search"
            value={query}
            onChange={(e) => onQuery(e.target.value)}
            onFocus={() => setFocused(true)}
            // Delay so a tap on a suggestion lands before the list closes.
            onBlur={() => {
              window.setTimeout(() => setFocused(false), 150)
              remember(query)
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                remember(query)
                inputRef.current?.blur()
              }
              if (e.key === 'Escape') {
                onQuery('')
                inputRef.current?.blur()
              }
            }}
            placeholder={filter ? `Search ${filter.label.toLowerCase()}…` : 'Search a mentor, a skill, a city, or what you need help with…'}
            // The label draws the focus ring, so the box inside it has none of its own.
            style={{ outline: 'none', boxShadow: 'none' }}
            className="min-w-0 flex-1 border-0 bg-transparent text-base text-ink-900 placeholder:text-ink-400 sm:text-lg [&::-webkit-search-cancel-button]:hidden"
          />
          {query ? (
            <button
              type="button"
              onClick={() => {
                onQuery('')
                inputRef.current?.focus()
              }}
              aria-label="Clear search"
              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-ink-400 hover:bg-ink-100 hover:text-ink-700"
            >
              <X size={16} />
            </button>
          ) : (
            <kbd className="hidden shrink-0 rounded-md border border-ink-200 px-1.5 py-0.5 font-mono text-[11px] text-ink-400 lg:block">
              /
            </kbd>
          )}
        </label>

        {showSuggestions && (
          <div className="absolute inset-x-0 top-full z-30 mt-2 rounded-2xl bg-white p-4 shadow-e2 ring-1 ring-ink-900/[0.08]">
            {recent.length > 0 && (
              <div>
                <div className="flex items-center justify-between">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-500">Recent</p>
                  <button
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => {
                      setRecent([])
                      writeRecent([])
                    }}
                    className="text-xs font-medium text-ink-500 hover:text-ink-800"
                  >
                    Clear
                  </button>
                </div>
                <Chips items={recent} icon={Clock} onPick={pick} />
              </div>
            )}
            {popular.length > 0 && (
              <div className={recent.length > 0 ? 'mt-4' : ''}>
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-500">Popular</p>
                <Chips items={popular} icon={TrendingUp} onPick={pick} />
              </div>
            )}
          </div>
        )}
      </div>

      {(filter || (q && resultCount != null)) && (
        <div className="mt-2.5 flex flex-wrap items-center gap-x-3 gap-y-1.5">
          {/* The one group being shown, as a tag that clears back to everything. */}
          {filter && (
            <button
              type="button"
              onClick={filter.onClear}
              aria-label={`Showing ${filter.label}. Show everything instead.`}
              className="press inline-flex items-center gap-1.5 rounded-full bg-ink-900 py-1.5 pl-3.5 pr-2.5 text-sm font-semibold text-white hover:bg-ink-800"
            >
              {filter.label}
              <X size={14} className="text-white/70" />
            </button>
          )}
          {q && resultCount != null && (
            <p className="text-sm text-ink-600" aria-live="polite">
              {resultCount === 0 ? 'No results' : `${resultCount} ${resultCount === 1 ? 'result' : 'results'}`} for “{q}”
            </p>
          )}
        </div>
      )}
    </div>

    {/* Before anything is typed: searches that will find something, one tap each. */}
    {!q && !filter && popular.length > 0 && (
      <div className="-mt-5 flex flex-wrap items-center gap-2">
        <span className="text-xs font-semibold uppercase tracking-[0.12em] text-ink-500">Popular</span>
        {popular.map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => pick(s)}
            className="press inline-flex items-center gap-1.5 rounded-full border border-ink-900/[0.1] bg-white px-3 py-1.5 text-sm text-ink-700 hover:border-brand-300 hover:text-brand-800"
          >
            <TrendingUp size={13} className="text-ink-400" />
            {s}
          </button>
        ))}
      </div>
    )}
    </>
  )
}

function Chips({ items, icon: Icon, onPick }: { items: string[]; icon: IconType; onPick: (s: string) => void }) {
  return (
    <ul className="mt-2 flex flex-wrap gap-2">
      {items.map((s) => (
        <li key={s}>
          <button
            type="button"
            // mousedown would blur the input (closing the list) before the click.
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => onPick(s)}
            className="press inline-flex items-center gap-1.5 rounded-full border border-ink-900/[0.1] px-3 py-1.5 text-sm text-ink-700 hover:border-brand-300 hover:text-brand-800"
          >
            <Icon size={13} className="text-ink-400" />
            {s}
          </button>
        </li>
      ))}
    </ul>
  )
}
