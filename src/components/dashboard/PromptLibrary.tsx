/**
 * Dashboard doorway to the prompt libraries.
 *
 * Open to everyone — the tier gate was removed 2026-08-02, so there's no
 * locked state any more.
 *
 * Lays out as a stacked card on mobile and a wide banner from `sm` up, since
 * it now sits in the dashboard's main column rather than the narrow rail.
 */
import { Link } from '@tanstack/react-router'
import { ArrowRight, Sparkles } from 'lucide-react'
import { promptLibraries, totalPromptItems } from '@/lib/promptLibraries'

export function PromptLibraryCard() {
  return (
    <Link
      to="/prompt-library"
      className="group relative block overflow-hidden rounded-2xl border border-brand-100 bg-gradient-to-br from-brand-50 via-white to-white p-4 transition-all hover:border-brand-300 hover:shadow-lg hover:shadow-ink-900/5 sm:p-5"
    >
      <div className="pointer-events-none absolute -right-10 -top-10 h-28 w-28 rounded-full bg-brand-200 opacity-40 blur-2xl transition-opacity group-hover:opacity-70" />

      <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="flex flex-1 items-center gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-600 text-white">
            <Sparkles size={20} />
          </span>
          <div className="min-w-0">
            <p className="text-[15px] font-semibold tracking-tight text-ink-900">Prompt Library</p>
            <p className="mt-0.5 text-xs text-ink-600">
              {totalPromptItems} prompts that turn any AI into a marketing tutor.
            </p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {promptLibraries.map((l) => (
                <span
                  key={l.id}
                  className="rounded-full bg-white px-2.5 py-1 text-[11px] font-medium text-ink-600 shadow-sm"
                >
                  {l.name}
                </span>
              ))}
            </div>
          </div>
        </div>

        <span className="inline-flex shrink-0 items-center justify-center gap-1.5 rounded-full bg-brand-600 px-4 py-2.5 text-xs font-semibold text-white transition-colors group-hover:bg-brand-700">
          Open library
          <ArrowRight size={13} className="transition-transform group-hover:translate-x-0.5" />
        </span>
      </div>
    </Link>
  )
}
