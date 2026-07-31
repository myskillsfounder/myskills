import { useEffect, useMemo, useRef, useState } from 'react'
import { createFileRoute, Link } from '@tanstack/react-router'
import { ArrowRight, Bookmark, Lock, Medal, Search, SlidersHorizontal, Sparkles, Trophy, X } from 'lucide-react'
import { requireOnboarded } from '@/lib/guards'
import { useAuthUser } from '@/lib/useAuth'
import { fetchMyCertificate, hasTierAccess, TIERS, type Certificate } from '@/lib/certificates'
import { promptCount, promptTracks, type Prompt } from '@/lib/promptLibrary'
import { vocabCount, vocabTracks, type VocabTerm } from '@/lib/vocabLibrary'
import { AppShell } from '@/components/app/AppShell'
import { BOTTOM_NAV_CLEARANCE } from '@/components/app/MobileBottomNav'
import { PromptCard } from '@/components/prompts/PromptCard'
import { PromptDetail } from '@/components/prompts/PromptDetail'
import { VocabDetail } from '@/components/prompts/VocabDetail'
import { VocabList, type VocabHit } from '@/components/prompts/VocabList'
import { ALL, FilterSheet, type FilterTrack } from '@/components/prompts/FilterSheet'

export const Route = createFileRoute('/prompt-library')({
  beforeLoad: requireOnboarded,
  component: PromptLibraryPage,
})

type Tab = 'prompts' | 'vocab'

const SAVED_KEY = (uid: string, ns: Tab) => `myskills.${ns}.saved.${uid}`

/** Flattened once — every deep-dive prompt with the track it belongs to. */
const ALL_PROMPTS: { prompt: Prompt; trackSlug: string; trackName: string }[] = promptTracks.flatMap(
  (t) => t.prompts.map((prompt) => ({ prompt, trackSlug: t.slug, trackName: t.name })),
)

/** Flattened once — every vocabulary term with the track it belongs to. */
const ALL_TERMS: VocabHit[] = vocabTracks.flatMap((t) =>
  t.terms.map((term) => ({ term, trackSlug: t.slug, trackName: t.name })),
)

const promptTrackName = (slug: string) => promptTracks.find((t) => t.slug === slug)?.name ?? ''
const vocabTrackName = (slug: string) => vocabTracks.find((t) => t.slug === slug)?.name ?? ''

/* -- saved items, per user, per tab, in localStorage ----------------------- */

function useSavedItems(userId: string, ns: Tab) {
  const [saved, setSaved] = useState<string[]>([])

  useEffect(() => {
    try {
      setSaved(JSON.parse(localStorage.getItem(SAVED_KEY(userId, ns)) || '[]'))
    } catch {
      setSaved([])
    }
  }, [userId, ns])

  function toggle(id: string) {
    setSaved((prev) => {
      const next = prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
      try {
        localStorage.setItem(SAVED_KEY(userId, ns), JSON.stringify(next))
      } catch {
        /* storage unavailable — keep it in memory for this session */
      }
      return next
    })
  }

  return { saved, toggle }
}

/* -- locked view (bronze / no certificate) --------------------------------- */

function LockedView({ cert }: { cert: Certificate | null }) {
  return (
    <div className="mx-auto max-w-xl py-8 text-center sm:py-10">
      <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-ink-50 text-ink-400">
        <Lock size={24} />
      </span>
      <h1 className="mt-5 text-xl font-semibold tracking-tight text-ink-900">Prompt Library</h1>
      <p className="mt-2 text-sm leading-relaxed text-ink-500">
        Prompts that turn any AI assistant into a marketing tutor — unlocked by your certificate band.
      </p>

      <div className="mt-6 space-y-3 text-left">
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
          <p className="text-sm font-semibold text-slate-900">
            Silver — {TIERS.silver.min}% to {TIERS.silver.max}% · {TIERS.silver.meaning}
          </p>
          <p className="mt-1 text-xs leading-relaxed text-slate-600">
            {vocabCount} vocabulary terms, each with a ready-made prompt that explains it in plain
            English with a real-world example.
          </p>
        </div>
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5">
          <p className="text-sm font-semibold text-amber-900">
            Gold — {TIERS.gold.min}% and above · {TIERS.gold.meaning}
          </p>
          <p className="mt-1 text-xs leading-relaxed text-amber-700">
            Everything in Silver, plus {promptCount} deep-dive prompts — case studies, simulations
            and role-plays across every track.
          </p>
        </div>
      </div>

      <p className="mt-5 text-xs text-ink-500">
        {cert
          ? `You scored ${cert.percent}% on the initial assessment.`
          : 'Complete the initial assessment to earn your certificate.'}
      </p>
      <Link
        to="/practice"
        className="mt-3 inline-flex h-11 items-center gap-1.5 rounded-full bg-brand-600 px-5 text-xs font-semibold text-white transition-colors hover:bg-brand-700"
      >
        {cert ? 'Keep practicing' : 'Take the assessment'} <ArrowRight size={13} />
      </Link>
    </div>
  )
}

/* -- page ------------------------------------------------------------------- */

function PromptLibraryPage() {
  const { user } = useAuthUser()
  const [cert, setCert] = useState<Certificate | null>(null)
  const [loading, setLoading] = useState(true)

  const [tab, setTab] = useState<Tab>('vocab')
  const [query, setQuery] = useState('')
  const [track, setTrack] = useState<string>(ALL)
  const [savedOnly, setSavedOnly] = useState(false)
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [activePrompt, setActivePrompt] = useState<{ prompt: Prompt; trackName: string } | null>(null)
  const [activeTerm, setActiveTerm] = useState<{ term: VocabTerm; trackName: string } | null>(null)
  const searchRef = useRef<HTMLInputElement>(null)

  const { saved, toggle } = useSavedItems(user?.id ?? 'guest', tab)

  const canVocab = hasTierAccess(cert, 'silver')
  const canPrompts = hasTierAccess(cert, 'gold')

  useEffect(() => {
    fetchMyCertificate()
      .then((c) => {
        setCert(c)
        // Gold users land on the deep dives — that's their headline reward.
        if (c?.kind === 'gold') setTab('prompts')
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  // "/" focuses search (desktop convenience; harmless on mobile).
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

  // Switching tabs resets filters — the two lists don't share a taxonomy of counts.
  function switchTab(next: Tab) {
    setTab(next)
    setTrack(ALL)
    setSavedOnly(false)
    setQuery('')
  }

  const promptResults = useMemo(() => {
    const q = query.trim().toLowerCase()
    return ALL_PROMPTS.filter(({ prompt, trackSlug }) => {
      if (track !== ALL && trackSlug !== track) return false
      if (savedOnly && !saved.includes(prompt.id)) return false
      if (!q) return true
      return prompt.title.toLowerCase().includes(q) || prompt.body.toLowerCase().includes(q)
    })
  }, [query, track, savedOnly, saved])

  const vocabResults = useMemo(() => {
    const q = query.trim().toLowerCase()
    return ALL_TERMS.filter(({ term, trackSlug }) => {
      if (track !== ALL && trackSlug !== track) return false
      if (savedOnly && !saved.includes(term.id)) return false
      if (!q) return true
      return term.term.toLowerCase().includes(q)
    })
  }, [query, track, savedOnly, saved])

  const resultCount = tab === 'prompts' ? promptResults.length : vocabResults.length
  const totalCount = tab === 'prompts' ? promptCount : vocabCount

  const filterTracks: FilterTrack[] = useMemo(() => {
    if (tab === 'prompts') {
      return promptTracks.map((t) => ({
        slug: t.slug,
        name: t.name,
        count:
          t.prompts.length === 0
            ? null
            : ALL_PROMPTS.filter(
                (p) => p.trackSlug === t.slug && (!savedOnly || saved.includes(p.prompt.id)),
              ).length,
      }))
    }
    return vocabTracks.map((t) => ({
      slug: t.slug,
      name: t.name,
      count: ALL_TERMS.filter((h) => h.trackSlug === t.slug && (!savedOnly || saved.includes(h.term.id)))
        .length,
    }))
  }, [tab, savedOnly, saved])

  function clearAll() {
    setQuery('')
    setTrack(ALL)
    setSavedOnly(false)
  }

  if (loading) {
    return (
      <AppShell wide>
        <p className="text-sm text-ink-500">Loading…</p>
      </AppShell>
    )
  }

  if (!canVocab) {
    return (
      <AppShell wide>
        <LockedView cert={cert} />
      </AppShell>
    )
  }

  const activeFilterCount = (track !== ALL ? 1 : 0) + (savedOnly ? 1 : 0)
  const filtering = Boolean(query.trim()) || activeFilterCount > 0
  const noun = tab === 'prompts' ? 'prompt' : 'term'

  return (
    <AppShell wide>
      <div className="space-y-4 pb-14 lg:pb-0">
        {/* Header */}
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-semibold tracking-tight text-ink-900 sm:text-2xl">
              Prompt Library
            </h1>
            <span
              className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-semibold ${
                canPrompts
                  ? 'border-amber-300 bg-amber-50 text-amber-800'
                  : 'border-slate-300 bg-slate-50 text-slate-700'
              }`}
            >
              <Sparkles size={11} /> {canPrompts ? 'Gold' : 'Silver'}
            </span>
          </div>
          <p className="mt-1 text-sm text-ink-500">
            {canPrompts
              ? 'Two libraries, unlocked by your certificate band.'
              : `${vocabCount} marketing terms explained by any AI assistant.`}
          </p>
        </div>

        {/* Band tabs — only for users who hold both. Labelled by certificate
            band, and colour-coded to match it, so it's obvious these are two
            separate rewards rather than one list split in half. */}
        {canPrompts && (
          <div>
            <div className="flex gap-1.5 rounded-2xl border border-ink-100 bg-white p-1.5">
              <button
                type="button"
                onClick={() => switchTab('vocab')}
                aria-pressed={tab === 'vocab'}
                className={`flex min-h-[52px] flex-1 flex-col items-center justify-center rounded-xl px-2 transition-colors ${
                  tab === 'vocab' ? 'bg-slate-100 ring-1 ring-slate-300' : 'hover:bg-ink-50'
                }`}
              >
                <span className="flex items-center gap-1.5">
                  <Medal
                    size={14}
                    className={tab === 'vocab' ? 'text-slate-600' : 'text-ink-300'}
                  />
                  <span
                    className={`text-sm font-semibold ${
                      tab === 'vocab' ? 'text-slate-900' : 'text-ink-500'
                    }`}
                  >
                    Silver
                  </span>
                </span>
                <span
                  className={`mt-0.5 text-[11px] ${
                    tab === 'vocab' ? 'text-slate-600' : 'text-ink-400'
                  }`}
                >
                  Vocabulary · {vocabCount}
                </span>
              </button>

              <button
                type="button"
                onClick={() => switchTab('prompts')}
                aria-pressed={tab === 'prompts'}
                className={`flex min-h-[52px] flex-1 flex-col items-center justify-center rounded-xl px-2 transition-colors ${
                  tab === 'prompts' ? 'bg-amber-50 ring-1 ring-amber-300' : 'hover:bg-ink-50'
                }`}
              >
                <span className="flex items-center gap-1.5">
                  <Trophy
                    size={14}
                    className={tab === 'prompts' ? 'text-amber-600' : 'text-ink-300'}
                  />
                  <span
                    className={`text-sm font-semibold ${
                      tab === 'prompts' ? 'text-amber-900' : 'text-ink-500'
                    }`}
                  >
                    Gold
                  </span>
                </span>
                <span
                  className={`mt-0.5 text-[11px] ${
                    tab === 'prompts' ? 'text-amber-700' : 'text-ink-400'
                  }`}
                >
                  Deep dives · {promptCount}
                </span>
              </button>
            </div>

            <p className="mt-2 text-xs leading-relaxed text-ink-500">
              {tab === 'vocab'
                ? 'Short marketing terms, each with a ready-made prompt that explains it with a real example.'
                : 'Long-form prompts that run as a back-and-forth — case studies, simulations and role-plays.'}
            </p>
          </div>
        )}

        {/* Search — sticky so it survives a long scroll */}
        <div className="sticky top-14 z-20 -mx-4 bg-[#f7f6fc]/95 px-4 py-2 backdrop-blur sm:-mx-6 sm:px-6 lg:static lg:mx-0 lg:bg-transparent lg:px-0 lg:py-0 lg:backdrop-blur-none">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-400" />
              <input
                ref={searchRef}
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={tab === 'prompts' ? 'Search prompts…' : 'Search terms…'}
                aria-label={tab === 'prompts' ? 'Search prompts' : 'Search terms'}
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

        {/* Active filters as dismissible chips (mobile-first) */}
        {activeFilterCount > 0 && (
          <div className="flex flex-wrap items-center gap-2 lg:hidden">
            {track !== ALL && (
              <button
                type="button"
                onClick={() => setTrack(ALL)}
                className="inline-flex items-center gap-1.5 rounded-full bg-brand-600 px-3 py-1.5 text-xs font-medium text-white"
              >
                {tab === 'prompts' ? promptTrackName(track) : vocabTrackName(track)} <X size={13} />
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
          {/* Track rail — desktop only. Mobile uses the filter sheet. */}
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
                <span className="text-xs text-ink-400">{savedOnly ? saved.length : totalCount}</span>
              </button>

              {filterTracks.map((t) => (
                <button
                  key={t.slug}
                  type="button"
                  disabled={t.count === null}
                  onClick={() => setTrack(t.slug)}
                  className={`flex items-center justify-between gap-3 rounded-lg px-3.5 py-2.5 text-left text-sm transition-colors ${
                    t.count === null
                      ? 'cursor-not-allowed text-ink-300'
                      : track === t.slug
                        ? 'bg-brand-50 font-medium text-brand-700'
                        : 'text-ink-600 hover:bg-ink-50'
                  }`}
                >
                  <span>{t.name}</span>
                  <span className="text-xs text-ink-400">{t.count === null ? 'Soon' : t.count}</span>
                </button>
              ))}
            </div>
          </nav>

          {/* Results */}
          <div className="space-y-2.5 lg:col-span-3">
            <p className="hidden text-xs text-ink-400 lg:block">
              {resultCount} {resultCount === 1 ? noun : `${noun}s`}
              {filtering ? ' shown' : ''}
            </p>

            {resultCount === 0 ? (
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
            ) : tab === 'prompts' ? (
              promptResults.map(({ prompt, trackName }) => (
                <PromptCard
                  key={prompt.id}
                  prompt={prompt}
                  trackName={trackName}
                  saved={saved.includes(prompt.id)}
                  onToggleSave={() => toggle(prompt.id)}
                  onOpen={() => setActivePrompt({ prompt, trackName })}
                />
              ))
            ) : (
              <VocabList
                hits={vocabResults}
                grouped={track === ALL}
                savedIds={saved}
                onOpen={(h) => setActiveTerm({ term: h.term, trackName: h.trackName })}
              />
            )}
          </div>
        </div>
      </div>

      {/* Floating filter button — thumb zone, stacked above the app's bottom nav */}
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
            {resultCount}
          </span>
        </button>
      </div>

      <FilterSheet
        open={filtersOpen}
        onClose={() => setFiltersOpen(false)}
        tracks={filterTracks}
        track={track}
        setTrack={setTrack}
        savedOnly={savedOnly}
        setSavedOnly={setSavedOnly}
        totalCount={totalCount}
        savedCount={saved.length}
        resultCount={resultCount}
        itemNoun={noun}
      />

      <PromptDetail
        prompt={activePrompt?.prompt ?? null}
        trackName={activePrompt?.trackName ?? ''}
        saved={activePrompt ? saved.includes(activePrompt.prompt.id) : false}
        onToggleSave={() => activePrompt && toggle(activePrompt.prompt.id)}
        onClose={() => setActivePrompt(null)}
      />

      <VocabDetail
        term={activeTerm?.term ?? null}
        trackName={activeTerm?.trackName ?? ''}
        saved={activeTerm ? saved.includes(activeTerm.term.id) : false}
        onToggleSave={() => activeTerm && toggle(activeTerm.term.id)}
        onClose={() => setActiveTerm(null)}
      />
    </AppShell>
  )
}
