import { useEffect, useRef, useState, type ComponentType } from 'react'
import { Clock, LayoutGrid, Search, TrendingUp, X } from 'lucide-react'
import { CATEGORIES, type Category } from './Marketplace'

type IconType = ComponentType<{ size?: number; className?: string }>

/** Each category gets its own colour, so the row reads at a glance the way a
 *  shopping app's category strip does. */
const TILE: Record<Category, string> = {
  all: 'from-ink-700 to-ink-900',
  wellness: 'from-rose-400 to-pink-600',
  guidance: 'from-amber-400 to-orange-600',
  mentors: 'from-brand-400 to-brand-700',
  internships: 'from-emerald-400 to-teal-600',
  institutions: 'from-sky-400 to-blue-600',
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
 * Search first, the way a shopping or food app opens: a large search box that
 * stays at the top as you scroll, the categories as a row of tiles under it,
 * and, when the box is focused and empty, recent and popular searches to tap.
 *
 * Results filter as you type (the page does the filtering); a search is
 * remembered once the person presses Enter or leaves the box with text in it.
 */
export function SearchHeader({
  query,
  onQuery,
  category,
  onCategory,
  counts,
  popular,
  resultCount,
}: {
  query: string
  onQuery: (q: string) => void
  category: Category
  onCategory: (c: Category) => void
  counts: Partial<Record<Category, number>>
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
        <label className="flex items-center gap-3 rounded-2xl bg-white px-4 py-3.5 shadow-e2 ring-1 ring-ink-900/[0.08] transition-shadow focus-within:ring-2 focus-within:ring-brand-500">
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

      {/* Categories as tiles: an icon in its own colour over a short label. */}
      <div
        role="tablist"
        aria-label="Browse by category"
        className="-mx-4 mt-3 flex gap-1 overflow-x-auto px-4 [scrollbar-width:none] sm:mx-0 sm:gap-2 sm:px-0"
      >
        {CATEGORIES.map((c) => {
          const on = c.id === category
          const Icon = (c.icon ?? LayoutGrid) as IconType
          const count = counts[c.id]
          return (
            <button
              key={c.id}
              type="button"
              role="tab"
              aria-selected={on}
              onClick={() => onCategory(c.id)}
              className="press group flex w-[76px] shrink-0 flex-col items-center gap-1.5 rounded-xl px-1 py-1.5 sm:w-24"
            >
              <span
                className={`flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br text-white shadow-e1 transition-transform duration-300 group-hover:-translate-y-0.5 ${TILE[c.id]} ${
                  on ? 'ring-2 ring-brand-600 ring-offset-2 ring-offset-[var(--color-paper,#faf9f7)]' : 'opacity-90'
                }`}
              >
                <Icon size={20} />
              </span>
              <span className={`text-center text-[11px] leading-tight ${on ? 'font-semibold text-ink-900' : 'font-medium text-ink-600'}`}>
                {c.label}
                {count != null && <span className="ml-1 tabular-nums text-ink-400">{count}</span>}
              </span>
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
