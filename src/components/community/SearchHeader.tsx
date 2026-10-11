import { useEffect, useRef, useState, type ComponentType } from 'react'
import { Clock, Search, TrendingUp, X } from 'lucide-react'

type IconType = ComponentType<{ size?: number; className?: string }>

/** One filter in the row under the search box. */
export interface BrowseTab {
  id: string
  label: string
  icon?: IconType
  count?: number
}

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
 * Search first, the way a shopping or food app opens: a search box that stays
 * at the top as you scroll, one slim row of filters under it, and, when the
 * box is focused and empty, recent and popular searches to tap. It is kept
 * short on purpose: it follows you down the page, so every pixel it takes is
 * taken from what you are browsing.
 *
 * Results filter as you type (the page does the filtering); a search is
 * remembered once the person presses Enter or leaves the box with text in it.
 */
export function SearchHeader({
  query,
  onQuery,
  tabs,
  active,
  onTab,
  popular,
  resultCount,
}: {
  query: string
  onQuery: (q: string) => void
  tabs: BrowseTab[]
  active: string
  onTab: (id: string) => void
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
    // Sits under the phone header (56px) and at the very top on desktop.
    <div className="surface-paper sticky top-14 z-20 -mx-4 border-b border-ink-900/[0.06] px-4 pb-3 pt-3 backdrop-blur sm:-mx-6 sm:px-6 lg:top-0 lg:-mx-8 lg:px-8">
      <div className="relative">
        <label className="flex items-center gap-3 rounded-2xl bg-white px-4 py-3 shadow-e1 ring-1 ring-ink-900/[0.08] transition-shadow focus-within:ring-2 focus-within:ring-brand-500">
          <Search size={20} className="shrink-0 text-brand-600" />
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
            placeholder="Search mentors, skills, cities, support…"
            // The label draws the focus ring, so the box inside it has none of its own.
            style={{ outline: 'none', boxShadow: 'none' }}
            className="min-w-0 flex-1 border-0 bg-transparent text-base text-ink-900 placeholder:text-ink-400 [&::-webkit-search-cancel-button]:hidden"
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

      {/* The filters: one row of pills, scrolling sideways on a phone. */}
      <div
        role="tablist"
        aria-label="Browse by category"
        className="-mx-4 mt-2.5 flex gap-2 overflow-x-auto px-4 [scrollbar-width:none] sm:mx-0 sm:px-0"
      >
        {tabs.map((tab) => {
          const on = tab.id === active
          const Icon = tab.icon
          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={on}
              onClick={() => onTab(tab.id)}
              className={`press inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3.5 py-2 text-sm font-semibold transition-colors ${
                on
                  ? 'border-ink-900 bg-ink-900 text-white'
                  : 'border-ink-900/[0.1] bg-white text-ink-700 hover:border-ink-900/25 hover:text-ink-900'
              }`}
            >
              {Icon && <Icon size={15} className={on ? 'text-white/80' : 'text-ink-400'} />}
              {tab.label}
              {tab.count != null && (
                <span className={`tabular-nums text-xs font-medium ${on ? 'text-white/60' : 'text-ink-400'}`}>{tab.count}</span>
              )}
            </button>
          )
        })}
      </div>

      {q && resultCount != null && (
        <p className="mt-2 text-xs text-ink-500" aria-live="polite">
          {resultCount === 0 ? 'No results' : `${resultCount} ${resultCount === 1 ? 'result' : 'results'}`} for “{q}”
        </p>
      )}
    </div>
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
