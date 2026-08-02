/**
 * Header block for a library page: identity, the three teaching styles, and a
 * way in.
 *
 * The styles used to be invisible until you opened an item, which is the main
 * reason the page read as "a long list and no instructions". Showing them here
 * — and offering "Pick one for me" — means you can tell what the library does
 * before committing to a topic.
 */
import { BookOpen, Brain, Shuffle, Sparkles, Type, type LucideIcon } from 'lucide-react'
import type { PromptLibrary } from '@/lib/promptLibraries'

const ICONS: Record<string, LucideIcon> = { BookOpen, Type, Sparkles, Brain }

const ACCENT = {
  brand: { tile: 'bg-brand-600 text-white', glow: 'bg-brand-200', num: 'bg-brand-50 text-brand-700' },
  emerald: { tile: 'bg-emerald-600 text-white', glow: 'bg-emerald-200', num: 'bg-emerald-50 text-emerald-700' },
  amber: { tile: 'bg-amber-500 text-white', glow: 'bg-amber-200', num: 'bg-amber-50 text-amber-800' },
} as const

export function LibraryIntro({
  library,
  total,
  onSurprise,
}: {
  library: PromptLibrary
  total: number
  onSurprise: () => void
}) {
  const Icon = ICONS[library.icon] ?? Sparkles
  const a = ACCENT[library.accent]

  return (
    <section className="relative overflow-hidden rounded-2xl border border-ink-100 bg-white p-5 sm:p-6">
      <div className={`pointer-events-none absolute -right-14 -top-14 h-40 w-40 rounded-full ${a.glow} opacity-40 blur-3xl`} />

      <div className="relative flex items-start gap-3.5">
        <span className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${a.tile}`}>
          <Icon size={22} />
        </span>
        <div className="min-w-0 flex-1">
          <h1 className="text-xl font-semibold tracking-tight text-ink-900 sm:text-2xl">
            {library.name}
          </h1>
          <p className="text-xs font-medium text-ink-500">{library.tagline}</p>
        </div>
      </div>

      <p className="relative mt-3 max-w-2xl text-sm leading-relaxed text-ink-600">
        {library.description}
      </p>

      <div className="relative mt-4 flex flex-wrap gap-2">
        <span className="rounded-full bg-ink-50 px-3 py-1.5 text-xs font-medium text-ink-600">
          {total} {library.itemNoun}s
        </span>
        {library.tracks.length > 1 && (
          <span className="rounded-full bg-ink-50 px-3 py-1.5 text-xs font-medium text-ink-600">
            {library.tracks.length} tracks
          </span>
        )}
        {library.styles.length > 1 && (
          <span className="rounded-full bg-ink-50 px-3 py-1.5 text-xs font-medium text-ink-600">
            {library.styles.length} styles
          </span>
        )}
        <button
          type="button"
          onClick={onSurprise}
          className="inline-flex items-center gap-1.5 rounded-full bg-ink-900 px-3.5 py-1.5 text-xs font-semibold text-white transition-colors active:bg-ink-800 sm:hover:bg-ink-800"
        >
          <Shuffle size={13} />
          Pick one for me
        </button>
      </div>

      {/* the framings, up front — only when there's actually a choice */}
      {library.styles.length > 1 && (
      <div className="relative mt-5 border-t border-ink-100 pt-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-ink-400">
          Every {library.itemNoun} comes in {library.styles.length} styles
        </p>
        <div className="mt-3 grid gap-2.5 sm:grid-cols-3">
          {library.styles.map((s, i) => (
            <div key={s.id} className="rounded-xl border border-ink-100 bg-ink-50/50 p-3">
              <div className="flex items-center gap-2">
                <span className={`flex h-5 w-5 items-center justify-center rounded-md text-[10px] font-bold ${a.num}`}>
                  {i + 1}
                </span>
                <p className="text-xs font-semibold text-ink-900">{s.name}</p>
              </div>
              <p className="mt-1.5 text-[11px] leading-relaxed text-ink-500">{s.blurb}</p>
            </div>
          ))}
        </div>
      </div>
      )}

      {library.kind === 'standalone' && (
        <p className="relative mt-5 rounded-xl border border-ink-100 bg-ink-50/60 p-3.5 text-xs leading-relaxed text-ink-600">
          These prompts write a fresh lesson every time you run them — there's no topic to choose.
          Run the same one tomorrow and you'll get a different principle.
        </p>
      )}
    </section>
  )
}
