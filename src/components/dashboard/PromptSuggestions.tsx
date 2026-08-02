/**
 * "Suggested for you" — one prompt per library on the dashboard.
 *
 * Each row deep-links to the library with `?item=<id>`, so tapping it opens
 * that exact prompt rather than dropping you into a list of 257.
 */
import { Link } from '@tanstack/react-router'
import { BookOpen, Brain, ChevronRight, Sparkles, Target, Type, type LucideIcon } from 'lucide-react'
import type { AssessmentResult } from '@/lib/assessmentResults'
import { suggestPrompts, weakestArea } from '@/lib/promptSuggestions'

const ICONS: Record<string, LucideIcon> = { BookOpen, Type, Sparkles, Brain }

const TILE: Record<string, string> = {
  brand: 'bg-brand-50 text-brand-700',
  emerald: 'bg-emerald-50 text-emerald-700',
  amber: 'bg-amber-50 text-amber-700',
}

export function PromptSuggestions({
  assessment,
  userKey,
}: {
  assessment: AssessmentResult | null | undefined
  userKey: string
}) {
  const weak = weakestArea(assessment)
  const suggestions = suggestPrompts(assessment, userKey)

  if (!suggestions.length) return null

  return (
    <section className="rounded-2xl border border-ink-100 bg-white p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-sm font-semibold text-ink-900">Suggested for you</h2>
          <p className="mt-0.5 text-xs leading-relaxed text-ink-500">
            {weak
              ? 'Picked from your weakest assessment area.'
              : 'A fresh pick from each library, changing daily.'}
          </p>
        </div>
        {weak && (
          <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-[11px] font-semibold text-amber-800">
            <Target size={11} />
            {weak.percent}%
          </span>
        )}
      </div>

      <ul className="mt-3 space-y-2">
        {suggestions.map(({ library, item, trackName, reason }) => {
          const Icon = ICONS[library.icon] ?? Sparkles
          return (
            <li key={library.id}>
              <Link
                to="/prompt-library/$libraryId"
                params={{ libraryId: library.id }}
                search={{ item: item.id }}
                className="flex items-center gap-3 rounded-xl border border-ink-100 bg-white p-3 transition-colors active:bg-ink-50 sm:hover:border-brand-200"
              >
                <span
                  className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${
                    TILE[library.accent] ?? TILE.brand
                  }`}
                >
                  <Icon size={17} />
                </span>

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="text-[10px] font-semibold uppercase tracking-wide text-ink-400">
                      {library.name}
                    </span>
                    {reason === 'weak' ? (
                      <span className="rounded-full bg-amber-50 px-1.5 py-0.5 text-[10px] font-medium text-amber-800">
                        {trackName}
                      </span>
                    ) : (
                      <span className="rounded-full bg-ink-50 px-1.5 py-0.5 text-[10px] font-medium text-ink-500">
                        Random pick
                      </span>
                    )}
                  </div>
                  <p className="mt-0.5 truncate text-sm font-medium text-ink-900">{item.title}</p>
                </div>

                <ChevronRight size={16} className="shrink-0 text-ink-300" />
              </Link>
            </li>
          )
        })}
      </ul>
    </section>
  )
}
