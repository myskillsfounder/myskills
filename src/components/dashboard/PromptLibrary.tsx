/**
 * Dashboard entry point for the Prompt Library.
 *
 * The card renders for everyone — the locked state is the incentive, so it
 * deliberately isn't hidden. Silver unlocks the vocabulary library, Gold adds
 * the deep-dive prompts on top. The library itself lives at /prompt-library;
 * this is only the doorway.
 */
import { Link } from '@tanstack/react-router'
import { ArrowRight, Lock, Sparkles } from 'lucide-react'
import { promptCount } from '@/lib/promptLibrary'
import { vocabCount } from '@/lib/vocabLibrary'
import { hasTierAccess, TIERS, type Certificate } from '@/lib/certificates'

export function PromptLibraryCard({ cert }: { cert: Certificate | null }) {
  const gold = hasTierAccess(cert, 'gold')
  const silver = hasTierAccess(cert, 'silver')

  if (!silver) {
    return (
      <div className="rounded-2xl border border-dashed border-ink-200 bg-white p-4">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-ink-50 text-ink-400">
            <Lock size={18} />
          </span>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-ink-800">Prompt Library</p>
            <p className="mt-0.5 text-xs text-ink-500">
              {vocabCount} AI study prompts, unlocked at Silver.
            </p>
          </div>
        </div>
        <p className="mt-3 text-xs text-ink-500">
          {cert
            ? `You scored ${cert.percent}% — reach ${TIERS.silver.min}% for Silver, ${TIERS.gold.min}% for Gold.`
            : `Score ${TIERS.silver.min}% or above on the initial assessment to unlock.`}
        </p>
        <Link
          to="/prompt-library"
          className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-brand-600 hover:text-brand-700"
        >
          See what's inside <ArrowRight size={13} />
        </Link>
      </div>
    )
  }

  const t = gold ? TIERS.gold : TIERS.silver

  return (
    <Link
      to="/prompt-library"
      className={`block rounded-2xl border p-4 transition-colors ${t.ui.border} ${t.ui.bg} ${
        gold ? 'hover:bg-amber-100' : 'hover:bg-slate-100'
      }`}
    >
      <div className="flex items-center gap-3">
        <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white ${t.ui.icon}`}>
          <Sparkles size={19} />
        </span>
        <div className="min-w-0">
          <p className={`text-sm font-semibold ${t.ui.textStrong}`}>Prompt Library</p>
          <p className={`mt-0.5 text-xs ${t.ui.textSoft}`}>
            {gold
              ? `${vocabCount} terms + ${promptCount} deep dives — yours to keep.`
              : `${vocabCount} marketing terms, explained on demand.`}
          </p>
        </div>
      </div>
      <span
        className={`mt-3 inline-flex w-full items-center justify-center gap-1.5 rounded-full px-4 py-2 text-xs font-semibold text-white ${t.ui.button}`}
      >
        Open library <ArrowRight size={13} />
      </span>
    </Link>
  )
}
